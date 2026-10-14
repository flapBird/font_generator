import 'server-only';
import { adminClient } from '../supabase';
import { waffoMode } from './waffo';
import { reconcileWaffoOrder } from './waffo-reconciliation';
import type { PaymentOrder } from './types';

export function billingReconciliationAvailable() {
  return ['WAFFO_MERCHANT_ID', 'WAFFO_PRIVATE_KEY', 'WAFFO_STORE_ID', 'WAFFO_PRODUCT_ID'].every(name => Boolean(process.env[name]?.trim()));
}

// Both cron and the authenticated Check payment action use the same leases and
// transactional ledger. No credit is inferred from a browser success redirect.
export async function reconcileBilling(orderId?: string) {
  if (!billingReconciliationAvailable()) return { checked: 0, errors: 0, disabled: true };
  const db = adminClient();
  const { data, error } = await db.rpc('ai_font_claim_billing_orders', {
    p_limit: orderId ? 1 : 3, p_order: orderId || null, p_mode: waffoMode(),
  });
  if (error) throw error;
  const result = { checked: 0, errors: 0, disabled: false };
  for (const order of (data || []) as PaymentOrder[]) {
    result.checked++;
    let failure: string | null = null;
    try {
      // The adapter validates all provider data before returning any events.
      const events = await reconcileWaffoOrder(order);
      if (events.length) {
        const { error: applyError } = await db.rpc('ai_font_apply_waffo_events', { p_events: events });
        if (applyError) throw applyError;
      }
    } catch {
      failure = 'PROVIDER_OR_LEDGER_CHECK_FAILED';
      result.errors++;
    }
    const { data: finished, error: finishError } = await db.rpc('ai_font_finish_billing_check', {
      p_id: order.id, p_token: order.billing_claim_token, p_error: failure,
    });
    if (finishError || !finished) { if (!failure) result.errors++; }
  }
  return result;
}
