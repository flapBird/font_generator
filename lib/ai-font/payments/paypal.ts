import 'server-only';
import { appOrigin, requiredEnv } from '../config';
import { HttpError } from '../http';
import type { PaymentEvent, PaymentOrder, PaymentProvider } from './types';

type PayPalOrder = {
  id: string;
  status: string;
  links?: { rel: string; href: string }[];
  purchase_units?: {
    custom_id?: string;
    amount?: { currency_code: string; value: string };
    payments?: { captures?: { id: string; status: string; amount: { currency_code: string; value: string } }[] };
  }[];
};

export function validateReceipt(data: PayPalOrder, order: PaymentOrder) {
  const units = data.purchase_units;
  const captures = units?.[0]?.payments?.captures;
  const capture = captures?.[0];
  if (data.id !== order.external_id || data.status !== 'COMPLETED' || units?.length !== 1 ||
      units[0].custom_id !== order.id || captures?.length !== 1 || !capture?.id || capture.status !== 'COMPLETED' ||
      capture.amount.currency_code !== order.currency || capture.amount.value !== (order.amount_minor / 100).toFixed(2)) {
    throw new HttpError(409, 'Payment is not completed or does not match this order.');
  }
  return { externalId: data.id, captureId: capture.id };
}

export class PayPalProvider implements PaymentProvider {
  readonly id = 'paypal';
  private get base() {
    const environment = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
    if (!['sandbox', 'live'].includes(environment)) throw new Error('Invalid PayPal environment');
    return environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  }

