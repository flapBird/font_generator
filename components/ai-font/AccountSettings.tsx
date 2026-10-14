'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { availableGenerations } from '@/lib/ai-font/catalog';
import { authChangedEvent } from '@/lib/ai-font/auth-navigation';

type Subscription = { id: string; plan_id: string; status: string; billing_interval: string; credits_per_period: number; current_period_end: string | null; cancel_requested_at: string | null };
type Account = { user: { email: string; displayName: string; avatarUrl: string | null; provider: string; createdAt: string; lastSignInAt?: string } | null; credits: number; billingRestricted?: boolean; subscriptions: Subscription[]; orders: { id: string; status: string; amount_minor: number; currency: string; credits: number }[]; creditEvents: { id: number; kind: string; delta: number; created_at: string }[] };
const button = 'min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50';
const panel = 'mt-6 rounded-2xl border border-border bg-background p-5 sm:p-7';
const eventLabels: Record<string,string> = { order: 'Pack purchase', job: 'Font generation', restore: 'Generation restored', revoke: 'Refund or reversal', billing: 'Payment credits', 'billing-refund': 'Refund or reversal', 'billing-adjustment': 'Refund or dispute adjustment' };

export default function AccountSettings() {
  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    const response = await fetch('/api/ai-font/account', { cache: 'no-store' });
    if (!response.ok) throw new Error('Your account could not load. Please try again.');
    const data = await response.json(); setAccount(data); setName(data.user?.displayName || '');
  }, []);
  useEffect(() => { const update = () => { void refresh().catch(error => setError(error.message)); }; update(); window.addEventListener(authChangedEvent, update); return () => window.removeEventListener(authChangedEvent, update); }, [refresh]);
  async function mutate(path: string, data: unknown, method = 'POST') {
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch(`/api/ai-font/${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      await refresh(); window.dispatchEvent(new Event(authChangedEvent));
      setNotice(path === 'profile' ? 'Display name saved.' : 'Cancellation requested. The billing provider will confirm the final status.');
      setConfirmId(null);
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-4xl px-5 pb-24 pt-28">
    <h1 className="text-3xl font-bold">Account & billing</h1>
    {error && <p role="alert" className="mt-5 text-red-600">{error} <button className={button} onClick={() => void refresh().then(() => setError('')).catch(err => setError(err.message))}>Retry</button></p>}
    {notice && <p role="status" className="mt-5 text-primary">{notice}</p>}
    {!account && !error && <p className="mt-5">Loading account…</p>}
    {account && !account.user && <section className={panel}><p>Sign in to manage your profile, purchases and credits.</p><Link className={`${button} mt-4 inline-block`} href="/login?next=%2Faccount">Continue to Google sign-in</Link><p className="mt-4 text-sm text-muted-foreground">Free font tools never require an account.</p></section>}
    {account?.user && <>
      <section className={panel} aria-label="Profile">
        <div className="flex items-center gap-4">
          {account.user.avatarUrl && <Image unoptimized src={account.user.avatarUrl} alt="Google account avatar" width={48} height={48} referrerPolicy="no-referrer" className="rounded-full" />}
          <div className="min-w-0"><h2 className="text-xl font-bold">Your profile</h2><p className="break-all text-sm text-muted-foreground">{account.user.email}</p></div>
        </div>
        <form className="mt-5 flex flex-wrap items-end gap-3" onSubmit={event => { event.preventDefault(); void mutate('profile', { displayName: name }, 'PATCH'); }}><label className="min-w-0 flex-1 text-sm font-semibold">Display name<input className="mt-2 block w-full rounded-lg border border-border bg-background px-3 py-3" value={name} maxLength={80} required onChange={event => setName(event.target.value)} /></label><button className={button} disabled={busy || !name.trim()}>Save name</button></form>
        <p className="mt-4 text-xs text-muted-foreground">Signed in with {account.user.provider}. Email and avatar are managed by your Google account.</p>
        <p className="mt-2 text-xs text-muted-foreground">Joined {new Date(account.user.createdAt).toLocaleDateString()}{account.user.lastSignInAt && ` · Last sign-in ${new Date(account.user.lastSignInAt).toLocaleString()}`}</p>
      </section>
      <section className={panel}><h2 className="text-xl font-bold">Your credits</h2>{(account.billingRestricted || account.credits < 0) && <p role="status" className="mt-3 text-sm">Your payment or balance needs review. New generations and purchases are paused. <Link href="/contact" className="text-primary underline">Contact support</Link></p>}<p className="mt-3 text-2xl font-semibold">{account.credits} credits</p><p className="mt-2 text-sm text-muted-foreground">Enough for {availableGenerations(account.credits)} basic English font generations. Layout edits and PNG exports use no credits.</p><Link className={`${button} mt-4 inline-block`} href="/ai-font-generator">Open my font studio</Link>
        <details className="mt-5"><summary className="cursor-pointer font-semibold">Credit activity</summary><ul className="mt-3 divide-y divide-border">{account.creditEvents.map(event => <li key={event.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>{eventLabels[event.kind] || 'Credit adjustment'} · {new Date(event.created_at).toLocaleDateString()}</span><span>{event.delta > 0 ? '+' : ''}{event.delta}</span></li>)}</ul>{!account.creditEvents.length && <p className="mt-3 text-sm">No credit activity yet.</p>}<p className="mt-2 text-xs text-muted-foreground">Showing the 30 most recent entries.</p></details>
      </section>
      <section className={panel}><h2 className="text-xl font-bold">Subscriptions</h2>{!account.subscriptions.length ? <p className="mt-3 text-sm text-muted-foreground">No subscription. Starter packs are one-time purchases with no automatic renewal.</p> : account.subscriptions.map(sub => <div key={sub.id} className="mt-4 rounded-xl border border-border p-4"><p className="font-semibold">{sub.plan_id} · {sub.status}</p><p className="mt-2 text-sm">{sub.credits_per_period} credits per paid {sub.billing_interval === 'yearly' ? 'year' : 'month'}{sub.current_period_end && ` · Period ends ${new Date(sub.current_period_end).toLocaleDateString()}`}</p>{sub.cancel_requested_at ? <p className="mt-3 text-sm">Cancellation requested. Refresh to check the latest status.</p> : ['active','pending','past_due'].includes(sub.status) && (confirmId === sub.id ? <div className="mt-3"><p className="text-sm">Request cancellation? Active subscriptions normally end at the billing period end; overdue subscriptions may end sooner. Already granted credits remain unless a payment is refunded.</p><button className={`${button} mt-3`} disabled={busy} onClick={() => void mutate('subscriptions/cancel', { id: sub.id })}>Confirm cancellation</button><button className={`${button} ml-2`} onClick={() => setConfirmId(null)}>Keep subscription</button></div> : <button className={`${button} mt-3`} onClick={() => setConfirmId(sub.id)}>Cancel subscription</button>)}</div>)}</section>
      <section className={panel}><h2 className="text-xl font-bold">Purchases</h2>{!account.orders.length && <p className="mt-3 text-sm text-muted-foreground">No purchases yet.</p>}<ul className="mt-3 divide-y divide-border">{account.orders.map(order => <li key={order.id} className="py-3 text-sm"><p>{(order.amount_minor/100).toFixed(2)} {order.currency} · {order.credits} credits · {order.status}</p><p className="mt-1 break-all text-xs text-muted-foreground">Reference: {order.id}</p></li>)}</ul><Link href="/contact" className="mt-4 inline-block text-sm text-primary underline">Contact support about a payment or account deletion</Link></section>
      <button className={`${button} mt-6`} disabled={busy} onClick={() => void refresh().catch(err => setError(err.message))}>Refresh account</button>
    </>}
  </main>;
}
