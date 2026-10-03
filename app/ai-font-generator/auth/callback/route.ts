import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authClient } from '@/lib/ai-font/supabase';
import { appOrigin, availability } from '@/lib/ai-font/config';
import { authCallbackPath, authReturnCookie, authReturnPath } from '@/lib/ai-font/auth-navigation';

export async function GET(request: Request) {
  if (!availability().auth) return NextResponse.redirect(new URL('/login?error=unavailable', request.url));
  const params = new URL(request.url).searchParams;
  const jar = await cookies();
  const next = authReturnPath(jar.get(authReturnCookie)?.value);
  jar.set(authReturnCookie, '', { path: authCallbackPath, maxAge: 0 });
  const destination = new URL(next, appOrigin());
  const code = params.get('code');
  try {
    if (!code) throw new Error('Missing code');
    const { error } = await (await authClient()).auth.exchangeCodeForSession(code);
    if (error) throw error;
  } catch {
    destination.pathname = '/login';
    destination.searchParams.set('error', 'google');
    destination.searchParams.set('next', next);
  }
  return NextResponse.redirect(destination, { headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
}
