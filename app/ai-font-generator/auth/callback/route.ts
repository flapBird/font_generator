import { NextResponse } from 'next/server';
import { authClient } from '@/lib/ai-font/supabase';
import { appOrigin } from '@/lib/ai-font/config';

export async function GET(request: Request) {
  const destination = new URL('/ai-font-generator', appOrigin());
  const code = new URL(request.url).searchParams.get('code');
  try {
    if (!code) throw new Error('Missing code');
    const { error } = await (await authClient()).auth.exchangeCodeForSession(code);
    if (error) throw error;
  } catch { destination.searchParams.set('auth', 'error'); }
  return NextResponse.redirect(destination, { headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
}
