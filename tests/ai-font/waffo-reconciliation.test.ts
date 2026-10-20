import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { reconcileWaffoOrder } from '../../lib/ai-font/payments/waffo-reconciliation';
import { verifyWaffoEvent } from '../../lib/ai-font/payments/waffo';

const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
process.env.WAFFO_PRIVATE_KEY = keys.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
process.env.WAFFO_WEBHOOK_PUBLIC_KEY = keys.publicKey.export({ type: 'spki', format: 'pem' }).toString();
process.env.WAFFO_MERCHANT_ID = 'merchant';
process.env.WAFFO_STORE_ID = 'store';
process.env.WAFFO_PRODUCT_ID = 'product';
process.env.WAFFO_ENVIRONMENT = 'test';
const id = '10000000-0000-4000-8000-000000000001';
const timestamp = '2026-10-14T00:00:00.000Z';
const order = {
  id, user_id: id, provider: 'waffo', external_id: 'SESSION_1', capture_id: null,
  amount_minor: 499, currency: 'USD', credits: 300, status: 'pending' as const,
  provider_environment: 'test', provider_order_id: null,
};
function snapshot() { return { subtotal: '4.99', taxAmount: '0.50', total: '5.49', currency: 'USD' }; }
function refund(refundId: string, amount = '1.83') {
  return { id: refundId, paymentId: 'PAY_1', status: 'succeeded', testMode: true, orderMerchantExternalId: id,
    createdAt: timestamp, pspAmountDetails: { amount, currency: 'USD' } };
}
function remote() {
  return { id: 'ORD_1', storeId: 'store', status: 'completed', testMode: true, orderMerchantExternalId: id,
    metadata: JSON.stringify({ app: 'font-generators', creditVersion: 2, packageId: 'english-starter' }),
    currency: 'USD', createdAt: timestamp, onetimeProduct: { id: 'product' }, priceSnapshot: snapshot(), payments: [{
      id: 'PAY_1', orderId: 'ORD_1', status: 'succeeded', testMode: true, orderMerchantExternalId: id,
      createdAt: timestamp, snapshotAmountDetails: snapshot(), pspAmountDetails: { amount: '5.49', currency: 'USD' },
      refunds: [] as ReturnType<typeof refund>[],
    }] };
}
async function withApi(onetimeOrders: unknown[], chargebacks: unknown[], work: () => Promise<void>) {
  const original = global.fetch;
  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://api.waffo.ai/v1/graphql');
    const request = JSON.parse(String(init?.body));
    assert.ok(!request.query.includes('buyerEmail'));
    if (request.query.includes('ReconcileFontOrder')) {
      assert.deepEqual(request.variables, { storeId: 'store', ref: id });
      return Response.json({ data: { onetimeOrders } });
    }
    assert.ok(request.query.includes('ReconcileFontChargebacks'));
    assert.deepEqual(request.variables, { storeId: 'store', paymentId: 'PAY_1', testMode: true });
    return Response.json({ data: { chargebacks } });
  };
  try { await work(); } finally { global.fetch = original; }
}

test('missing webhook reconciles the exact business reference and uses original tax-inclusive payment total', async () => {
  const record = remote();
  record.payments[0].refunds = [refund('REF_1'), refund('REF_2')];
  await withApi([record], [], async () => {
    const events = await reconcileWaffoOrder(order);
    assert.equal(events.length, 3);
    assert.deepEqual(events.map(event => event.kind), ['revoked', 'revoked', 'paid']);
    for (const event of events) {
      assert.equal(event.orderId, id); assert.equal(event.providerOrderId, 'ORD_1');
      assert.equal(event.paymentId, 'PAY_1'); assert.equal(event.amountMinor, 499);
      assert.equal(event.paymentTotalMinor, 549); assert.equal(event.source, 'reconciliation');
      assert.equal(event.businessReferenceVerified, true);
    }
    assert.equal(events[0].adjustmentId, 'REF_1'); assert.equal(events[0].refundAmountMinor, 183);
    assert.equal(events[1].adjustmentId, 'REF_2'); assert.equal(events[1].reason, 'refund');
    assert.deepEqual(await reconcileWaffoOrder(order), events);
  });
});

