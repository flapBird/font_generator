import 'server-only';
import { createHash } from 'node:crypto';
import { adminClient } from './supabase';
import { submitModeration, pollModeration, SeeApiError, type ModerationKind } from './seeapi';
import { renderFontSpecimens } from './font-specimens';

type ReviewStatus = 'pending' | 'passed' | 'blocked' | 'failed';
type Review = { id: string; status: ReviewStatus; provider_task_id: string | null; claim_token: string | null; next_check_at?: string; lease_until?: string | null };
export type PromptReviewState = { status: ReviewStatus; retryAfterSeconds: number; waitingToRetry: boolean };
export type ReviewJob = { id: string; user_id: string; output_hash?: string | null; review_page_count?: number | null };

export function reviewHash(value: string | Buffer) { return createHash('sha256').update(value).digest('hex'); }
export function reviewStoragePath(job: ReviewJob, hash: string) { return `${job.user_id}/${job.id}/${hash}`; }
export function reviewStagePath(job: ReviewJob) { return `${job.user_id}/${job.id}/staged.ttf`; }

async function check(kind: ModerationKind, user: string, request: string, stage: string, input: string, inputHash: string, assetHash: string | null = null): Promise<PromptReviewState> {
  const db = adminClient();
  const { data, error } = await db.rpc('ai_font_prepare_moderation', {
    p_user: user, p_request: request, p_stage: stage, p_input_hash: inputHash, p_asset_hash: assetHash,
  });
  if (error) throw error;
  const review = data as Review;
  if (!review || !['pending', 'passed', 'blocked', 'failed'].includes(review.status)) throw new Error('Review unavailable');
  if (review.status !== 'pending') return { status: review.status, retryAfterSeconds: 0, waitingToRetry: false };
  if (!review.claim_token) {
    const now = Date.now();
    const nextCheck = Date.parse(review.next_check_at || '') || now;
    const leaseUntil = Date.parse(review.lease_until || '') || now;
    return { status: 'pending', retryAfterSeconds: Math.max(3, Math.min(300, Math.ceil((Math.max(nextCheck, leaseUntil) - now) / 1000))), waitingToRetry: !review.provider_task_id && leaseUntil <= now && nextCheck > now };
  }
  try {
    const outcome = review.provider_task_id
      ? await pollModeration(kind, review.provider_task_id)
      : await submitModeration(kind, input, `font-review-${review.id}`);
    const saved = await db.rpc('ai_font_finish_moderation', {
      p_id: review.id, p_token: review.claim_token, p_task_id: outcome.taskId,
      p_status: outcome.status, p_consumed_credits: outcome.consumedCredits,
    });
    if (saved.error) throw saved.error;
    // An expired lease cannot publish a stale verdict. Another invocation can
    // read the durable result or safely replay the original idempotency key.
    return { status: saved.data === true ? outcome.status : 'pending', retryAfterSeconds: 3, waitingToRetry: false };
  } catch (failure) {
    await db.rpc('ai_font_finish_moderation', {
      p_id: review.id, p_token: review.claim_token, p_task_id: review.provider_task_id,
      // An explicit rejection before task creation needs configuration/input
      // repair, not automatic resubmission. Ambiguous responses retain the key.
      p_status: failure instanceof SeeApiError && failure.submissionRejected ? 'failed' : 'retry', p_consumed_credits: null,
      p_retry_after_seconds: failure instanceof SeeApiError ? Math.max(60, failure.retryAfterSeconds ?? 60) : 60,
    }).then(() => {}, () => {});
    throw failure;
  }
}

export function reviewPromptState(user: string, request: string, prompt: string) {
  return check('text', user, request, 'prompt', prompt, reviewHash(prompt));
}

export async function reviewPrompt(user: string, request: string, prompt: string) {
  return (await reviewPromptState(user, request, prompt)).status;
}

async function storedBytes(path: string, maximum: number) {
  const { data, error } = await adminClient().storage.from('ai-font-review').download(path);
  if (error) throw error;
  if (!data || data.size < 1 || data.size > maximum) throw new Error('Review asset unavailable');
  return Buffer.from(await data.arrayBuffer());
}

