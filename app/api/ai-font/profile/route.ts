import { body, endpoint, HttpError, json, requireUser, sameOrigin } from '@/lib/ai-font/http';
import { adminClient } from '@/lib/ai-font/supabase';
import { displayName } from '@/lib/ai-font/profile';

export async function PATCH(request: Request) {
  return endpoint(async () => {
    sameOrigin(request);
    const user = await requireUser();
    const input = await body(request);
    if (typeof input.displayName !== 'string' || input.displayName.length > 80 || !displayName(input.displayName)) throw new HttpError(400, 'Enter a display name of 1–80 characters.');
    const name = displayName(input.displayName);
    const { error } = await adminClient().from('ai_font_profiles').upsert({ user_id: user.id, display_name: name, name_customized: true, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
    return json({ displayName: name });
  });
}
