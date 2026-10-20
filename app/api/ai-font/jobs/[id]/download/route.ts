import { isUuid } from '@/lib/ai-font/catalog';
import { endpoint, HttpError, json, requireUser } from '@/lib/ai-font/http';
import { adminClient } from '@/lib/ai-font/supabase';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return endpoint(async () => {
    const user = await requireUser();
    const { id } = await params;
    if (!isUuid(id)) throw new HttpError(404, 'Font not found.');
    const db = adminClient();
    const { data, error } = await db.from('ai_font_jobs').select('storage_path,status,moderation_version,moderation_status').eq('id', id).eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    if (!data || data.status !== 'succeeded' || !data.storage_path) throw new HttpError(404, 'Font is not ready to download.');
    if (data.moderation_version && data.moderation_status !== 'passed') throw new HttpError(404, 'Font is still being reviewed.');
    const signed = await db.storage.from('ai-fonts').createSignedUrl(data.storage_path, 60, { download: `font-${id.slice(0, 8)}.ttf` });
    if (signed.error) throw signed.error;
    return json({ url: signed.data.signedUrl });
  });
}
