import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sendFreemail, freemailAvailable, FreemailDeliveryError } from '../../lib/ai-font/freemail';

const message = { to: 'buyer@example.com', subject: 'Credits ready', text: '300 credits', idempotencyKey: 'ai-font-mail-42' };
async function configured(action: () => Promise<void>) {
  const previous = { ...process.env }, fetchBefore = globalThis.fetch;
  Object.assign(process.env, { FREEMAIL_API_CONTRACT: 'idinging-send-v1', FREEMAIL_API_URL: 'https://mail.example.com/api/send', FREEMAIL_API_TOKEN: 'test-server-token', FREEMAIL_FROM_EMAIL: 'receipts@example.com' });
  try { await action(); } finally { process.env = previous; globalThis.fetch = fetchBefore; }
}

test('Freemail is disabled until its deployed API contract is explicitly confirmed', async () => {
  await configured(async () => {
    delete process.env.FREEMAIL_API_CONTRACT;
    assert.equal(freemailAvailable(), false);
    globalThis.fetch = async () => assert.fail('Unexpected send');
    await assert.rejects(sendFreemail(message), error => error instanceof FreemailDeliveryError && error.code === 'PERMANENT_CONFIGURATION');
  });
});

test('website sends through Freemail with a server token and validates the accepted receipt', async () => {
  await configured(async () => {
    globalThis.fetch = async (url, init) => {
      assert.equal(String(url), 'https://mail.example.com/api/send');
      assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer test-server-token');
      assert.equal(init?.redirect, 'error');
      assert.deepEqual(JSON.parse(String(init?.body)), { from: 'receipts@example.com', fromName: 'Font Generators', to: message.to, subject: message.subject, text: message.text });
      return Response.json({ success: true, id: 'mail-receipt', provider: 'mailjet' });
    };
    assert.equal(await sendFreemail(message), 'mail-receipt');
  });
});

test('uncertain sends and invalid receipts are held; explicit rate limits alone can retry', async () => {
  await configured(async () => {
    for (const response of [new Response(null, { status: 503 }), Response.json({ success: true }), Response.json({ success: false }), new Response(null, { status: 302 })]) {
      globalThis.fetch = async () => response;
      await assert.rejects(sendFreemail(message), error => error instanceof FreemailDeliveryError && error.code === 'DELIVERY_UNCERTAIN');
    }
    globalThis.fetch = async () => { throw new Error('Response lost after acceptance'); };
    await assert.rejects(sendFreemail(message), error => error instanceof FreemailDeliveryError && error.code === 'DELIVERY_UNCERTAIN');
    globalThis.fetch = async () => new Response(null, { status: 429 });
    await assert.rejects(sendFreemail(message), error => error instanceof FreemailDeliveryError && error.code === 'RETRY_RATE_LIMIT');
  });
});

test('rejects an unsafe endpoint without sending the privileged token', async () => {
  await configured(async () => {
    process.env.FREEMAIL_API_URL = 'https://user:pass@mail.example.com/api/send';
    globalThis.fetch = async () => assert.fail('Unexpected send');
    await assert.rejects(sendFreemail(message), error => error instanceof FreemailDeliveryError && error.code === 'PERMANENT_CONFIGURATION');
  });
});