test('unpaid checkout produces no entitlement and a completed order without a payment is rejected', async () => {
  await withApi([], [], async () => assert.deepEqual(await reconcileWaffoOrder(order), []));
  const record = remote();
  record.status = 'pending'; record.payments[0].status = 'failed';
  await withApi([record], [], async () => assert.deepEqual(await reconcileWaffoOrder(order), []));
  record.status = 'completed';
  await withApi([record], [], async () => assert.rejects(reconcileWaffoOrder(order)));
});

test('a failed local checkout session save can recover only an exact confirmed provider payment', async () => {
  const localOrder = { ...order, external_id: null };
  await withApi([remote()], [], async () => {
    const events = await reconcileWaffoOrder(localOrder);
    assert.equal(events.length, 1); assert.equal(events[0].kind, 'paid');
    assert.equal(events[0].businessReferenceVerified, true); assert.equal(events[0].paymentId, 'PAY_1');
  });
  await withApi([], [], async () => assert.deepEqual(await reconcileWaffoOrder(localOrder), []));
  const pending = remote(); pending.status = 'pending'; pending.payments[0].status = 'pending';
  await withApi([pending], [], async () => assert.deepEqual(await reconcileWaffoOrder(localOrder), []));
  const unrelated = remote(); unrelated.orderMerchantExternalId = 'unrelated';
  await withApi([unrelated], [], async () => assert.rejects(reconcileWaffoOrder(localOrder)));
});

test('reconciliation rejects mismatched store, environment, reference, metadata, product, price and actual payment', async () => {
  const corruptions: ((value: ReturnType<typeof remote>) => void)[] = [
    value => { value.storeId = 'other'; },
    value => { value.testMode = false; },
    value => { value.orderMerchantExternalId = 'other'; },
    value => { value.id = 'ORD_other'; },
    value => { value.metadata = '{invalid'; },
    value => { value.metadata = JSON.stringify({ app: 'other', creditVersion: 2, packageId: 'english-starter' }); },
    value => { value.onetimeProduct.id = 'other'; },
    value => { value.currency = 'EUR'; },
    value => { value.priceSnapshot.subtotal = '3.99'; },
    value => { value.priceSnapshot.taxAmount = '0.49'; },
    value => { value.payments[0].testMode = false; },
    value => { value.payments[0].orderMerchantExternalId = 'other'; },
    value => { value.payments[0].pspAmountDetails.amount = '1.00'; },
    value => { value.payments[0].pspAmountDetails.currency = 'EUR'; },
  ];
  for (const corrupt of corruptions) {
    const value = remote(); corrupt(value);
    await withApi([value], [], async () => assert.rejects(reconcileWaffoOrder(order)));
  }
  await withApi([remote(), remote()], [], async () => assert.rejects(reconcileWaffoOrder(order)));
  const multiple = remote(); multiple.payments.push({ ...multiple.payments[0], id: 'PAY_2' });
  await withApi([multiple], [], async () => assert.rejects(reconcileWaffoOrder(order)));
  await assert.rejects(reconcileWaffoOrder({ ...order, provider_environment: 'prod' }));
  await withApi([remote()], [], async () => assert.rejects(reconcileWaffoOrder({ ...order, capture_id: 'PAY_other' })));
});

test('only successful refunds can adjust credits; wrong or excessive cumulative amounts fail closed', async () => {
  const record = remote();
  record.payments[0].refunds = [{ ...refund('REF_failed'), status: 'failed' }, { ...refund('REF_pending'), status: 'pending' }];
  await withApi([record], [], async () => assert.equal((await reconcileWaffoOrder(order)).length, 1));
  const corruptions: ((value: ReturnType<typeof refund>) => void)[] = [
    value => { value.paymentId = 'PAY_other'; },
    value => { value.orderMerchantExternalId = 'other'; },
    value => { value.testMode = false; },
    value => { value.pspAmountDetails.currency = 'EUR'; },
    value => { value.pspAmountDetails.amount = '0.00'; },
  ];
  for (const corrupt of corruptions) {
    const value = refund('REF_1'); corrupt(value); record.payments[0].refunds = [value];
    await withApi([record], [], async () => assert.rejects(reconcileWaffoOrder(order)));
  }
  record.payments[0].refunds = [refund('REF_1'), refund('REF_1')];
  await withApi([record], [], async () => assert.rejects(reconcileWaffoOrder(order)));
  record.payments[0].refunds = [refund('REF_1', '4.00'), refund('REF_2', '2.00')];
  await withApi([record], [], async () => assert.rejects(reconcileWaffoOrder(order)));
});

