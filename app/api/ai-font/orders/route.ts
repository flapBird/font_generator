import { FONT_PACK, isUuid } from '@/lib/ai-font/catalog';
import { availability } from '@/lib/ai-font/config';
import { body, endpoint, HttpError, json, requireUser, sameOrigin } from '@/lib/ai-font/http';
import { adminClient } from '@/lib/ai-font/supabase';
import { paymentProvider } from '@/lib/ai-font/payments';
import type { PaymentOrder } from '@/lib/ai-font/payments/types';

export async function POST(request: Request) {
  return endpoint(async () => {
    sameOrigin(request);
    const user = await requireUser();
    const services = availability();
    if (!services.checkout) throw new HttpError(503, 'Checkout is not available yet.');
    const input = await body(request);
    if (!isUuid(input.id) || input.packageId !== FONT_PACK.id || input.provider !== services.provider || input.acceptedTerms !== true) throw new HttpError(400, 'Please select a valid pack and accept the purchase terms.');
    const db = adminClient();
    const { data: previous, error: lookupError } = await db.from('ai_font_orders').select('*').eq('id', input.id).maybeSingle();
    if (lookupError) throw lookupError;
    if (previous && previous.user_id !== user.id) throw new HttpError(404, 'Order not found.');
    if (previous && (previous.provider !== services.provider || (previous.provider === 'waffo' && previous.provider_environment !== (services.sandbox ? 'test' : 'prod')))) throw new HttpError(410, 'Payment options changed. Please start a new checkout.');
    let order: PaymentOrder = previous;
    if (!order) {
      const { count, error: countError } = await db.from('ai_font_orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', new Date(Date.now() - 3600000).toISOString());
      if (countError) throw countError;
      if ((count ?? 0) >= 10) throw new HttpError(429, 'Please use an existing order or try again later.');
      const { data, error } = await db.from('ai_font_orders').upsert({
        id: input.id, user_id: user.id, provider: services.provider, provider_environment: services.provider === 'waffo' ? (services.sandbox ? 'test' : 'prod') : (services.sandbox ? 'sandbox' : 'live'), package_id: FONT_PACK.id,
        amount_minor: FONT_PACK.amountMinor, currency: FONT_PACK.currency, credits: FONT_PACK.credits, credit_version: 2,
      }, { onConflict: 'id', ignoreDuplicates: true }).select('*').maybeSingle();
      if (error) throw error;
      if (!data) throw new HttpError(409, 'Checkout is already starting. Please try again.');
      order = data;
    }
    if (order.status !== 'pending') throw new HttpError(410, 'This order has already been processed. Refresh your account before purchasing again.');
    const checkout = await paymentProvider(order.provider).createCheckout(order);
    if (order.external_id && order.external_id !== checkout.externalId) throw new HttpError(410, 'This checkout expired. Please try purchasing again.');
    const { error } = await db.from('ai_font_orders').update({ external_id: checkout.externalId, checkout_url: checkout.approvalUrl, checkout_expires_at: checkout.expiresAt || null }).eq('id', order.id).eq('user_id', user.id);
    if (error) throw error;
    return json({ id: order.id, approvalUrl: checkout.approvalUrl });
  });
}
