import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { availability, checkoutAccess } from '../../lib/ai-font/config';

const owner = { email: 'owner@example.com', email_confirmed_at: '2026-10-23T00:00:00Z' };
async function configured(action: () => void | Promise<void>) {
  const previous = { ...process.env };
  Object.assign(process.env, {
    NEXT_PUBLIC_SUPABASE_URL: 'https://auth.example.com', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'mock-public-key',
    SUPABASE_SERVICE_ROLE_KEY: 'mock-service-key', AI_FONT_APP_URL: 'https://fonts.example.com',
    MIXFONT_API_KEY: 'mock-mixfont', SEEAPI_API_KEY: 'mock-seeapi', AI_FONT_CRON_SECRET: 'mock-cron',
    AI_FONT_PAYMENT_PROVIDER: 'waffo', WAFFO_MERCHANT_ID: 'mock-merchant', WAFFO_PRIVATE_KEY: 'mock-key',
    WAFFO_WEBHOOK_PUBLIC_KEY: 'mock-webhook', WAFFO_STORE_ID: 'mock-store', WAFFO_PRODUCT_ID: 'mock-product',
    AI_FONT_CHECKOUT_MODE: 'private', AI_FONT_CHECKOUT_ALLOWLIST: 'owner@example.com',
  });
  try { await action(); } finally { process.env = previous; }
}

test('configured payments stay private by default and only verified allowlisted emails can buy', async () => {
  await configured(() => {
    delete process.env.AI_FONT_CHECKOUT_MODE;
    assert.equal(availability(owner).checkout, true);
    for (const user of [undefined, null, {}, { email: owner.email },
      { ...owner, email: 'other@example.com' }, { ...owner, email: 'owner+other@example.com' },
      { ...owner, email: 'other@example.com', user_metadata: { email: owner.email, role: 'admin' } }]) {
      assert.equal(availability(user).checkout, false);
      assert.equal(availability(user).generation, true, 'Existing credit use is unaffected');
    }
    process.env.AI_FONT_CHECKOUT_ALLOWLIST = '';
    assert.equal(availability(owner).checkout, false);
    process.env.AI_FONT_CHECKOUT_ALLOWLIST = '*';
    assert.equal(availability(owner).checkout, false, 'No wildcard grants');
  });
});

test('allowlist matches complete addresses, accepts comma/newline separators and is never serialized', async () => {
  await configured(() => {
    process.env.AI_FONT_CHECKOUT_ALLOWLIST = ' other@example.com, OWNER@example.com\nthird@example.com, ';
    assert.equal(checkoutAccess(owner), true);
    assert.equal(checkoutAccess({ ...owner, email: 'third@example.com' }), true);
    assert.equal(checkoutAccess({ ...owner, email: 'not-owner@example.com' }), false);
    assert.equal(JSON.stringify(availability(owner)).includes('example.com'), false);
  });
});

test('runtime mode can open checkout publicly without bypassing service readiness', async () => {
  await configured(() => {
    process.env.AI_FONT_CHECKOUT_MODE = 'public';
    delete process.env.AI_FONT_CHECKOUT_ALLOWLIST;
    assert.equal(availability().checkout, true, 'Public visitors may see the login-to-purchase link');
    assert.equal(availability({ ...owner, email: 'other@example.com' }).checkout, true);
    for (const key of ['SEEAPI_API_KEY', 'MIXFONT_API_KEY', 'AI_FONT_CRON_SECRET', 'WAFFO_PRIVATE_KEY']) {
      const value = process.env[key]; delete process.env[key];
      assert.equal(availability(owner).checkout, false);
      process.env[key] = value;
    }
    process.env.AI_FONT_CHECKOUT_MODE = 'publci';
    assert.equal(availability(owner).checkout, false, 'Unknown rollout mode fails closed');
    process.env.AI_FONT_CHECKOUT_MODE = 'private';
    process.env.AI_FONT_CHECKOUT_ALLOWLIST = owner.email;
    process.env.WAFFO_PRIVATE_KEY = '';
    assert.equal(availability(owner).checkout, false, 'Private tester cannot bypass missing payment configuration');
  });
});

test('actual order route rejects unlisted users before database/provider access despite forged request fields', async (t) => {
  // Replace only the Supabase boundary. Exercise the real route, HTTP guards and
  // config together without cookies, database access or payment requests.
  const bundle = await build({
    stdin: { contents: "export { POST } from './app/api/ai-font/orders/route'; export { GET } from './app/api/ai-font/account/route'; export { state } from './lib/ai-font/supabase';", resolveDir: process.cwd() },
    bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external',
    plugins: [{ name: 'mock-auth-database', setup(build) {
      build.onLoad({ filter: /lib\/ai-font\/supabase\.ts$/ }, () => ({ contents: `
        export const state = { user: null, databaseCalls: 0, allowReads: false };
        export async function authClient() { return { auth: { getUser: async () => ({ data: { user: state.user }, error: null }) } }; }
        export function adminClient() {
          state.databaseCalls++;
          if (!state.allowReads) throw new Error('Mock database boundary reached');
          const query = new Proxy({}, { get: (_, key) => key === 'then' ? resolve => resolve({ data: [], error: null }) : () => query });
          return query;
        }
      `, loader: 'js' }));
    } }],
  });
  const compiledModule = { exports: {} };
  new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(createRequire(import.meta.url), compiledModule, compiledModule.exports);
  const { POST, GET, state } = compiledModule.exports as { POST: (request: Request) => Promise<Response>; GET: () => Promise<Response>;
    state: { user: object | null; databaseCalls: number; allowReads: boolean } };
  t.mock.method(console, 'error', () => undefined);
  t.mock.method(globalThis, 'fetch', async () => assert.fail('Unexpected real network request'));
  await configured(async () => {
    const request = () => new Request('https://fonts.example.com/api/ai-font/orders', {
      method: 'POST', headers: { origin: 'https://fonts.example.com', 'content-type': 'application/json' },
      body: JSON.stringify({ email: owner.email, user: owner, checkout: true, role: 'admin', acceptedTerms: true }),
    });
    for (const user of [{ ...owner, email: 'other@example.com' }, { email: owner.email },
      { ...owner, email: 'other@example.com', user_metadata: owner }]) {
      state.user = user;
      const response = await POST(request());
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { error: 'Checkout is not available yet.' });
      assert.equal(state.databaseCalls, 0);
    }
    state.user = null;
    assert.equal((await POST(request())).status, 401);
    assert.equal(state.databaseCalls, 0);
    state.user = owner;
    await POST(request());
    assert.equal(state.databaseCalls, 1, 'Allowlisted user advances to the existing billing checks');
    process.env.AI_FONT_CHECKOUT_MODE = 'public';
    state.user = { ...owner, email: 'other@example.com' };
    await POST(request());
    assert.equal(state.databaseCalls, 2, 'Runtime public switch opens the same path to other authenticated users');
    process.env.AI_FONT_CHECKOUT_MODE = 'private';
    state.allowReads = true;
    for (const [user, checkout] of [[owner, true], [{ ...owner, email: 'other@example.com' }, false], [null, false]] as const) {
      state.user = user;
      const response = await GET();
      assert.equal(response.status, 200);
      assert.equal((await response.json()).services.checkout, checkout, 'Account API uses verified per-user access');
    }
  });
});
