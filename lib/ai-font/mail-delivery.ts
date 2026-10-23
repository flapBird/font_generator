import 'server-only';
import { adminClient } from './supabase';
import { billingMessage, type BillingMail } from './notifications';
import { inboxAvailable, inboxSettings, sendInboxMail, InboxDeliveryError } from '../mail/inbox';

export async function deliverBillingMail() {
  if (!inboxAvailable()) return { checked: 0, errors: 0, disabled: true };
  // Reject bad deployment settings before taking any delivery leases.
  inboxSettings();
  const db = adminClient();
  const { data, error } = await db.rpc('ai_font_claim_mail', { p_limit: 1 });
  if (error) throw error;
  const result = { checked: 0, errors: 0, disabled: false };
  for (const mail of (data || []) as BillingMail[]) {
    result.checked++;
    let messageId: string | null = null;
    let failure: string | null = null;
    let phase: 'rendering' | 'preparing' | 'sending' = 'rendering';
    try {
      const message = billingMessage(mail);
      phase = 'preparing';
      const { data: started, error: startError } = await db.rpc('ai_font_begin_mail_delivery', { p_id: mail.id, p_token: mail.claim_token });
      if (startError) throw startError;
      if (!started) continue;
      phase = 'sending';
      messageId = await sendInboxMail(message);
    } catch (error) {
      failure = error instanceof InboxDeliveryError ? error.code
        : phase === 'sending' ? 'DELIVERY_UNCERTAIN' : phase === 'preparing' ? 'RETRY_PREPARE' : 'PERMANENT_PAYLOAD';
      // Only allowlisted diagnostics; never log the recipient, body or raw error.
      console.warn('billing_mail_failed', { mailId: mail.id, code: failure,
        status: error instanceof InboxDeliveryError ? error.status : undefined });
      result.errors++;
    }
    const { data: finished, error: finishError } = await db.rpc('ai_font_finish_mail', {
      p_id: mail.id, p_token: mail.claim_token, p_message_id: messageId, p_error: failure,
    });
    if (finishError || !finished) {
      // A sent mail must not be retried if saving its receipt failed. The expired
      // delivery_started_at lease is moved to needs_review by the next claim.
      if (!failure) result.errors++;
    }
  }
  return result;
}
