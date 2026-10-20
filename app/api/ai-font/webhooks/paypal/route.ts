import { endpoint, json } from '@/lib/ai-font/http';
import { paymentProvider } from '@/lib/ai-font/payments';
import { settleOrder } from '@/lib/ai-font/payments/service';
import { adminClient } from '@/lib/ai-font/supabase';

export async function POST(request: Request) {
  return endpoint(async () => {
    const event = await paymentProvider('paypal').verifyWebhook(request);
    if (event.kind === 'ignored') return json({ received: true });
    const db = adminClient();
    const query = db.from('ai_font_orders').select('*').eq('provider', 'paypal');
    const { data: order, error } = await query.eq('external_id', event.externalId).maybeSingle();
    if (error) throw error;
    // Non-2xx asks PayPal to retry if the callback races the initial DB write.
    if (!order) throw new Error('Order not persisted yet');
    if (event.kind === 'revoked') {
      const { error } = await db.rpc('ai_font_revoke_order', { p_id: order.id });
      if (error) throw error;
    } else if (await settleOrder(order) === 'pending') throw new Error('Payment confirmation pending');
    return json({ received: true });
  });
}
