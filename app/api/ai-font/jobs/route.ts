import { isUuid, validatePrompt } from '@/lib/ai-font/catalog';
import { availability } from '@/lib/ai-font/config';
import { body, endpoint, HttpError, json, requireUser, sameOrigin } from '@/lib/ai-font/http';
import { adminClient } from '@/lib/ai-font/supabase';
import { reconcileJobs } from '@/lib/ai-font/generation';

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
    const { error } = await adminClient().rpc('ai_font_reserve_job', { p_user: user.id, p_id: input.id, p_prompt: prompt });
    if (error) {
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
