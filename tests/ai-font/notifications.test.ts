import { test } from 'node:test';
import assert from 'node:assert/strict';
import { billingMessage, type BillingMail } from '../../lib/ai-font/notifications';

const mail: BillingMail = {
  id: 42, event_key: 'payment:one', claim_token: 'lease', recipient_email: 'buyer@example.com',
  kind: 'payment_credited', order_id: '6d8f5409-ab19-491e-a75c-ec5b4e5c41cc',
  payload: { creditsDelta: 300, balance: 300 },
};

test('billing email uses the committed credit change and a stable deduplication key', () => {
  const message = billingMessage(mail, 'https://fonts.example');
  assert.equal(message.to, 'buyer@example.com');
  assert.equal(message.idempotencyKey, 'ai-font-mail-42');
  assert.match(message.text, /300 credits have been added/);
  assert.match(message.text, /one-time purchases/);
  assert.match(message.text, /https:\/\/fonts.example\/account/);
  assert.equal(billingMessage(mail, 'https://fonts.example').idempotencyKey, message.idempotencyKey);
});

test('refund mail explains a spent-credit deficit without promising a new charge', () => {
  const message = billingMessage({ ...mail, kind: 'refund_applied', payload: { creditsDelta: -300, balance: -100 } }, 'https://fonts.example');
  assert.match(message.text, /-300 credits/);
  assert.match(message.text, /-100 credits/);
  assert.match(message.text, /does not create an automatic charge/);
});

test('a chargeback review does not falsely claim a completed refund', () => {
  const message = billingMessage({ ...mail, kind: 'chargeback_restricted', payload: { creditsDelta: 0, balance: 300 } }, 'https://fonts.example');
  assert.match(message.text, /does not itself confirm that a refund was issued/);
  assert.match(message.text, /purchases are paused/);
});

test('a payment credited during a dispute does not promise usable credits', () => {
  const message = billingMessage({ ...mail, payload: { creditsDelta: 300, balance: 300, reviewRequired: true } }, 'https://fonts.example');
  assert.match(message.subject, /under review/);
  assert.match(message.text, /new generation and purchases are paused/);
});

test('malformed ledger payload is held instead of sending a false balance', () => {
  assert.throws(() => billingMessage({ ...mail, payload: { creditsDelta: 300, balance: '300' } }, 'https://fonts.example'), /Invalid billing mail balance/);
});
