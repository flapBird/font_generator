import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const user = '00000000-0000-4000-8000-000000000001';
const other = '00000000-0000-4000-8000-000000000002';
const order = '10000000-0000-4000-8000-000000000001';
const job = '20000000-0000-4000-8000-000000000001';
const secondJob = '20000000-0000-4000-8000-000000000002';

async function database() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    insert into auth.users values('${user}'),('${other}');
  `);
  await db.exec(await readFile(new URL('../../supabase/migrations/202610030001_ai_fonts.sql', import.meta.url), 'utf8'));
  await db.query(`insert into ai_font_orders(id,user_id,provider,package_id,amount_minor,currency,credits,external_id)
    values($1,$2,'paypal','english-starter',499,'USD',3,'PAYPAL-ORDER')`, [order, user]);
  return db;
}

async function balance(db: PGlite) {
  return (await db.query<{ balance: number }>('select balance from ai_font_wallets where user_id=$1', [user])).rows[0]?.balance ?? 0;
}

test('payment callbacks are idempotent; jobs reserve atomically and restore once', async () => {
  const db = await database();
  try {
    assert.equal(await balance(db), 0, 'no sign-up credits');
    await assert.rejects(db.query('select ai_font_reserve_job($1,$2,$3)', [user, job, 'a bold display font']), /NO_CREDITS/);
    await assert.rejects(db.query('select ai_font_settle_order($1,$2,$3)', [order, 'WRONG', 'CAPTURE']), /ORDER_MISMATCH/);
    await Promise.all(Array.from({ length: 5 }, () => db.query('select ai_font_settle_order($1,$2,$3)', [order, 'PAYPAL-ORDER', 'CAPTURE'])));
    assert.equal(await balance(db), 3);
    await assert.rejects(db.query('select ai_font_settle_order($1,$2,$3)', [order, 'PAYPAL-ORDER', 'OTHER-CAPTURE']), /CAPTURE_MISMATCH/);
    await Promise.all(Array.from({ length: 5 }, () => db.query('select ai_font_reserve_job($1,$2,$3)', [user, job, 'a bold display font'])));
    assert.equal(await balance(db), 2);
    await assert.rejects(db.query('select ai_font_reserve_job($1,$2,$3)', [other, job, 'a bold display font']), /REQUEST_MISMATCH/);
    await assert.rejects(db.query('select ai_font_reserve_job($1,$2,$3)', [user, job, 'a different display font']), /REQUEST_MISMATCH/);
    await assert.rejects(db.query('select ai_font_reserve_job($1,$2,$3)', [user, secondJob, 'a bold display font']), /ACTIVE_JOB/);
    const claims = await Promise.all(Array.from({ length: 5 }, () => db.query<{ ai_font_claim_job: boolean }>('select ai_font_claim_job($1)', [job])));
    assert.equal(claims.filter((r) => r.rows[0].ai_font_claim_job).length, 1, 'only one upstream POST owner');
    await Promise.all(Array.from({ length: 3 }, () => db.query('select ai_font_finish_job($1,$2)', [job, 'failed'])));
    assert.equal(await balance(db), 3);
    await db.query('select ai_font_reserve_job($1,$2,$3)', [user, secondJob, 'a bold display font']);
    await assert.rejects(db.query('select ai_font_finish_job($1,$2,$3)', [secondJob, 'succeeded', `${other}/${secondJob}.ttf`]), /INVALID_PATH/);
    await db.query('select ai_font_finish_job($1,$2,$3,$4)', [secondJob, 'succeeded', `${user}/${secondJob}.ttf`, 'Test Font']);
    await db.query('select ai_font_finish_job($1,$2)', [secondJob, 'failed']);
    assert.equal(await balance(db), 2, 'late failed callback cannot refund a delivered font');
    await Promise.all(Array.from({ length: 3 }, () => db.query('select ai_font_revoke_order($1)', [order])));
    assert.equal(await balance(db), -1, 'refund withdraws pack including already spent credits');
    await db.query('select ai_font_settle_order($1,$2,$3)', [order, 'PAYPAL-ORDER', 'CAPTURE']);
    assert.equal(await balance(db), -1, 'late payment callback cannot re-grant revoked pack');
  } finally { await db.close(); }
});

test('refund before completion never grants credits; browsers cannot mutate the ledger', async () => {
  const db = await database();
  try {
    await db.query('select ai_font_revoke_order($1)', [order]);
    await db.query('select ai_font_settle_order($1,$2,$3)', [order, 'PAYPAL-ORDER', 'CAPTURE']);
    assert.equal(await balance(db), 0);
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role}`);
      await assert.rejects(db.query('select * from ai_font_orders'), /permission denied/);
      await assert.rejects(db.query('select ai_font_settle_order($1,$2,$3)', [order, 'PAYPAL-ORDER', 'CAPTURE']), /permission denied/);
      await assert.rejects(db.query('select ai_font_credit_once($1,$2,$3)', [user, 'fake', 100]), /permission denied/);
      await db.exec('reset role');
    }
    assert.equal((await db.query<{ public: boolean }>("select public from storage.buckets where id='ai-fonts'")).rows[0].public, false);
  } finally { await db.close(); }
});