/** The canonical private stage survives a crash before the hash/page bind RPC. */
export async function stagedFontBytes(job: ReviewJob): Promise<Buffer | null> {
  const { data, error } = await adminClient().storage.from('ai-font-review').download(reviewStagePath(job));
  if (error) {
    // Current storage-js can place the service code in statusCode. Only a
    // missing object is a cache miss; missing buckets and denied reads must fail.
    const code = 'code' in error ? error.code : undefined;
    if (code === 'NoSuchKey' || (code === undefined && ['NoSuchKey', '404'].includes(String(error.statusCode)))) return null;
    throw error;
  }
  if (!data || data.size < 1 || data.size > 20 * 1024 * 1024) throw new Error('Review asset unavailable');
  return Buffer.from(await data.arrayBuffer());
}

export async function approvedFontBytes(job: ReviewJob) {
  if (!job.output_hash) throw new Error('Review asset unavailable');
  const bytes = await storedBytes(`${reviewStoragePath(job, job.output_hash)}/font.ttf`, 20 * 1024 * 1024);
  if (reviewHash(bytes) !== job.output_hash) throw new Error('Review asset changed');
  return bytes;
}

/** Quarantine the exact font and its complete specimen before any review call. */
export async function reviewGeneratedFont(job: ReviewJob, incoming?: Buffer): Promise<ReviewStatus> {
  const db = adminClient();
  if (!job.output_hash) {
    if (!incoming) throw new Error('Missing review asset');
    // Never overwrite the first saved candidate for a logical job. A concurrent
    // retry or partial staging failure resumes that file, not a fresh vendor URL.
    const staged = await db.storage.from('ai-font-review').upload(reviewStagePath(job), incoming, { contentType: 'font/ttf', upsert: false });
    if (staged.error) {
      const saved = await stagedFontBytes(job);
      if (!saved) throw staged.error;
      incoming = saved;
    }
    const hash = reviewHash(incoming);
    const pages = await renderFontSpecimens(incoming);
    const base = reviewStoragePath(job, hash);
    const bucket = db.storage.from('ai-font-review');
    const font = await bucket.upload(`${base}/font.ttf`, incoming, { contentType: 'font/ttf', upsert: true });
    if (font.error) throw font.error;
    for (let index = 0; index < pages.length; index++) {
      const stored = await bucket.upload(`${base}/${index}.png`, pages[index], { contentType: 'image/png', upsert: true });
      if (stored.error) throw stored.error;
    }
    const bound = await db.rpc('ai_font_bind_review', { p_id: job.id, p_hash: hash, p_pages: pages.length });
    if (bound.error) throw bound.error;
    if (bound.data !== true) return 'pending';
    job = { ...job, output_hash: hash, review_page_count: pages.length };
  }
  if (!job.output_hash || !job.review_page_count) throw new Error('Review asset unavailable');
  const { data, error } = await db.from('ai_font_moderation_checks').select('stage,status,input_hash,asset_hash')
    .eq('user_id', job.user_id).eq('request_id', job.id).eq('policy_version', 'seeapi-v1').like('stage', 'output:%');
  if (error) throw error;
  const checks = data as { stage: string; status: ReviewStatus; input_hash: string; asset_hash: string }[];
  if (checks.some((row) => row.asset_hash !== job.output_hash)) throw new Error('Review asset changed');
  if (checks.some((row) => row.status === 'blocked')) return 'blocked';
  if (checks.some((row) => row.status === 'failed')) return 'failed';
  for (let index = 0; index < job.review_page_count; index++) {
    const stage = `output:${index}`;
    const existing = checks.find((row) => row.stage === stage);
    if (existing?.status === 'passed') continue;
    const png = await storedBytes(`${reviewStoragePath(job, job.output_hash)}/${index}.png`, 4 * 1024 * 1024);
    const hash = reviewHash(png);
    if (existing && existing.input_hash !== hash) throw new Error('Review image changed');
    const { status } = await check('image', job.user_id, job.id, stage, `data:image/png;base64,${png.toString('base64')}`, hash, job.output_hash);
    if (status === 'blocked' || status === 'failed') return status;
    // One provider operation per job/invocation bounds HTTP request duration and
    // Workers memory. Cron and authenticated refresh resume subsequent pages.
    return status === 'passed' && index === job.review_page_count - 1 ? 'passed' : 'pending';
  }
  return 'passed';
}
