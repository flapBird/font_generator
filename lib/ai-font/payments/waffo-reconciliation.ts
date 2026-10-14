import 'server-only';
import { requiredEnv } from '../config';
import { isUuid } from '../catalog';
import type { PaymentOrder } from './types';
import { moneyMinor, waffoMode, waffoRequest, type WaffoNormalizedEvent } from './waffo';

// Fields verified against Waffo's authenticated GraphQL introspection. Its
// metadata is a JSON string; PSP amounts are major-unit decimal strings.
const orderQuery = `query ReconcileFontOrder($storeId: String!, $ref: String!) {
  onetimeOrders(storeId: $storeId, filter: { orderMerchantExternalId: { eq: $ref } }, limit: 2) {
    id storeId status testMode orderMerchantExternalId metadata currency createdAt
    onetimeProduct { id }
    priceSnapshot { subtotal taxAmount total currency }
    payments {
      id orderId status testMode orderMerchantExternalId createdAt
      snapshotAmountDetails { subtotal taxAmount total currency }
      pspAmountDetails { amount currency }
      refunds {
        id paymentId status testMode orderMerchantExternalId createdAt
        pspAmountDetails { amount currency }
      }
    }
  }
}`;

const chargebackQuery = `query ReconcileFontChargebacks($storeId: String!, $paymentId: String!, $testMode: Boolean!) {
  chargebacks(filter: { storeId: { eq: $storeId }, paymentId: { eq: $paymentId }, testMode: { eq: $testMode } }, limit: 101) {
    id paymentId orderId storeId status testMode updatedAt amount { amount currency }
  }
}`;

type Obj = Record<string, unknown>;
function invalid(): never { throw new Error('Waffo reconciliation data mismatch'); }
function object(value: unknown): Obj {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  return value as Obj;
}
function text(value: unknown, max = 200) {
  if (typeof value !== 'string' || !value || value.length > max) return invalid();
  return value;
}
function date(value: unknown) {
  const result = text(value);
  if (!Number.isFinite(Date.parse(result))) return invalid();
  return result;
}
function list(value: unknown, max: number) {
  if (!Array.isArray(value) || value.length > max) return invalid();
  return value.map(object);
}
function currency(value: unknown, expected: string) {
  if (value !== expected) return invalid();
  return expected;
}
function snapshot(value: unknown, order: PaymentOrder) {
  const price = object(value);
  currency(price.currency, order.currency);
  const subtotal = moneyMinor(price.subtotal), tax = moneyMinor(price.taxAmount), total = moneyMinor(price.total);
  if (subtotal !== order.amount_minor || subtotal + tax !== total || total <= 0) return invalid();
  return total;
}
function metadata(value: unknown) {
  // Do not include API response values in errors: those can carry buyer data.
  if (typeof value !== 'string' || value.length > 8192) return invalid();
  let result;
  try { result = object(JSON.parse(value)); } catch { return invalid(); }
  if (result.app !== 'font-generators' || result.creditVersion !== 2 || result.packageId !== 'english-starter') return invalid();
}

type ReconciliationOrder = PaymentOrder & { provider_order_id?: string | null; provider_environment?: string | null };

/**
 * Read authoritative provider records by the reference written by our signed
 * createCheckout. Browser return parameters never supply a payment receipt.
 * Fetch and validate the complete result before returning any credit events.
 */
