import { availability } from '@/lib/ai-font/config';
import { authClient } from '@/lib/ai-font/supabase';
import { endpoint, json } from '@/lib/ai-font/http';

// Header sign-in state is independent of paid features and database migrations.
export async function GET() {
  return endpoint(async () => {
    if (!availability().auth) return json({ user: null });
    const { data: { user }, error } = await (await authClient()).auth.getUser();
    if (error || !user) return json({ user: null });
    return json({ user: { email: user.email } });
  });
}
