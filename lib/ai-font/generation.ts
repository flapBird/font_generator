import 'server-only';
import { adminClient } from './supabase';
import { requiredEnv } from './config';
import type { FontJob } from './catalog';

type StoredJob = FontJob & { user_id: string; external_id: string | null; storage_path: string | null; updated_at: string };
const apiBase = 'https://api.mixfont.com/v1/font-generations';

async function finish(id: string, status: 'failed' | 'succeeded', path: string | null = null, name: string | null = null) {
  const { error } = await adminClient().rpc('ai_font_finish_job', { p_id: id, p_status: status, p_path: path, p_name: name });
  if (error) throw error;
}

async function start(job: StoredJob) {
  const db = adminClient();
  const { data: claimed, error } = await db.rpc('ai_font_claim_job', { p_id: job.id });
  if (error) throw error;
  if (!claimed) return;
  // Mixfont does not document an idempotent creation key. Never blindly repeat a
  // POST after a timeout; it may already have incurred a charge upstream.
  try {
    const response = await fetch(`${apiBase}/text`, {
      method: 'POST', headers: { 'x-api-key': requiredEnv('MIXFONT_API_KEY'), 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: job.prompt, glyph_set: 'standard' }), cache: 'no-store', signal: AbortSignal.timeout(20000),
    });
    if ([400, 401, 402, 403, 422, 429].includes(response.status)) { await finish(job.id, 'failed'); return; }
    if (!response.ok) throw new Error('Uncertain generation submission');
    const result = await response.json();
    if (typeof result.id !== 'string' || !/^[a-zA-Z0-9-]{1,100}$/.test(result.id)) throw new Error('Invalid generation response');
    const { error: saveError } = await db.from('ai_font_jobs').update({
      external_id: result.id, status: 'processing', updated_at: new Date().toISOString(),
    }).eq('id', job.id).eq('status', 'starting');
    if (saveError) throw saveError;
  } catch {
    const { error: reviewError } = await db.from('ai_font_jobs').update({ status: 'needs_review', updated_at: new Date().toISOString() }).eq('id', job.id).eq('status', 'starting');
    if (reviewError) throw reviewError;
  }
}

export function safeFontUrl(value: unknown) {
  if (typeof value !== 'string') throw new Error('Missing font URL');
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'static.mixfont.com' || url.port || url.username || url.password) throw new Error('Unexpected font host');
  return url;
}

async function downloadFont(url: URL) {
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20000), cache: 'no-store' });
  if (!response.ok || !response.body) throw new Error('Font download unavailable');
  const maxBytes = 20 * 1024 * 1024;
  if (Number(response.headers.get('content-length')) > maxBytes) throw new Error('Font too large');
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) throw new Error('Font too large');
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const bytes = Buffer.concat(chunks);
  if (bytes.length < 12 || (bytes.readUInt32BE(0) !== 0x00010000 && bytes.toString('ascii', 0, 4) !== 'true')) throw new Error('Invalid TTF file');
  return bytes;
}

export async function reconcileJob(job: StoredJob) {
  if (job.status === 'reserved') { await start(job); return; }
  const age = Date.now() - new Date(job.updated_at).getTime();
  if (job.status === 'starting' && age > 5 * 60 * 1000) {
    const { error } = await adminClient().from('ai_font_jobs').update({ status: 'needs_review' }).eq('id', job.id).eq('status', 'starting');
    if (error) throw error;
    return;
  }
  if (job.status !== 'processing' || !job.external_id) return;
  const response = await fetch(`${apiBase}/${encodeURIComponent(job.external_id)}`, {
    headers: { 'x-api-key': requiredEnv('MIXFONT_API_KEY') }, cache: 'no-store', signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Generation status unavailable');
  const result = await response.json();
  if (result.id !== job.external_id) throw new Error('Generation mismatch');
  if (['failed', 'cancelled'].includes(result.status)) { await finish(job.id, 'failed'); return; }
  if (result.status !== 'succeeded') return;
  const bytes = await downloadFont(safeFontUrl(result.ttf_url));
  const path = `${job.user_id}/${job.id}.ttf`;
  const { error } = await adminClient().storage.from('ai-fonts').upload(path, bytes, { contentType: 'font/ttf', upsert: true });
  if (error) throw error;
  await finish(job.id, 'succeeded', path, typeof result.name === 'string' ? result.name : 'Your custom font');
}

export async function reconcileJobs(userId?: string) {
  const db = adminClient();
  let query = db.from('ai_font_jobs').select('*').in('status', ['reserved', 'starting', 'processing']).order('updated_at').limit(userId ? 1 : 10);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  const outcomes = await Promise.allSettled((data as StoredJob[]).map(reconcileJob));
  return { checked: outcomes.length, errors: outcomes.filter((result) => result.status === 'rejected').length };
}
