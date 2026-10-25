import 'server-only';
import { adminClient } from './supabase';
import { billingMessage, type BillingMail } from './notifications';
import { jobMessage, type JobMail } from './job-notifications';
import { inboxAvailable, inboxSettings, sendInboxMail, InboxDeliveryError } from '../mail/inbox';

async function deliverMail<T extends BillingMail | JobMail>(queue: 'billing' | 'job', render: (mail: T) => ReturnType<typeof billingMessage>) {
  if (!inboxAvailable()) return { checked: 0, errors: 0, disabled: true };
  // Reject bad deployment settings before taking any delivery leases.
  inboxSettings();
  const db = adminClient();
  const claim = queue === 'billing' ? 'ai_font_claim_mail' : 'ai_font_claim_job_mail';
  const begin = queue === 'billing' ? 'ai_font_begin_mail_delivery' : 'ai_font_begin_job_mail_delivery';
  const finish = queue === 'billing' ? 'ai_font_finish_mail' : 'ai_font_finish_job_mail';
  const { data, error } = await db.rpc(claim, { p_limit: 1 });
  if (error) throw error;
  const result = { checked: 0, errors: 0, disabled: false };
  for (const mail of (data || []) as T[]) {
    result.checked++;
    let messageId: string | null = null;
    let failure: string | null = null;
    let phase: 'rendering' | 'preparing' | 'sending' = 'rendering';
    try {
      const message = render(mail);
      phase = 'preparing';
      const { data: started, error: startError } = await db.rpc(begin, { p_id: mail.id, p_token: mail.claim_token });
      if (startError) throw startError;
      if (!started) continue;
      phase = 'sending';
      messageId = await sendInboxMail(message);
    } catch (error) {
      failure = error instanceof InboxDeliveryError ? error.code
        : phase === 'sending' ? 'DELIVERY_UNCERTAIN' : phase === 'preparing' ? 'RETRY_PREPARE' : 'PERMANENT_PAYLOAD';
      // Only allowlisted diagnostics; never log the recipient, body or raw error.
      console.warn(`${queue}_mail_failed`, { mailId: mail.id, code: failure,
        status: error instanceof InboxDeliveryError ? error.status : undefined });
      result.errors++;
    }
    const { data: finished, error: finishError } = await db.rpc(finish, {
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

export const deliverBillingMail = () => deliverMail<BillingMail>('billing', billingMessage);
export const deliverJobMail = () => deliverMail<JobMail>('job', jobMessage);

// Share the existing one-message cron budget. Alternating priority prevents a
// busy generation queue from starving receipts (or the reverse).
export async function deliverQueuedMail(now = Date.now()) {
  const empty = () => ({ checked: 0, errors: 0 });
  const result = { billing: empty(), jobs: empty() };
  const order = Math.floor(now / 300_000) % 2 ? ['jobs', 'billing'] as const : ['billing', 'jobs'] as const;
  for (const queue of order) {
    try { result[queue] = await (queue === 'billing' ? deliverBillingMail() : deliverJobMail()); }
    catch { result[queue] = { checked: 0, errors: 1 }; }
    if (result[queue].checked || result[queue].errors) break;
  }
  return result;
}
