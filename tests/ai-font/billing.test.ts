import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const user = '00000000-0000-4000-8000-000000000001';
const id = '10000000-0000-4000-8000-000000000001';
async function database(subscription = false) {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    insert into auth.users values('${user}','{"full_name":"Google Name"}');`);
  for (const file of ['202610030001_ai_fonts.sql','202610060001_ai_font_credits.sql','202610060002_accounts_billing.sql']) await db.exec(await readFile(new URL(`../../supabase/migrations/${file}`,import.meta.url),'utf8'));
  await db.query(`insert into ai_font_orders(id,user_id,provider,package_id,amount_minor,currency,credits,credit_version,provider_environment,purchase_kind,billing_interval)
    values($1,$2,'waffo','english-starter',499,'USD',300,2,'test',$3,$4)`,[id,user,subscription ? 'subscription' : 'one_time',subscription ? 'monthly' : null]);
  return db;
}
async function balance(db: PGlite) { return (await db.query<{ balance:number }>('select balance from ai_font_wallets where user_id=$1',[user])).rows[0]?.balance || 0; }
function event(kind='paid', extra={}) {return {kind,key:`${kind}:PAY_1`,orderId:id,providerOrderId:'ORD_1',paymentId:'PAY_1',mode:'test',amountMinor:499,currency:'USD',timestamp:'2026-10-06T10:00:00Z',...extra};}
async function apply(db:PGlite, data:object) {await db.query('select ai_font_apply_waffo_event($1)',[JSON.stringify(data)]);}

test('Waffo settles once, rejects incorrect amounts and reverses a refunded payment once',async()=>{
 const db=await database();try{
  await assert.rejects(apply(db,event('paid',{amountMinor:1})),/AMOUNT_MISMATCH/);
  await assert.rejects(apply(db,event('paid',{mode:'prod'})),/ORDER_MISMATCH/);
  await Promise.all([apply(db,event()),apply(db,event())]);assert.equal(await balance(db),300);
  await apply(db,event('paid',{key:'retry-with-another-delivery'}));assert.equal(await balance(db),300);
  await assert.rejects(apply(db,event('paid',{paymentId:'PAY_2',key:'other-payment'})),/DUPLICATE_PAYMENT_REVIEW/);
  await apply(db,event('revoked'));await apply(db,event('revoked',{key:'other-refund-notice'}));assert.equal(await balance(db),0);
  await apply(db,event('paid',{key:'late-payment'}));assert.equal(await balance(db),0);
 }finally{await db.close();}
});
test('refund arriving before payment never issues credits',async()=>{
 const db=await database();try{await apply(db,event('revoked'));await apply(db,event());assert.equal(await balance(db),0);}finally{await db.close();}
});
test('subscriptions grant only paid periods, dedupe renewals and ignore stale state',async()=>{
 const db=await database(true);try{
  await apply(db,event('subscription',{paymentId:undefined,status:'active',key:'activated',periodStart:'2026-10-06',periodEnd:'2026-11-06'}));assert.equal(await balance(db),0);
  await apply(db,event('paid',{periodNumber:1}));assert.equal(await balance(db),300);
  assert.equal((await db.query<{status:string}>('select status from ai_font_orders')).rows[0].status,'paid');
  await db.exec("update ai_font_subscriptions set cancel_requested_at=now()");
  await apply(db,event('subscription',{status:'active',key:'uncanceled',timestamp:'2026-10-07T10:00:00Z',cancellationWithdrawn:true}));
  assert.equal((await db.query<{cancel_requested_at:string|null}>('select cancel_requested_at from ai_font_subscriptions')).rows[0].cancel_requested_at,null);
  await apply(db,event('paid',{periodNumber:2,paymentId:'PAY_2',key:'period2'}));assert.equal(await balance(db),600);
  await assert.rejects(apply(db,event('paid',{periodNumber:2,paymentId:'PAY_ALT',key:'same-period-new-payment'})),/unique constraint/);
  await apply(db,event('subscription',{paymentId:undefined,status:'canceled',timestamp:'2026-11-06T10:00:00Z',key:'canceled'}));
  await apply(db,event('subscription',{paymentId:undefined,status:'active',timestamp:'2026-10-07T10:00:00Z',key:'stale'}));
  assert.equal((await db.query<{status:string}>('select status from ai_font_subscriptions')).rows[0].status,'canceled');assert.equal(await balance(db),600);
  await apply(db,event('revoked',{periodNumber:2,paymentId:'PAY_2',key:'refund2'}));assert.equal(await balance(db),300);
 }finally{await db.close();}
});
test('Google profile sync preserves customized names and client roles cannot access billing tables',async()=>{
 const db=await database();try{
  assert.equal((await db.query<{display_name:string}>('select display_name from ai_font_profiles')).rows[0].display_name,'Google Name');
  await db.exec("update ai_font_profiles set display_name='Chosen Name',name_customized=true");
  await db.query("update auth.users set raw_user_meta_data=$1 where id=$2",[JSON.stringify({full_name:'Changed Google Name',avatar_url:'https://lh3.googleusercontent.com/a'}),user]);
  const profile=(await db.query<{display_name:string,avatar_url:string}>('select * from ai_font_profiles')).rows[0];assert.equal(profile.display_name,'Chosen Name');assert.ok(profile.avatar_url.endsWith('/a'));
  for(const role of ['anon','authenticated']){await db.exec(`set role ${role}`);await assert.rejects(apply(db,event()),/permission denied/);for (const table of ['ai_font_profiles','ai_font_subscriptions','ai_font_billing_payments','ai_font_webhook_events']) await assert.rejects(db.query(`select * from ${table}`),/permission denied/);await db.exec('reset role');}
 }finally{await db.close();}
});
