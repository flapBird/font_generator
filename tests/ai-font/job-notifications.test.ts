import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { jobMessage, type JobMail } from '../../lib/ai-font/job-notifications';
import { deliverJobMail, deliverQueuedMail } from '../../lib/ai-font/mail-delivery';

const user = '00000000-0000-4000-8000-000000000001';
const job = '10000000-0000-4000-8000-000000000001';
const migration = () => readFile(new URL('../../supabase/migrations/202610260001_job_notifications.sql', import.meta.url), 'utf8');
async function fixture() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}',email text);
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    insert into auth.users values('${user}','{}','owner@example.com');`);
  for (const file of ['202610030001_ai_fonts.sql','202610060001_ai_font_credits.sql','202610060002_accounts_billing.sql','202610140001_billing_reconciliation_outbox.sql','202610200001_font_moderation.sql','202610250001_job_failure_details.sql']) await db.exec(await readFile(new URL(`../../supabase/migrations/${file}`, import.meta.url), 'utf8'));
  await db.query('select ai_font_credit_once($1,$2,300)', [user,'fixture:funding']);
  await db.query("insert into ai_font_jobs(id,user_id,prompt,status,credit_cost) values($1,$2,'Private fixture description','processing',100)", [job,user]);
  await db.query('select ai_font_credit_once($1,$2,-100)', [user,`job:${job}`]);
  return db;
}

test('future terminal outcomes snapshot final reason and actual restored credits atomically, once', async () => {
  const db = await fixture();
  try {
    await db.exec(await migration());
    await db.query("update ai_font_jobs set status='needs_review' where id=$1", [job]);
    assert.equal((await db.query('select * from ai_font_job_mail_outbox')).rows.length, 0);
    await db.exec('begin');
    await db.query("select ai_font_finish_job_with_reason($1,'failed',null,null,'service_unavailable')", [job]);
    await db.exec('rollback');
    assert.equal((await db.query('select * from ai_font_job_mail_outbox')).rows.length, 0);
    assert.equal((await db.query<{ balance: number }>('select balance from ai_font_wallets')).rows[0].balance, 200);
    await db.query("select ai_font_finish_job_with_reason($1,'failed',null,null,'service_unavailable')", [job]);
    await db.query("select ai_font_finish_job_with_reason($1,'failed',null,null,'output_blocked')", [job]);
    const mails = (await db.query('select kind,recipient_email,payload from ai_font_job_mail_outbox')).rows;
    assert.deepEqual(mails, [{ kind: 'failed', recipient_email: 'owner@example.com', payload: { creditsRestored: 100, failureCode: 'service_unavailable' } }]);
    assert.equal((await db.query<{ balance: number }>('select balance from ai_font_wallets')).rows[0].balance, 300);
    assert.equal(JSON.stringify(mails).includes('Private fixture'), false);
    await db.exec('set role authenticated');
    await assert.rejects(db.query('select * from ai_font_job_mail_outbox'), /permission denied/);
    await assert.rejects(db.query('select * from ai_font_claim_job_mail(1)'), /permission denied/);
  } finally { await db.close(); }
});

test('historical tasks are not backfilled and success requires final reviewed delivery', async () => {
  const db = await fixture();
  try {
    await db.query("select ai_font_finish_job_with_reason($1,'failed',null,null,'service_unavailable')", [job]);
    await db.exec(await migration());
    assert.equal((await db.query('select * from ai_font_job_mail_outbox')).rows.length, 0);
    const next = '10000000-0000-4000-8000-000000000002';
    await db.query("insert into ai_font_jobs(id,user_id,prompt,status,credit_cost,moderation_version,output_hash,review_page_count) values($1,$2,'A second fixture font','processing',100,null,$3,1)", [next,user,'a'.repeat(64)]);
    await assert.rejects(db.query("select ai_font_finish_job($1,'succeeded',$2,'Fixture font')", [next,`${user}/${next}.ttf`]), /OUTPUT_MODERATION_REQUIRED/);
    assert.equal((await db.query('select * from ai_font_job_mail_outbox')).rows.length, 0);
    await db.query("insert into ai_font_moderation_checks(user_id,request_id,stage,input_hash,asset_hash,status) values($1,$2,'output:0',$3,$3,'passed')", [user,next,'a'.repeat(64)]);
    await db.query("select ai_font_finish_job_with_reason($1,'succeeded',$2,'Fixture font')", [next,`${user}/${next}.ttf`]);
    assert.deepEqual((await db.query('select kind,payload from ai_font_job_mail_outbox')).rows, [{ kind: 'succeeded', payload: { creditsRestored: 0, failureCode: null } }]);
  } finally { await db.close(); }
});

test('job mail leases serialize delivery, back off rejection, and hold uncertain sends without resending', async () => {
  const db = await fixture();
  try {
    await db.exec(await migration());
    await db.query("select ai_font_finish_job($1,'failed')", [job]);
    const claims = await Promise.all([db.query<JobMail>('select * from ai_font_claim_job_mail(1)'),db.query<JobMail>('select * from ai_font_claim_job_mail(1)')]);
    assert.equal(claims.reduce((sum,c) => sum+c.rows.length,0), 1);
    const first = claims.flatMap(c => c.rows)[0];
    await db.query("select ai_font_finish_job_mail($1,$2,null,'RETRY_RATE_LIMIT')", [first.id,first.claim_token]);
    assert.equal((await db.query('select * from ai_font_claim_job_mail(1)')).rows.length, 0);
    await db.exec("update ai_font_job_mail_outbox set next_attempt_at=now()-interval '1 second'");
    const second = (await db.query<JobMail>('select * from ai_font_claim_job_mail(1)')).rows[0];
    assert.notEqual(second.claim_token,first.claim_token);
    assert.equal((await db.query<{ started: boolean }>('select ai_font_begin_job_mail_delivery($1,$2) as started', [first.id,first.claim_token])).rows[0].started, false);
    await db.query('select ai_font_begin_job_mail_delivery($1,$2)', [second.id,second.claim_token]);
    await db.exec("update ai_font_job_mail_outbox set claimed_until=now()-interval '1 second'");
    assert.equal((await db.query('select * from ai_font_claim_job_mail(1)')).rows.length, 0);
    assert.deepEqual((await db.query('select status,last_error from ai_font_job_mail_outbox')).rows, [{ status: 'needs_review', last_error: 'DELIVERY_UNCERTAIN' }]);
  } finally { await db.close(); }
});

test('missing recipient and exhausted retries require review; an unrecorded restoration cannot announce failure', async () => {
  const db = await fixture();
  try {
    await db.exec(await migration());
    await assert.rejects(db.query("update ai_font_jobs set status='failed' where id=$1", [job]), /JOB_RESTORE_REQUIRED/);
    assert.equal((await db.query('select * from ai_font_job_mail_outbox')).rows.length, 0);
    await db.exec('update auth.users set email=null');
    // Use a different stored operation price; the email must not assume 100.
    await db.query('update ai_font_jobs set credit_cost=75 where id=$1', [job]);
    await db.query("select ai_font_finish_job($1,'failed')", [job]);
    const row = (await db.query('select payload,status,last_error from ai_font_job_mail_outbox')).rows[0];
    assert.deepEqual(row, { payload: { creditsRestored: 75,failureCode: null },status: 'needs_review',last_error: 'ACCOUNT_EMAIL_MISSING' });
    assert.equal((await db.query('select * from ai_font_claim_job_mail(1)')).rows.length,0);
    await db.exec("update ai_font_job_mail_outbox set status='processing',attempts=8,claimed_until=now()-interval '1 second'");
    assert.equal((await db.query('select * from ai_font_claim_job_mail(1)')).rows.length,0);
    assert.equal((await db.query<{ last_error: string }>('select last_error from ai_font_job_mail_outbox')).rows[0].last_error,'DELIVERY_RETRIES_EXHAUSTED');
  } finally { await db.close(); }
});

test('notification content exposes only public reasons, credit outcome and authenticated library link', () => {
  const mail: JobMail = { id: 1, claim_token: 'fixture', recipient_email: 'owner@example.com', job_id: job, kind: 'failed', payload: { creditsRestored: 75, failureCode: 'service_unavailable' } };
  const failed = jobMessage(mail,'https://fonts.example');
  assert.match(failed.text,/75 generation credits were restored/);
  assert.match(failed.text,/description was not flagged/);
  assert.match(failed.text,/https:\/\/fonts.example\/my-fonts/);
  assert.doesNotMatch(failed.text,/\.ttf|token=|api\.mixfont/);
  assert.doesNotMatch(jobMessage({ ...mail,payload: { creditsRestored: 75,failureCode: 'secret-provider-body' } },'https://fonts.example').text,/secret-provider-body/);
  assert.match(jobMessage({ ...mail,kind: 'succeeded',payload: { creditsRestored: 0,failureCode: null } },'https://fonts.example').subject,/ready/);
  assert.throws(() => jobMessage({ ...mail,kind: 'succeeded' },'https://fonts.example'));
});

test('job sender reuses Inbox protocol and alternates one-message budget with billing', async () => {
  const previous = { ...process.env }, original = globalThis.fetch;
  Object.assign(process.env,{ NEXT_PUBLIC_SUPABASE_URL: 'https://job-mail-test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'fixture', AI_FONT_APP_URL: 'https://fonts.example', INBOX_URL: 'https://mail.example', INBOX_SEND_API_KEY: 'fixture', INBOX_FROM_EMAIL: 'support@example.com', INBOX_FROM_NAME: 'Font Generators' });
  try {
    let sends = 0;
    const calls: string[] = [];
    globalThis.fetch = async (url,init) => {
      const path = new URL(String(url)).pathname;
      calls.push(path);
      if (path.endsWith('ai_font_claim_job_mail')) return Response.json([{ id: 1,claim_token: 'fixture',recipient_email: 'owner@example.com',job_id: job,kind: 'failed',payload: { creditsRestored: 100,failureCode: null } }]);
      if (path.endsWith('ai_font_claim_mail')) return Response.json([]);
      if (path.endsWith('ai_font_begin_job_mail_delivery')) return Response.json(true);
      if (path === '/api/v1/send') { sends++; assert.equal(JSON.parse(String(init?.body)).to,'owner@example.com'); return Response.json({ status: 'sent',id: 'MSG_1' },{ status: 202 }); }
      assert.ok(path.endsWith('ai_font_finish_job_mail'));
      assert.equal(JSON.parse(String(init?.body)).p_message_id,'MSG_1');
      return Response.json(true);
    };
    assert.equal((await deliverQueuedMail(0)).jobs.checked,1);
    assert.equal(sends,1);
    assert.ok(calls[0].endsWith('ai_font_claim_mail'));
    calls.length=0;
    await deliverQueuedMail(300_000);
    assert.equal(calls.some(path => path.endsWith('ai_font_claim_mail')),false);
    assert.equal(sends,2);
    delete process.env.INBOX_SEND_API_KEY;
    assert.equal((await deliverJobMail()).disabled,true);
  } finally { process.env=previous; globalThis.fetch=original; }
});

test('job sender persists uncertain acceptance and rate-limit codes without immediate resend', async (t) => {
  const previous = { ...process.env }, original = globalThis.fetch;
  Object.assign(process.env,{ NEXT_PUBLIC_SUPABASE_URL: 'https://job-mail-test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'fixture', AI_FONT_APP_URL: 'https://fonts.example', INBOX_URL: 'https://mail.example', INBOX_SEND_API_KEY: 'fixture', INBOX_FROM_EMAIL: 'support@example.com', INBOX_FROM_NAME: 'Font Generators' });
  const logs: unknown[] = [];
  t.mock.method(console,'warn',(...args: unknown[]) => { logs.push(args); });
  try {
    for (const [status,code] of [[0,'DELIVERY_UNCERTAIN'],[429,'RETRY_RATE_LIMIT']] as const) {
      let sends=0;
      globalThis.fetch = async (url,init) => {
        const path = new URL(String(url)).pathname;
        if (path.endsWith('ai_font_claim_job_mail')) return Response.json([{ id: 1,claim_token: 'fixture',recipient_email: 'owner@example.com',job_id: job,kind: 'succeeded',payload: { creditsRestored: 0,failureCode: null } }]);
        if (path.endsWith('ai_font_begin_job_mail_delivery')) return Response.json(true);
        if (path === '/api/v1/send') { sends++; if (!status) throw new Error('private network diagnostics'); return new Response(null,{ status }); }
        assert.ok(path.endsWith('ai_font_finish_job_mail'));
        assert.equal(JSON.parse(String(init?.body)).p_error,code);
        return Response.json(true);
      };
      assert.equal((await deliverJobMail()).errors,1);
      assert.equal(sends,1);
    }
    assert.doesNotMatch(JSON.stringify(logs),/owner@example|private network/);
  } finally { process.env=previous; globalThis.fetch=original; }
});
