import 'server-only';

export function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing configuration: ${name}`);
  return value;
}

export function appOrigin() {
  const url = new URL(requiredEnv('AI_FONT_APP_URL'));
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
    throw new Error('AI_FONT_APP_URL must use HTTPS outside localhost.');
  }
  return url.origin;
}

export function availability() {
  const auth = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && process.env.AI_FONT_APP_URL);
  const generation = Boolean(auth && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.MIXFONT_API_KEY);
  const checkout = Boolean(generation && process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET && process.env.PAYPAL_WEBHOOK_ID && process.env.AI_FONT_CRON_SECRET);
  return { auth, generation, checkout, sandbox: process.env.PAYPAL_ENVIRONMENT !== 'live' };
}
