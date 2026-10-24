'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { setAnalyticsIdentity, trackLoginResult } from '@/lib/analytics/browser';
import { authChangedEvent, authReturnPath } from '@/lib/ai-font/auth-navigation';

const authConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const control = 'flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5';

function AccountIcon() {
  return <svg aria-hidden="true" className="h-5 w-5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="3.5" /><path strokeLinecap="round" d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2" /></svg>;
}

export default function AccountMenu() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ email?: string; displayName?: string; avatarUrl?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const menu = useRef<HTMLDetailsElement>(null);
  const latestRefresh = useRef(0);

  useEffect(() => {
    if (!authConfigured) return;
    let alive = true;
    async function refresh() {
      const refreshId = ++latestRefresh.current;
      try {
        const response = await fetch('/api/ai-font/auth/session', { cache: 'no-store' });
        if (!response.ok) return;
        const result = await response.json();
        if (alive && refreshId === latestRefresh.current) { setUser(result.user); setAnalyticsIdentity(result.analytics || null); trackLoginResult(result.loginEvent); }
      } catch { /* A sign-in service outage must not disrupt free tools. */ }
    }
    void refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener(authChangedEvent, refresh);
    return () => { alive = false; window.removeEventListener('focus', refresh); window.removeEventListener(authChangedEvent, refresh); };
  }, [pathname]);

  useEffect(() => {
    function close(event: Event) {
      if (menu.current && !menu.current.contains(event.target as Node)) menu.current.open = false;
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape' && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector('summary')?.focus();
      }
    }
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, []);

  async function signOut() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/ai-font/auth/signout', { method: 'POST' });
      if (!response.ok) throw new Error();
      latestRefresh.current++;
      setUser(null); setAnalyticsIdentity(null);
      window.dispatchEvent(new Event(authChangedEvent));
    } catch { setError('Could not sign out. Please try again.'); }
    finally { setBusy(false); }
  }

  if (!user) return <Link href={`/login?next=${encodeURIComponent(authReturnPath(pathname))}`} className={control} aria-label="Log in" title="Log in"><AccountIcon /><span className="hidden sm:inline">Log in</span></Link>;

  const initial = Array.from(user.displayName?.trim() || user.email?.trim() || 'U')[0].toLocaleUpperCase();

  return <details ref={menu} className="relative">
    <summary aria-label="Account" title={user.displayName || user.email || 'Account'} className="flex h-11 w-11 shrink-0 cursor-pointer list-none items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 [&::-webkit-details-marker]:hidden"><span aria-hidden="true">{initial}</span></summary>
    <div className="absolute right-0 top-full z-50 mt-3 w-56 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-lg shadow-slate-900/10">
      <div className="border-b border-slate-100 px-4 py-3.5">
        <p className="truncate text-sm font-semibold text-slate-900">{user.displayName || 'Your account'}</p>
        <p className="mt-1 truncate text-xs text-slate-500" title={user.email}>{user.email}</p>
      </div>
      <div className="space-y-1 p-2">
        <Link href="/account" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-slate-100 focus-visible:bg-slate-100" onClick={() => { if (menu.current) menu.current.open = false; }}><svg aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></svg>Account & billing</Link>
        <Link href="/ai-font-generator#my-fonts-title" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-slate-100 focus-visible:bg-slate-100" onClick={() => { if (menu.current) menu.current.open = false; }}><svg aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path strokeLinejoin="round" d="M3 7V4h7l2 3h9v13H3Z" /></svg>My fonts & purchases</Link>
      </div>
      <div className="border-t border-slate-100 p-2">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 disabled:opacity-50" disabled={busy} onClick={signOut}><svg aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M9 4H4v16h5m6-12 4 4-4 4m-7-4h11" /></svg>{busy ? 'Signing out…' : 'Sign out'}</button>
        {error && <p role="alert" className="px-3 py-2 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  </details>;
}
