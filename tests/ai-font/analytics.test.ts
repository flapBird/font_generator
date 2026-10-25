import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validContext } from '../../lib/analytics/shared';
import { analyticsIdentity, attachOrderAnalytics, serverAnalyticsAvailable } from '../../lib/analytics/server';
import { deliverAnalytics, eventPayload } from '../../lib/analytics/delivery';

const context = { client_id: '123.456', session_id: '123456', analytics_storage: 'granted' as const };
const event = { id: 1, claim_token: 'lease', order_id: '10000000-0000-4000-8000-000000000001', event_name: 'purchase' as const,
  occurred_at: new Date().toISOString(), context: { ...context, userId: 'a'.repeat(64), audienceType: 'customer' as const,
    checkoutEligible: true, checkoutMode: 'public' as const, paymentProvider: 'waffo' as const, paymentEnvironment: 'live' as const },
  amount_minor: 499, currency: 'USD', package_id: 'english-starter' };
async function configured(run: () => Promise<void>) {
  const previous = { ...process.env }, original = globalThis.fetch;
  Object.assign(process.env, { AI_FONT_APP_URL: 'https://font-generators.org', GA4_MEASUREMENT_PROTOCOL_SECRET: 'mock-secret',
    NEXT_PUBLIC_SUPABASE_URL: 'https://analytics-test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'mock-service' });
  try { await run(); } finally { process.env = previous; globalThis.fetch = original; }
}

test('analytics input only accepts existing numeric GA IDs and strips unsolicited properties', () => {
  assert.deepEqual(validContext({ ...context, email: 'private@example.com', amount: 9999 }), context);
  for (const value of [null, {}, { ...context, client_id: 'user@example.com' }, { ...context, session_id: 'NaN' }, { ...context, session_id: '0' }, { ...context, session_id: '99999999999999999999' }, { ...context, analytics_storage: 'denied' }]) assert.equal(validContext(value), null);
});

test('identity is stable, pseudonymous and classifies internal accounts without exposing emails', async () => configured(async () => {
  process.env.GA4_INTERNAL_EMAILS = 'tester@example.com';
  const user = { id: 'supabase-user', email: 'tester@example.com', email_confirmed_at: '2026-01-01' };
  const result = analyticsIdentity(user);
  assert.match(result.userId!, /^[a-f0-9]{64}$/);
  assert.equal(result.userId, analyticsIdentity(user).userId);
  assert.equal(result.audienceType, 'internal');
  assert.ok(!JSON.stringify(result).includes(user.email));
  assert.ok(!JSON.stringify(result).includes(user.id));
  assert.equal(analyticsIdentity(null).userId, null);
}));

test('only configured production HTTPS can send server analytics', async () => configured(async () => {
  assert.equal(serverAnalyticsAvailable(), true);
  for (const url of ['http://font-generators.org','https://preview.font-generators.org','https://font-generators.org:1234','https://user:pass@font-generators.org','http://localhost:3000']) {
    process.env.AI_FONT_APP_URL = url; assert.equal(serverAnalyticsAvailable(), false);
  }
  globalThis.fetch = async () => assert.fail('disabled analytics must not make requests');
  assert.equal((await deliverAnalytics()).disabled, true);
}));

test('real purchases carry ledger values and transaction ID; internal/sandbox use non-revenue test events', () => {
  const payload = eventPayload(event);
  assert.equal(payload.events[0].name, 'purchase');
  assert.equal(payload.events[0].params.transaction_id, event.order_id);
  assert.equal(payload.events[0].params.value, 4.99);
  assert.equal(payload.events[0].params.session_id, Number(context.session_id));
  assert.equal(eventPayload({ ...event, context: { ...event.context, audienceType: 'internal' } }).events[0].name, 'test_purchase');
  assert.equal(eventPayload({ ...event, event_name: 'begin_checkout', context: { ...event.context, paymentEnvironment: 'test' } }).events[0].name, 'test_begin_checkout');
  assert.throws(() => eventPayload({ ...event, amount_minor: -1 }), /INVALID_EVENT/);
  assert.throws(() => eventPayload({ ...event, context: { ...event.context, userId: 'email@example.com' } }), /INVALID_EVENT/);
});

test('attaching optional analytics cannot fail checkout when the analytics migration is unavailable', async () => configured(async () => {
  globalThis.fetch = async () => Response.json({ message: 'Missing RPC' }, { status: 404 });
  await assert.doesNotReject(attachOrderAnalytics(event.order_id, { id: 'user' }, context));
}));

for (const [status, expected] of [[204, null], [307, 'REQUEST_REJECTED'], [401, 'REQUEST_REJECTED'], [429, 'RATE_LIMIT'], [502, 'DELIVERY_UNCERTAIN'], [0, 'DELIVERY_UNCERTAIN']] as const) {
  test(`GA4 delivery ${status || 'timeout'} is classified without automatic resend`, async () => configured(async () => {
    let sends = 0, finished = false;
    globalThis.fetch = async (url, init) => {
      const parsed = new URL(String(url));
      if (parsed.pathname.endsWith('ai_font_claim_analytics')) return Response.json([event]);
      if (parsed.pathname === '/mp/collect') {
        sends++;
        assert.equal(parsed.hostname, 'www.google-analytics.com');
        assert.equal(parsed.searchParams.get('api_secret'), 'mock-secret');
        assert.deepEqual(Object.keys(init!.headers!), ['Content-Type']);
        assert.equal(init?.redirect, 'manual'); assert.equal(init?.credentials, 'omit'); assert.ok(init?.signal);
        assert.ok(!String(init?.body).includes('mock-secret'));
        if (!status) throw new DOMException('timed out', 'TimeoutError');
        return new Response(status === 204 ? null : '<html>upstream unavailable</html>', { status });
      }
      assert.ok(parsed.pathname.endsWith('ai_font_finish_analytics'));
      const body = JSON.parse(String(init?.body));
      assert.equal(body.p_error, expected); assert.equal(body.p_token, 'lease'); finished = true;
      return Response.json(true);
    };
    const result = await deliverAnalytics();
    assert.equal(result.errors, expected ? 1 : 0); assert.equal(sends, 1); assert.equal(finished, true);
  }));
}
