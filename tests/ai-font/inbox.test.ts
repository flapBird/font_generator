import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sendInboxMail, inboxAvailable, InboxDeliveryError } from '../../lib/mail/inbox';

const message = { to: 'buyer@example.com', subject: 'Credits ready', text: '300 credits' };
async function configured(action: () => Promise<void>) {
  const previous = { ...process.env }, fetchBefore = globalThis.fetch;
  Object.assign(process.env, { INBOX_URL: 'https://mail.example.com', INBOX_SEND_API_KEY: 'mock-server-token',
    INBOX_FROM_EMAIL: 'receipts@example.com', INBOX_FROM_NAME: 'Font Generators' });
  try { await action(); } finally { process.env = previous; globalThis.fetch = fetchBefore; }
}

test('mail stays disabled until all four server settings are present', async () => {
  for (const name of ['INBOX_URL', 'INBOX_SEND_API_KEY', 'INBOX_FROM_EMAIL', 'INBOX_FROM_NAME']) {
    await configured(async () => {
      delete process.env[name];
      assert.equal(inboxAvailable(), false);
      globalThis.fetch = async () => assert.fail('Unexpected send');
      await assert.rejects(sendInboxMail(message), { code: 'PERMANENT_CONFIGURATION' });
    });
  }
});

test('only server sender and isolated Bearer headers are sent; a valid 202 receipt is accepted', async () => {
  await configured(async () => {
    let calls = 0;
    globalThis.fetch = async (url, init) => {
      calls++;
      assert.equal(String(url), 'https://mail.example.com/api/v1/send');
      assert.equal(init?.method, 'POST');
      assert.deepEqual(Object.fromEntries(new Headers(init?.headers)), {
        authorization: 'Bearer mock-server-token', 'content-type': 'application/json',
      });
      assert.equal(init?.redirect, 'manual');
      assert.equal(init?.credentials, 'omit');
      assert.equal(init?.cache, 'no-store');
      assert.deepEqual(JSON.parse(String(init?.body)), {
        from: { email: 'receipts@example.com', name: 'Font Generators' }, ...message,
      });
      return Response.json({ id: 'internal-mail-id', status: 'sent' }, { status: 202 });
    };
    const extra = { ...message, from: { email: 'attacker@example.com' }, headers: { Origin: 'https://browser.example' } };
    assert.equal(await sendInboxMail(extra), 'internal-mail-id');
    assert.equal(calls, 1);
  });
});

test('supports address arrays, cc, bcc and HTML-only messages', async () => {
  await configured(async () => {
    const html = { to: ['a@example.com', 'b@example.com'], cc: 'c@example.com', bcc: ['d@example.com'], subject: 'Done', html: '<p>Done</p>' };
    globalThis.fetch = async (_url, init) => {
      assert.deepEqual(JSON.parse(String(init?.body)), { from: { email: 'receipts@example.com', name: 'Font Generators' }, ...html });
      return Response.json({ id: 'html-mail', status: 'sent' }, { status: 202 });
    };
    assert.equal(await sendInboxMail(html), 'html-mail');
  });
});

test('known HTTP errors are classified without trusting JSON or echoing upstream content', async () => {
  await configured(async () => {
    const cases = [[400, 'PERMANENT_REJECTED'], [401, 'PERMANENT_AUTHENTICATION'], [403, 'PERMANENT_SENDER_UNAUTHORIZED'],
      [404, 'PERMANENT_SENDER_NOT_FOUND'], [413, 'PERMANENT_REJECTED'], [429, 'RETRY_RATE_LIMIT'],
      [502, 'DELIVERY_UNCERTAIN'], [503, 'PERMANENT_CONFIGURATION']] as const;
    for (const [status, code] of cases) {
      let calls = 0;
      globalThis.fetch = async () => { calls++; return new Response('<html>sensitive upstream content</html>', { status }); };
      await assert.rejects(sendInboxMail(message), error => error instanceof InboxDeliveryError
        && error.code === code && error.status === status && error.message === code);
      assert.equal(calls, 1, 'No inline retry, including for 429');
    }
  });
});

test('non-202 success, redirects, non-JSON and invalid/oversized receipts are uncertain', async () => {
  await configured(async () => {
    for (const response of [
      Response.json({ id: 'id', status: 'sent' }), new Response(null, { status: 204 }), new Response(null, { status: 302 }),
      new Response('<html>upstream error</html>', { status: 202 }),
      ...[null, {}, { id: 'id', status: 'queued' }, { id: 123, status: 'sent' }, { id: ' ', status: 'sent' }]
        .map(value => Response.json(value, { status: 202 })),
      Response.json({ id: 'id', status: 'sent', padding: 'x'.repeat(16 * 1024) }, { status: 202 }),
    ]) {
      let calls = 0;
      globalThis.fetch = async () => { calls++; return response; };
      await assert.rejects(sendInboxMail(message), { code: 'DELIVERY_UNCERTAIN' });
      assert.equal(calls, 1);
    }
  });
});

test('35-second abort, interrupted body and network failure remain uncertain without retry', async (t) => {
  await configured(async () => {
    for (const phase of ['request', 'body']) {
      const controller = new AbortController();
      const timeout = t.mock.method(AbortSignal, 'timeout', (milliseconds: number) => {
        assert.equal(milliseconds, 35_000); return controller.signal;
      });
      let calls = 0;
      globalThis.fetch = async (_url, init) => {
        calls++;
        if (phase === 'body') return new Response(new ReadableStream({
          start(stream) { init?.signal?.addEventListener('abort', () => stream.error(init.signal?.reason), { once: true }); },
        }), { status: 202 });
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
        });
      };
      const rejected = assert.rejects(sendInboxMail(message), { code: 'DELIVERY_UNCERTAIN' });
      controller.abort(new DOMException('Request timed out', 'TimeoutError'));
      await rejected;
      assert.equal(calls, 1);
      timeout.mock.restore();
    }
    let calls = 0;
    globalThis.fetch = async () => { calls++; throw new Error('Network lost with sensitive diagnostics'); };
    await assert.rejects(sendInboxMail(message), { message: 'DELIVERY_UNCERTAIN' });
    assert.equal(calls, 1);
  });
});

test('invalid configuration and payloads fail before fetch', async () => {
  for (const url of ['not-a-url', 'http://mail.example.com', 'https://user:pass@mail.example.com',
    'https://mail.example.com/api/send', 'https://mail.example.com/?key=private', 'https://mail.example.com/#fragment']) {
    await configured(async () => {
      process.env.INBOX_URL = url;
      globalThis.fetch = async () => assert.fail('Unexpected send');
      await assert.rejects(sendInboxMail(message), { message: 'PERMANENT_CONFIGURATION' });
    });
  }
  await configured(async () => {
    globalThis.fetch = async () => assert.fail('Unexpected send');
    for (const invalid of [
      { ...message, to: [] }, { ...message, cc: ['invalid'] }, { ...message, bcc: [] },
      { ...message, to: 'a@example.com,b@example.com' }, { ...message, subject: ' ' },
      { ...message, subject: 'hello\r\nBcc: other@example.com' }, { ...message, text: ' ', html: '' },
      { ...message, text: 'x'.repeat(20 * 1024 * 1024) },
    ]) await assert.rejects(sendInboxMail(invalid), { code: 'PERMANENT_REJECTED' });
  });
});
