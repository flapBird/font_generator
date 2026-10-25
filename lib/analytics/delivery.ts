import 'server-only';
import { adminClient } from '../ai-font/supabase';
import { serverAnalyticsAvailable } from './server';
import { GA4_MEASUREMENT_ID, identityParams, validContext, type AnalyticsIdentity } from './shared';

type AnalyticsEvent = {
  id: number; claim_token: string; order_id: string; event_name: 'begin_checkout' | 'purchase'; occurred_at: string;
  context: AnalyticsIdentity & { client_id: string; session_id: string; analytics_storage: 'granted' };
  amount_minor: number; currency: string; package_id: string;
};
export function eventPayload(event: AnalyticsEvent) {
  const context = validContext(event.context);
  const timestamp = new Date(event.occurred_at).getTime();
  if (!context || !/^[a-f0-9]{64}$/.test(event.context.userId || '') || !Number.isFinite(timestamp)
    || !['begin_checkout', 'purchase'].includes(event.event_name) || !Number.isSafeInteger(event.amount_minor)
    || event.amount_minor <= 0 || !/^[A-Z]{3}$/.test(event.currency) || event.package_id !== 'english-starter') throw new Error('INVALID_EVENT');
  const test = event.context.audienceType === 'internal' || event.context.paymentEnvironment !== 'live';
  return {
    client_id: context.client_id, user_id: event.context.userId, timestamp_micros: timestamp * 1000,
    validation_behavior: 'ENFORCE_RECOMMENDATIONS',
    events: [{ name: `${test ? 'test_' : ''}${event.event_name}`, params: {
      ...identityParams(event.context), session_id: Number(context.session_id), engagement_time_msec: 1,
      transaction_id: event.order_id, currency: event.currency, value: event.amount_minor / 100,
      items: [{ item_id: event.package_id, item_name: 'AI Font Starter Pack', item_category: 'AI font credits', price: event.amount_minor / 100, quantity: 1 }],
    } }],
  };
}
export async function deliverAnalytics() {
  if (!serverAnalyticsAvailable()) return { checked: 0, errors: 0, disabled: true };
  const db = adminClient();
  const { data, error } = await db.rpc('ai_font_claim_analytics', { p_limit: 5 });
  if (error) throw error;
  const result = { checked: 0, errors: 0, disabled: false };
  for (const event of (data || []) as AnalyticsEvent[]) {
    result.checked++;
    let failure: string | null = null;
    try {
      const payload = eventPayload(event);
      if (Date.now() - new Date(event.occurred_at).getTime() > 72 * 3600_000) throw new Error('EVENT_TOO_OLD');
      const url = new URL('https://www.google-analytics.com/mp/collect');
      url.searchParams.set('measurement_id', GA4_MEASUREMENT_ID);
      url.searchParams.set('api_secret', process.env.GA4_MEASUREMENT_PROTOCOL_SECRET!.trim());
      let response: Response;
      try {
        response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
          signal: AbortSignal.timeout(7_000), redirect: 'manual', credentials: 'omit', cache: 'no-store' });
      } catch { throw new Error('DELIVERY_UNCERTAIN'); }
      await response.body?.cancel().catch(() => undefined);
      if (!response.ok) throw new Error(response.status === 429 ? 'RATE_LIMIT' : response.status >= 500 ? 'DELIVERY_UNCERTAIN' : 'REQUEST_REJECTED');
      // A 2xx receipt is transport acceptance, not proof of GA4 validation or reporting.
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      failure = ['RATE_LIMIT','DELIVERY_UNCERTAIN','REQUEST_REJECTED','EVENT_TOO_OLD','INVALID_EVENT'].includes(code) ? code : 'DELIVERY_UNCERTAIN';
      result.errors++;
      console.warn('analytics_delivery_failed', { eventId: event.id, code: failure });
    }
    const { error: finishError, data: finished } = await db.rpc('ai_font_finish_analytics', { p_id: event.id, p_token: event.claim_token, p_error: failure });
    if (finishError || !finished) { if (!failure) result.errors++; }
  }
  return result;
}
