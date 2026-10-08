'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { FONT_PACK, availableGenerations } from '@/lib/ai-font/catalog';
import { authChangedEvent } from '@/lib/ai-font/auth-navigation';

type Services = { checkout: boolean; sandbox: boolean; provider?: 'waffo' | 'paypal' };
type Account = { user: { email: string } | null; credits: number; services: Services };
const checkoutKey = 'ai-font-studio-checkout-v1';
const action = 'inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50';

export default function PricingCheckout({ services }: { services: Services }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const requestId = useRef<string | null>(null);
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const response = await fetch('/api/ai-font/account', { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to load your account. Please reload to try again.');
        const data = await response.json();
        if (alive) { setAccount(data); setAccepted(false); setError(''); }
      } catch (err) { if (alive) setError((err as Error).message); }
      finally { if (alive) setLoaded(true); }
    };
    void refresh();
    window.addEventListener(authChangedEvent, refresh);
    return () => { alive = false; window.removeEventListener(authChangedEvent, refresh); };
  }, []);
  const current = account?.services ?? services;
  const provider = current.provider || 'paypal';
  const providerName = provider === 'waffo' ? 'Waffo' : 'PayPal';
  async function buy() {
    if (lock.current || !account?.user || !accepted || !current.checkout || account.credits < 0) return;
    lock.current = true; setBusy(true); setError('');
    try {
      if (!requestId.current) {
        try { requestId.current = sessionStorage.getItem(checkoutKey); } catch {}
        requestId.current ||= crypto.randomUUID();
      }
      try { sessionStorage.setItem(checkoutKey, requestId.current); } catch {}
      const response = await fetch('/api/ai-font/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: requestId.current, provider, packageId: FONT_PACK.id, acceptedTerms: accepted }) });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 410) { requestId.current = null; try { sessionStorage.removeItem(checkoutKey); } catch {} }
        if (response.status === 401) setAccount(null);
        throw new Error(result.error || 'Checkout could not start. Please try again.');
      }
      window.location.assign(result.approvalUrl);
    } catch (err) { setError((err as Error).message); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div className="mt-6" id="checkout">
    {!loaded ? <button className={action} disabled>Loading…</button> : error && !account ? <p role="alert" className="text-sm text-red-600">{error} <Link href="/login?next=%2Fpricing" className="underline">Log in again</Link></p> : !account?.user ? <Link href="/login?next=%2Fpricing" className={action}>Log in to purchase</Link> : <>
      <p className="mb-3 text-sm text-muted-foreground">Balance: {account.credits} credits</p>
      {account.credits < 0 ? <p className="mb-3 text-sm">Your balance needs review. <Link href="/contact" className="text-primary underline">Contact support</Link></p> : <label className="mb-4 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 h-4 w-4" checked={accepted} onChange={event => setAccepted(event.target.checked)} /><span>I agree to the <Link href="/ai-font-generator/policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">purchase terms and privacy details</Link>.</span></label>}
      <button className={action} disabled={busy || !accepted || !current.checkout || account.credits < 0} onClick={buy}>{busy ? `Opening ${providerName}…` : `Buy ${availableGenerations(FONT_PACK.credits)} generations with ${providerName}`}</button>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </>}
    {!current.checkout && <p className="mt-3 text-xs text-muted-foreground">Purchases are not available yet.</p>}
    {current.checkout && current.sandbox && <p className="mt-3 text-xs text-muted-foreground">{providerName} test mode · Use test payment details only.</p>}
  </div>;
}
