import { analyticsIdentity } from '@/lib/analytics/server';
import { loadAccount } from '@/lib/ai-font/account';
import { availability } from '@/lib/ai-font/config';
import { authClient } from '@/lib/ai-font/supabase';
import { endpoint, json } from '@/lib/ai-font/http';

export async function GET() {
  return endpoint(async () => {
    const services = availability();
    if (!services.auth) return json({ user: null, credits: 0, jobs: [], orders: [], creditEvents: [], subscriptions: [], analytics: analyticsIdentity(null), services });
    const { data: { user }, error: authError } = await (await authClient()).auth.getUser();
    if (authError || !user) return json({ user: null, credits: 0, jobs: [], orders: [], creditEvents: [], subscriptions: [], analytics: analyticsIdentity(null), services });
    return json(await loadAccount(user));
  });
}
