import { FONT_PACK } from '../ai-font/catalog';

export const GA4_MEASUREMENT_ID = 'G-P3P9SJKZEG';
export const ANALYTICS_HOSTS = ['font-generators.org', 'www.font-generators.org'];
export const LOGIN_ANALYTICS_COOKIE = 'fg_login_analytics';
export type AnalyticsIdentity = {
  userId: string | null;
  audienceType: 'anonymous' | 'customer' | 'internal';
  checkoutEligible: boolean;
  checkoutMode: 'private' | 'public';
  paymentProvider: 'waffo' | 'paypal';
  paymentEnvironment: 'test' | 'live';
};
export type AnalyticsContext = { client_id: string; session_id: string; analytics_storage: 'granted' };
export function validContext(value: unknown): AnalyticsContext | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  if (input.analytics_storage !== 'granted' || typeof input.client_id !== 'string' || !/^\d{1,20}\.\d{1,20}$/.test(input.client_id)
    || typeof input.session_id !== 'string' || !/^\d{1,20}$/.test(input.session_id)
    || !Number.isSafeInteger(Number(input.session_id)) || Number(input.session_id) <= 0) return null;
  return { client_id: input.client_id, session_id: input.session_id, analytics_storage: 'granted' };
}
export function identityParams(identity?: AnalyticsIdentity | null) {
  return {
    audience_type: identity?.audienceType || 'anonymous', checkout_eligible: identity?.checkoutEligible ? 'true' : 'false',
    checkout_mode: identity?.checkoutMode || 'private', payment_provider: identity?.paymentProvider || 'unknown',
    payment_environment: identity?.paymentEnvironment || 'unknown',
  };
}
export function packItems() {
  return [{ item_id: FONT_PACK.id, item_name: FONT_PACK.name, item_category: 'AI font credits', price: FONT_PACK.amountMinor / 100, quantity: 1 }];
}
