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
    return json({ user: { email: user.email, displayName: displayName(profile?.display_name || user.user_metadata?.full_name), avatarUrl: googleAvatar(profile?.avatar_url || user.user_metadata?.avatar_url) } });
  });
}
