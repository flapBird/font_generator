import 'server-only';
import { createHash } from 'node:crypto';
import { ANALYTICS_HOSTS, validContext, type AnalyticsIdentity } from './shared';
import { availability } from '../ai-font/config';
import { adminClient } from '../ai-font/supabase';

type User = { id: string; email?: string; email_confirmed_at?: string };
export function analyticsIdentity(user: User | null): AnalyticsIdentity {
  const services = availability(user);
  const internal = [process.env.AI_FONT_CHECKOUT_ALLOWLIST, process.env.GA4_INTERNAL_EMAILS].filter(Boolean).join(',')
    .split(/[,\n]/).map(email => email.trim().toLowerCase()).filter(Boolean);
  return {
    userId: user ? createHash('sha256').update(`font-generators:analytics:${user.id}`).digest('hex') : null,
    audienceType: user ? (user.email && internal.includes(user.email.toLowerCase()) ? 'internal' : 'customer') : 'anonymous',
    checkoutEligible: services.checkout, checkoutMode: process.env.AI_FONT_CHECKOUT_MODE?.trim() === 'public' ? 'public' : 'private',
    paymentProvider: services.provider, paymentEnvironment: services.sandbox ? 'test' : 'live',
  };
}
export function serverAnalyticsAvailable() {
  try {
    const url = new URL(process.env.AI_FONT_APP_URL || '');
    return Boolean(process.env.GA4_MEASUREMENT_PROTOCOL_SECRET?.trim() && url.protocol === 'https:'
      && !url.username && !url.password && !url.port && ANALYTICS_HOSTS.includes(url.hostname));
  } catch { return false; }
}
export async function attachOrderAnalytics(orderId: string, user: User, input: unknown) {
  const context = validContext(input);
  if (!context || !serverAnalyticsAvailable()) return;
  try {
    const { error } = await adminClient().rpc('ai_font_attach_analytics', {
      p_order: orderId, p_user: user.id, p_context: { ...context, ...analyticsIdentity(user) },
    }).abortSignal(AbortSignal.timeout(1_000));
    if (error) throw error;
  } catch { console.warn('analytics_context_unavailable'); }
}
