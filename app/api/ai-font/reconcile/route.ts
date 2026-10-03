import { timingSafeEqual } from 'node:crypto';
import { requiredEnv } from '@/lib/ai-font/config';
import { endpoint, HttpError, json } from '@/lib/ai-font/http';
import { reconcileJobs } from '@/lib/ai-font/generation';

export const maxDuration = 60;

// Schedule every 5 minutes, including when the user closes their browser.
export async function GET(request: Request) {
  return endpoint(async () => {
    const expected = Buffer.from(`Bearer ${requiredEnv('AI_FONT_CRON_SECRET')}`);
    const supplied = Buffer.from(request.headers.get('authorization') || '');
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) throw new HttpError(401, 'Unauthorized.');
    return json(await reconcileJobs());
  });
}
