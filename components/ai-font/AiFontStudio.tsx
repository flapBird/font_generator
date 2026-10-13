'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FONT_SAMPLES, STANDARD_FONT_CREDITS, availableGenerations, isUuid, type FontJob } from '@/lib/ai-font/catalog';
import { authChangedEvent } from '@/lib/ai-font/auth-navigation';
import FontArtwork from './FontArtwork';
import FontExamples from './FontExamples';
import { matchFontStyle } from '@/lib/ai-font/style-match';
import styles from './AiFontStudio.module.css';

type Services = { auth: boolean; generation: boolean; checkout: boolean; sandbox: boolean; provider?: 'paypal' | 'waffo' };
type Order = { id: string; provider: string; amount_minor: number; currency: string; credits: number; status: string; created_at: string };
type Account = { user: { email: string } | null; credits: number; jobs: FontJob[]; orders: Order[]; creditEvents?: { id: number; kind: string; delta: number; created_at: string }[]; services: Services };
const button = 'inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
const secondary = 'inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const field = 'w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring';
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
  const [styleDescription, setStyleDescription] = useState('');
  const [matchNotice, setMatchNotice] = useState('');
  const [preview, setPreview] = useState('Make something yours');
  const [prompt, setPrompt] = useState<string>('');
  const [account, setAccount] = useState<Account | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loadedFonts, setLoadedFonts] = useState<Record<string, string>>({});
  const [artworkFont, setArtworkFont] = useState<{ id: string; family: string; name: string } | null>(null);
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
    const update = () => { void refresh().catch(() => {}); };
    window.addEventListener(authChangedEvent, update);
    return () => window.removeEventListener(authChangedEvent, update);
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
    try { await action(); } catch (err) { setError((err as Error).message); if (err instanceof ApiError && [401, 402, 409].includes(err.status)) await refresh().catch(() => {}); }
    finally { actionLock.current = false; setBusy(null); }
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

  async function previewFont(id: string, name: string) {
    if (loadedFonts[id]) {
      setArtworkFont({ id, family: loadedFonts[id], name });
      document.getElementById('font-artwork')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const result = await api<{ url: string }>(`jobs/${id}/download`);
    const family = `generated-${id}`;
    const font = new FontFace(family, `url(${JSON.stringify(result.url)})`);
    await font.load();
    document.fonts.add(font);
    setLoadedFonts((current) => ({ ...current, [id]: family }));
    setArtworkFont({ id, family, name });
    document.getElementById('font-artwork')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const canGenerate = loaded && Boolean(account?.user) && (account?.credits ?? 0) >= STANDARD_FONT_CREDITS && services.generation && !blocked && !busy && prompt.trim().length >= 10;

  return (
    <div className={styles.studio}>
      <header className={styles.hero}>
        <h1 className={styles.eyebrow}>AI Font Generator</h1>
        <p className={styles.headline}>Describe a font. Make it real.</p>
        <p className={styles.intro}>Create an installable English font from a text description.</p>
      </header>
      <section aria-labelledby="create-title" className={styles.generator}>
        <h2 id="create-title" className="sr-only scroll-mt-24">Create your custom font</h2>
        <label htmlFor="ai-font-prompt" className="sr-only">Font description</label>
        <textarea id="ai-font-prompt" className={styles.prompt} value={prompt} maxLength={1000} placeholder="A playful rounded typeface for a neighborhood bakery…" onChange={(event) => { setPrompt(event.target.value); save(draftKey, event.target.value); }} aria-describedby="ai-prompt-help" />
        <div className={styles.generatorBar}>
          <p id="ai-prompt-help">English · 72 glyphs · TTF <span className={styles.characterCount}>{prompt.length}/1000</span></p>
          <button className={button} disabled={!canGenerate} onClick={() => act('generate', generate)}>{busy === 'generate' ? 'Starting your font…' : `Generate font · ${STANDARD_FONT_CREDITS} credits`}</button>
        </div>
      </section>
      <div className={styles.accountStatus}>
        {account?.user && <p className="mt-3 text-center text-xs text-muted-foreground">{availableGenerations(account.credits)} generations available · {account.credits} credits</p>}
        <div className="mt-3 text-center text-sm" aria-live="polite">
          {!loaded ? <p className="text-muted-foreground">Checking your account…</p> : !account ? <p className="text-muted-foreground">Account unavailable. <button className="text-primary underline" onClick={() => act('refresh', async () => { await refresh(); })}>Try again</button></p> : !account.user ? <p><Link href="/login?next=%2Fai-font-generator" className="font-semibold text-primary underline" onClick={() => save(draftKey, prompt)}>Log in</Link> <span className="text-muted-foreground">and add credits to generate your font.</span></p> : blocked ? <p className="text-muted-foreground">{active ? 'Your font is being generated. Check My fonts below.' : 'Your previous generation needs review. Check My fonts below.'}</p> : account.credits < 0 ? <p className="text-muted-foreground">Your balance needs review. <Link href="/contact" className="text-primary underline">Contact support</Link></p> : account.credits < STANDARD_FONT_CREDITS ? <p><span className="text-muted-foreground">Not enough credits. </span><Link href="/pricing" className="font-semibold text-primary underline" onClick={() => save(draftKey, prompt)}>View plans & credits</Link></p> : !services.generation ? <p className="text-muted-foreground">Font generation is temporarily unavailable.</p> : <p className="text-muted-foreground">{prompt.trim().length < 10 ? 'Enter at least 10 characters.' : 'Ready to create your font.'}</p>}
        </div>
      </div>
      <div aria-live="polite" aria-atomic="true" className="mt-4">
        {notice && <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}
        {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p>}
      </div>
      <nav className={styles.toolLinks} aria-label="Font tools">
        <a href="#examples-title">See examples</a>
        <a href="#preview-title">Try a reference font</a>
        <a href="#font-artwork">Create artwork</a>
        {account?.user && <a href="#my-fonts-title" className={secondary}>My fonts</a>}
      </nav>
      <FontExamples onUsePrompt={(item) => {
        setSample(item); setMatchNotice(''); setPrompt(item.prompt); save(draftKey, item.prompt);
        document.getElementById('ai-font-prompt')?.focus({ preventScroll: true });
        document.getElementById('create-title')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }} />
      <section className={styles.outputs} aria-label="What you can download">
        <h2>Download a font.<br />Keep creating.</h2>
        <div><h3>TTF font file</h3><p>Install your generated font in a design app. Includes uppercase, lowercase, numbers and basic punctuation.</p></div>
        <div><h3>PNG artwork</h3><p>Make square posts, wide banners or transparent lettering. Edit and export for free.</p><a href="#font-artwork">Try the artwork editor</a></div>
      </section>
      <div className="mt-8">
        <section aria-labelledby="preview-title" className={styles.referenceSection}>

          <div className="flex items-center justify-between gap-2"><h2 id="preview-title" className="scroll-mt-24 text-xl font-bold">Try your own words</h2><span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">Free preview</span></div>
          <p className="mt-2 text-sm text-muted-foreground">Explore existing reference fonts before spending any credits.</p>
          <details className={styles.matcher}><summary>Find a reference by description</summary>
          <label htmlFor="style-description" className="mb-2 mt-5 block text-sm font-semibold">Describe a style to try for free</label>
          <input id="style-description" className={field} maxLength={240} value={styleDescription} placeholder="e.g. a retro pixel font for a game" onChange={(event) => setStyleDescription(event.target.value)} />
          <button className={`${secondary} mt-3`} disabled={!styleDescription.trim()} onClick={() => {
            const match = matchFontStyle(styleDescription);
            if (match) { setSample(match); setMatchNotice(`Matched ${match.name}, an existing reference font. Your custom font description has not changed.`); }
            else setMatchNotice('No close match in our reference set. Try words such as rounded, elegant, pixel or bold, or choose a style below.');
          }}>Match a reference style</button>
          <p className="mt-2 text-xs text-muted-foreground">Local keyword matching · No AI generation or credits used</p>
          <p role="status" className="mt-2 text-sm text-muted-foreground">{matchNotice}</p>
          </details>
          <div className={styles.styleOptions} aria-label="Style references">
            {FONT_SAMPLES.map((item) => <button key={item.id} aria-pressed={sample.id === item.id} onClick={() => { setSample(item); setMatchNotice(''); setPrompt(item.prompt); save(draftKey, item.prompt); }}><span aria-hidden="true" style={{ fontFamily: item.family }}>Aa</span>{item.name}</button>)}
          </div>
          <label htmlFor="ai-preview-text" className="mb-2 block text-sm font-semibold">Your preview text</label>
          <input id="ai-preview-text" className={field} value={preview} maxLength={100} onChange={(event) => setPreview(event.target.value)} />
          <div className={styles.previewPaper}>
            <div className={styles.previewCaption}><span>{sample.name}</span><span>Reference specimen</span></div>
            <p className="break-words text-4xl leading-tight sm:text-5xl" style={{ fontFamily: sample.family, overflowWrap: 'anywhere' }}>{preview || 'Your words here'}</p>
            <div className={styles.previewAlphabet} aria-hidden="true" style={{ fontFamily: sample.family }}>Aa Bb Cc Dd Ee Ff Gg · 0123456789</div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Style references use existing open-source fonts, not a live AI generation. Your custom result will be different. The preview text does not limit the characters in your font.</p>
        </section>

      </div>

      <div id="font-artwork" className="scroll-mt-24">
        <FontArtwork family={account?.user && artworkFont ? artworkFont.family : sample.family} name={account?.user && artworkFont ? artworkFont.name : sample.name} reference={!account?.user || !artworkFont} />
        {account?.user && artworkFont && <button className={`${secondary} mt-3`} onClick={() => setArtworkFont(null)}>Back to reference font</button>}
      </div>

      <div className="mt-10 grid gap-6 border-t border-border pt-7 sm:grid-cols-3">
        {[['No subscription', 'Buy a small pack for your next project.'], ['Private font library', 'Your generated files are not listed in a public gallery.'], ['Ready for your design', 'Download TTF fonts and export PNG artwork without a watermark.']].map(([title, copy]) => <div key={title}><h2 className="text-sm font-bold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p></div>)}
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
            {job.status === 'succeeded' && <div className="mt-4 flex flex-wrap gap-2"><button className={secondary} disabled={Boolean(busy)} onClick={() => act(`preview-${job.id}`, () => previewFont(job.id, job.name || 'Custom English font'))}>Preview & create artwork</button><button className={secondary} disabled={Boolean(busy)} onClick={() => act(`download-${job.id}`, async () => { const result = await api<{ url: string }>(`jobs/${job.id}/download`); window.location.assign(result.url); })}>Download TTF ↓</button></div>}
          </article>)}
        </div>}
        {Boolean(account.creditEvents?.length) && <details className="mt-6 rounded-2xl border border-border p-5"><summary className="cursor-pointer font-semibold">Credit activity</summary><p className="mt-2 text-xs text-muted-foreground">Your 30 most recent balance changes. Layout edits and exports are free.</p><ul className="mt-3 divide-y divide-border">{account.creditEvents?.map(event => <li key={event.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>{{ order: 'Pack purchase', job: 'Font generation', restore: 'Failed generation restored', revoke: 'Payment refund or reversal', billing: 'Payment credits', 'billing-refund': 'Payment refund or reversal' }[event.kind] || 'Credit adjustment'} · {new Date(event.created_at).toLocaleDateString()}</span><span>{event.delta > 0 ? '+' : ''}{event.delta} credits</span></li>)}</ul></details>}
        {account.orders.length > 0 && <details className="mt-6 rounded-2xl border border-border p-5"><summary className="cursor-pointer font-semibold">Your orders</summary><ul className="mt-4 divide-y divide-border">{account.orders.map((order) => <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span>{order.credits} credits · ${(order.amount_minor / 100).toFixed(2)} {order.currency} · {order.status}</span>{order.status === 'pending' && <button className={secondary} disabled={Boolean(busy)} onClick={() => act(`order-${order.id}`, async () => { const result = await api<{ status: string }>('orders/complete', 'POST', { id: order.id }); setNotice(result.status === 'paid' ? 'Payment confirmed. Your generations are ready.' : 'Payment has not completed.'); if (result.status === 'paid') save(checkoutKey, null); await refresh(); })}>Check payment</button>}</li>)}</ul></details>}
      </section>}

      <section className="mt-12 grid gap-6 border-t border-border pt-8 sm:grid-cols-3" aria-label="How it works">
        {[['01', 'Explore a style', 'Try your words in our free style references. No account or generation credits needed.'], ['02', 'Make it your own', 'Describe your font and sign in. Choose a credit pack on the Pricing page if you need credits.'], ['03', 'Download and create', 'Download your TTF, or use the artwork editor to create PNG posters and transparent lettering. Layout edits do not use generations.']].map(([number, title, copy]) => <div key={number}><p className="text-sm font-semibold text-primary">{number}</p><h2 className="mt-2 font-bold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p></div>)}
      </section>
      <p className="mt-8 text-sm text-muted-foreground">Just need copy-and-paste text? <Link href="/" className="text-primary underline">Use our free font generator</Link>. <Link href="/ai-font-generator/policy" className="ml-2 underline">AI font purchase terms & privacy</Link></p>
    </div>
  );
}
