import 'server-only';
import { createHash, sign, verify } from 'node:crypto';
import { appOrigin, requiredEnv } from '../config';
import { HttpError } from '../http';
import { isUuid } from '../catalog';
import type { PaymentOrder, PaymentProvider } from './types';

export function waffoMode() { return process.env.WAFFO_ENVIRONMENT === 'prod' ? 'prod' : 'test'; }
export async function waffoRequest(path: string, payload: unknown, idempotencyKey?: string) {
  const body = JSON.stringify(payload);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const canonical = `POST\n${path}\n${timestamp}\n${createHash('sha256').update(body).digest('base64')}`;
  const signature = sign('sha256', Buffer.from(canonical), requiredEnv('WAFFO_PRIVATE_KEY').replace(/\\n/g, '\n')).toString('base64');
  const response = await fetch(`https://api.waffo.ai${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Merchant-Id': requiredEnv('WAFFO_MERCHANT_ID'), 'X-Timestamp': timestamp, 'X-Signature': signature,
      ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}) },
    body, cache: 'no-store', signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error('Waffo request failed');
  const result = await response.json();
  if (result.errors?.length || !result.data) throw new Error('Waffo response invalid');
  return result.data;
}

export class WaffoProvider implements PaymentProvider {
  id = 'waffo';
  async createCheckout(order: PaymentOrder) {
    // Keep retries within Waffo's 24h idempotency window. Never mint a fresh
    // session after a possibly successful request with this business reference.
    if (!order.created_at || Date.now() - Date.parse(order.created_at) > 40 * 60 * 1000) throw new HttpError(410, 'This checkout expired. Please start a new purchase.');
    if (order.checkout_url && order.external_id && Date.parse(order.checkout_expires_at || '') > Date.now()) return { externalId: order.external_id, approvalUrl: order.checkout_url, expiresAt: order.checkout_expires_at! };
    if (order.external_id) throw new HttpError(410, 'This checkout expired. Please start a new purchase.');
    const origin = appOrigin();
    if (!origin.startsWith('https://')) throw new HttpError(503, 'Waffo checkout requires an HTTPS site or test tunnel.');
    const data = await waffoRequest('/v1/actions/checkout/create-session', {
      productId: requiredEnv('WAFFO_PRODUCT_ID'), currency: order.currency,
      priceSnapshot: { amount: (order.amount_minor / 100).toFixed(2), taxIncluded: false, taxCategory: 'saas' },
      orderMerchantExternalId: order.id,
      metadata: { app: 'font-generators', packageId: 'english-starter', creditVersion: 2 },
      successUrl: `${origin}/ai-font-generator?checkout=return&order=${order.id}`,
      expiresInSeconds: 2700, language: 'en',
    }, `${requiredEnv('WAFFO_MERCHANT_ID')}-${order.id}`);
    const url = new URL(data.checkoutUrl);
    if (url.protocol !== 'https:' || !['checkout.waffo.ai','pancake.waffo.ai','pay.waffo.ai'].includes(url.hostname) || url.username || url.password || url.port) throw new Error('Unexpected checkout URL');
    if (typeof data.sessionId !== 'string' || !Number.isFinite(Date.parse(data.expiresAt))) throw new Error('Invalid checkout session');
    return { externalId: data.sessionId, approvalUrl: url.href, expiresAt: data.expiresAt as string };
  }
  async complete() { return null; } // Verified webhook is the authority, never the browser return.
  async verifyWebhook(): Promise<never> { throw new Error('Use the typed Waffo event handler'); }
}

type Obj = Record<string, unknown>;
function object(value: unknown): Obj {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'Invalid event.');
  return value as Obj;
}
function text(value: unknown, max = 200) {
  if (typeof value !== 'string' || !value || value.length > max) throw new HttpError(400, 'Invalid event field.');
  return value;
}
export function moneyMinor(value: unknown) {
  const amount = text(value, 20);
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(amount)) throw new HttpError(400, 'Invalid amount.');
  const [whole, decimals = ''] = amount.split('.');
  return Number(whole) * 100 + Number(decimals.padEnd(2, '0'));
}
function date(value: unknown) { const result = text(value); if (!Number.isFinite(Date.parse(result))) throw new HttpError(400, 'Invalid date.'); return result; }
export async function verifyWaffoEvent(request: Request) {
  const raw = await request.text();
  if (raw.length > 65536) throw new HttpError(413, 'Event too large.');
  const header = request.headers.get('x-waffo-signature') || '';
  const parts = Object.fromEntries(header.split(',').map(part => { const i = part.indexOf('='); return [part.slice(0,i).trim(),part.slice(i+1).trim()]; }));
  if (!/^\d{13}$/.test(parts.t || '') || Math.abs(Date.now() - Number(parts.t)) > 45 * 60 * 1000 || !parts.v1) throw new HttpError(401, 'Invalid signature.');
  if (!verify('RSA-SHA256', Buffer.from(`${parts.t}.${raw}`), requiredEnv('WAFFO_WEBHOOK_PUBLIC_KEY').replace(/\\n/g, '\n'), Buffer.from(parts.v1, 'base64'))) throw new HttpError(401, 'Invalid signature.');
  const event = object(JSON.parse(raw));
  if (event.storeId !== requiredEnv('WAFFO_STORE_ID') || event.mode !== waffoMode()) throw new HttpError(403, 'Wrong store or environment.');
  const type = text(event.eventType);
  const statuses: Record<string,string> = { 'subscription.activated': 'active', 'subscription.renewed': 'active', 'subscription.recovered': 'active', 'subscription.canceling': 'canceling', 'subscription.canceled': 'canceled', 'subscription.past_due': 'past_due', 'subscription.closed': 'closed', 'subscription.uncanceled': 'active' };
  if (!['order.completed','subscription.payment_succeeded','refund.succeeded'].includes(type) && !Object.hasOwn(statuses, type)) return null;
  const data = object(event.data);
  const id = text(data.orderMerchantExternalId);
  if (!isUuid(id)) throw new HttpError(400, 'Unknown order reference.');
  const meta = object(data.orderMetadata);
  if (meta.app !== 'font-generators' || meta.creditVersion !== 2) throw new HttpError(400, 'Invalid order metadata.');
  const kind = Object.hasOwn(statuses, type) ? 'subscription' : type === 'refund.succeeded' ? 'revoked' : 'paid';
  if (kind === 'paid' && data.paymentStatus !== 'succeeded') throw new HttpError(400, 'Payment is not complete.');
  if (kind === 'revoked' && (data.refundStatus !== 'succeeded' || moneyMinor(data.refundedAmount) <= 0)) throw new HttpError(400, 'Refund is not complete.');
  const price = object(kind === 'subscription' ? data.planPrice : kind === 'revoked' ? data.originalPayment : data.listPrice);
  if (kind === 'paid' && moneyMinor(data.chargedAmount) !== moneyMinor(price.total)) throw new HttpError(400, 'Unexpected discounted payment.');
  const period = data.periodNumber;
  if (period !== undefined && (!Number.isInteger(period) || (period as number) < 1)) throw new HttpError(400, 'Invalid billing period.');
  return {
    key: `${type}:${text(event.eventId)}:${date(event.timestamp)}`,
    kind, orderId: id, providerOrderId: text(data.orderId), mode: event.mode,
    amountMinor: moneyMinor(price.subtotal), currency: text(data.currency), timestamp: date(event.timestamp),
    paymentId: kind === 'subscription' ? undefined : text(data.paymentId),
    periodNumber: period, status: Object.hasOwn(statuses, type) ? statuses[type] : undefined, cancellationWithdrawn: type === 'subscription.uncanceled',
    periodStart: data.currentPeriodStart ? date(data.currentPeriodStart) : undefined,
    periodEnd: data.currentPeriodEnd ? date(data.currentPeriodEnd) : undefined,
  };
}