export async function reconcileWaffoOrder(order: ReconciliationOrder): Promise<WaffoNormalizedEvent[]> {
  // A successful provider checkout can outlive a failed local session-save.
  // The authenticated exact business reference is the recovery authority;
  // a missing external_id never substitutes for a confirmed provider payment.
  if (order.provider !== 'waffo' || !isUuid(order.id) || order.currency !== 'USD'
    || !Number.isSafeInteger(order.amount_minor) || order.amount_minor <= 0) return invalid();
  const mode = waffoMode(), testMode = mode === 'test', storeId = requiredEnv('WAFFO_STORE_ID');
  if (order.provider_environment !== mode) return invalid();
  const response = object(await waffoRequest('/v1/graphql', { query: orderQuery, variables: { storeId, ref: order.id } }));
  const remoteOrders = list(response.onetimeOrders, 2);
  if (!remoteOrders.length) return [];
  // A duplicate business reference must go to review, not provision twice.
  if (remoteOrders.length !== 1) return invalid();
  const remote = remoteOrders[0], providerOrderId = text(remote.id);
  if (remote.storeId !== storeId || remote.testMode !== testMode || remote.orderMerchantExternalId !== order.id
    || (order.provider_order_id && order.provider_order_id !== providerOrderId)) return invalid();
  metadata(remote.metadata);
  currency(remote.currency, order.currency);
  if (object(remote.onetimeProduct).id !== requiredEnv('WAFFO_PRODUCT_ID')) return invalid();
  const payments = list(remote.payments, 100).filter(payment => payment.status === 'succeeded');
  if (!payments.length) {
    if (remote.status === 'completed') return invalid();
    return [];
  }
  if (remote.status !== 'completed' || payments.length !== 1) return invalid();
  const payment = payments[0], paymentId = text(payment.id);
  if (payment.orderId !== providerOrderId || payment.testMode !== testMode || payment.orderMerchantExternalId !== order.id
    || (order.capture_id && order.capture_id !== paymentId)) return invalid();
  const total = snapshot(remote.priceSnapshot, order);
  if (snapshot(payment.snapshotAmountDetails, order) !== total) return invalid();
  const collected = object(payment.pspAmountDetails);
  currency(collected.currency, order.currency);
  if (moneyMinor(collected.amount) !== total) return invalid();
  const base = {
    orderId: order.id, providerOrderId, paymentId, mode,
    amountMinor: order.amount_minor, currency: order.currency, paymentTotalMinor: total,
    source: 'reconciliation' as const, businessReferenceVerified: true,
  };
  const paid: WaffoNormalizedEvent = {
    ...base, key: `reconcile:paid:${paymentId}`, kind: 'paid', timestamp: date(payment.createdAt),
  };
  const events: WaffoNormalizedEvent[] = [];
  let refundedTotal = 0;
  const refundIds = new Set<string>();
  for (const refund of list(payment.refunds, 100)) {
    // Pending tickets and failed attempts never revoke paid credits.
    if (refund.status !== 'succeeded') continue;
    const refundId = text(refund.id);
    if (refundIds.has(refundId) || refund.paymentId !== paymentId || refund.testMode !== testMode
      || refund.orderMerchantExternalId !== order.id) return invalid();
    refundIds.add(refundId);
    const returned = object(refund.pspAmountDetails);
    currency(returned.currency, order.currency);
    const refundAmountMinor = moneyMinor(returned.amount);
    refundedTotal += refundAmountMinor;
    if (refundAmountMinor <= 0 || refundedTotal > total) return invalid();
    events.push({ ...base, key: `reconcile:refund:${refundId}`, kind: 'revoked', reason: 'refund',
      adjustmentId: refundId, refundAmountMinor, timestamp: date(refund.createdAt) });
  }
  const cases = object(await waffoRequest('/v1/graphql', {
    query: chargebackQuery, variables: { storeId, paymentId, testMode },
  }));
  const caseIds = new Set<string>();
  for (const chargeback of list(cases.chargebacks, 100)) {
    const adjustmentId = text(chargeback.id), chargebackStatus = text(chargeback.status);
    if (caseIds.has(adjustmentId) || chargeback.paymentId !== paymentId || chargeback.orderId !== providerOrderId
      || chargeback.storeId !== storeId || chargeback.testMode !== testMode) return invalid();
    caseIds.add(adjustmentId);
    const principal = object(chargeback.amount);
    currency(principal.currency, order.currency);
    const minor = text(principal.amount, 12), chargebackAmountMinor = Number(minor);
    if (!/^\d+$/.test(minor) || !Number.isSafeInteger(chargebackAmountMinor) || chargebackAmountMinor <= 0 || chargebackAmountMinor > total) return invalid();
    const timestamp = date(chargeback.updatedAt);
    // The API stores PSP status strings verbatim and does not publish a closed
    // enum or guaranteed final outcome mapping. Preserve the fact and suspend
    // generation for review; do not guess a win, loss, or reversed principal.
    events.push({ ...base, key: `reconcile:chargeback:${adjustmentId}:${timestamp}`, kind: 'review',
      reason: 'chargeback', adjustmentId, chargebackStatus, chargebackAmountMinor, reviewRequired: true, timestamp });
  }
  // Apply already completed adjustments before the first grant. The batch
  // ledger then credits only the net entitlement, including its receipt mail.
  return [...events, paid];
}
