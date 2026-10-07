import { displayName, googleAvatar } from '@/lib/ai-font/profile';
import { availability } from '@/lib/ai-font/config';
import { adminClient, authClient } from '@/lib/ai-font/supabase';
import { endpoint, json } from '@/lib/ai-font/http';

export async function GET() {
  return endpoint(async () => {
    const services = availability();
    if (!services.auth) return json({ user: null, credits: 0, jobs: [], orders: [], creditEvents: [], subscriptions: [], services });
    const { data: { user } } = await (await authClient()).auth.getUser();
    if (!user) return json({ user: null, credits: 0, jobs: [], orders: [], creditEvents: [], subscriptions: [], services });
    const db = adminClient();
    const results = await Promise.all([
      db.from('ai_font_wallets').select('balance').eq('user_id', user.id).maybeSingle(),
      db.from('ai_font_jobs').select('id,prompt,status,name,created_at,credit_cost').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      db.from('ai_font_orders').select('id,provider,amount_minor,currency,credits,status,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      db.from('ai_font_credit_events').select('id,event_key,delta,created_at').eq('user_id', user.id).order('id', { ascending: false }).limit(30),
      db.from('ai_font_profiles').select('display_name,avatar_url').eq('user_id', user.id).maybeSingle(),
      db.from('ai_font_subscriptions').select('id,plan_id,status,billing_interval,credits_per_period,current_period_start,current_period_end,cancel_requested_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ]);
    for (const result of results) if (result.error) throw result.error;
    return json({ user: { email: user.email, displayName: displayName(results[4].data?.display_name || user.user_metadata?.full_name), avatarUrl: googleAvatar(results[4].data?.avatar_url || user.user_metadata?.avatar_url), createdAt: user.created_at, lastSignInAt: user.last_sign_in_at, provider: 'Google' }, credits: results[0].data?.balance ?? 0, jobs: results[1].data, orders: results[2].data, subscriptions: results[5].data, creditEvents: results[3].data?.map(({ event_key, ...event }) => ({ ...event, kind: event_key.split(':')[0] })), services });
  });
}
