import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { User } from '@supabase/supabase-js';
import { loadAccount } from '../../lib/ai-font/account';

const user: User = { id: '00000000-0000-4000-8000-000000000001', email: 'owner@example.com', email_confirmed_at: '2026-01-01', created_at: '2026-01-01', aud: 'authenticated', app_metadata: { provider: 'google' }, user_metadata: { full_name: 'Google Name', avatar_url: 'https://lh3.googleusercontent.com/avatar' } };

async function configured(run: (logs: string[]) => Promise<void>) {
  const previous = { ...process.env }, originalFetch = globalThis.fetch, originalError = console.error;
  Object.assign(process.env, { NEXT_PUBLIC_SUPABASE_URL: 'https://account-test.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'mock-public', SUPABASE_SERVICE_ROLE_KEY: 'mock-service', AI_FONT_APP_URL: 'https://fonts.example', MIXFONT_API_KEY: 'mock-generation', SEEAPI_API_KEY: 'mock-review', PAYPAL_CLIENT_ID: 'mock-client', PAYPAL_CLIENT_SECRET: 'mock-secret', PAYPAL_WEBHOOK_ID: 'mock-webhook', AI_FONT_PAYMENT_PROVIDER: 'paypal', AI_FONT_CHECKOUT_MODE: 'public', AI_FONT_CRON_SECRET: 'mock-cron' });
  const logs: string[] = [];
  console.error = (...args: unknown[]) => { logs.push(args.join(' ')); };
  try { await run(logs); } finally { process.env = previous; globalThis.fetch = originalFetch; console.error = originalError; }
}

function database(failed?: string) {
  globalThis.fetch = async input => {
    const url = new URL(String(input));
    assert.equal(url.hostname, 'account-test.supabase.co');
    assert.equal(url.searchParams.get('user_id'), `eq.${user.id}`, 'all reads must be scoped to the verified user');
    const table = url.pathname.split('/').at(-1);
    if (table === failed) return Response.json({ code: 'PGRST205', message: 'Sensitive upstream body with mock-service and owner@example.com' }, { status: 404 });
    const data = table === 'ai_font_wallets' ? { balance: 300 }
      : table === 'ai_font_profiles' ? { display_name: 'Saved Name', avatar_url: null }
      : table === 'ai_font_jobs' ? [{ id: 'job', status: 'succeeded', name: 'Saved font' }]
      : table === 'ai_font_credit_events' ? [{ id: 1, event_key: 'billing:waffo:private-payment-id', delta: 300, created_at: '2026-01-01' }] : [];
    return Response.json(data);
  };
}

test('a missing billing-holds table preserves profile, balance and fonts but pauses paid actions', async () => configured(async logs => {
  database('ai_font_billing_holds');
  const result = await loadAccount(user);
  assert.equal(result.user.displayName, 'Saved Name');
  assert.equal(result.credits, 300);
  assert.equal(result.jobs[0].name, 'Saved font');
  assert.deepEqual(result.unavailableSections, ['billing']);
  assert.equal(result.billingUnavailable, true);
  assert.equal(result.services.checkout, false);
  assert.equal(result.services.generation, false);
  assert.equal(result.analytics.checkoutEligible, false);
  assert.ok(logs[0].includes('billing PGRST205'));
  for (const value of ['owner@example.com', 'mock-service', 'Sensitive upstream body']) assert.ok(!logs.join('').includes(value));
  assert.ok(!JSON.stringify(result).includes('Sensitive upstream body'));
}));

test('profile storage failure falls back to verified Google metadata without inventing a signed-out state', async () => configured(async () => {
  database('ai_font_profiles');
  const result = await loadAccount(user);
  assert.equal(result.user.email, user.email);
  assert.equal(result.user.displayName, 'Google Name');
  assert.equal(result.user.avatarUrl, user.user_metadata.avatar_url);
  assert.deepEqual(result.unavailableSections, ['profile']);
  assert.equal(result.billingUnavailable, false);
  assert.equal(result.services.checkout, true);
}));

test('a failed wallet read is unknown, not a zero balance, and never grants checkout eligibility', async () => configured(async () => {
  database('ai_font_wallets');
  const result = await loadAccount(user);
  assert.equal(result.credits, null);
  assert.equal(result.billingUnavailable, true);
  assert.equal(result.analytics.checkoutEligible, false);
  assert.equal(result.user.displayName, 'Saved Name');
}));

test('missing server credentials keep the authenticated profile and mark every database section unavailable', async () => configured(async () => {
  globalThis.fetch = async () => assert.fail('no database request without server credentials');
  const result = await loadAccount(user, () => { throw new Error('Missing configuration: server credential'); });
  assert.equal(result.user.displayName, 'Google Name');
  assert.equal(result.credits, null);
  assert.equal(result.unavailableSections.length, 7);
  assert.deepEqual(result.jobs, []);
  assert.equal(result.services.generation, false);
  assert.equal(result.services.checkout, false);
}));

test('healthy account responses preserve saved data and omit private credit-event identifiers', async () => configured(async logs => {
  database();
  const result = await loadAccount(user);
  assert.deepEqual(result.unavailableSections, []);
  assert.equal(result.billingUnavailable, false);
  assert.equal(result.services.checkout, true);
  assert.equal(result.creditEvents[0].kind, 'billing');
  assert.ok(!JSON.stringify(result.creditEvents).includes('private-payment-id'));
  assert.deepEqual(logs, []);
}));