  private async call(path: string, method = 'GET', payload?: unknown, requestId?: string) {
    const tokenResponse = await fetch(`${this.base}/v1/oauth2/token`, {
      method: 'POST', headers: {
        Authorization: `Basic ${Buffer.from(`${requiredEnv('PAYPAL_CLIENT_ID')}:${requiredEnv('PAYPAL_CLIENT_SECRET')}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      }, body: 'grant_type=client_credentials', cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    if (!tokenResponse.ok) throw new Error('PayPal authentication failed');
    const token = await tokenResponse.json();
    if (typeof token.access_token !== 'string') throw new Error('Invalid PayPal token');
    return fetch(`${this.base}${path}`, {
      method, headers: {
        Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json',
        Prefer: 'return=representation', ...(requestId ? { 'PayPal-Request-Id': requestId } : {}),
      }, body: payload === undefined ? undefined : JSON.stringify(payload),
      cache: 'no-store', signal: AbortSignal.timeout(20000),
    });
  }

  async createCheckout(order: PaymentOrder) {
    const response = await this.call('/v2/checkout/orders', 'POST', {
      intent: 'CAPTURE',
      purchase_units: [{ custom_id: order.id, description: `${order.credits} English font generations`,
        amount: { currency_code: order.currency, value: (order.amount_minor / 100).toFixed(2) } }],
      payment_source: { paypal: { experience_context: {
        brand_name: 'Font Generators', shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW',
        return_url: `${appOrigin()}/ai-font-generator?checkout=return&order=${order.id}`,
        cancel_url: `${appOrigin()}/ai-font-generator?checkout=cancel&order=${order.id}`,
      } } },
    }, order.id);
    if (!response.ok) throw new Error('PayPal checkout unavailable');
    const data: PayPalOrder = await response.json();
    const link = data.links?.find((link) => ['payer-action', 'approve'].includes(link.rel));
    if (!data.id || !link) throw new Error('Missing PayPal checkout link');
    const url = new URL(link.href);
    const expectedHost = process.env.PAYPAL_ENVIRONMENT === 'live' ? 'www.paypal.com' : 'www.sandbox.paypal.com';
    if (url.protocol !== 'https:' || url.hostname !== expectedHost || url.username || url.password) throw new Error('Invalid checkout host');
    return { externalId: data.id, approvalUrl: url.href };
  }

  async complete(order: PaymentOrder) {
    if (!order.external_id) throw new HttpError(409, 'Checkout is not ready.');
    const path = `/v2/checkout/orders/${encodeURIComponent(order.external_id)}`;
    const response = await this.call(path);
    if (!response.ok) throw new Error('Unable to verify payment');
    let data: PayPalOrder = await response.json();
    if (data.status === 'APPROVED') {
      const capture = await this.call(`${path}/capture`, 'POST', {}, order.id);
      // A webhook and browser return can race. Re-read instead of issuing a new
      // capture with a new key, including after an upstream response error.
      if (capture.ok) data = await capture.json();
      else {
        const latest = await this.call(path);
        if (!latest.ok) throw new Error('Unable to verify capture');
        data = await latest.json();
      }
    }
    if (data.status !== 'COMPLETED') return null;
    return validateReceipt(data, order);
  }

  async verifyWebhook(request: Request): Promise<PaymentEvent> {
    const raw = await request.text();
    if (raw.length > 100000) throw new HttpError(413, 'Webhook too large.');
    let event;
    try { event = JSON.parse(raw); } catch { throw new HttpError(400, 'Invalid webhook.'); }
    const fields = ['auth-algo', 'cert-url', 'transmission-id', 'transmission-sig', 'transmission-time'];
    if (fields.some((field) => !request.headers.get(`paypal-${field}`))) throw new HttpError(400, 'Missing webhook signature.');
    const verification = await this.call('/v1/notifications/verify-webhook-signature', 'POST', {
      auth_algo: request.headers.get('paypal-auth-algo'), cert_url: request.headers.get('paypal-cert-url'),
      transmission_id: request.headers.get('paypal-transmission-id'), transmission_sig: request.headers.get('paypal-transmission-sig'),
      transmission_time: request.headers.get('paypal-transmission-time'), webhook_id: requiredEnv('PAYPAL_WEBHOOK_ID'), webhook_event: event,
    });
    if (!verification.ok) throw new Error('Webhook verification unavailable');
    if ((await verification.json()).verification_status !== 'SUCCESS') throw new HttpError(403, 'Invalid webhook signature.');
    const resource = event.resource;
    if (event.event_type === 'CHECKOUT.ORDER.APPROVED' && typeof resource?.id === 'string') return { kind: 'approved', externalId: resource.id };
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const externalId = resource?.supplementary_data?.related_ids?.order_id;
      if (typeof externalId !== 'string') throw new HttpError(400, 'Missing order reference.');
      return { kind: 'paid', externalId };
    }
    if (['PAYMENT.CAPTURE.REFUNDED', 'PAYMENT.CAPTURE.REVERSED'].includes(event.event_type)) {
      let captureId = resource?.id;
      if (event.event_type === 'PAYMENT.CAPTURE.REFUNDED') {
        captureId = resource?.supplementary_data?.related_ids?.capture_id;
        if (!captureId) {
          const up = resource?.links?.find((link: { rel: string }) => link.rel === 'up')?.href;
          const match = typeof up === 'string' && up.match(/^https:\/\/api(?:-m)?\.(?:sandbox\.)?paypal\.com\/v2\/payments\/captures\/([A-Z0-9]+)$/);
          captureId = match ? match[1] : null;
        }
      }
      if (typeof captureId !== 'string') throw new HttpError(400, 'Missing capture reference.');
      // Resolve the parent order even if a refund beats the completion webhook
      // and the local order does not have a capture_id yet.
      const captureResponse = await this.call(`/v2/payments/captures/${encodeURIComponent(captureId)}`);
      if (!captureResponse.ok) throw new Error('Unable to resolve reversed payment');
      const capture = await captureResponse.json();
      const externalId = capture.supplementary_data?.related_ids?.order_id;
      if (typeof externalId !== 'string') throw new Error('Missing reversed order reference');
      return { kind: 'revoked', captureId, externalId };
    }
    return { kind: 'ignored' };
  }
}
