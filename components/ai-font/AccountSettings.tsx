'use client';
import Link from '@/components/IntentLink';
import Image from 'next/image';
import { useState } from 'react';
import { availableGenerations } from '@/lib/ai-font/catalog';
import { authChangedEvent } from '@/lib/ai-font/auth-navigation';
import { fetchAccount, useAccount } from '@/lib/ai-font/account-client';
import AccountWorkspace, { AccountLoading } from './AccountWorkspace';
import styles from './AccountWorkspace.module.css';

const eventLabels: Record<string,string> = { order: 'Pack purchase', job: 'Font generation', restore: 'Generation restored', revoke: 'Refund or reversal', billing: 'Payment credits', 'billing-refund': 'Refund or reversal', 'billing-adjustment': 'Refund or dispute adjustment' };

export default function AccountSettings() {
  const { account, loading, error: loadError, refresh } = useAccount();
  const [draft, setDraft] = useState<{ email?: string; value: string } | null>(null);
  const name = account?.user && draft && draft.email === account.user.email ? draft.value : account?.user?.displayName || '';
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [allActivity, setAllActivity] = useState(false);
  const retry = () => { setError(''); void refresh().catch(err => setError(err.message)); };
  async function mutate(path: string, data: unknown, method = 'POST') {
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch(`/api/ai-font/${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: AbortSignal.timeout(12000) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Your change could not be saved. Please try again.');
      window.dispatchEvent(new Event(authChangedEvent));
      await fetchAccount();
      setNotice(path === 'profile' ? 'Display name saved.' : 'Cancellation requested. The billing provider will confirm the final status.');
      setConfirmId(null);
    } catch (failure) { setError(failure instanceof Error && failure.name === 'TimeoutError' ? 'The request took too long. Refresh to check its status before trying again.' : (failure as Error).message); }
    finally { setBusy(false); }
  }
  const credits = account?.credits;
  const events = account?.creditEvents || [];
  const subscriptions = account?.subscriptions || [];
  return <AccountWorkspace page="account" refresh={retry} refreshing={loading || busy}>
    {(error || loadError) && <p role="alert" className={`${styles.banner} ${styles.error}`}>{error || loadError} <button className={styles.button} onClick={retry}>Retry</button></p>}
    {notice && <p role="status" className={`${styles.banner} ${styles.success}`}>{notice}</p>}
    {!account && !error && !loadError && <AccountLoading />}
    {account && !account.user && <section className={styles.empty}><h2>Your creative workspace</h2><p>Sign in to manage your profile, purchases and credits.</p><Link className={`${styles.button} ${styles.primary}`} href="/login?next=%2Faccount">Continue to Google sign-in</Link><p className="!mt-4 !mb-0">Free font tools never require an account.</p></section>}
    {account?.user && <div className={styles.stack}>
      {account.billingUnavailable && <p role="status" className={styles.banner}>Some account services are temporarily unavailable. New generations and purchases are paused. Your profile and available records are shown below. <button className={styles.button} onClick={retry}>Retry</button></p>}
      <div className={styles.grid}>
        <section className={styles.panel} aria-label="Profile">
          <div className="flex items-center gap-4">
            {account.user.avatarUrl ? <Image unoptimized src={account.user.avatarUrl} alt="Google account avatar" width={52} height={52} referrerPolicy="no-referrer" className="rounded-full" /> : <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-xl font-bold text-violet-700" aria-hidden="true">{Array.from(account.user.displayName || account.user.email || 'U')[0].toUpperCase()}</span>}
            <div className="min-w-0"><p className={styles.eyebrow}>Profile</p><h2 className="!mt-1 !text-lg">Your profile</h2><p className={`${styles.muted} break-all`}>{account.user.email}</p></div>
          </div>
          <form className="mt-7" onSubmit={event => { event.preventDefault(); void mutate('profile', { displayName: name }, 'PATCH'); }}>
            <label className="block text-xs font-semibold">Display name<input className="mt-2 block w-full rounded-xl border border-[#e5e1ee] bg-[#faf9fc] px-3 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" value={name} maxLength={80} required onChange={event => setDraft({ email: account.user?.email, value: event.target.value })} /></label>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className={styles.muted}>Your name appears in your account.</p><button className={styles.button} disabled={busy || !name.trim() || account.unavailableSections?.includes('profile')}>Save name</button></div>
          </form>
          {account.unavailableSections?.includes('profile') && <p role="status" className={`${styles.muted} mt-3`}>Your saved profile could not load. Showing your Google profile until the service recovers.</p>}
          <div className={`${styles.rule} ${styles.muted}`}><p>Signed in with {account.user.provider || 'Google'}. Email and avatar are managed by your Google account.</p>{account.user.createdAt && <p className="mt-1">Joined {new Date(account.user.createdAt).toLocaleDateString()}{account.user.lastSignInAt && ` · Last sign-in ${new Date(account.user.lastSignInAt).toLocaleDateString()}`}</p>}</div>
        </section>
        <section className={`${styles.panel} ${styles.balance}`}><p className={styles.eyebrow}>Your balance</p><h2 className="mt-2">Your credits</h2>{credits === null ? <p role="status" className={`${styles.muted} mt-6`}>Your balance could not load. Please try again.</p> : <><p className={styles.balanceNumber}>{credits}{' '}<small>credits</small></p>{!account.billingUnavailable && <p className={`${styles.muted} mt-3`}>{availableGenerations(credits ?? 0)} basic English font generations available.</p>}</>}
          {(account.billingRestricted || (credits ?? 0) < 0) && <p role="status" className="mt-4 text-xs leading-6 text-amber-800">Your payment or balance needs review. New generations and purchases are paused. <Link href="/contact" className="underline">Contact support</Link></p>}
          <div className="mt-auto pt-6">{account.billingUnavailable || account.billingRestricted || (credits ?? 0) < 0 ? <p className={styles.muted}>Purchases are paused until your account is available.</p> : <Link className={`${styles.button} ${styles.primary} w-full`} href="/pricing">Get more credits</Link>}<p className={`${styles.muted} mt-3`}>100 credits per generation. Layout edits and PNG exports use no credits.</p></div>
        </section>
      </div>
      <div className={styles.grid}>
        <section className={styles.panel}><div className="flex items-center justify-between gap-3"><h2>Purchases</h2><span className={styles.eyebrow}>Recent orders</span></div>
          {account.unavailableSections?.includes('purchases') ? <p role="status" className={`${styles.muted} mt-4`}>Purchases could not load. Please try again.</p> : !account.orders.length ? <div className="py-7"><p className="text-sm font-semibold">No purchases yet.</p><p className={`${styles.muted} mt-2`}>Your credit packs and payment records will appear here.</p></div> : <ul className="mt-3">{account.orders.slice(0,4).map(order => <li key={order.id} className={styles.row}><div><p className="font-semibold">{order.credits} credits <span className="ml-1 font-normal text-slate-400">· {order.status}</span></p><p className="mt-1 break-all text-[10px] text-slate-400">Reference: {order.id}</p></div><span className="shrink-0 font-semibold">{(order.amount_minor/100).toFixed(2)} {order.currency}</span></li>)}</ul>}
          <Link href="/my-fonts" className="mt-4 inline-block text-xs font-semibold text-violet-700">View fonts & purchase history →</Link>
        </section>
        <section className={styles.panel}><h2>Subscriptions</h2>{account.unavailableSections?.includes('subscriptions') ? <p role="status" className={`${styles.muted} mt-4`}>Subscriptions could not load. Please try again.</p> : !subscriptions.length ? <><p className="mt-6 text-sm font-semibold">No recurring charges</p><p className={`${styles.muted} mt-3`}>No subscription. Starter packs are one-time purchases with no automatic renewal.</p><p className={`${styles.rule} ${styles.muted}`}>You choose when to add more credits.</p></> : subscriptions.map(sub => <div key={sub.id} className="mt-4 rounded-xl border border-border p-4"><p className="text-sm font-semibold">{sub.plan_id} · {sub.status}</p><p className={`${styles.muted} mt-2`}>{sub.credits_per_period} credits per paid {sub.billing_interval === 'yearly' ? 'year' : 'month'}{sub.current_period_end && ` · Period ends ${new Date(sub.current_period_end).toLocaleDateString()}`}</p>{sub.cancel_requested_at ? <p className={`${styles.muted} mt-3`}>Cancellation requested. Refresh to check the latest status.</p> : ['active','pending','past_due'].includes(sub.status) && (confirmId === sub.id ? <div className="mt-3"><p className={styles.muted}>Request cancellation? Active subscriptions normally end at the billing period end; overdue subscriptions may end sooner. Already granted credits remain unless a payment is refunded.</p><button className={`${styles.button} mt-3`} disabled={busy} onClick={() => void mutate('subscriptions/cancel', { id: sub.id })}>Confirm cancellation</button><button className={`${styles.button} mt-2`} onClick={() => setConfirmId(null)}>Keep subscription</button></div> : <button className={`${styles.button} mt-3`} onClick={() => setConfirmId(sub.id)}>Cancel subscription</button>)}</div>)}</section>
      </div>
      <section className={styles.panel}><div className="flex items-center justify-between"><h2>Credit activity</h2><span className={styles.eyebrow}>Balance history</span></div><p className={`${styles.muted} mt-2`}>Showing the 30 most recent entries.</p>
        {account.unavailableSections?.includes('creditActivity') ? <p role="status" className={`${styles.muted} mt-4`}>Credit activity could not load. Please try again.</p> : !events.length ? <p className={`${styles.muted} mt-6`}>No credit activity yet.</p> : <ul className="mt-3">{events.slice(0,allActivity ? 30 : 6).map(event => <li key={event.id} className={styles.row}><div><p className="font-medium">{eventLabels[event.kind] || 'Credit adjustment'}</p><p className="mt-1 text-[10px] text-slate-400">{new Date(event.created_at).toLocaleString()}</p></div><span className={`font-semibold ${event.delta > 0 ? 'text-emerald-700' : 'text-slate-600'}`}>{event.delta > 0 ? '+' : ''}{event.delta} credits</span></li>)}</ul>}{events.length > 6 && <button className={`${styles.button} mt-4`} onClick={() => setAllActivity(!allActivity)}>{allActivity ? 'Show less activity' : 'Show all recent activity'}</button>}
      </section>
      <p className={`${styles.muted} text-center`}><Link href="/contact" className="text-violet-700 underline">Contact support about a payment or account deletion</Link></p>
    </div>}
  </AccountWorkspace>;
}
