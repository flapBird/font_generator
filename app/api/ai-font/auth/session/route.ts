import { cookies } from 'next/headers';
import { LOGIN_ANALYTICS_COOKIE } from '@/lib/analytics/shared';
import { analyticsIdentity } from '@/lib/analytics/server';
import { authReturnPath } from '@/lib/ai-font/auth-navigation';
import { displayName, googleAvatar } from '@/lib/ai-font/profile';
import { availability } from '@/lib/ai-font/config';
import { adminClient, authClient } from '@/lib/ai-font/supabase';
import { endpoint, json } from '@/lib/ai-font/http';

// Header sign-in state is independent of paid features and database migrations.
export async function GET() {
  return endpoint(async () => {
    if (!availability().auth) return json({ user: null });
    const { data: { user }, error } = await (await authClient()).auth.getUser();
    if (error || !user) return json({ user: null });
    let profile = null;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const result = await adminClient().from('ai_font_profiles').select('display_name,avatar_url').eq('user_id', user.id).maybeSingle();
      profile = result.data;
    }
    let loginEvent = null;
    const jar = await cookies();
    const marker = jar.get(LOGIN_ANALYTICS_COOKIE)?.value;
    if (marker) {
      jar.set(LOGIN_ANALYTICS_COOKIE, '', { path: '/', maxAge: 0 });
      try {
        const value = JSON.parse(marker);
        if (value.userId === user.id && typeof value.id === 'string' && /^[a-f0-9-]{36}$/.test(value.id))
          loginEvent = { id: value.id, destination: authReturnPath(value.destination) };
      } catch { /* Invalid markers never count as successful logins. */ }
    }
    return json({ analytics: analyticsIdentity(user), loginEvent, user: { email: user.email, displayName: displayName(profile?.display_name || user.user_metadata?.full_name), avatarUrl: googleAvatar(profile?.avatar_url || user.user_metadata?.avatar_url) } });
  });
}
