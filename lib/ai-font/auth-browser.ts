'use client';

import { authCallbackPath, authReturnCookie, authReturnPath } from './auth-navigation';

export async function signInWithGoogle(next = '/ai-font-generator') {
  const { createBrowserClient } = await import('@supabase/ssr');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Google sign-in is not available yet.');
  const client = createBrowserClient(url, key);
  const callback = new URL(authCallbackPath, window.location.origin);
  // Keep Supabase's allowlisted callback URL exact; this short-lived cookie
  // contains only a validated local page path, never credentials.
  document.cookie = `${authReturnCookie}=${authReturnPath(next)}; Path=${authCallbackPath}; Max-Age=600; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
  const { data, error } = await client.auth.signInWithOAuth({ provider: 'google', options: {
    redirectTo: callback.href, skipBrowserRedirect: true,
  } });
  if (error || !data.url) throw new Error('Google sign-in is temporarily unavailable. Please try again.');
  window.location.assign(data.url);
}
