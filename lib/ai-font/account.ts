import 'server-only';
import type { User } from '@supabase/supabase-js';
import { analyticsIdentity } from '@/lib/analytics/server';
import { availability } from './config';
import { displayName, googleAvatar } from './profile';
import { adminClient } from './supabase';
import type { FontJob } from './catalog';

export type AccountSection = 'credits' | 'fonts' | 'purchases' | 'creditActivity' | 'profile' | 'subscriptions' | 'billing';

function reportUnavailable(section: AccountSection, error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  // Only bounded error codes: never log database messages, account data or keys.
  console.error('[ai-font] Account section unavailable:', section, /^[A-Z0-9_]{1,24}$/.test(code) ? code : 'REQUEST_FAILED');
}

export async function loadAccount(user: User, createDatabase = adminClient) {
  const unavailableSections: AccountSection[] = [];
  let results;
  let databaseError: unknown;
  try {
    const db = createDatabase();
    const signal = AbortSignal.timeout(5000);
    const jobFields = 'id,prompt,status,name,created_at,credit_cost';
    async function loadJobs(): Promise<{ data: FontJob[] | null; error: unknown }> {
      const result = await db.from('ai_font_jobs').select(`${jobFields},updated_at,failure_code`).eq('user_id', user.id).order('created_at', { ascending: false }).limit(50).abortSignal(signal);
      if (result.error && ['42703','PGRST204'].includes(result.error.code)) {
        // Failure details are additive. Old schemas must still show saved fonts.
        return db.from('ai_font_jobs').select(jobFields).eq('user_id', user.id).order('created_at', { ascending: false }).limit(50).abortSignal(signal);
      }
      return result;
    }
    results = await Promise.allSettled([
      db.from('ai_font_wallets').select('balance').eq('user_id', user.id).abortSignal(signal).maybeSingle(),
      loadJobs(),
      db.from('ai_font_orders').select('id,provider,amount_minor,currency,credits,status,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20).abortSignal(signal),
      db.from('ai_font_credit_events').select('id,event_key,delta,created_at').eq('user_id', user.id).order('id', { ascending: false }).limit(30).abortSignal(signal),
      db.from('ai_font_profiles').select('display_name,avatar_url').eq('user_id', user.id).abortSignal(signal).maybeSingle(),
      db.from('ai_font_subscriptions').select('id,plan_id,status,billing_interval,credits_per_period,current_period_start,current_period_end,cancel_requested_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20).abortSignal(signal),
      db.from('ai_font_billing_holds').select('adjustment_id').eq('user_id', user.id).eq('active', true).limit(1).abortSignal(signal),
    ]);
  } catch (error) {
    databaseError = error;
  }
  function read<T>(result: PromiseSettledResult<{ data: T; error: unknown }> | undefined, section: AccountSection): T | null {
    if (!result || result.status === 'rejected' || result.value.error) {
      unavailableSections.push(section);
      reportUnavailable(section, !result ? databaseError : result.status === 'rejected' ? result.reason : result.value.error);
      return null;
    }
    return result.value.data;
  }
  const wallet = read(results?.[0], 'credits');
  const jobs = read(results?.[1], 'fonts');
  const orders = read(results?.[2], 'purchases');
  const creditEvents = read(results?.[3], 'creditActivity');
  const profile = read(results?.[4], 'profile');
  const subscriptions = read(results?.[5], 'subscriptions');
  const holds = read(results?.[6], 'billing');
  const credits = unavailableSections.includes('credits') ? null : wallet?.balance ?? 0;
  const billingUnavailable = unavailableSections.some(section => section !== 'profile');
  const billingRestricted = Boolean(holds?.length);
  const services = availability(user);
  if (billingUnavailable) { services.generation = false; services.checkout = false; }
  return {
    user: { email: user.email, displayName: displayName(profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.name), avatarUrl: googleAvatar(profile?.avatar_url || user.user_metadata?.avatar_url), createdAt: user.created_at, lastSignInAt: user.last_sign_in_at, provider: 'Google' },
    credits, billingRestricted, billingUnavailable, unavailableSections, services,
    analytics: { ...analyticsIdentity(user), checkoutEligible: services.checkout && credits !== null && credits >= 0 && !billingRestricted },
    jobs: jobs ?? [], orders: orders ?? [], subscriptions: subscriptions ?? [],
    creditEvents: creditEvents?.map(({ event_key, ...event }) => ({ ...event, kind: event_key.split(':')[0] })) ?? [],
  };
}
