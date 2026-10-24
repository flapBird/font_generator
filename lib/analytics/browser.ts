'use client';

import { ANALYTICS_HOSTS, GA4_MEASUREMENT_ID, identityParams, packItems, validContext, type AnalyticsContext, type AnalyticsIdentity } from './shared';
import { FONT_PACK } from '../ai-font/catalog';

type Tag = (...args: unknown[]) => void;
declare global {
  interface Window { dataLayer?: unknown[]; gtag?: Tag; fontAnalyticsConsent?: 'granted' | 'denied' }
}
let initialized = false;
let identity: AnalyticsIdentity | null = null;
export function analyticsAllowed() {
  return typeof window !== 'undefined' && ANALYTICS_HOSTS.includes(window.location.hostname)
    && window.fontAnalyticsConsent !== 'denied'
    && !(window as unknown as Record<string, unknown>)[`ga-disable-${GA4_MEASUREMENT_ID}`];
}
function command(...args: unknown[]) {
  window.dataLayer ||= [];
  // Google's gtag queue uses Arguments objects, not dataLayer event objects.
  // eslint-disable-next-line prefer-rest-params
  window.gtag ||= function () { window.dataLayer!.push(arguments); };
  window.gtag(...args);
}
export function safePageLocation() {
  const url = new URL(window.location.href);
  const safe = new URL(url.pathname, url.origin);
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const value = url.searchParams.get(key);
    if (value && value.length <= 100 && /^[\p{L}\p{N} ._~:/+-]+$/u.test(value)) safe.searchParams.set(key, value);
  }
  return safe.href;
}
export function initializeAnalytics() {
  if (!analyticsAllowed() || initialized) return;
  initialized = true;
  command('js', new Date());
  command('config', GA4_MEASUREMENT_ID, { send_page_view: false, page_location: safePageLocation(),
    page_referrer: document.referrer ? new URL(document.referrer).origin : '' });
}
// Existing CMPs can call this bridge when analytics storage consent changes.
export function setAnalyticsConsent(granted: boolean) {
  window.fontAnalyticsConsent = granted ? 'granted' : 'denied';
  command('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' });
  if (!granted) { identity = null; command('config', GA4_MEASUREMENT_ID, { user_id: null, send_page_view: false }); }
}
export function setAnalyticsIdentity(value: AnalyticsIdentity | null) {
  identity = value;
  if (!analyticsAllowed()) return;
  try {
    initializeAnalytics();
    command('config', GA4_MEASUREMENT_ID, { user_id: value?.userId || null, send_page_view: false });
  } catch { /* Analytics never blocks the account UI. */ }
}
export type ClientEvent = 'page_view' | 'ai_font_view' | 'login_start' | 'login' | 'login_return' | 'view_item' | 'checkout_click' | 'checkout_error';
export function trackEvent(name: ClientEvent, details: { destination?: string; eventId?: string; errorCode?: string } = {}) {
  try {
    if (!analyticsAllowed()) return;
    initializeAnalytics();
    const params: Record<string, unknown> = { ...identityParams(identity), page_location: safePageLocation(),
      page_referrer: document.referrer ? new URL(document.referrer).origin : '', transport_type: 'beacon' };
    if (details.destination && /^\/[a-zA-Z0-9_/-]*$/.test(details.destination)) params.login_destination = details.destination;
    if (details.eventId && /^[a-zA-Z0-9-]{1,100}$/.test(details.eventId)) params.event_id = details.eventId;
    if (details.errorCode && /^HTTP_\d{3}$|^NETWORK$/.test(details.errorCode)) params.error_code = details.errorCode;
    if (['login_start', 'login', 'login_return'].includes(name)) params.method = 'Google';
    if (['view_item', 'checkout_click'].includes(name)) Object.assign(params, { currency: FONT_PACK.currency, value: FONT_PACK.amountMinor / 100, items: packItems() });
    command('event', name, params);
  } catch { /* Analytics never blocks sign-in, checkout or rendering. */ }
}
export function trackLoginResult(result?: { id: string; destination: string } | null) {
  if (!result || !analyticsAllowed()) return;
  try {
    const key = `fg-login-event-${result.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    trackEvent('login', { eventId: result.id, destination: result.destination });
    trackEvent('login_return', { eventId: result.id, destination: result.destination });
  } catch { /* No tracking when storage is unavailable. */ }
}
export async function checkoutAnalyticsContext(): Promise<AnalyticsContext | null> {
  try {
    // Never manufacture a client ID or sidestep blocked/disabled cookie storage.
    if (!analyticsAllowed() || !window.gtag || !document.cookie.split(';').some(item => /^\s*_ga=/.test(item))) return null;
    const get = (field: string) => new Promise<unknown>(resolve => {
      const timer = setTimeout(() => resolve(null), 200);
      window.gtag!('get', GA4_MEASUREMENT_ID, field, (value: unknown) => { clearTimeout(timer); resolve(value); });
    });
    const [client, session] = await Promise.all([get('client_id'), get('session_id')]);
    if (!analyticsAllowed()) return null;
    return validContext({ client_id: client, session_id: session == null ? session : String(session), analytics_storage: 'granted' });
  } catch { return null; }
}
