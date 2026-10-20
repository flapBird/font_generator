import { authClient } from '@/lib/ai-font/supabase';
import { endpoint, json, sameOrigin } from '@/lib/ai-font/http';

export async function POST(request: Request) {
  return endpoint(async () => {
    sameOrigin(request);
    const { error } = await (await authClient()).auth.signOut();
    if (error) throw error;
    return json({ success: true });
  });
}
