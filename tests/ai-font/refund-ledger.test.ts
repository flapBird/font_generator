import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const user = '00000000-0000-4000-8000-000000000001';
const order = '10000000-0000-4000-8000-000000000001';
const job = '20000000-0000-4000-8000-000000000001';
const migration = '202610140001_billing_reconciliation_outbox.sql';
async function database(migrate = true) {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}',email text);
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    insert into auth.users values('${user}','{}','account@example.com');`);
  for (const file of ['202610030001_ai_fonts.sql', '202610060001_ai_font_credits.sql', '202610060002_accounts_billing.sql', ...(migrate ? [migration] : [])]) {
    await db.exec(await readFile(new URL(`../../supabase/migrations/${file}`, import.meta.url), 'utf8'));
  }
  await db.query(`insert into ai_font_orders(id,user_id,provider,package_id,amount_minor,currency,credits,credit_version,provider_environment,external_id)
    values($1,$2,'waffo','english-starter',499,'USD',300,2,'test','SESSION_1')`, [order, user]);
  return db;
}
function event(kind = 'paid', extra: Record<string, unknown> = {}) {
  return { kind, key: `${kind}:PAY_1`, orderId: order, providerOrderId: 'ORD_1', paymentId: 'PAY_1', mode: 'test', amountMinor: 499,
    paymentTotalMinor: 599, currency: 'USD', timestamp: '2026-10-14T10:00:00Z', ...extra };
}
function refund(id: string, amount: number, extra: Record<string, unknown> = {}) {
  return event('revoked', { key: `refund:${id}`, reason: 'refund', adjustmentId: id, refundAmountMinor: amount, ...extra });
}
async function apply(db: PGlite, data: object) { await db.query('select ai_font_apply_waffo_event($1)', [JSON.stringify(data)]); }
async function balance(db: PGlite) { return (await db.query<{ balance: number }>('select balance from ai_font_wallets where user_id=$1', [user])).rows[0]?.balance ?? 0; }
async function mails(db: PGlite) { return (await db.query<{ kind: string; recipient_email: string; payload: Record<string, unknown> }>('select kind,recipient_email,payload from ai_font_mail_outbox order by id')).rows; }

test('tax-inclusive partial refunds debit cumulatively, remain idempotent and never revoke more than the pack', async () => {
  const db = await database(); try {
    await apply(db, event());
    await apply(db, refund('R1', 100));
    assert.equal(await balance(db), 249, 'ceil(300 * 100 / 599), rather than dividing by tax-exclusive 499');
    await apply(db, refund('R1', 100, { key: 'new-delivery-id' }));
    assert.equal(await balance(db), 249);
    await assert.rejects(apply(db, refund('R1', 101, { key: 'changed-refund' })), /ADJUSTMENT_MISMATCH/);
    await apply(db, refund('R2', 100));
    assert.equal(await balance(db), 199, 'round cumulative 200 once, not each refund separately');
    await apply(db, refund('R3', 399));
    assert.equal(await balance(db), 0);
    await apply(db, event('paid', { key: 'late-paid' }));
    assert.equal(await balance(db), 0);
    await assert.rejects(apply(db, refund('R4', 1)), /REFUND_TOTAL_EXCEEDED/);
    assert.deepEqual((await mails(db)).map(row => row.kind), ['payment_credited', 'refund_applied', 'refund_applied', 'refund_applied']);
    assert.equal((await mails(db))[0].recipient_email, 'account@example.com');
  } finally { await db.close(); }
});

test('refunds withdraw spent credits, preserve delivered fonts and block new generations', async () => {
  const db = await database(); try {
    await apply(db, event());
    await db.query('select ai_font_reserve_job($1,$2,$3,100)', [user, job, 'a bold display font']);
    await db.query('select ai_font_finish_job($1,$2,$3,$4)', [job, 'succeeded', `${user}/${job}.ttf`, 'Delivered Font']);
    await apply(db, refund('FULL', 599));
    assert.equal(await balance(db), -100);
    assert.equal((await db.query<{ storage_path: string }>('select storage_path from ai_font_jobs')).rows[0].storage_path, `${user}/${job}.ttf`);
    await assert.rejects(db.query('select ai_font_reserve_job($1,$2,$3,100)', [user, '20000000-0000-4000-8000-000000000002', 'a second display font']), /NO_CREDITS/);
    assert.equal((await mails(db))[1].payload.balance, -100);
  } finally { await db.close(); }
});

test('a full refund before payment cannot grant credits; a partial refund before payment grants only the net entitlement', async () => {
  const full = await database(); try {
    await apply(full, refund('FULL', 599)); await apply(full, event());
    assert.equal(await balance(full), 0);
    assert.deepEqual((await mails(full)).map(row => row.kind), ['refund_applied']);
  } finally { await full.close(); }
  const partial = await database(); try {
    await apply(partial, refund('PARTIAL', 100));
    assert.equal(await balance(partial), 0);
    await apply(partial, event());
    assert.equal(await balance(partial), 249);
    assert.equal((await mails(partial))[1].payload.credits, 249);
  } finally { await partial.close(); }
});

test('legacy full reversal semantics and historic credited/refunded balances survive the new migration', async () => {
  const db = await database(false); try {
    await apply(db, event('paid', { paymentTotalMinor: undefined }));
    await apply(db, event('revoked', { paymentTotalMinor: undefined }));
    assert.equal(await balance(db), 0);
    await db.exec(await readFile(new URL(`../../supabase/migrations/${migration}`, import.meta.url), 'utf8'));
    assert.equal((await db.query<{ payment_total_minor: number | null }>('select payment_total_minor from ai_font_billing_payments')).rows[0].payment_total_minor, null);
    await apply(db, event('paid', { key: 'migration-late-paid' }));
    assert.equal(await balance(db), 0);
    assert.equal((await mails(db)).length, 0, 'migration must not re-send old receipts');
    await apply(db, refund('TAX_INCLUSIVE_REFUND', 599));
    assert.equal(await balance(db), 0, 'verified gross total can fill in legacy refund without regranting');
    const payment = (await db.query<{ payment_total_minor: number; refunded_amount_minor: number; legacy_full_reversal: boolean }>('select payment_total_minor,refunded_amount_minor,legacy_full_reversal from ai_font_billing_payments')).rows[0];
    assert.deepEqual(payment, { payment_total_minor: 599, refunded_amount_minor: 599, legacy_full_reversal: true });
  } finally { await db.close(); }
  const first = await database(); try {
    await apply(first, event('revoked', { paymentTotalMinor: undefined }));
    await apply(first, event('paid', { paymentTotalMinor: undefined }));
    assert.equal(await balance(first), 0);
  } finally { await first.close(); }
});

test('chargebacks and refunds share a capped entitlement and a confirmed reversal restores only unrefunded credits', async () => {
  const db = await database(); try {
    await apply(db, event());
    await apply(db, refund('R1', 100));
    await apply(db, event('revoked', { key: 'CB-open', reason: 'chargeback', adjustmentId: 'CB1' }));
    assert.equal(await balance(db), 0);
    await apply(db, refund('R2', 100));
    assert.equal(await balance(db), 0, 'refund while disputed cannot double debit');
    await apply(db, event('restored', { key: 'CB-won', reason: 'chargeback_reversed', adjustmentId: 'CB1', timestamp: '2026-10-15T10:00:00Z' }));
    assert.equal(await balance(db), 199);
    await apply(db, event('revoked', { key: 'CB-delayed', reason: 'chargeback', adjustmentId: 'CB1', timestamp: '2026-10-16T10:00:00Z' }));
    assert.equal(await balance(db), 199, 'terminal reversal cannot be reopened by delayed delivery');
    assert.equal((await db.query<{ active: boolean }>('select active from ai_font_billing_holds')).rows[0].active, false);
  } finally { await db.close(); }
});

test('unknown dispute statuses freeze new generation and reserved-job submission without guessing a debit', async () => {
  const db = await database(); try {
    await apply(db, event());
    await db.query('select ai_font_reserve_job($1,$2,$3,100)', [user, job, 'a bold display font']);
    await apply(db, event('review', { key: 'CB-review', reason: 'chargeback', adjustmentId: 'CB1', chargebackStatus: 'ACTION_REQUIRED', reviewRequired: true }));
    assert.equal(await balance(db), 200);
    assert.equal((await db.query<{ ai_font_claim_job: boolean }>('select ai_font_claim_job($1)', [job])).rows[0].ai_font_claim_job, false);
    assert.equal((await db.query<{ status: string }>('select status from ai_font_jobs')).rows[0].status, 'failed');
    assert.equal(await balance(db), 300, 'a reserved job never submitted upstream restores its cost');
    await assert.rejects(db.query('select ai_font_reserve_job($1,$2,$3,100)', [user, '20000000-0000-4000-8000-000000000002', 'a second display font']), /BILLING_RESTRICTED/);
    await db.query('select ai_font_finish_job($1,$2)', [job, 'failed']);
    assert.equal(await balance(db), 300, 'failed reserved jobs still restore their cost');
    await apply(db, event('review', { key: 'CB-new-delivery', reason: 'chargeback', adjustmentId: 'CB1', chargebackStatus: 'EXPIRED', reviewRequired: true }));
    const hold = (await db.query<{ active: boolean; needs_review: boolean; provider_status: string }>('select * from ai_font_billing_holds')).rows[0];
    assert.deepEqual([hold.active, hold.needs_review, hold.provider_status], [true, true, 'EXPIRED']);
    assert.equal((await mails(db)).filter(row => row.kind === 'chargeback_restricted').length, 1);
    assert.equal((await db.query<{ billing_review_reason: string }>('select billing_review_reason from ai_font_orders')).rows[0].billing_review_reason, 'CHARGEBACK_REVIEW_REQUIRED');
  } finally { await db.close(); }
});

test('service-role chargeback resolution requires evidence, audits decisions and reverses only the unrefunded entitlement', async () => {
  const db = await database(); try {
    await assert.rejects(db.query('select ai_font_resolve_chargeback($1,$2,$3)', ['MISSING', 'reversed', 'WAFFO:CASE1']), /CHARGEBACK_NOT_FOUND/);
    await assert.rejects(db.query('select ai_font_resolve_chargeback($1,$2,$3)', ['CB1', 'guessed_won', 'WAFFO:CASE1']), /INVALID_CHARGEBACK_OUTCOME/);
    await assert.rejects(db.query('select ai_font_resolve_chargeback($1,$2,$3)', ['CB1', 'reversed', '']), /INVALID_EVIDENCE_REFERENCE/);
    await assert.rejects(db.query('select ai_font_resolve_chargeback($1,$2,$3)', ['CB1', 'reversed', 'someone@example.com']), /INVALID_EVIDENCE_REFERENCE/);
    await apply(db, event()); await apply(db, refund('R1', 100));
    await apply(db, event('review', { key: 'CB-review', reason: 'chargeback', adjustmentId: 'CB1', chargebackStatus: 'ACTION_REQUIRED' }));
    await db.exec('set role service_role');
    await db.query('select ai_font_resolve_chargeback($1,$2,$3)', ['CB1', 'confirmed_loss', 'WAFFO:CASE1']);
    await db.query('select ai_font_resolve_chargeback($1,$2,$3)', ['CB1', 'confirmed_loss', 'WAFFO:CASE1-RETRY']);
    await db.exec('reset role');
    assert.equal(await balance(db), 0);
    const disputeMails = (await mails(db)).filter(row => row.kind === 'chargeback_restricted');
    assert.equal(disputeMails.length, 2, 'review and later confirmed loss need distinct, deduped notifications');
    assert.equal(disputeMails[0].payload.reviewRequired, true);
    assert.equal(disputeMails[1].payload.confirmedLoss, true);
    assert.equal(disputeMails[1].payload.creditsDelta, -249);
    await apply(db, event('review', { key: 'CB-after-manual-loss', reason: 'chargeback', adjustmentId: 'CB1', chargebackStatus: 'UNKNOWN_LOSS_STATUS' }));
    assert.equal((await mails(db)).filter(row => row.kind === 'chargeback_restricted').length, 2);
    assert.equal((await db.query<{ provider_status: string }>('select provider_status from ai_font_billing_holds')).rows[0].provider_status, 'MANUAL_CONFIRMED_LOSS');
    await apply(db, refund('R2', 100));
    await db.query('select ai_font_resolve_chargeback($1,$2,$3)', ['CB1', 'reversed', 'BANK:REVERSAL1']);
    await db.query('select ai_font_resolve_chargeback($1,$2,$3)', ['CB1', 'reversed', 'BANK:REVERSAL1-RETRY']);
    assert.equal(await balance(db), 199);
    await apply(db, event('review', { key: 'CB-after-manual-reversal', reason: 'chargeback', adjustmentId: 'CB1', chargebackStatus: 'ACTION_REQUIRED' }));
    await assert.rejects(db.query('select ai_font_resolve_chargeback($1,$2,$3)', ['CB1', 'confirmed_loss', 'WAFFO:DELAYED']), /CHARGEBACK_ALREADY_REVERSED/);
    const decisions = (await db.query<{ outcome: string; evidence_reference: string; decided_at: string }>('select outcome,evidence_reference,decided_at from ai_font_chargeback_decisions order by decided_at')).rows;
    assert.deepEqual(decisions.map(row => [row.outcome, row.evidence_reference]), [['confirmed_loss', 'WAFFO:CASE1'], ['reversed', 'BANK:REVERSAL1']]);
    assert.ok(decisions.every(row => row.decided_at));
    const hold = (await db.query<{ active: boolean; needs_review: boolean; provider_status: string }>('select active,needs_review,provider_status from ai_font_billing_holds')).rows[0];
    assert.deepEqual(hold, { active: false, needs_review: false, provider_status: 'MANUAL_REVERSED' });
    assert.equal((await db.query<{ billing_review_reason: string | null }>('select billing_review_reason from ai_font_orders')).rows[0].billing_review_reason, null);
  } finally { await db.close(); }
});

test('refunded reserved jobs cancel and restore once; jobs already submitted continue to deliver', async () => {
  const db = await database(); try {
    await apply(db, event());
    await db.query('select ai_font_reserve_job($1,$2,$3,100)', [user, job, 'a bold display font']);
    await apply(db, refund('FULL', 599));
    assert.equal(await balance(db), -100);
    const claims = await Promise.all([db.query<{ ai_font_claim_job: boolean }>('select ai_font_claim_job($1)', [job]), db.query<{ ai_font_claim_job: boolean }>('select ai_font_claim_job($1)', [job])]);
    assert.ok(claims.every(result => result.rows[0].ai_font_claim_job === false));
    assert.equal(await balance(db), 0, 'reserved cost was not actual generation usage');
    assert.equal((await db.query<{ status: string }>('select status from ai_font_jobs')).rows[0].status, 'failed');
  } finally { await db.close(); }
  const started = await database(); try {
    await apply(started, event());
    await started.query('select ai_font_reserve_job($1,$2,$3,100)', [user, job, 'a bold display font']);
    assert.equal((await started.query<{ ai_font_claim_job: boolean }>('select ai_font_claim_job($1)', [job])).rows[0].ai_font_claim_job, true);
    await apply(started, refund('FULL', 599));
    assert.equal((await started.query<{ ai_font_claim_job: boolean }>('select ai_font_claim_job($1)', [job])).rows[0].ai_font_claim_job, false);
    assert.equal(await balance(started), -100);
    await started.query('select ai_font_finish_job($1,$2,$3,$4)', [job, 'succeeded', `${user}/${job}.ttf`, 'Delivered Font']);
    assert.equal(await balance(started), -100, 'actual remote generation remains spent');
    assert.equal((await started.query<{ status: string }>('select status from ai_font_jobs')).rows[0].status, 'succeeded');
  } finally { await started.close(); }
});

test('partial chargeback losses use their verified principal, combine with refunds and reverse without duplicate restoration', async () => {
  const db = await database(); try {
    await apply(db, event('paid', { paymentTotalMinor: 499 }));
    const dispute = event('review', { key: 'CB-partial-review', reason: 'chargeback', adjustmentId: 'CB_PARTIAL', chargebackStatus: 'ACTION_REQUIRED', paymentTotalMinor: 499, chargebackAmountMinor: 149 });
    await apply(db, dispute);
    assert.equal(await balance(db), 300, 'review still freezes without guessing a monetary loss');
    assert.equal((await db.query<{ chargeback_amount_minor: number }>('select chargeback_amount_minor from ai_font_billing_holds')).rows[0].chargeback_amount_minor, 149);
    await assert.rejects(apply(db, { ...dispute, key: 'CB-changed-principal', chargebackAmountMinor: 150 }), /CHARGEBACK_AMOUNT_MISMATCH/);
    await assert.rejects(apply(db, { ...dispute, key: 'CB-exceeds-paid', adjustmentId: 'CB_TOO_LARGE', chargebackAmountMinor: 500 }), /INVALID_CHARGEBACK_AMOUNT/);
    await db.query('select ai_font_resolve_chargeback($1,$2,$3)', ['CB_PARTIAL', 'confirmed_loss', 'WAFFO:PARTIAL_LOSS']);
    assert.equal(await balance(db), 210, 'ceil(300 * 149 / 499) = 90 credits, rather than all 300');
    await apply(db, refund('R_PARTIAL', 100, { paymentTotalMinor: 499 }));
    assert.equal(await balance(db), 150, 'ceil(300 * (149 + 100) / 499) = 150 cumulative withdrawal');
    await db.query('select ai_font_resolve_chargeback($1,$2,$3)', ['CB_PARTIAL', 'reversed', 'BANK:PARTIAL_REVERSAL']);
    assert.equal(await balance(db), 239, 'only the 100 / 499 refund remains withdrawn (61 credits)');
    await db.query('select ai_font_resolve_chargeback($1,$2,$3)', ['CB_PARTIAL', 'reversed', 'BANK:PARTIAL_RETRY']);
    await apply(db, event('paid', { key: 'late-payment', paymentTotalMinor: 499 }));
    assert.equal(await balance(db), 239);
    await assert.rejects(apply(db, { ...dispute, key: 'CB-terminal-changed-principal', chargebackAmountMinor: 150 }), /CHARGEBACK_AMOUNT_MISMATCH/);
    assert.equal((await mails(db)).filter(row => row.kind === 'chargeback_reversed').length, 1);
    const adjustment = (await db.query<{ amount_minor: number; active: boolean }>("select amount_minor,active from ai_font_billing_adjustments where kind='chargeback'")).rows[0];
    assert.deepEqual(adjustment, { amount_minor: 149, active: false });
  } finally { await db.close(); }
});

test('the transaction rolls back payment/credits if its outbox insert fails; account email is authoritative', async () => {
  const db = await database(); try {
    await db.exec(`create function reject_mail() returns trigger language plpgsql as $$ begin raise exception 'OUTBOX_FAIL'; end $$;
      create trigger reject_mail before insert on ai_font_mail_outbox for each row execute function reject_mail();`);
    await assert.rejects(apply(db, event()), /OUTBOX_FAIL/);
    assert.equal(await balance(db), 0);
    assert.equal((await db.query('select * from ai_font_billing_payments')).rows.length, 0);
    await db.exec('drop trigger reject_mail on ai_font_mail_outbox');
    await apply(db, event('paid', { checkoutEmail: 'cashier-stranger@example.com' }));
    assert.equal((await mails(db))[0].recipient_email, 'account@example.com');
  } finally { await db.close(); }
});

test('mail leases support one claimant, retry, expired-lease recovery and stale-token rejection independently of credits', async () => {
  const db = await database(); try {
    await apply(db, event());
    const claims = await Promise.all([db.query<{ id: number; claim_token: string }>('select * from ai_font_claim_mail(3)'), db.query('select * from ai_font_claim_mail(3)')]);
    assert.equal(claims[0].rows.length + claims[1].rows.length, 1);
    const claimed = claims[0].rows[0];
    await db.query('select ai_font_finish_mail($1,$2,null,$3)', [claimed.id, claimed.claim_token, 'MAIL_UNAVAILABLE']);
    assert.equal(await balance(db), 300);
    assert.equal((await db.query('select * from ai_font_claim_mail(3)')).rows.length, 0, 'retry observes backoff');
    await db.exec("update ai_font_mail_outbox set next_attempt_at=now()-interval '1 second'");
    const second = (await db.query<{ id: number; claim_token: string }>('select * from ai_font_claim_mail(3)')).rows[0];
    assert.notEqual(second.claim_token, claimed.claim_token);
    await db.exec("update ai_font_mail_outbox set claimed_until=now()-interval '1 second'");
    const third = (await db.query<{ id: number; claim_token: string }>('select * from ai_font_claim_mail(3)')).rows[0];
    const stale = (await db.query<{ ai_font_finish_mail: boolean }>('select ai_font_finish_mail($1,$2,$3)', [second.id, second.claim_token, 'stale-message'])).rows[0].ai_font_finish_mail;
    assert.equal(stale, false);
    const done = (await db.query<{ ai_font_finish_mail: boolean }>('select ai_font_finish_mail($1,$2,$3)', [third.id, third.claim_token, 'MSG_1'])).rows[0].ai_font_finish_mail;
    assert.equal(done, true);
    assert.equal((await db.query('select * from ai_font_claim_mail(3)')).rows.length, 0);
    assert.equal((await db.query<{ status: string }>('select status from ai_font_mail_outbox')).rows[0].status, 'sent');
  } finally { await db.close(); }
});

test('missing account email and exhausted mail retries are held for support instead of dropping the receipt', async () => {
  const db = await database(); try {
    await db.exec('update auth.users set email=null'); await apply(db, event());
    assert.equal(await balance(db), 300);
    assert.equal((await db.query('select * from ai_font_claim_mail(3)')).rows.length, 0);
    assert.equal((await db.query<{ status: string }>('select status from ai_font_mail_outbox')).rows[0].status, 'needs_review');
    await db.exec("update ai_font_mail_outbox set recipient_email='account@example.com',status='processing',attempts=8,claimed_until=now()-interval '1 second'");
    await db.query('select * from ai_font_claim_mail(3)');
    assert.equal((await db.query<{ last_error: string }>('select last_error from ai_font_mail_outbox')).rows[0].last_error, 'DELIVERY_RETRIES_EXHAUSTED');
  } finally { await db.close(); }
});

test('mail requests that may already have sent are held for review rather than automatically duplicated', async () => {
  const db = await database(); try {
    await apply(db, event());
    const claimed = (await db.query<{ id: number; claim_token: string }>('select * from ai_font_claim_mail(3)')).rows[0];
    assert.equal((await db.query<{ ai_font_begin_mail_delivery: boolean }>('select ai_font_begin_mail_delivery($1,$2)', [claimed.id, claimed.claim_token])).rows[0].ai_font_begin_mail_delivery, true);
    assert.equal((await db.query<{ ai_font_begin_mail_delivery: boolean }>('select ai_font_begin_mail_delivery($1,$2)', [claimed.id, claimed.claim_token])).rows[0].ai_font_begin_mail_delivery, false);
    await db.exec("update ai_font_mail_outbox set claimed_until=now()-interval '1 second'");
    assert.equal((await db.query('select * from ai_font_claim_mail(3)')).rows.length, 0);
    const mail = (await db.query<{ status: string; last_error: string }>('select status,last_error from ai_font_mail_outbox')).rows[0];
    assert.deepEqual(mail, { status: 'needs_review', last_error: 'DELIVERY_UNCERTAIN' });
    assert.equal(await balance(db), 300);
  } finally { await db.close(); }
  const failed = await database(); try {
    await apply(failed, event());
    const claimed = (await failed.query<{ id: number; claim_token: string }>('select * from ai_font_claim_mail(3)')).rows[0];
    await failed.query('select ai_font_begin_mail_delivery($1,$2)', [claimed.id, claimed.claim_token]);
    await failed.query('select ai_font_finish_mail($1,$2,null,$3)', [claimed.id, claimed.claim_token, 'DELIVERY_UNCERTAIN']);
    assert.equal((await failed.query('select * from ai_font_claim_mail(3)')).rows.length, 0);
  } finally { await failed.close(); }
});

test('reconciliation cannot guess a payment reference and rejects amount or payment identity mismatches', async () => {
  const db = await database(); try {
    await apply(db, event('paid', { source: 'reconciliation' }));
    assert.equal(await balance(db), 0);
    assert.equal((await db.query<{ billing_review_reason: string }>('select billing_review_reason from ai_font_orders')).rows[0].billing_review_reason, 'UNVERIFIED_RECONCILIATION_REFERENCE');
    await apply(db, event('paid', { source: 'reconciliation', businessReferenceVerified: true }));
    assert.equal(await balance(db), 300);
    await assert.rejects(apply(db, event('paid', { key: 'wrong-total', paymentTotalMinor: 499 })), /PAYMENT_TOTAL_MISMATCH/);
    await assert.rejects(apply(db, event('paid', { key: 'wrong-amount', amountMinor: 500 })), /AMOUNT_MISMATCH/);
    await assert.rejects(apply(db, event('paid', { key: 'second-payment', paymentId: 'PAY_2' })), /DUPLICATE_PAYMENT_REVIEW/);
    assert.equal((await mails(db)).length, 1);
  } finally { await db.close(); }
});

test('a reconciliation snapshot applies refunded entitlement atomically and never queues credits for a fully refunded payment', async () => {
  const db = await database(); try {
    await db.query('select ai_font_apply_waffo_events($1)', [JSON.stringify([event(), refund('FULL', 599)])]);
    assert.equal(await balance(db), 0);
    assert.deepEqual((await mails(db)).map(row => row.kind), ['refund_applied']);
  } finally { await db.close(); }
  const bad = await database(); try {
    await assert.rejects(bad.query('select ai_font_apply_waffo_events($1)', [JSON.stringify([event(), refund('BAD', 600)])]), /INVALID_REFUND_AMOUNT/);
    assert.equal(await balance(bad), 0);
    assert.equal((await mails(bad)).length, 0);
    await assert.rejects(bad.query('select ai_font_apply_waffo_events($1)', [JSON.stringify([event(), event('paid', { orderId: '10000000-0000-4000-8000-000000000002' })])]), /INVALID_EVENT_BATCH/);
  } finally { await bad.close(); }
  const disputed = await database(); try {
    await disputed.query('select ai_font_apply_waffo_events($1)', [JSON.stringify([event(), event('review', { key: 'CB-review', reason: 'chargeback', adjustmentId: 'CB1', chargebackStatus: 'ACTION_REQUIRED' })])]);
    const mail = (await mails(disputed)).find(row => row.kind === 'payment_credited');
    assert.ok(mail);
    assert.equal(mail.payload.billingRestricted, true);
    assert.equal(mail.payload.reviewRequired, true);
    assert.equal(await balance(disputed), 300);
  } finally { await disputed.close(); }
  const debt = await database(); try {
    await debt.query('select ai_font_credit_once($1,$2,$3)', [user, 'prior-confirmed-refund', -400]);
    await apply(debt, event());
    assert.equal(await balance(debt), -100);
    assert.equal((await mails(debt))[0].payload.billingRestricted, true, 'a pending purchase does not make a still-negative account usable');
  } finally { await debt.close(); }
});

test('billing checks use leases, manual cooldown, mode filtering, old-order coverage and retry backoff', async () => {
  const db = await database(); try {
    await db.exec("update ai_font_orders set created_at='2020-01-01'");
    assert.equal((await db.query('select * from ai_font_claim_billing_orders(3,null,$1)', ['prod'])).rows.length, 0);
    const claims = await Promise.all([db.query<{ id: string; billing_claim_token: string }>('select * from ai_font_claim_billing_orders(3,null,$1)', ['test']), db.query('select * from ai_font_claim_billing_orders(3,null,$1)', ['test'])]);
    assert.equal(claims[0].rows.length + claims[1].rows.length, 1);
    const claimed = claims[0].rows[0];
    await db.query('select ai_font_finish_billing_check($1,$2)', [claimed.id, claimed.billing_claim_token]);
    assert.equal((await db.query('select * from ai_font_claim_billing_orders(1,$1,$2)', [order, 'test'])).rows.length, 0, 'manual recheck cooldown');
    await db.exec("update ai_font_orders set billing_checked_at=now()-interval '61 seconds'");
    const second = (await db.query<{ id: string; billing_claim_token: string }>('select * from ai_font_claim_billing_orders(1,$1,$2)', [order, 'test'])).rows[0];
    await db.query('select ai_font_finish_billing_check($1,$2,$3)', [second.id, second.billing_claim_token, 'PROVIDER_UNAVAILABLE']);
    assert.equal((await db.query('select * from ai_font_claim_billing_orders(3,null,$1)', ['test'])).rows.length, 0, 'scheduled retry observes backoff');
    assert.equal((await db.query<{ billing_check_failures: number }>('select billing_check_failures from ai_font_orders')).rows[0].billing_check_failures, 1);
    const stale = (await db.query<{ ai_font_finish_billing_check: boolean }>('select ai_font_finish_billing_check($1,$2)', [claimed.id, claimed.billing_claim_token])).rows[0].ai_font_finish_billing_check;
    assert.equal(stale, false);
  } finally { await db.close(); }
  const missingSession = await database(); try {
    await missingSession.exec('update ai_font_orders set external_id=null');
    assert.equal((await missingSession.query('select * from ai_font_claim_billing_orders(3,null,$1)', ['test'])).rows.length, 1, 'a crashed checkout persistence must remain eligible for authenticated provider reconciliation');
    await apply(missingSession, event('paid', { source: 'reconciliation' }));
    assert.equal(await balance(missingSession), 0);
    await apply(missingSession, event('paid', { source: 'reconciliation', businessReferenceVerified: true }));
    assert.equal(await balance(missingSession), 300);
  } finally { await missingSession.close(); }
});

test('anonymous and authenticated roles cannot read notification addresses, freeze accounts, adjust credits or claim checks', async () => {
  const db = await database(); try {
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role}`);
      for (const table of ['ai_font_billing_adjustments', 'ai_font_billing_holds', 'ai_font_chargeback_decisions', 'ai_font_mail_outbox']) await assert.rejects(db.query(`select * from ${table}`), /permission denied/);
      await assert.rejects(apply(db, event()), /permission denied/);
      await assert.rejects(db.query('select ai_font_apply_waffo_events($1)', [JSON.stringify([event()])]), /permission denied/);
      await assert.rejects(db.query('select * from ai_font_claim_mail(3)'), /permission denied/);
      await assert.rejects(db.query('select ai_font_begin_mail_delivery(1,$1)', ['00000000-0000-4000-8000-000000000001']), /permission denied/);
      await assert.rejects(db.query('select * from ai_font_claim_billing_orders(3,null,null)'), /permission denied/);
      await assert.rejects(db.query('select ai_font_finish_mail(1,$1)', ['00000000-0000-4000-8000-000000000001']), /permission denied/);
      await assert.rejects(db.query('select ai_font_resolve_chargeback($1,$2,$3)', ['CB1', 'reversed', 'WAFFO:CASE1']), /permission denied/);
      await db.exec('reset role');
    }
  } finally { await db.close(); }
});
