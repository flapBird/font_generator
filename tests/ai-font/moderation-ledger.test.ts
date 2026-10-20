import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const user = '00000000-0000-4000-8000-000000000001';
const other = '00000000-0000-4000-8000-000000000002';
const prompt = 'A friendly geometric display font';
const migration = '202610200001_font_moderation.sql';
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
type Check = { id: string; request_id: string; input_hash: string; asset_hash: string | null; provider_task_id: string | null; status: string; attempts: number; claim_token: string | null };

async function database(migrate = true, fund = true) {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}',email text);
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    insert into auth.users values('${user}','{}','account@example.com'),('${other}','{}','other@example.com');`);
  for (const file of ['202610030001_ai_fonts.sql', '202610060001_ai_font_credits.sql', '202610060002_accounts_billing.sql', '202610140001_billing_reconciliation_outbox.sql', ...(migrate ? [migration] : [])]) {
    await db.exec(await readFile(new URL(`../../supabase/migrations/${file}`, import.meta.url), 'utf8'));
  }
  if (fund) await db.query('select ai_font_credit_once($1,$2,1000)', [user, 'fixture:funding']);
  return db;
}
async function balance(db: PGlite) { return (await db.query<{ balance: number }>('select balance from ai_font_wallets where user_id=$1', [user])).rows[0]?.balance ?? 0; }
async function prepare(db: PGlite, request: string, stage = 'prompt', inputHash = hash(prompt), assetHash: string | null = null) {
  return (await db.query<{ review: Check }>('select ai_font_prepare_moderation($1,$2,$3,$4,$5) as review', [user, request, stage, inputHash, assetHash])).rows[0].review;
}
async function finish(db: PGlite, check: Check, status: string, task: string | null = `task_${check.id.replaceAll('-', '')}`) {
  return (await db.query<{ completed: boolean }>('select ai_font_finish_moderation($1,$2,$3,$4,$5) as completed', [check.id, check.claim_token, task, status, 0.01])).rows[0].completed;
}
async function approve(db: PGlite, request: string, stage = 'prompt', inputHash = hash(prompt), assetHash: string | null = null) {
  const check = await prepare(db, request, stage, inputHash, assetHash);
  assert.ok(check.claim_token); assert.equal(await finish(db, check, 'passed'), true);
  return check;
}
async function reserve(db: PGlite, request: string, text = prompt) { return db.query('select ai_font_reserve_job($1,$2,$3,100)', [user, request, text]); }
async function startProcessing(db: PGlite, request: string) {
  assert.equal((await db.query<{ claimed: boolean }>('select ai_font_claim_job($1) as claimed', [request])).rows[0].claimed, true);
  // This is the application's service-role transition after receiving a Mixfont ID.
  // Moderation verdicts and asset hashes are never seeded through table updates.
  await db.query("update ai_font_jobs set status='processing',external_id=$2 where id=$1 and status='starting'", [request, `mixfont_${request}`]);
}
async function complete(db: PGlite, request: string, status = 'succeeded') {
  return db.query('select ai_font_finish_job($1,$2,$3,$4)', [request, status, status === 'succeeded' ? `${user}/${request}.ttf` : null, 'Reviewed Font']);
}

test('moderation precedes reservation, and no-credit, billing-hold and active-job requests never admit a paid check', async () => {
  const db = await database(true, false);
  try {
    await assert.rejects(prepare(db, randomUUID()), /NO_CREDITS/);
    assert.equal((await db.query('select * from ai_font_moderation_checks')).rows.length, 0);
    await db.query('select ai_font_credit_once($1,$2,1000)', [user, 'fixture:funding']);
    const request = randomUUID();
    await assert.rejects(reserve(db, request), /MODERATION_REQUIRED/);
    const check = await prepare(db, request);
    assert.equal(await balance(db), 1000);
    assert.equal((await db.query('select * from ai_font_jobs')).rows.length, 0);
    assert.equal((await db.query('select * from ai_font_credit_events')).rows.length, 1, 'moderation must not reserve or refund generation credits');
    await assert.rejects(reserve(db, request), /MODERATION_REQUIRED/);
    assert.equal(await finish(db, check, 'passed'), true);
    await reserve(db, request);
    await assert.rejects(prepare(db, randomUUID()), /ACTIVE_JOB/);
    assert.equal((await db.query('select * from ai_font_moderation_checks')).rows.length, 1);
    await complete(db, request, 'failed');

    const order = randomUUID();
    await db.query(`insert into ai_font_orders(id,user_id,provider,package_id,amount_minor,currency,credits,credit_version,provider_environment,external_id)
      values($1,$2,'waffo','english-starter',499,'USD',300,2,'test','SESSION_HOLD')`, [order, user]);
    await db.query('select ai_font_apply_waffo_event($1)', [JSON.stringify({ kind: 'review', key: 'hold:review', orderId: order, providerOrderId: 'ORD_HOLD', paymentId: 'PAY_HOLD', mode: 'test', amountMinor: 499, paymentTotalMinor: 499, currency: 'USD', timestamp: '2026-10-20T10:00:00Z', reason: 'chargeback', adjustmentId: 'HOLD_1', chargebackStatus: 'ACTION_REQUIRED' })]);
    await assert.rejects(prepare(db, randomUUID()), /BILLING_RESTRICTED/);
    assert.equal((await db.query('select * from ai_font_moderation_checks')).rows.length, 1);
    assert.equal(await balance(db), 1000);
  } finally { await db.close(); }
});

test('moderation admissions enforce per-minute and per-hour limits without consuming font credits', async () => {
  const db = await database();
  try {
    for (let batch = 0; batch < 4; batch++) {
      await Promise.all(Array.from({ length: 5 }, () => prepare(db, randomUUID())));
      await assert.rejects(prepare(db, randomUUID()), /REVIEW_RATE_LIMIT/);
      // Only timing is changed: the earlier checks still count against the hourly cap.
      await db.exec("update ai_font_moderation_checks set created_at=now()-interval '2 minutes'");
    }
    await assert.rejects(prepare(db, randomUUID()), /REVIEW_RATE_LIMIT/);
    assert.equal((await db.query('select * from ai_font_moderation_checks')).rows.length, 20);
    assert.equal(await balance(db), 1000);
    assert.equal((await db.query('select * from ai_font_jobs')).rows.length, 0);
  } finally { await db.close(); }
});

test('moderation rows and provider identities are stable, leased once, and reject changed hashes or stale finishers', async () => {
  const db = await database();
  try {
    const request = randomUUID(), first = await prepare(db, request);
    assert.ok(first.claim_token);
    const concurrent = await prepare(db, request);
    assert.equal(concurrent.id, first.id); assert.equal(concurrent.claim_token, null); assert.equal(concurrent.attempts, 1);
    await assert.rejects(finish(db, first, 'passed', null), /REVIEW_TASK_REQUIRED/);
    await assert.rejects(prepare(db, request, 'prompt', hash('a different prompt')), /REVIEW_MISMATCH/);
    await assert.rejects(prepare(db, request, 'prompt', hash(prompt), hash('not a prompt asset')), /INVALID_REVIEW/);
    await db.query("update ai_font_moderation_checks set lease_until=now()-interval '1 second' where id=$1", [first.id]);
    assert.equal(await finish(db, first, 'passed'), false, 'expired owners cannot approve');
    const replacement = await prepare(db, request);
    assert.notEqual(replacement.claim_token, first.claim_token);
    assert.equal(await finish(db, first, 'passed'), false, 'stale owners cannot approve a replacement lease');
    assert.equal(await finish(db, replacement, 'pending', 'task_stable'), true);
    assert.equal((await prepare(db, request)).claim_token, null, 'pending tasks obey polling backoff');
    assert.equal(await finish(db, { ...replacement, claim_token: null }, 'passed', 'task_stable'), false, 'a released lease never authorizes a null-token finisher');
    await db.query("update ai_font_moderation_checks set next_check_at=now()-interval '1 second' where id=$1", [first.id]);
    const pollClaim = await prepare(db, request);
    assert.equal(pollClaim.provider_task_id, 'task_stable');
    await assert.rejects(finish(db, pollClaim, 'passed', 'task_changed'), /REVIEW_TASK_MISMATCH/);
    assert.equal(await finish(db, pollClaim, 'passed', 'task_stable'), true);
    const completed = await prepare(db, request);
    assert.equal(completed.id, first.id); assert.equal(completed.status, 'passed'); assert.equal(completed.claim_token, null);
    assert.equal((await db.query('select * from ai_font_moderation_checks')).rows.length, 1);
    const longestAdapterTask = `task_${'a'.repeat(240)}`;
    const longTaskCheck = await prepare(db, randomUUID());
    assert.equal(await finish(db, longTaskCheck, 'passed', longestAdapterTask), true, 'every task ID admitted by the HTTP adapter must fit the ledger');
    assert.equal(await balance(db), 1000);
  } finally { await db.close(); }
});

test('concurrent refreshes cannot exhaust a still-running twentieth moderation lease', async () => {
  const db = await database();
  try {
    const request = randomUUID();
    let last: Check | undefined;
    for (let attempt = 1; attempt <= 20; attempt++) {
      last = await prepare(db, request);
      assert.ok(last.claim_token); assert.equal(last.attempts, attempt);
      if (attempt < 20) {
        assert.equal(await finish(db, last, 'retry'), true);
        await db.query("update ai_font_moderation_checks set next_check_at=now()-interval '1 second' where id=$1", [last.id]);
      }
    }
    const refreshes = await Promise.all([prepare(db, request), prepare(db, request)]);
    assert.ok(refreshes.every((check) => check.status === 'pending' && check.claim_token === null && check.attempts === 20), 'the active final owner keeps its lease until it finishes or expires');
    assert.equal(await finish(db, last!, 'passed'), true);
    assert.equal((await prepare(db, request)).status, 'passed');
    assert.equal(await balance(db), 1000);
  } finally { await db.close(); }
});

test('moderation retry delay durably respects Retry-After while five-argument callers retain the sixty-second default', async () => {
  const db = await database();
  try {
    const defaults = await prepare(db, randomUUID());
    assert.equal(await finish(db, defaults, 'retry'), true);
    const defaultSeconds = (await db.query<{ seconds: number }>('select extract(epoch from next_check_at-now())::double precision as seconds from ai_font_moderation_checks where id=$1', [defaults.id])).rows[0].seconds;
    assert.ok(defaultSeconds >= 59 && defaultSeconds <= 60, `expected default backoff near 60 seconds, received ${defaultSeconds}`);
    assert.equal((await prepare(db, defaults.request_id)).claim_token, null);

    const delayed = await prepare(db, randomUUID());
    const result = await db.query<{ saved: boolean }>('select ai_font_finish_moderation($1,$2,$3,$4,$5,$6) as saved', [delayed.id, delayed.claim_token, 'task_delayed', 'retry', 0.01, 300]);
    assert.equal(result.rows[0].saved, true);
    const delayedSeconds = (await db.query<{ seconds: number }>('select extract(epoch from next_check_at-now())::double precision as seconds from ai_font_moderation_checks where id=$1', [delayed.id])).rows[0].seconds;
    assert.ok(delayedSeconds >= 299 && delayedSeconds <= 300, `expected provider backoff near 300 seconds, received ${delayedSeconds}`);
    const replay = await prepare(db, delayed.request_id);
    assert.equal(replay.claim_token, null); assert.equal(replay.provider_task_id, 'task_delayed'); assert.equal(replay.attempts, 1);
    assert.equal(await balance(db), 1000);
  } finally { await db.close(); }
});

test('only approval for the exact prompt permits an idempotent reservation of exactly 100 credits', async () => {
  const db = await database();
  try {
    for (const verdict of ['failed', 'blocked']) {
      const request = randomUUID(), check = await prepare(db, request);
      assert.equal(await finish(db, check, verdict), true);
      await assert.rejects(reserve(db, request), /MODERATION_REQUIRED/);
    }
    const request = randomUUID(); await approve(db, request);
    await assert.rejects(reserve(db, request, `${prompt} `), /MODERATION_REQUIRED/, 'even a trailing-space change requires its own approval');
    await Promise.all(Array.from({ length: 4 }, () => reserve(db, request)));
    assert.equal(await balance(db), 900);
    assert.equal((await db.query<{ count: number }>('select count(*)::integer as count from ai_font_credit_events where event_key=$1', [`job:${request}`])).rows[0].count, 1);
    await assert.rejects(db.query('select ai_font_reserve_job($1,$2,$3,100)', [other, request, prompt]), /REQUEST_MISMATCH/);
    await assert.rejects(reserve(db, request, 'A different prompt entirely'), /REQUEST_MISMATCH/);
  } finally { await db.close(); }
});

test('font delivery binds one immutable asset and requires every rendered page of that asset to pass', async () => {
  const db = await database();
  try {
    const request = randomUUID(), fontHash = hash('actual font bytes');
    await approve(db, request); await reserve(db, request); await startProcessing(db, request);
    await assert.rejects(complete(db, request), /OUTPUT_MODERATION_REQUIRED/);
    assert.equal((await db.query<{ bound: boolean }>('select ai_font_bind_review($1,$2,2) as bound', [request, fontHash])).rows[0].bound, true);
    assert.equal((await db.query<{ bound: boolean }>('select ai_font_bind_review($1,$2,2) as bound', [request, fontHash])).rows[0].bound, true);
    assert.equal((await db.query<{ bound: boolean }>('select ai_font_bind_review($1,$2,2) as bound', [request, hash('other font')])).rows[0].bound, false);
    assert.equal((await db.query<{ bound: boolean }>('select ai_font_bind_review($1,$2,1) as bound', [request, fontHash])).rows[0].bound, false);
    await assert.rejects(prepare(db, request, 'output:0', hash('page0'), hash('other font')), /INVALID_REVIEW/);
    await assert.rejects(prepare(db, request, 'output:2', hash('page2'), fontHash), /INVALID_REVIEW/);
    await approve(db, request, 'output:0', hash('page0'), fontHash);
    await assert.rejects(prepare(db, request, 'output:0', hash('replaced page0'), fontHash), /REVIEW_MISMATCH/);
    await assert.rejects(complete(db, request), /OUTPUT_MODERATION_REQUIRED/, 'an approved first page cannot stand in for the whole font');
    const second = await prepare(db, request, 'output:1', hash('page1'), fontHash);
    await assert.rejects(complete(db, request), /OUTPUT_MODERATION_REQUIRED/, 'pending pages cannot be delivered');
    assert.equal(await finish(db, second, 'passed'), true);
    await complete(db, request);
    const job = (await db.query<{ status: string; moderation_status: string; storage_path: string; output_hash: string }>('select status,moderation_status,storage_path,output_hash from ai_font_jobs where id=$1', [request])).rows[0];
    assert.deepEqual(job, { status: 'succeeded', moderation_status: 'passed', storage_path: `${user}/${request}.ttf`, output_hash: fontHash });
    await complete(db, request, 'failed');
    assert.equal(await balance(db), 900, 'late failures cannot refund delivered fonts');
  } finally { await db.close(); }
});

test('new unapproved jobs cannot be claimed or delivered even if all output pages passed', async () => {
  const db = await database();
  try {
    const request = randomUUID(), fontHash = hash('unapproved prompt font');
    // A stale/direct server writer must still face the final delivery gate.
    await db.query("insert into ai_font_jobs(id,user_id,prompt,status) values($1,$2,$3,'reserved')", [request, user, prompt]);
    assert.equal((await db.query<{ claimed: boolean }>('select ai_font_claim_job($1) as claimed', [request])).rows[0].claimed, false);
    await assert.rejects(complete(db, request), /MODERATION_REQUIRED|OUTPUT_MODERATION_REQUIRED/);
    // A separate processing fixture preserves the failed claim above without changing a verdict.
    const processing = randomUUID();
    await db.query("insert into ai_font_jobs(id,user_id,prompt,status) values($1,$2,$3,'processing')", [processing, user, prompt]);
    await db.query('select ai_font_bind_review($1,$2,1)', [processing, fontHash]);
    await approve(db, processing, 'output:0', hash('unapproved page0'), fontHash);
    await assert.rejects(complete(db, processing), /MODERATION_REQUIRED/);
  } finally { await db.close(); }
});

test('blocked output cannot be delivered and restores exactly the originally reserved cost once', async () => {
  const db = await database();
  try {
    const request = randomUUID(), fontHash = hash('blocked font');
    await approve(db, request); await reserve(db, request); await startProcessing(db, request);
    await db.query('select ai_font_bind_review($1,$2,1)', [request, fontHash]);
    const output = await prepare(db, request, 'output:0', hash('blocked page'), fontHash);
    assert.equal(await finish(db, output, 'blocked'), true);
    await assert.rejects(complete(db, request), /OUTPUT_MODERATION_REQUIRED/);
    await db.exec("update ai_font_operation_costs set credits=150 where operation='standard'");
    await Promise.all(Array.from({ length: 3 }, () => complete(db, request, 'failed')));
    assert.equal(await balance(db), 1000);
    const job = (await db.query<{ status: string; moderation_status: string; credit_cost: number; storage_path: string | null }>('select status,moderation_status,credit_cost,storage_path from ai_font_jobs where id=$1', [request])).rows[0];
    assert.deepEqual(job, { status: 'failed', moderation_status: 'blocked', credit_cost: 100, storage_path: null });
    assert.equal((await db.query<{ delta: number }>('select delta from ai_font_credit_events where event_key=$1', [`restore:${request}`])).rows[0].delta, 100);
  } finally { await db.close(); }
});

test('browsers cannot read or mutate checks or invoke review, billing or unreviewed wrappers', async () => {
  const db = await database();
  try {
    const request = randomUUID(), check = await prepare(db, request);
    const calls: Array<[string, unknown[]]> = [
      ['select ai_font_prepare_moderation($1,$2,$3,$4)', [user, request, 'prompt', hash(prompt)]],
      ['select ai_font_finish_moderation($1,$2,$3,$4)', [check.id, check.claim_token, 'task_fake', 'passed']],
      ['select ai_font_bind_review($1,$2,1)', [request, hash('font')]],
      ['select ai_font_reserve_job($1,$2,$3,100)', [user, request, prompt]],
      ['select ai_font_claim_job($1)', [request]], ['select ai_font_finish_job($1,$2)', [request, 'failed']],
      ['select ai_font_reserve_job_unreviewed($1,$2,$3,100)', [user, request, prompt]],
      ['select ai_font_claim_job_unreviewed($1)', [request]], ['select ai_font_finish_job_unreviewed($1,$2)', [request, 'failed']],
    ];
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role}`);
      await assert.rejects(db.query('select * from ai_font_moderation_checks'), /permission denied/);
      await assert.rejects(db.query("update ai_font_moderation_checks set status='passed'"), /permission denied/);
      for (const [sql, values] of calls) await assert.rejects(db.query(sql, values), /permission denied/);
      await db.exec('reset role');
    }
    await db.exec('set role service_role');
    for (const [sql, values] of calls.slice(-3)) await assert.rejects(db.query(sql, values), /permission denied/);
    await db.exec('reset role');
    const bucket = (await db.query<{ public: boolean; allowed_mime_types: string[] }>("select public,allowed_mime_types from storage.buckets where id='ai-font-review'")).rows[0];
    assert.equal(bucket.public, false);
    assert.ok(bucket.allowed_mime_types.includes('font/ttf'));
    assert.ok(bucket.allowed_mime_types.includes('image/png'), 'quarantine must accept the PNG specimens required for output moderation');
    assert.equal(await balance(db), 1000);
  } finally { await db.close(); }
});

