import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { reconcileBilling } from '../../lib/ai-font/payments/reconciliation';
import { deliverBillingMail } from '../../lib/ai-font/mail-delivery';

const id = '10000000-0000-4000-8000-000000000001';
const timestamp = '2026-10-14T00:00:00.000Z';
const order = { id, user_id: id, provider: 'waffo', provider_environment: 'test', provider_order_id: null, external_id: null, capture_id: null, status: 'pending', amount_minor: 499, currency: 'USD', credits: 300, billing_claim_token: 'billing-lease' };
const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const settings = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://billing-test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  WAFFO_MERCHANT_ID: 'merchant', WAFFO_STORE_ID: 'store', WAFFO_PRODUCT_ID: 'product', WAFFO_ENVIRONMENT: 'test',
  WAFFO_PRIVATE_KEY: keys.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  AI_FONT_APP_URL: 'https://fonts.example', FREEMAIL_API_CONTRACT: 'idinging-send-v1', FREEMAIL_API_URL: 'https://mail.example/api/send',
  FREEMAIL_API_TOKEN: 'test-mail-token', FREEMAIL_FROM_EMAIL: 'receipts@example.com',
};
async function configured(action: () => Promise<void>) {
  const previous = { ...process.env }, original = globalThis.fetch;
  Object.assign(process.env, settings);
  try { await action(); } finally { process.env = previous; globalThis.fetch = original; }
}
function remote() {
  const price = { subtotal: '4.99', taxAmount: '0.00', total: '4.99', currency: 'USD' };
  return { id: 'ORD_1', storeId: 'store', status: 'completed', testMode: true, orderMerchantExternalId: id,
    metadata: JSON.stringify({ app: 'font-generators', creditVersion: 2, packageId: 'english-starter' }),
    onetimeProduct: { id: 'product' }, currency: 'USD', priceSnapshot: price, payments: [{
      id: 'PAY_1', orderId: 'ORD_1', status: 'succeeded', testMode: true, orderMerchantExternalId: id, createdAt: timestamp,
      snapshotAmountDetails: price, pspAmountDetails: { amount: '4.99', currency: 'USD' }, refunds: [{
        id: 'REF_1', paymentId: 'PAY_1', status: 'succeeded', testMode: true, orderMerchantExternalId: id, createdAt: timestamp,
        pspAmountDetails: { amount: '4.99', currency: 'USD' },
      }],
    }] };
}

test('recovery applies the validated refund and payment snapshot through one atomic RPC', async () => {
  await configured(async () => {
    const calls: { path: string; body: Record<string, unknown> }[] = [];
    globalThis.fetch = async (url, init) => {
      const path = new URL(String(url)).pathname, body = JSON.parse(String(init?.body));
      calls.push({ path, body });
      if (path.endsWith('ai_font_claim_billing_orders')) return Response.json([order]);
      if (path === '/v1/graphql') return Response.json({ data: body.query.includes('ReconcileFontOrder') ? { onetimeOrders: [remote()] } : { chargebacks: [] } });
      if (path.endsWith('ai_font_apply_waffo_events')) return Response.json(null);
      assert.ok(path.endsWith('ai_font_finish_billing_check'));
      return Response.json(true);
    };
    assert.deepEqual(await reconcileBilling(id), { checked: 1, errors: 0, disabled: false });
    const apply = calls.filter(call => call.path.endsWith('ai_font_apply_waffo_events'));
    assert.equal(apply.length, 1);
    assert.deepEqual((apply[0].body.p_events as { kind: string }[]).map(event => event.kind), ['revoked', 'paid']);
    assert.equal(calls.find(call => call.path.endsWith('ai_font_finish_billing_check'))?.body.p_token, 'billing-lease');
    assert.equal(calls.filter(call => call.path.includes('/actions/')).length, 0);
  });
});

test('failed complete provider validation never partially applies a payment', async () => {
  await configured(async () => {
    let applied = false;
    globalThis.fetch = async (url, init) => {
      const path = new URL(String(url)).pathname, body = JSON.parse(String(init?.body));
      if (path.endsWith('ai_font_claim_billing_orders')) return Response.json([order]);
      if (path === '/v1/graphql') return Response.json(body.query.includes('ReconcileFontOrder') ? { data: { onetimeOrders: [remote()] } } : { errors: [{ message: 'Provider check unavailable' }] });
      if (path.endsWith('ai_font_apply_waffo_events')) applied = true;
      assert.ok(path.endsWith('ai_font_finish_billing_check'));
      assert.equal(body.p_error, 'PROVIDER_OR_LEDGER_CHECK_FAILED');
      return Response.json(true);
    };
    assert.equal((await reconcileBilling()).errors, 1);
    assert.equal(applied, false);
  });
});

test('claimed email sends through Bearer-authenticated Freemail and saves its receipt', async () => {
  await configured(async () => {
    const mail = { id: 42, event_key: 'payment:waffo:PAY_1', claim_token: 'mail-lease', recipient_email: 'buyer@example.com', kind: 'payment_credited', order_id: id, payload: { creditsDelta: 300, balance: 300 } };
    let sends = 0;
    globalThis.fetch = async (url, init) => {
      const path = new URL(String(url)).pathname, body = JSON.parse(String(init?.body));
      if (path.endsWith('ai_font_claim_mail')) return Response.json([mail]);
      if (path.endsWith('ai_font_begin_mail_delivery')) return Response.json(true);
      if (path === '/api/send') {
        sends++; assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer test-mail-token');
        assert.equal(body.to, 'buyer@example.com'); return Response.json({ success: true, id: 'mail-receipt' });
      }
      assert.ok(path.endsWith('ai_font_finish_mail'));
      assert.equal(body.p_token, 'mail-lease'); assert.equal(body.p_message_id, 'mail-receipt'); assert.equal(body.p_error, null);
      return Response.json(true);
    };
    assert.deepEqual(await deliverBillingMail(), { checked: 1, errors: 0, disabled: false });
    assert.equal(sends, 1);
  });
});

test('lost email acceptance response is held without an automatic second send', async () => {
  await configured(async () => {
    let sends = 0;
    globalThis.fetch = async (url, init) => {
      const path = new URL(String(url)).pathname, body = JSON.parse(String(init?.body));
      if (path.endsWith('ai_font_claim_mail')) return Response.json([{ id: 42, event_key: 'payment:one', claim_token: 'mail-lease', recipient_email: 'buyer@example.com', kind: 'payment_credited', order_id: id, payload: { creditsDelta: 300, balance: 300 } }]);
      if (path.endsWith('ai_font_begin_mail_delivery')) return Response.json(true);
      if (path === '/api/send') { sends++; throw new Error('Receipt lost'); }
      assert.ok(path.endsWith('ai_font_finish_mail'));
      assert.equal(body.p_error, 'DELIVERY_UNCERTAIN'); assert.equal(body.p_message_id, null);
      return Response.json(true);
    };
    assert.equal((await deliverBillingMail()).errors, 1);
    assert.equal(sends, 1);
  });
});
