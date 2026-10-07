import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, verify, createHash } from 'node:crypto';
import { verifyWaffoEvent, WaffoProvider } from '../../lib/ai-font/payments/waffo';

const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
process.env.WAFFO_PRIVATE_KEY = keys.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
process.env.WAFFO_WEBHOOK_PUBLIC_KEY = keys.publicKey.export({ type: 'spki', format: 'pem' }).toString();
process.env.WAFFO_MERCHANT_ID = 'merchant';
process.env.WAFFO_STORE_ID = 'store';
process.env.WAFFO_PRODUCT_ID = 'product';
process.env.WAFFO_ENVIRONMENT = 'test';
process.env.AI_FONT_APP_URL = 'https://example.com';
const id = '10000000-0000-4000-8000-000000000001';
function event(overrides = {}) {
  return { eventId: 'PAY_1', eventType: 'order.completed', timestamp: new Date().toISOString(), storeId: 'store', mode: 'test', data: {
    orderMerchantExternalId: id, orderId: 'ORD_1', paymentId: 'PAY_1', orderMetadata: { app: 'font-generators', creditVersion: 2 }, paymentStatus: 'succeeded', currency: 'USD', chargedAmount: '5.49', listPrice: { subtotal: '4.99', total: '5.49' },
  }, ...overrides };
}
function request(value: unknown, age = 0, tamper = false) {
  const raw = JSON.stringify(value), t = String(Date.now() - age);
  const signature = sign('sha256', Buffer.from(`${t}.${raw}`), keys.privateKey).toString('base64');
  return new Request('https://example.com/webhook', { method: 'POST', body: raw + (tamper ? ' ' : ''), headers: { 'x-waffo-signature': `t=${t},v1=${signature}` } });
}
test('Waffo verifies exact signed body, store, mode and retry window before normalizing payment', async () => {
  const result = await verifyWaffoEvent(request(event(), 32 * 60000));
  assert.equal(result?.amountMinor, 499); assert.equal(result?.paymentId, 'PAY_1');
  await assert.rejects(verifyWaffoEvent(request(event(), 46 * 60000)));
  await assert.rejects(verifyWaffoEvent(request(event(), 0, true)));
  await assert.rejects(verifyWaffoEvent(request(event({ storeId: 'other' }))));
  await assert.rejects(verifyWaffoEvent(request(event({ mode: 'prod' }))));
  const discounted = event(); discounted.data.chargedAmount = '1.00';
  await assert.rejects(verifyWaffoEvent(request(discounted)));
  assert.equal(await verifyWaffoEvent(request(event({ eventType: 'refund.failed' }))), null);
});
test('Waffo recovery and uncancellation events update state without a payment receipt', async () => {
  for (const eventType of ['subscription.recovered', 'subscription.uncanceled']) {
    const result = await verifyWaffoEvent(request(event({ eventType, data: {
      ...event().data, planPrice: { subtotal: '4.99', total: '5.49' },
    } })));
    assert.equal(result?.kind, 'subscription'); assert.equal(result?.status, 'active'); assert.equal(result?.paymentId, undefined);
  }
});
test('Waffo checkout signs the exact request and preserves server price and idempotency', async () => {
  const original = global.fetch;
  const seen: string[] = [];
  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://api.waffo.ai/v1/actions/checkout/create-session');
    const headers = new Headers(init?.headers), body = String(init?.body);
    const canonical = `POST\n/v1/actions/checkout/create-session\n${headers.get('X-Timestamp')}\n${createHash('sha256').update(body).digest('base64')}`;
    assert.ok(verify('sha256', Buffer.from(canonical), keys.publicKey, Buffer.from(headers.get('X-Signature')!, 'base64')));
    seen.push(headers.get('X-Idempotency-Key')!);
    const payload = JSON.parse(body); assert.equal(payload.priceSnapshot.amount, '4.99'); assert.equal(payload.orderMerchantExternalId, id);
    return Response.json({ data: { sessionId: 'SESSION_1', checkoutUrl: 'https://checkout.waffo.ai/test', expiresAt: new Date(Date.now() + 2700000).toISOString() } });
  };
  try {
    const provider = new WaffoProvider();
    const order = { id, user_id: id, provider: 'waffo', capture_id: null, credits: 300, status: 'pending' as const, external_id: null, amount_minor: 499, currency: 'USD', created_at: new Date().toISOString() };
    await provider.createCheckout(order); await provider.createCheckout(order);
    assert.equal(seen[0], seen[1]); assert.equal(await provider.complete(), null);
    await assert.rejects(provider.createCheckout({ ...order, created_at: '2020-01-01T00:00:00Z' }));
  } finally { global.fetch = original; }
});
