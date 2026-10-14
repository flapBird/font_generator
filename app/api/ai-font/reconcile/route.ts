import { timingSafeEqual } from 'node:crypto';
import { requiredEnv } from '@/lib/ai-font/config';
import { endpoint, HttpError, json } from '@/lib/ai-font/http';
import { reconcileJobs } from '@/lib/ai-font/generation';
import { reconcileBilling, billingReconciliationAvailable } from '@/lib/ai-font/payments/reconciliation';
import { deliverBillingMail } from '@/lib/ai-font/mail-delivery';

export const maxDuration = 600;

// Schedule every 5 minutes, including when the user closes their browser.
export async function GET(request: Request) {
  return endpoint(async () => {
    const expected = Buffer.from(`Bearer ${requiredEnv('AI_FONT_CRON_SECRET')}`);
    const supplied = Buffer.from(request.headers.get('authorization') || '');
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) throw new HttpError(401, 'Unauthorized.');
    // Keep the three queues independent: a provider outage must not prevent
    // completed credit events from reaching the notification queue.
    const safe = async (action: () => Promise<{ checked: number; errors: number }>) => {
      try { return await action(); } catch { return { checked: 0, errors: 1 }; }
    };
    const billing = billingReconciliationAvailable() ? await safe(() => reconcileBilling()) : { checked: 0, errors: 0 };
    const jobs = process.env.MIXFONT_API_KEY?.trim() ? await safe(() => reconcileJobs()) : { checked: 0, errors: 0 };
    const mail = await safe(() => deliverBillingMail());
    return json({ billing, jobs, mail, checked: billing.checked + jobs.checked + mail.checked, errors: billing.errors + jobs.errors + mail.errors });
  });
}
