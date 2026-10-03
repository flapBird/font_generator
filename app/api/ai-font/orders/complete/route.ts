import { isUuid } from '@/lib/ai-font/catalog';
import { body, endpoint, HttpError, json, requireUser, sameOrigin } from '@/lib/ai-font/http';
import { adminClient } from '@/lib/ai-font/supabase';
import { settleOrder } from '@/lib/ai-font/payments/service';

export async function POST(request: Request) {
  return endpoint(async () => {
    sameOrigin(request);
    const user = await requireUser();
    const input = await body(request);
    if (!isUuid(input.id)) throw new HttpError(400, 'Invalid order.');
    const { data: order, error } = await adminClient().from('ai_font_orders').select('*').eq('id', input.id).eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    if (!order) throw new HttpError(404, 'Order not found.');
    return json({ status: await settleOrder(order) });
  });
}
