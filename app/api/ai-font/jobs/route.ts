import { isUuid, validatePrompt, STANDARD_FONT_CREDITS } from '@/lib/ai-font/catalog';
import { availability } from '@/lib/ai-font/config';
import { body, endpoint, HttpError, json, requireUser, sameOrigin } from '@/lib/ai-font/http';
import { adminClient } from '@/lib/ai-font/supabase';
import { reconcileJobs } from '@/lib/ai-font/generation';
import { reviewPromptState } from '@/lib/ai-font/moderation';
import { SeeApiError } from '@/lib/ai-font/seeapi';

export const maxDuration = 60;

export async function POST(request: Request) {
  return endpoint(async () => {
    sameOrigin(request);
    const user = await requireUser();
    if (!availability().generation) throw new HttpError(503, 'Font generation is not available yet.');
    const input = await body(request);
    if (!isUuid(input.id)) throw new HttpError(400, 'Invalid generation request.');
    let prompt;
    try { prompt = validatePrompt(input.prompt); } catch (error) { throw new HttpError(400, (error as Error).message); }
    const existing = await adminClient().from('ai_font_jobs').select('user_id,prompt').eq('id', input.id).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) {
      if (existing.data.user_id !== user.id || existing.data.prompt !== prompt) throw new HttpError(409, 'This request has already been used.');
      await reconcileJobs(user.id);
      return json({ id: input.id }, 202);
    }
    let review;
    try { review = await reviewPromptState(user.id, input.id, prompt); }
    catch (error) {
      const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : '';
      if (message.includes('NO_CREDITS')) throw new HttpError(402, 'Purchase a font pack to generate a font.');
      if (message.includes('BILLING_RESTRICTED')) throw new HttpError(403, 'Your payment is under review. Contact support before generating another font.');
      if (message.includes('ACTIVE_JOB')) throw new HttpError(409, 'Please wait for your current font to finish.');
      if (message.includes('REVIEW_RATE_LIMIT')) throw new HttpError(429, 'Too many descriptions submitted. Please wait before trying again.');
      if (message.includes('REVIEW_MISMATCH')) throw new HttpError(409, 'This request has already been used.');
      const code = error instanceof SeeApiError ? error.code : error && typeof error === 'object' && 'code' in error && /^[A-Z0-9_]{1,24}$/.test(String(error.code)) ? String(error.code) : 'REVIEW_UNAVAILABLE';
      console.error('[ai-font] Prompt review unavailable:', { code, httpStatus: error instanceof SeeApiError ? error.httpStatus : null });
      const restartAllowed = error instanceof SeeApiError && error.submissionRejected;
      const retryAfterSeconds = restartAllowed ? 0 : error instanceof SeeApiError ? Math.max(60, error.retryAfterSeconds ?? 60) : 60;
      const response = json({ error: 'Safety checks are temporarily unavailable. No generation credits have been used. Please try again later.', code: 'MODERATION_UNAVAILABLE', retryAfterSeconds, restartAllowed }, 503);
      if (retryAfterSeconds) response.headers.set('Retry-After', String(retryAfterSeconds));
      return response;
    }
    if (review.status === 'pending') {
      const response = json({ id: input.id, moderation: 'pending', retryAfterSeconds: review.retryAfterSeconds, waitingToRetry: review.waitingToRetry }, 202);
      response.headers.set('Retry-After', String(review.retryAfterSeconds));
      return response;
    }
    if (review.status === 'blocked') throw new HttpError(422, 'This description did not pass our safety checks. Please describe another font. No generation credits have been used.');
    if (review.status !== 'passed') return json({ error: 'The safety check could not complete. No generation credits have been used. Please try again later.', code: 'MODERATION_UNAVAILABLE', restartAllowed: true, retryAfterSeconds: 0 }, 503);
    const { error } = await adminClient().rpc('ai_font_reserve_job', { p_user: user.id, p_id: input.id, p_prompt: prompt, p_expected_cost: STANDARD_FONT_CREDITS });
    if (error) {
      if (error.message.includes('BILLING_RESTRICTED')) throw new HttpError(403, 'Your payment is under review. Contact support before generating another font.');
      if (error.message.includes('COST_CHANGED')) throw new HttpError(409, 'Generation pricing changed. Please refresh before continuing.');
      if (error.message.includes('NO_CREDITS')) throw new HttpError(402, 'Purchase a font pack to generate a font.');
      if (error.message.includes('ACTIVE_JOB')) throw new HttpError(409, 'Please wait for your current font to finish.');
      if (error.message.includes('REQUEST_MISMATCH')) throw new HttpError(409, 'This request has already been used.');
      throw error;
    }
    await reconcileJobs(user.id);
    return json({ id: input.id }, 202);
  });
}

export async function PATCH(request: Request) {
  return endpoint(async () => {
    sameOrigin(request);
    const user = await requireUser();
    return json(await reconcileJobs(user.id));
  });
}
