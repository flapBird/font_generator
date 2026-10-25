import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('failure details and restored credits settle atomically and retain the first terminal reason', async () => {
  const db = new PGlite();
  const user = '00000000-0000-4000-8000-000000000001', job = '10000000-0000-4000-8000-000000000001';
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}',email text);
      create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      insert into auth.users values('${user}','{}','fixture@example.com');`);
    for (const file of ['202610030001_ai_fonts.sql','202610060001_ai_font_credits.sql','202610060002_accounts_billing.sql','202610140001_billing_reconciliation_outbox.sql','202610200001_font_moderation.sql','202610250001_job_failure_details.sql']) await db.exec(await readFile(new URL(`../../supabase/migrations/${file}`, import.meta.url), 'utf8'));
    await db.query('select ai_font_credit_once($1,$2,300)', [user, 'fixture:funding']);
    // A seeded reserved fixture models the already approved, charged task.
    await db.query("insert into ai_font_jobs(id,user_id,prompt,status,credit_cost) values($1,$2,'A friendly font','starting',100)", [job,user]);
    await db.query('select ai_font_credit_once($1,$2,-100)', [user, `job:${job}`]);
    await assert.rejects(db.query("select ai_font_finish_job_with_reason($1,'failed',null,null,'private-provider-body')", [job]), /INVALID_REASON/);
    assert.equal((await db.query<{ balance: number }>('select balance from ai_font_wallets')).rows[0].balance, 200);
    await db.query("select ai_font_finish_job_with_reason($1,'failed',null,null,'service_unavailable')", [job]);
    await db.query("select ai_font_finish_job_with_reason($1,'failed',null,null,'output_blocked')", [job]);
    assert.deepEqual((await db.query('select status,failure_code from ai_font_jobs')).rows[0], { status: 'failed', failure_code: 'service_unavailable' });
    assert.equal((await db.query<{ balance: number }>('select balance from ai_font_wallets')).rows[0].balance, 300);
    assert.equal((await db.query('select * from ai_font_credit_events where event_key=$1', [`restore:${job}`])).rows.length, 1);
    await db.exec('set role authenticated');
    await assert.rejects(db.query("select ai_font_finish_job_with_reason($1,'failed',null,null,'service_unavailable')", [job]), /permission denied/);
    await db.exec('reset role');
    await db.query("insert into ai_font_jobs(id,user_id,prompt,status,credit_cost) values('10000000-0000-4000-8000-000000000002',$1,'A second font','processing',100)", [user]);
    await assert.rejects(db.query("select ai_font_finish_job_with_reason('10000000-0000-4000-8000-000000000002','succeeded',$1,'Unreviewed font',null)", [`${user}/10000000-0000-4000-8000-000000000002.ttf`]), /MODERATION_REQUIRED/);
  } finally { await db.close(); }
});
