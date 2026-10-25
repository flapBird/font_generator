import 'server-only';
import { appOrigin } from './config';
import { failureReasons, type JobFailureCode } from './job-status';
import type { TransactionalMessage } from './notifications';

export type JobMail = {
  id: number;
  claim_token: string;
  recipient_email: string;
  job_id: string;
  kind: 'succeeded' | 'failed';
  payload: { creditsRestored: number; failureCode: string | null };
};

// Deliberately omit descriptions, provider diagnostics, font attachments and
// private/signed download URLs. Downloads still require the owning account.
export function jobMessage(mail: JobMail, origin = appOrigin()): TransactionalMessage {
  if (!/^[a-f0-9-]{36}$/i.test(mail.job_id) || !Number.isSafeInteger(mail.payload.creditsRestored) || mail.payload.creditsRestored < 0) throw new Error('Invalid job mail');
  let subject: string, details: string;
  if (mail.kind === 'succeeded') {
    if (mail.payload.creditsRestored !== 0) throw new Error('Invalid success credit outcome');
    subject = 'Your AI font is ready';
    details = 'Your font has finished generation and the required file and safety checks. Sign in to your font library to preview and download it.';
  } else if (mail.kind === 'failed') {
    subject = 'Your AI font generation did not complete';
    const code = mail.payload.failureCode;
    const reason = code && Object.hasOwn(failureReasons, code) ? failureReasons[code as JobFailureCode] : null;
    details = `${reason ? `${reason.title}. ${reason.message}` : 'This generation could not complete. A detailed reason was not recorded.'}\n${mail.payload.creditsRestored} generation credits were restored to your account. This is a credit restoration, not a payment refund.\n${reason?.next || 'Contact support with the task reference if you would like us to investigate.'}`;
  } else throw new Error('Invalid job mail kind');
  return { to: mail.recipient_email, subject,
    text: `${details}\n\nTask reference: ${mail.job_id}\nView your private font library: ${new URL('/my-fonts', origin).href}\nContact support: ${new URL('/contact', origin).href}\n\nFont Generators` };
}
