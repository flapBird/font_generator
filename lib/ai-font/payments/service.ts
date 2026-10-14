import 'server-only';
import { adminClient } from '../supabase';
import { paymentProvider } from './index';
import type { PaymentOrder } from './types';
import { reconcileBilling } from './reconciliation';

export async function settleOrder(order: PaymentOrder) {
  if (order.provider === 'waffo') {
    const result = await reconcileBilling(order.id);
    if (result.errors) throw new Error('Payment reconciliation failed');
    const { data, error } = await adminClient().from('ai_font_orders').select('status').eq('id', order.id).single();
    if (error) throw error;
    return data.status as PaymentOrder['status'];
  }
  if (order.status !== 'pending') return order.status;
  const receipt = await paymentProvider(order.provider).complete(order);
  if (!receipt) return 'pending';
  const db = adminClient();
  const { error } = await db.rpc('ai_font_settle_order', {
    p_id: order.id, p_external: receipt.externalId, p_capture: receipt.captureId,
  });
  if (error) throw error;
  const { data, error: readError } = await db.from('ai_font_orders').select('status').eq('id', order.id).single();
  if (readError) throw readError;
  return data.status as PaymentOrder['status'];
}
