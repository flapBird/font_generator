import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PayPalProvider, validateReceipt } from '../../lib/ai-font/payments/paypal';
import { safeFontUrl } from '../../lib/ai-font/generation';
import { validatePrompt } from '../../lib/ai-font/catalog';
import type { PaymentOrder } from '../../lib/ai-font/payments/types';

const order: PaymentOrder = { id: '10000000-0000-4000-8000-000000000001', user_id: 'user', provider: 'paypal', external_id: 'ORDER', capture_id: null, amount_minor: 499, currency: 'USD', credits: 3, status: 'pending' };
function receipt() { return { id: 'ORDER', status: 'COMPLETED', purchase_units: [{ custom_id: order.id, payments: { captures: [{ id: 'CAPTURE', status: 'COMPLETED', amount: { currency_code: 'USD', value: '4.99' } }] } }] }; }

test('only exact completed payments for the stored order grant credit', () => {
  assert.deepEqual(validateReceipt(receipt(), order), { externalId: 'ORDER', captureId: 'CAPTURE' });
  for (const change of [
    (r: ReturnType<typeof receipt>) => { r.id = 'OTHER'; },
    (r: ReturnType<typeof receipt>) => { r.status = 'APPROVED'; },
    (r: ReturnType<typeof receipt>) => { r.purchase_units[0].custom_id = 'another-user-order'; },
    (r: ReturnType<typeof receipt>) => { r.purchase_units[0].payments.captures[0].amount.value = '0.01'; },
    (r: ReturnType<typeof receipt>) => { r.purchase_units[0].payments.captures[0].amount.currency_code = 'EUR'; },
    (r: ReturnType<typeof receipt>) => { r.purchase_units[0].payments.captures[0].status = 'PENDING'; },
    (r: ReturnType<typeof receipt>) => { r.purchase_units[0].payments.captures[0].status = 'REFUNDED'; },
    (r: ReturnType<typeof receipt>) => { r.purchase_units.push(r.purchase_units[0]); },
  ]) { const data = receipt(); change(data); assert.throws(() => validateReceipt(data, order)); }
});

test('font download rejects untrusted hosts and prompt validation bounds API requests', () => {
  assert.equal(safeFontUrl('https://static.mixfont.com/uploads/test.ttf').hostname, 'static.mixfont.com');
  for (const url of ['http://static.mixfont.com/test.ttf', 'https://localhost/test.ttf', 'https://static.mixfont.com.attacker.test/a', 'https://user:pass@static.mixfont.com/a', 'https://static.mixfont.com:8443/a', 'file:///etc/passwd']) assert.throws(() => safeFontUrl(url));
  assert.throws(() => validatePrompt('short'));
  assert.throws(() => validatePrompt('a'.repeat(1001)));
  assert.equal(validatePrompt('  A bold display font  '), 'A bold display font');
});

test('PayPal checkout/capture uses stored prices and stable idempotency keys', async () => {
  process.env.PAYPAL_CLIENT_ID = 'test-client'; process.env.PAYPAL_CLIENT_SECRET = 'test-secret';
  process.env.PAYPAL_ENVIRONMENT = 'sandbox'; process.env.AI_FONT_APP_URL = 'http://localhost:3000';
  const original = globalThis.fetch;
  const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input); calls.push({ url, init });
    if (url.endsWith('/token')) return Response.json({ access_token: 'test-token' });
    if (url.endsWith('/capture')) return Response.json(receipt());
    if (url.endsWith('/ORDER')) return Response.json({ id: 'ORDER', status: 'APPROVED' });
    return Response.json({ id: 'ORDER', links: [{ rel: 'payer-action', href: 'https://www.sandbox.paypal.com/checkoutnow?token=ORDER' }] });
  };
  try {
    const provider = new PayPalProvider();
    await provider.createCheckout(order);
    assert.deepEqual(await provider.complete(order), { externalId: 'ORDER', captureId: 'CAPTURE' });
    const create = calls.find((c) => c.url.endsWith('/v2/checkout/orders'))!;
    assert.equal(JSON.parse(String(create.init?.body)).purchase_units[0].amount.value, '4.99');
    assert.equal(new Headers(create.init?.headers).get('PayPal-Request-Id'), order.id);
    const capture = calls.find((c) => c.url.endsWith('/capture'))!;
    assert.equal(new Headers(capture.init?.headers).get('PayPal-Request-Id'), order.id);
    assert.ok(calls.every((c) => c.url.startsWith('https://api-m.sandbox.paypal.com/')));
  } finally { globalThis.fetch = original; }
});

test('webhook rejects forged signatures and resolves refunds arriving before capture persistence', async () => {
  process.env.PAYPAL_CLIENT_ID = 'test-client'; process.env.PAYPAL_CLIENT_SECRET = 'test-secret';
  process.env.PAYPAL_WEBHOOK_ID = 'WEBHOOK'; process.env.PAYPAL_ENVIRONMENT = 'sandbox';
  const original = globalThis.fetch;
  let valid = false;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.endsWith('/token')) return Response.json({ access_token: 'test-token' });
    if (url.includes('verify-webhook-signature')) return Response.json({ verification_status: valid ? 'SUCCESS' : 'FAILURE' });
    assert.ok(url.endsWith('/v2/payments/captures/CAPTURE'));
    return Response.json({ supplementary_data: { related_ids: { order_id: 'ORDER' } } });
  };
  const request = () => new Request('https://example.test/webhook', { method: 'POST', headers: {
    'paypal-auth-algo': 'SHA256withRSA', 'paypal-cert-url': 'https://api.paypal.com/cert', 'paypal-transmission-id': 'event', 'paypal-transmission-sig': 'signature', 'paypal-transmission-time': '2026-10-03',
  }, body: JSON.stringify({ event_type: 'PAYMENT.CAPTURE.REFUNDED', resource: { id: 'REFUND', links: [{ rel: 'up', href: 'https://api.sandbox.paypal.com/v2/payments/captures/CAPTURE' }] } }) });
  try {
    const provider = new PayPalProvider();
    await assert.rejects(provider.verifyWebhook(request()), /Invalid webhook signature/);
    valid = true;
    assert.deepEqual(await provider.verifyWebhook(request()), { kind: 'revoked', captureId: 'CAPTURE', externalId: 'ORDER' });
    await assert.rejects(provider.verifyWebhook(new Request('https://example.test', { method: 'POST', body: '{}' })), /Missing webhook signature/);
  } finally { globalThis.fetch = original; }
});
