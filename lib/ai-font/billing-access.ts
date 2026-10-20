import 'server-only';
import { adminClient } from './supabase';
import { HttpError } from './http';

export async function requireBillingAccess(userId: string) {
  const db = adminClient();
  const [wallet, holds] = await Promise.all([
    db.from('ai_font_wallets').select('balance').eq('user_id', userId).maybeSingle(),
    db.from('ai_font_billing_holds').select('adjustment_id').eq('user_id', userId).eq('active', true).limit(1),
  ]);
  if (wallet.error) throw wallet.error;
  if (holds.error) throw holds.error;
  if ((wallet.data?.balance ?? 0) < 0 || holds.data?.length) {
    throw new HttpError(403, 'Your payment or balance needs review. Contact support before purchasing again.');
  }
}