test('migration preserves already delivered fonts and their legacy download entitlement', async () => {
  const db = await database(false);
  try {
    const request = randomUUID();
    await reserve(db, request); await complete(db, request);
    const active = randomUUID(); await reserve(db, active);
    await db.exec(await readFile(new URL(`../../supabase/migrations/${migration}`, import.meta.url), 'utf8'));
    const job = (await db.query<{ status: string; moderation_status: string; moderation_version: string | null; storage_path: string }>('select status,moderation_status,moderation_version,storage_path from ai_font_jobs where id=$1', [request])).rows[0];
    assert.deepEqual(job, { status: 'succeeded', moderation_status: 'legacy', moderation_version: null, storage_path: `${user}/${request}.ttf` });
    await complete(db, request, 'failed');
    assert.equal(await balance(db), 800);
    assert.equal((await db.query('select * from ai_font_moderation_checks')).rows.length, 0);
    await assert.rejects(complete(db, active), /OUTPUT_MODERATION_REQUIRED/, 'a legacy job still in flight cannot bypass the new output review');
    await startProcessing(db, active);
    const fontHash = hash('legacy in-flight font');
    await db.query('select ai_font_bind_review($1,$2,1)', [active, fontHash]);
    await approve(db, active, 'output:0', hash('legacy output page'), fontHash);
    await complete(db, active);
    assert.equal((await db.query<{ moderation_status: string }>('select moderation_status from ai_font_jobs where id=$1', [active])).rows[0].moderation_status, 'passed');
    assert.equal(await balance(db), 800, 'migrated in-flight jobs preserve their already reserved cost');
  } finally { await db.close(); }
});
