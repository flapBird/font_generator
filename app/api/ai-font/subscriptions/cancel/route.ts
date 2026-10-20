import { isUuid } from '@/lib/ai-font/catalog';
import { body, endpoint, HttpError, json, requireUser, sameOrigin } from '@/lib/ai-font/http';
import { adminClient } from '@/lib/ai-font/supabase';
import { waffoMode, waffoRequest } from '@/lib/ai-font/payments/waffo';

export async function POST(request: Request) {
  return endpoint(async () => {
    sameOrigin(request); const user = await requireUser(); const input = await body(request);
    if (!isUuid(input.id)) throw new HttpError(400, 'Invalid subscription.');
    const db = adminClient();
    const { data: sub, error } = await db.from('ai_font_subscriptions').select('*').eq('id', input.id).eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    if (!sub) throw new HttpError(404, 'Subscription not found.');
    if (['canceled','closed','canceling'].includes(sub.status)) return json({ status: sub.status });
    const { data: order, error: orderError } = await db.from('ai_font_orders').select('provider_environment').eq('id', sub.id).single();
    if (orderError) throw orderError;
    if (sub.provider !== 'waffo' || order.provider_environment !== waffoMode()) throw new HttpError(409, 'Contact support to manage this subscription.');
    await waffoRequest('/v1/actions/subscription-order/cancel-order', { orderId: sub.external_id }, `${process.env.WAFFO_MERCHANT_ID}-cancel-${sub.id}`);
    const { error: updateError } = await db.from('ai_font_subscriptions').update({ cancel_requested_at: new Date().toISOString() }).eq('id', sub.id).eq('user_id', user.id);
    if (updateError) throw updateError;
    return json({ status: 'requested' }); // Final state comes from signed notifications.
  });
}