test('chargeback records preserve unsupported provider statuses for review instead of guessing a refund or recovery', async () => {
  const chargeback = { id: 'CB_1', paymentId: 'PAY_1', orderId: 'ORD_1', storeId: 'store', status: 'ACTION_REQUIRED',
    testMode: true, updatedAt: timestamp, amount: { amount: '549', currency: 'USD' } };
  for (const status of ['ACTION_REQUIRED', 'EXPIRED', 'UNKNOWN_FUTURE_STATUS']) {
    await withApi([remote()], [{ ...chargeback, status }], async () => {
      const events = await reconcileWaffoOrder(order);
      assert.equal(events[0].kind, 'review'); assert.equal(events[0].reason, 'chargeback');
      assert.equal(events[0].adjustmentId, 'CB_1'); assert.equal(events[0].chargebackStatus, status);
      assert.equal(events[0].chargebackAmountMinor, 549);
      assert.equal(events[0].reviewRequired, true); assert.equal(events[0].refundAmountMinor, undefined);
    });
  }
  await withApi([remote()], [{ ...chargeback, testMode: false }], async () => assert.rejects(reconcileWaffoOrder(order)));
  await withApi([remote()], [{ ...chargeback, amount: { amount: '999', currency: 'USD' } }], async () => assert.rejects(reconcileWaffoOrder(order)));
  const partial = remote();
  partial.priceSnapshot.taxAmount = '0.00'; partial.priceSnapshot.total = '4.99';
  partial.payments[0].snapshotAmountDetails = { ...partial.priceSnapshot };
  partial.payments[0].pspAmountDetails.amount = '4.99';
  await withApi([partial], [{ ...chargeback, amount: { amount: '149', currency: 'USD' } }], async () => {
    const event = (await reconcileWaffoOrder(order))[0];
    assert.equal(event.kind, 'review'); assert.equal(event.chargebackAmountMinor, 149);
    assert.equal(event.amountMinor, 499); assert.equal(event.paymentTotalMinor, 499);
    assert.equal(event.refundAmountMinor, undefined);
  });
});

function signedRefund(amount: string, originalChargedAmount: string | null = '5.49') {
  const event = { eventId: 'REF_1', eventType: 'refund.succeeded', timestamp: new Date().toISOString(), storeId: 'store', mode: 'test', data: {
    orderMerchantExternalId: id, orderId: 'ORD_1', paymentId: 'PAY_1', orderMetadata: { app: 'font-generators', creditVersion: 2 },
    paymentStatus: 'succeeded', currency: 'USD', refundStatus: 'succeeded', refundedAmount: amount, originalChargedAmount,
    originalPayment: { subtotal: '4.99', total: '5.49' },
  } };
  const raw = JSON.stringify(event), t = String(Date.now());
  const signature = sign('sha256', Buffer.from(`${t}.${raw}`), keys.privateKey).toString('base64');
  return new Request('https://example.com/webhook', { method: 'POST', body: raw, headers: { 'x-waffo-signature': `t=${t},v1=${signature}` } });
}
test('signed partial refund supplies actual refund identity and tax-inclusive denominator to the same ledger', async () => {
  const event = await verifyWaffoEvent(signedRefund('1.83'));
  assert.equal(event?.kind, 'revoked'); assert.equal(event?.reason, 'refund');
  assert.equal(event?.adjustmentId, 'REF_1'); assert.equal(event?.amountMinor, 499);
  assert.equal(event?.refundAmountMinor, 183); assert.equal(event?.paymentTotalMinor, 549);
  const record = remote(); record.payments[0].refunds = [refund('REF_1')];
  await withApi([record], [], async () => {
    const reconciled = (await reconcileWaffoOrder(order))[0];
    // Different delivery keys still target exactly one provider adjustment.
    assert.notEqual(reconciled.key, event?.key);
    assert.equal(reconciled.adjustmentId, event?.adjustmentId);
    assert.equal(reconciled.paymentId, event?.paymentId);
    assert.equal(reconciled.refundAmountMinor, event?.refundAmountMinor);
    assert.equal(reconciled.paymentTotalMinor, event?.paymentTotalMinor);
  });
  await assert.rejects(verifyWaffoEvent(signedRefund('5.50')));
  await assert.rejects(verifyWaffoEvent(signedRefund('1.00', '3.00')));
  await assert.rejects(verifyWaffoEvent(signedRefund('1.00', null)));
});
