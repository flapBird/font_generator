import 'server-only';
import { adminClient } from './supabase';
import { requiredEnv } from './config';
import type { FontJob } from './catalog';
import { FontValidationError, validateEnglishTtf } from './validate-font';
import { approvedFontBytes, reviewGeneratedFont, reviewStoragePath, reviewStagePath, stagedFontBytes, type ReviewJob } from './moderation';
import { FontSpecimenError } from './font-specimens';
import type { JobFailureCode } from './job-status';

type StoredJob = FontJob & ReviewJob & { external_id: string | null; storage_path: string | null; updated_at: string };
const apiBase = 'https://api.mixfont.com/v1/font-generations';

async function finish(id: string, status: 'failed' | 'succeeded', path: string | null = null, name: string | null = null, reason: JobFailureCode | null = null) {
  const db = adminClient();
  const args = { p_id: id, p_status: status, p_path: path, p_name: name };
  let { error } = await db.rpc('ai_font_finish_job_with_reason', { ...args, p_reason: reason });
  // A rolling deployment without the additive migration still settles credits.
  // Other errors may be uncertain commits: never treat them as a missing RPC.
  if (error?.code === 'PGRST202') ({ error } = await db.rpc('ai_font_finish_job', args));
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
    if ([400, 401, 402, 403, 422, 429].includes(response.status)) {
      const reason = response.status === 429 ? 'service_busy' : [401,402,403].includes(response.status) ? 'service_unavailable' : 'request_rejected';
      console.error('[ai-font] Generation submission rejected:', { httpStatus: response.status, code: reason });
      await response.body?.cancel();
      await finish(job.id, 'failed', null, null, reason); return;
    }
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
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20000), cache: 'no-store' });
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new Error('Font download unavailable');
  }
  const maxBytes = 20 * 1024 * 1024;
  if (Number(response.headers.get('content-length')) > maxBytes) {
    await response.body.cancel();
    throw new FontValidationError('Font too large');
  }
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) throw new FontValidationError('Font too large');
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const bytes = Buffer.concat(chunks);
  validateEnglishTtf(bytes);
  return bytes;
}

export async function reconcileJob(job: StoredJob) {
  // Missing review configuration never permits an unreviewed generation or
  // delivery. Already delivered files remain downloadable independently.
  if (!process.env.SEEAPI_API_KEY?.trim()) return;
  if (job.status === 'reserved') { await start(job); return; }
  const age = Date.now() - new Date(job.updated_at).getTime();
  if (job.status === 'starting' && age > 5 * 60 * 1000) {
    const { error } = await adminClient().from('ai_font_jobs').update({ status: 'needs_review' }).eq('id', job.id).eq('status', 'starting');
    if (error) throw error;
    return;
  }
  if (job.status !== 'processing' || !job.external_id) return;
  let bytes: Buffer | undefined;
  let name = job.name || 'Your custom font';
  try {
    if (!job.output_hash) {
      bytes = await stagedFontBytes(job) ?? undefined;
      if (!bytes) {
        const response = await fetch(`${apiBase}/${encodeURIComponent(job.external_id)}`, {
          headers: { 'x-api-key': requiredEnv('MIXFONT_API_KEY') }, cache: 'no-store', signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) throw new Error('Generation status unavailable');
        const result = await response.json();
        if (result.id !== job.external_id) throw new Error('Generation mismatch');
        if (['failed', 'cancelled'].includes(result.status)) { await finish(job.id, 'failed', null, null, 'generation_failed'); return; }
        if (result.status !== 'succeeded') return;
        bytes = await downloadFont(safeFontUrl(result.ttf_url));
        if (typeof result.name === 'string') name = result.name;
        const savedName = await adminClient().from('ai_font_jobs').update({ name }).eq('id', job.id).eq('status', 'processing');
        if (savedName.error) throw savedName.error;
      } else validateEnglishTtf(bytes);
    }
    const review = await reviewGeneratedFont(job, bytes);
    if (review === 'pending') return;
    if (review === 'blocked' || review === 'failed') { await finish(job.id, 'failed', null, null, review === 'blocked' ? 'output_blocked' : 'review_failed'); await cleanupReview(job); return; }
  } catch (error) {
    if (!(error instanceof FontValidationError) && !(error instanceof FontSpecimenError)) throw error;
    // A completed but invalid font cannot be delivered. The existing atomic
    // failure function restores exactly the reserved customer credits once.
    await finish(job.id, 'failed', null, null, 'output_invalid');
    await cleanupReview(job);
    return;
  }
  if (!job.output_hash) {
    const current = await adminClient().from('ai_font_jobs').select('output_hash,review_page_count').eq('id', job.id).single();
    if (current.error) throw current.error;
    job = { ...job, ...current.data };
  }
  bytes = await approvedFontBytes(job);
  const path = `${job.user_id}/${job.id}.ttf`;
  const { error } = await adminClient().storage.from('ai-fonts').upload(path, bytes, { contentType: 'font/ttf', upsert: true });
  if (error) throw error;
  await finish(job.id, 'succeeded', path, name);
  await cleanupReview(job);
}

async function cleanupReview(job: ReviewJob) {
  if (!job.output_hash || !job.review_page_count) {
    const current = await adminClient().from('ai_font_jobs').select('output_hash,review_page_count').eq('id', job.id).maybeSingle();
    if (!current.error && current.data) job = { ...job, ...current.data };
  }
  const base = job.output_hash ? reviewStoragePath(job, job.output_hash) : null;
  await adminClient().storage.from('ai-font-review').remove([
    reviewStagePath(job), ...(base && job.review_page_count ? [`${base}/font.ttf`, ...Array.from({ length: job.review_page_count }, (_, index) => `${base}/${index}.png`)] : []),
  ]).then(() => {}, () => {});
}

export async function reconcileJobs(userId?: string) {
  const db = adminClient();
  let query = db.from('ai_font_jobs').select('*').in('status', ['reserved', 'starting', 'processing']).order('updated_at').limit(userId ? 1 : 10);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  // Workers have 128 MB per isolate. Each font can occupy multiple 20 MB
  // buffers during validation/upload; do not buffer ten completed fonts at once.
  let errors = 0;
  for (const job of data as StoredJob[]) {
    try { await reconcileJob(job); } catch { errors++; }
  }
  return { checked: data.length, errors };
}
