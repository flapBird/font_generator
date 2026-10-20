'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { signInWithGoogle } from '@/lib/ai-font/auth-browser';
import { authReturnPath } from '@/lib/ai-font/auth-navigation';

export default function GoogleLogin({ available }: { available: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('error');
    if (code) Promise.resolve().then(() => setError('Google sign-in was not completed. Please try again.'));
  }, []);

  async function login() {
    setBusy(true); setError('');
    try { await signInWithGoogle(authReturnPath(new URLSearchParams(window.location.search).get('next'))); }
    catch (error) { setError((error as Error).message); setBusy(false); }
  }

  return <div className="mx-auto max-w-md px-5 pb-24 pt-32">
    <div className="rounded-2xl border border-border bg-background p-6 text-center shadow-sm sm:p-8">
      <p className="text-sm font-semibold text-primary">Font Generators</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Welcome</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Sign in or create your account.</p>
      <button className="mt-7 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-border px-4 py-3 font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" disabled={!available || busy} onClick={login}>
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.3 2.9-7.4Z" /><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1H3v2.6A10 10 0 0 0 12 22Z" /><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3a10 10 0 0 0 0 9l3.4-2.6Z" /><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.5l3.4 2.6C7.2 7.8 9.4 6 12 6Z" /></svg>
        {busy ? 'Opening Google…' : 'Continue with Google'}
      </button>
      {!available && <p className="mt-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">Google sign-in is not available yet. Please try again later.</p>}
      {error && <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-300">{error}</p>}
      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">By continuing, you agree to our <Link className="underline" href="/terms">Terms</Link> and <Link className="underline" href="/privacy">Privacy Policy</Link>.</p>
    </div>
  </div>;
}
