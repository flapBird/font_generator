import 'server-only';
import { appOrigin } from './config';

export type BillingMail = {
  id: number;
  event_key: string;
  claim_token: string;
  recipient_email: string;
  kind: 'payment_credited' | 'refund_applied' | 'chargeback_restricted' | 'chargeback_reversed';
  order_id: string;
  payload: Record<string, unknown>;
};
export type TransactionalMessage = { to: string; subject: string; text: string; idempotencyKey: string };

function integer(value: unknown, name: string) {
  if (!Number.isSafeInteger(value)) throw new Error(`Invalid billing mail ${name}`);
  return value as number;
}

// Use the committed ledger snapshot, never a browser or provider success URL.
export function billingMessage(mail: BillingMail, origin = appOrigin()): TransactionalMessage {
  const balance = integer(mail.payload.balance, 'balance');
  const delta = integer(mail.payload.creditsDelta, 'creditsDelta');
  const reference = mail.order_id;
  const account = new URL('/account', origin).href;
  const support = new URL('/contact', origin).href;
  const restricted = mail.payload.reviewRequired === true || mail.payload.billingRestricted === true || balance < 0;
  let subject: string;
  let details: string;
  switch (mail.kind) {
    case 'payment_credited':
      subject = restricted ? 'Your AI font payment is confirmed and under review' : 'Your AI font credits are ready';
      details = `Your payment has been confirmed. ${delta} credits have been added to your account. Starter packs are one-time purchases with no automatic renewal.`;
      if (restricted) details += ' Your account has a payment restriction, so new generation and purchases are paused. Check your account and contact support before using these credits.';
      break;
    case 'refund_applied':
      subject = 'Your AI font refund and credit adjustment';
      details = `A refund has been confirmed by the payment provider. Your credit balance changed by ${delta} credits. Refunds withdraw the corresponding paid credits; if a payment has not yet been credited, only its unrefunded entitlement can be added later.`;
      break;
    case 'chargeback_restricted':
      subject = 'Your AI font payment needs review';
      details = mail.payload.confirmedLoss === true
        ? `A chargeback funds loss has been confirmed. Your credit balance changed by ${delta} credits. New font generation and purchases remain paused; contact support about the payment restriction.`
        : 'The payment provider reported a payment dispute. New font generation and purchases are paused while support reviews the payment. A dispute does not itself confirm that a refund was issued.';
      break;
    case 'chargeback_reversed':
      subject = 'Your AI font payment review was resolved';
      details = `The payment adjustment was resolved. Your credit balance changed by ${delta} credits. Check your account for the current balance and any remaining restrictions.`;
      break;
    default: throw new Error('Invalid billing mail kind');
  }
  const negative = balance < 0 ? '\nThe balance at this adjustment was negative. If it remains negative, new font generation and purchases are paused until support resolves the balance. This does not create an automatic charge to your card.\n' : '';
  return {
    to: mail.recipient_email,
    subject,
    text: `${details}\n\nBalance at the time of this adjustment: ${balance} credits.\nOrder reference: ${reference}\n${negative}\nView your account: ${account}\nContact support: ${support}\n\nFont Generators`,
    idempotencyKey: `ai-font-mail-${mail.id}`,
  };
}
