import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scheduled } from '../../cloudflare/reconcile.mjs';

function configuredEnv(fetch) {
  return {
    AI_FONT_APP_URL: 'https://font-generators.org',
    AI_FONT_CRON_SECRET: 'test-cron-secret',
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    MIXFONT_API_KEY: 'test-mixfont-key',
    WORKER_SELF_REFERENCE: { fetch },
  };
}

test('cron does not call paid services for an unconfigured or partial deployment', async () => {
  await scheduled({}, {});
  for (const key of ['AI_FONT_APP_URL', 'AI_FONT_CRON_SECRET', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'MIXFONT_API_KEY']) {
    const env = configuredEnv(() => assert.fail('Unexpected paid-service call'));
    env[key] = ' ';
    await scheduled({}, env);
  }
});

test('cron authenticates to the existing route through the self service binding', async () => {
  let calls = 0;
  await scheduled({}, configuredEnv(async (request) => {
    calls++;
    assert.equal(request.url, 'https://font-generators.org/api/ai-font/reconcile');
    assert.equal(request.method, 'GET');
    assert.equal(request.headers.get('authorization'), 'Bearer test-cron-secret');
    return Response.json({ checked: 3, errors: 0 });
  }));
  assert.equal(calls, 1);
});

test('billing and mail can run without enabling paid font generation', async () => {
  for (const config of [
    { WAFFO_MERCHANT_ID: 'merchant', WAFFO_PRIVATE_KEY: 'key', WAFFO_STORE_ID: 'store', WAFFO_PRODUCT_ID: 'product' },
    { FREEMAIL_API_CONTRACT: 'idinging-send-v1', FREEMAIL_API_URL: 'https://mail.example.com/api/send', FREEMAIL_API_TOKEN: 'token', FREEMAIL_FROM_EMAIL: 'receipts@example.com' },
  ]) {
    let calls = 0;
    const env = configuredEnv(async () => { calls++; return Response.json({ errors: 0 }); });
    delete env.MIXFONT_API_KEY;
    Object.assign(env, config);
    await scheduled({}, env);
    assert.equal(calls, 1);
  }
});

test('cron surfaces HTTP, partial job and network failures to Cloudflare monitoring', async () => {
  for (const response of [new Response(null, { status: 401 }), Response.json({ checked: 2, errors: 1 }), Response.json({})]) {
    await assert.rejects(scheduled({}, configuredEnv(async () => response)), /reconciliation/);
  }
  await assert.rejects(scheduled({}, configuredEnv(async () => { throw new Error('Network unavailable'); })), /Network unavailable/);
});
