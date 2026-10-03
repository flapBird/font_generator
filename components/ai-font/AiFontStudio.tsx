'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FONT_PACK, FONT_SAMPLES, isUuid, type FontJob } from '@/lib/ai-font/catalog';

type Services = { auth: boolean; generation: boolean; checkout: boolean; sandbox: boolean };
type Order = { id: string; provider: string; amount_minor: number; currency: string; credits: number; status: string; created_at: string };
type Account = { user: { email: string } | null; credits: number; jobs: FontJob[]; orders: Order[]; services: Services };
const button = 'inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
const secondary = 'inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const field = 'w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring';
const draftKey = 'ai-font-studio-draft-v1';
const pendingJobKey = 'ai-font-studio-pending-job-v1';
const checkoutKey = 'ai-font-studio-checkout-v1';

class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function api<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
  const response = await fetch(`/api/ai-font/${path}`, { method, credentials: 'same-origin', cache: 'no-store',
    headers: data === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new ApiError(response.status, result.error || 'Please try again.');
  return result;
}

function saved(key: string) { try { return sessionStorage.getItem(key); } catch { return null; } }
function save(key: string, value: string | null) { try { if (value === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, value); } catch {} }

const jobLabels: Record<FontJob['status'], string> = {
  reserved: 'Queued', starting: 'Starting', processing: 'Drawing your font', needs_review: 'Checking your generation', succeeded: 'Ready', failed: 'Failed · generation restored',
};

export default function AiFontStudio({ services: initialServices }: { services: Services }) {
  const [sample, setSample] = useState<(typeof FONT_SAMPLES)[number]>(FONT_SAMPLES[0]);
  const [preview, setPreview] = useState('Make something yours');
  const [prompt, setPrompt] = useState<string>(FONT_SAMPLES[0].prompt);
  const [account, setAccount] = useState<Account | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loadedFonts, setLoadedFonts] = useState<Record<string, string>>({});
  const actionLock = useRef(false);
  const services = account?.services ?? initialServices;
  const active = Boolean(account?.jobs.some((job) => ['reserved', 'starting', 'processing'].includes(job.status)));
  const blocked = Boolean(account?.jobs.some((job) => ['reserved', 'starting', 'processing', 'needs_review'].includes(job.status)));

  const refresh = useCallback(async () => {
    const data = await api<Account>('account');
    setAccount(data);
    return data;
  }, []);

  useEffect(() => {
    let alive = true;
    async function initialize() {
      const draft = saved(draftKey);
      if (draft) setPrompt(draft.slice(0, 1000));
      const params = new URLSearchParams(window.location.search);
      if (params.get('checkout') === 'return' && isUuid(params.get('order'))) save(checkoutKey, params.get('order'));
      if (params.get('auth') === 'error') setError('Google sign-in was not completed. Please try again.');
      if (params.get('checkout') === 'cancel') {
        save(checkoutKey, null);
        setNotice('Checkout was cancelled. You can return to your font whenever you like.');
      }
      try {
        const data = await api<Account>('account');
        if (!alive) return;
        setAccount(data);
        const orderId = params.get('order') || saved(checkoutKey);
        if (orderId && data.user && params.get('checkout') !== 'cancel') {
          const result = await api<{ status: string }>('orders/complete', 'POST', { id: orderId });
          if (!alive) return;
          if (result.status === 'paid') {
            save(checkoutKey, null);
            setNotice('Payment confirmed. Your font generations are ready to use.');
            await refresh();
          } else setNotice('Payment has not completed yet. You can check it again under Your orders.');
        } else if (params.get('checkout') === 'return' && !data.user) {
          setNotice('Sign in with the same Google account to recover your purchase.');
        }
      } catch (err) { if (alive) setError((err as Error).message); }
      finally {
        if (alive) {
          setLoaded(true);
          // Remove payment/OAuth query values before further navigation.
          if (params.has('checkout') || params.has('auth')) history.replaceState(null, '', '/ai-font-generator');
        }
      }
    }
    void initialize();
    return () => { alive = false; };
  }, [refresh]);

  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try { await api('jobs', 'PATCH'); if (!stopped) await refresh(); }
      catch { if (!stopped) setError('Progress could not refresh. Your saved job is safe; use Refresh below.'); }
      if (!stopped) timer = setTimeout(poll, 8000);
    }
    timer = setTimeout(poll, 5000);
    return () => { stopped = true; clearTimeout(timer); };
  }, [active, refresh]);

  async function act(name: string, action: () => Promise<void>) {
    if (actionLock.current) return;
    actionLock.current = true;
    setBusy(name); setError(''); setNotice('');
    try { await action(); } catch (err) { setError((err as Error).message); }
    finally { actionLock.current = false; setBusy(null); }
  }

  async function signIn() {
    save(draftKey, prompt);
    const { createBrowserClient } = await import('@supabase/ssr');
    const client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
    const { data, error } = await client.auth.signInWithOAuth({ provider: 'google', options: {
      redirectTo: `${window.location.origin}/ai-font-generator/auth/callback`, skipBrowserRedirect: true,
    } });
    if (error || !data.url) throw new Error('Google sign-in is temporarily unavailable.');
    window.location.assign(data.url);
  }

  async function buy() {
    save(draftKey, prompt);
    const id = saved(checkoutKey) || crypto.randomUUID();
    save(checkoutKey, id);
    try {
      const result = await api<{ approvalUrl: string }>('orders', 'POST', { id, provider: 'paypal', packageId: FONT_PACK.id, acceptedTerms: accepted });
      window.location.assign(result.approvalUrl);
    } catch (error) {
      if (error instanceof ApiError && error.status === 410) save(checkoutKey, null);
      throw error;
    }
  }

  async function generate() {
    let request = { id: crypto.randomUUID(), prompt: prompt.trim() };
    try {
      const previous = JSON.parse(saved(pendingJobKey) || 'null');
      if (previous?.prompt === request.prompt && previous?.id) request = previous;
    } catch {}
    save(pendingJobKey, JSON.stringify(request));
    await api('jobs', 'POST', request);
    save(pendingJobKey, null);
    save(draftKey, prompt);
    await refresh();
    setNotice('Your font is on its way. It will appear in My fonts below.');
  }

  async function previewFont(id: string) {
    const result = await api<{ url: string }>(`jobs/${id}/download`);
    const family = `generated-${id}`;
    const font = new FontFace(family, `url(${JSON.stringify(result.url)})`);
    await font.load();
    document.fonts.add(font);
    setLoadedFonts((current) => ({ ...current, [id]: family }));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 text-sm">
        <Link href="/" className="text-muted-foreground hover:text-primary">← Free font tools</Link>
        {account?.user && <div className="flex max-w-full items-center gap-3"><span className="truncate text-muted-foreground">{account.user.email}</span><button className={secondary} disabled={Boolean(busy)} onClick={() => act('signout', async () => { await api('auth/signout', 'POST'); save(checkoutKey, null); save(pendingJobKey, null); await refresh(); })}>Sign out</button></div>}
      </div>
      <div className="mb-10 max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">A font of your own</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">AI Font Generator</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">Turn a style you imagine into an English font you can install. Explore free style references, then create a custom TTF for your next project.</p>
      </div>

      {!services.checkout && <p className="mb-6 rounded-xl border border-border bg-muted p-4 text-sm">Custom font purchases are coming soon. You can explore the free style references below — no account needed.</p>}
      {services.checkout && services.sandbox && <p className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">Preview checkout · PayPal Sandbox only. Use a PayPal test account; no real payment will be taken.</p>}
      <div aria-live="polite" aria-atomic="true">
        {notice && <p className="mb-5 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950">{notice}</p>}
        {error && <p role="alert" className="mb-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-950">{error}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <section aria-labelledby="preview-title" className="min-w-0 rounded-2xl border border-border bg-background p-5 sm:p-7">
          <div className="flex items-center justify-between gap-2"><h2 id="preview-title" className="text-xl font-bold">Find your direction</h2><span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">Free preview</span></div>
          <p className="mt-2 text-sm text-muted-foreground">Type your words and explore a few starting points.</p>
          <div className="my-5 flex flex-wrap gap-2" aria-label="Style references">
            {FONT_SAMPLES.map((item) => <button key={item.id} aria-pressed={sample.id === item.id} className={`${secondary} ${sample.id === item.id ? 'border-primary text-primary ring-1 ring-primary' : ''}`} onClick={() => { setSample(item); setPrompt(item.prompt); save(draftKey, item.prompt); }}>{item.name}</button>)}
          </div>
          <label htmlFor="ai-preview-text" className="mb-2 block text-sm font-semibold">Your preview text</label>
          <input id="ai-preview-text" className={field} value={preview} maxLength={100} onChange={(event) => setPreview(event.target.value)} />
          <div className="mt-5 flex min-h-60 items-center justify-center overflow-hidden rounded-xl bg-violet-50 p-6 text-center text-violet-950 dark:bg-violet-950/40 dark:text-violet-100">
            <p className="break-words text-4xl leading-tight sm:text-5xl" style={{ fontFamily: sample.family, overflowWrap: 'anywhere' }}>{preview || 'Your words here'}</p>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Style references use existing open-source fonts, not a live AI generation. Your custom result will be different. The preview text does not limit the characters in your font.</p>
        </section>

        <section aria-labelledby="create-title" className="min-w-0 rounded-2xl border border-border bg-background p-5 sm:p-7">
          <h2 id="create-title" className="text-xl font-bold">Create your custom font</h2>
          <p className="mt-2 text-sm text-muted-foreground">Describe the shapes, mood, and project you have in mind.</p>
          <label htmlFor="ai-font-prompt" className="mb-2 mt-5 block text-sm font-semibold">Font description</label>
          <textarea id="ai-font-prompt" className={`${field} min-h-36 resize-y`} value={prompt} maxLength={1000} onChange={(event) => { setPrompt(event.target.value); save(draftKey, event.target.value); }} aria-describedby="ai-prompt-help" />
          <p id="ai-prompt-help" className="mt-2 text-xs text-muted-foreground">English letters, numbers and basic punctuation · 72 characters · One style · TTF</p>
          <div className="my-5 rounded-xl bg-muted p-4">
            <div className="flex items-baseline justify-between gap-3"><span className="font-semibold">{FONT_PACK.credits} font generations</span><span className="text-2xl font-bold">${(FONT_PACK.amountMinor / 100).toFixed(2)} <span className="text-xs font-normal">USD</span></span></div>
            <p className="mt-2 text-sm text-muted-foreground">One-time purchase. No subscription. Download every successful result. Commercial use included, subject to the purchase terms.</p>
          </div>
          {!account?.user ? <>
            <button className={`${button} w-full`} disabled={!loaded || !services.checkout || Boolean(busy)} onClick={() => act('signin', signIn)}>{busy === 'signin' ? 'Opening Google…' : !loaded ? 'Loading…' : !services.checkout ? 'Paid generation coming soon' : 'Continue with Google'}</button>
            <p className="mt-3 text-center text-xs text-muted-foreground">Sign in only when you want to purchase or use paid generations.</p>
          </> : <>
            <p className="mb-4 text-sm font-semibold">{Math.max(0, account.credits)} generation{account.credits === 1 ? '' : 's'} available</p>
            {account.credits < 0 && <p className="mb-3 text-sm text-red-700 dark:text-red-300">Your balance was adjusted after a payment refund or reversal. Contact support before purchasing again.</p>}
            {account.credits > 0 && <button className={`${button} mb-4 w-full`} disabled={Boolean(busy) || blocked || !services.generation || prompt.trim().length < 10} onClick={() => act('generate', generate)}>{busy === 'generate' ? 'Starting your font…' : blocked ? 'A generation is already in progress' : 'Generate font · 1 generation'}</button>}
            <label className="mb-4 flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" className="mt-1 h-4 w-4 accent-violet-600" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span>I agree to the <Link className="text-primary underline" href="/ai-font-generator/policy" target="_blank" rel="noopener noreferrer">purchase terms and privacy details</Link>.</span></label>
            <button className={`${secondary} w-full`} disabled={Boolean(busy) || !accepted || !services.checkout || account.credits < 0} onClick={() => act('checkout', buy)}>{busy === 'checkout' ? 'Opening PayPal…' : `Buy ${FONT_PACK.credits} generations with PayPal`}</button>
          </>}
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">AI results vary. Best for creative titles and display lettering. Confirmed technical failures restore your generation; changing a successful design uses another generation.</p>
        </section>
      </div>

      {account?.user && <section className="mt-10" aria-labelledby="my-fonts-title">
        <div className="mb-5 flex items-center justify-between gap-3"><h2 id="my-fonts-title" className="text-2xl font-bold">My fonts</h2><button className={secondary} disabled={Boolean(busy)} onClick={() => act('refresh', async () => { await api('jobs', 'PATCH'); await refresh(); })}>Refresh</button></div>
        {account.jobs.length === 0 ? <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Your custom fonts will be saved here. Use a paid generation whenever you are ready.</p> : <div className="grid gap-4 sm:grid-cols-2">
          {account.jobs.map((job) => <article key={job.id} className="min-w-0 rounded-2xl border border-border p-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{job.name || 'Custom English font'}</h3><span className="rounded-full bg-muted px-3 py-1 text-xs">{jobLabels[job.status]}</span></div>
            <p className="mt-3 break-words text-sm text-muted-foreground">{job.prompt}</p>
            <p className="mt-3 text-xs text-muted-foreground">{new Date(job.created_at).toLocaleDateString()} · {job.id.slice(0, 8)}</p>
            {job.status === 'needs_review' && <p className="mt-3 text-sm">We could not confirm the provider response. Your request is saved and will not be charged again automatically. <Link className="text-primary underline" href="/contact">Contact support</Link> with the reference above.</p>}
            {loadedFonts[job.id] && <p className="mt-4 break-words rounded-xl bg-muted p-4 text-3xl" style={{ fontFamily: loadedFonts[job.id], overflowWrap: 'anywhere' }}>{preview || 'Your words here'}</p>}
            {job.status === 'succeeded' && <div className="mt-4 flex flex-wrap gap-2"><button className={secondary} disabled={Boolean(busy) || Boolean(loadedFonts[job.id])} onClick={() => act(`preview-${job.id}`, () => previewFont(job.id))}>{loadedFonts[job.id] ? 'Preview loaded' : 'Preview font'}</button><button className={secondary} disabled={Boolean(busy)} onClick={() => act(`download-${job.id}`, async () => { const result = await api<{ url: string }>(`jobs/${job.id}/download`); window.location.assign(result.url); })}>Download TTF ↓</button></div>}
          </article>)}
        </div>}
        {account.orders.length > 0 && <details className="mt-6 rounded-2xl border border-border p-5"><summary className="cursor-pointer font-semibold">Your orders</summary><ul className="mt-4 divide-y divide-border">{account.orders.map((order) => <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span>{order.credits} generations · ${(order.amount_minor / 100).toFixed(2)} {order.currency} · {order.status}</span>{order.status === 'pending' && <button className={secondary} disabled={Boolean(busy)} onClick={() => act(`order-${order.id}`, async () => { const result = await api<{ status: string }>('orders/complete', 'POST', { id: order.id }); setNotice(result.status === 'paid' ? 'Payment confirmed. Your generations are ready.' : 'Payment has not completed.'); if (result.status === 'paid') save(checkoutKey, null); await refresh(); })}>Check payment</button>}</li>)}</ul></details>}
      </section>}

      <section className="mt-12 grid gap-6 border-t border-border pt-8 sm:grid-cols-3" aria-label="How it works">
        {[['01', 'Explore a style', 'Try your words in our free style references. No account or generation credits needed.'], ['02', 'Make it your own', 'Describe your font, sign in with Google, and buy a one-time generation pack.'], ['03', 'Download and create', 'Get a real TTF file for compatible design apps. Return to your account to download it again.']].map(([number, title, copy]) => <div key={number}><p className="text-sm font-semibold text-primary">{number}</p><h2 className="mt-2 font-bold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p></div>)}
      </section>
      <p className="mt-8 text-sm text-muted-foreground">Just need copy-and-paste text? <Link href="/" className="text-primary underline">Use our free font generator</Link>. <Link href="/ai-font-generator/policy" className="ml-2 underline">AI font purchase terms & privacy</Link></p>
    </div>
  );
}
