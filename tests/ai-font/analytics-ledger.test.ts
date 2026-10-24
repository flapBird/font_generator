import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const user = '00000000-0000-4000-8000-000000000001';
const order = '10000000-0000-4000-8000-000000000001';
const context = { client_id: '123.456', session_id: '123456', analytics_storage: 'granted', userId: 'a'.repeat(64), audienceType: 'customer', paymentEnvironment: 'test', checkoutMode: 'public', paymentProvider: 'waffo', checkoutEligible: true };
async function database() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}',email text);
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    insert into auth.users values('${user}','{}','account@example.com');`);
  for (const file of ['202610030001_ai_fonts.sql','202610060001_ai_font_credits.sql','202610060002_accounts_billing.sql','202610140001_billing_reconciliation_outbox.sql','202610230001_analytics_funnel.sql']) {
    await db.exec(await readFile(new URL(`../../supabase/migrations/${file}`, import.meta.url), 'utf8'));
  }
  await db.query(`insert into ai_font_orders(id,user_id,provider,package_id,amount_minor,currency,credits,credit_version,provider_environment)
    values($1,$2,'waffo','english-starter',499,'USD',300,2,'test')`, [order,user]);
  return db;
}
async function attach(db: PGlite, value: object = context, account = user) {
  return (await db.query<{ ok: boolean }>('select ai_font_attach_analytics($1,$2,$3) as ok',[order,account,JSON.stringify(value)])).rows[0].ok;
}
async function claim(db: PGlite) { return (await db.query<{ id: number; event_name: string; claim_token: string }>('select * from ai_font_claim_analytics(5)')).rows; }
async function facts(db: PGlite) { await db.query(`update ai_font_orders set checkout_url='https://checkout.example/order',status='paid' where id=$1`, [order]); }

test('optional context is owner-bound, immutable and cannot add arbitrary data', async () => {
  const db = await database(); try {
    assert.equal(await attach(db, context, '00000000-0000-4000-8000-000000000002'), false);
    assert.equal(await attach(db, { ...context, analytics_storage: 'denied' }), false);
    assert.equal(await attach(db, { ...context, paymentEnvironment: 'live' }), false);
    assert.equal(await attach(db, { ...context, checkoutEligible: false }), false);
    assert.equal(await attach(db, { ...context, email: 'private@example.com' }), true);
    assert.equal(await attach(db, { ...context, client_id: '999.999' }), false);
    const saved = (await db.query<{ analytics_context: object }>('select analytics_context from ai_font_orders')).rows[0].analytics_context;
    assert.deepEqual(saved, context);
    await db.exec('set role authenticated');
    await assert.rejects(claim(db), /permission denied/);
    await assert.rejects(db.query('select * from ai_font_analytics_outbox'), /permission denied/);
  } finally { await db.close(); }
});

test('only persisted checkout/payment facts generate unique queue events and concurrent claims do not duplicate them', async () => {
  const db = await database(); try {
    await attach(db);
    assert.equal((await claim(db)).length, 0);
    await facts(db);
    const rows = await claim(db);
    assert.deepEqual(rows.map(row => row.event_name).sort(), ['begin_checkout','purchase']);
    assert.equal((await claim(db)).length, 0);
    for (const row of rows) await db.query('select ai_font_finish_analytics($1,$2,null)', [row.id,row.claim_token]);
    await db.query(`update ai_font_orders set status='revoked' where id=$1`, [order]);
    await facts(db);
    assert.equal((await claim(db)).length, 0, 'a late webhook/reconciliation cannot count another purchase');
    assert.equal((await db.query<{ count: number }>('select count(*)::integer as count from ai_font_analytics_outbox')).rows[0].count, 2);
  } finally { await db.close(); }
});

test('payments still persist without consent/context and do not generate GA events', async () => {
  const db = await database(); try {
    await facts(db);
    assert.equal((await claim(db)).length, 0);
    assert.equal(await attach(db), false, 'paid orders cannot be retroactively attributed');
    assert.equal((await db.query<{ status: string }>('select status from ai_font_orders')).rows[0].status, 'paid');
  } finally { await db.close(); }
});

test('expired delivery leases need review, rate limits back off and stale workers cannot mark success', async () => {
  const db = await database(); try {
    await attach(db); await facts(db);
    const rows = await claim(db);
    await db.query('select ai_font_finish_analytics($1,$2,$3)', [rows[0].id,rows[0].claim_token,'RATE_LIMIT']);
    await db.query(`update ai_font_analytics_outbox set lease_until=now()-interval '1 second' where id=$1`,[rows[1].id]);
    assert.equal((await claim(db)).length, 0);
    const states = (await db.query<{ status: string; last_error: string }>('select status,last_error from ai_font_analytics_outbox order by id')).rows;
    assert.deepEqual(states.map(row => row.status), ['pending','needs_review']);
    assert.equal(states[1].last_error, 'DELIVERY_UNCERTAIN');
    assert.equal((await db.query<{ ok: boolean }>('select ai_font_finish_analytics($1,$2,null) as ok',[rows[1].id,rows[1].claim_token])).rows[0].ok, false);
    await db.exec(`update ai_font_analytics_outbox set occurred_at=now()-interval '73 hours',next_attempt_at=now() where status='pending'`);
    assert.equal((await claim(db)).length, 0);
    assert.equal((await db.query<{ last_error: string }>('select last_error from ai_font_analytics_outbox where id=$1',[rows[0].id])).rows[0].last_error,'EVENT_TOO_OLD');
  } finally { await db.close(); }
});
