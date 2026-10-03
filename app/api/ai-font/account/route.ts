import { availability } from '@/lib/ai-font/config';
import { adminClient, authClient } from '@/lib/ai-font/supabase';
import { endpoint, json } from '@/lib/ai-font/http';

export async function GET() {
  return endpoint(async () => {
    const services = availability();
    if (!services.auth) return json({ user: null, credits: 0, jobs: [], orders: [], services });
    const { data: { user } } = await (await authClient()).auth.getUser();
    if (!user) return json({ user: null, credits: 0, jobs: [], orders: [], services });
    const db = adminClient();
    const results = await Promise.all([
      db.from('ai_font_wallets').select('balance').eq('user_id', user.id).maybeSingle(),
      db.from('ai_font_jobs').select('id,prompt,status,name,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      db.from('ai_font_orders').select('id,provider,amount_minor,currency,credits,status,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ]);
    for (const result of results) if (result.error) throw result.error;
    return json({ user: { email: user.email }, credits: results[0].data?.balance ?? 0, jobs: results[1].data, orders: results[2].data, services });
  });
}
