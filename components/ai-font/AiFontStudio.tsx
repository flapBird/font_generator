'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FONT_SAMPLES, STANDARD_FONT_CREDITS, availableGenerations, isUuid } from '@/lib/ai-font/catalog';
import FontArtwork from './FontArtwork';
import FontExamples from './FontExamples';
import { matchFontStyle } from '@/lib/ai-font/style-match';
import { unsupportedFontCharacters } from '@/lib/ai-font/font-characters';
import styles from './AiFontStudio.module.css';
import AccountWorkspace, { AccountLoading } from './AccountWorkspace';
import workspaceStyles from './AccountWorkspace.module.css';
import FontJobs from './FontJobs';
import { fetchAccount, refreshAccount, useAccount, type AccountData } from '@/lib/ai-font/account-client';

type Services = { auth: boolean; generation: boolean; checkout: boolean; sandbox: boolean; provider?: 'paypal' | 'waffo' };
type Account = AccountData;
const button = 'inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
const secondary = 'inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const field = 'w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring';
const draftKey = 'ai-font-studio-draft-v1';
const pendingJobKey = 'ai-font-studio-pending-job-v1';
const checkoutKey = 'ai-font-studio-checkout-v1';

class ApiError extends Error {
  constructor(public status: number, message: string, public retryAfterSeconds = 0, public restartAllowed = false) { super(message); }
}

async function api<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
  const response = await fetch(`/api/ai-font/${path}`, { method, credentials: 'same-origin', cache: 'no-store',
    headers: data === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) {
    const delay = Number(response.headers.get('Retry-After') || result.retryAfterSeconds);
    throw new ApiError(response.status, result.error || 'Please try again.', Number.isFinite(delay) ? Math.max(0, Math.min(300, Math.ceil(delay))) : 0, result.code === 'MODERATION_UNAVAILABLE' && result.restartAllowed === true);
  }
  return result;
}

function reviewWaitState(prompt: string, seconds: number, pending: boolean) { return { prompt, seconds, pending, retryAt: Date.now() + seconds * 1000 }; }

function saved(key: string) { try { return sessionStorage.getItem(key); } catch { return null; } }
function save(key: string, value: string | null) { try { if (value === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, value); } catch {} }

function paymentNotice(status: string, account: Account) {
  if (account.billingRestricted || (account.credits ?? 0) < 0) return 'Your payment or balance needs review. Contact support before generating another font.';
  if (status === 'paid') return 'Payment confirmed. Your account balance has been updated.';
  if (status === 'revoked') return 'This payment was refunded or reversed. Your account balance has been updated.';
  return 'Payment has not completed yet. You can check it again under Your orders.';
}

export default function AiFontStudio({ services: initialServices, libraryOnly = false }: { services: Services; libraryOnly?: boolean }) {
  const [sample, setSample] = useState<(typeof FONT_SAMPLES)[number]>(FONT_SAMPLES[0]);
  const [styleDescription, setStyleDescription] = useState('');
  const [matchNotice, setMatchNotice] = useState('');
  const [preview, setPreview] = useState('Make something yours');
  const [prompt, setPrompt] = useState<string>('');
  const { account, error: accountError, loading: accountLoading } = useAccount();
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [reviewWait, setReviewWait] = useState<ReturnType<typeof reviewWaitState> | null>(null);
  const [loadedFonts, setLoadedFonts] = useState<Record<string, { family: string; characters: string }>>({});
  const [artworkFont, setArtworkFont] = useState<{ id: string; family: string; name: string; characters: string } | null>(null);
  const actionLock = useRef(false);
  const services = account?.services ?? initialServices;
  const active = Boolean(account?.jobs.some((job) => ['reserved', 'starting', 'processing'].includes(job.status)));
  const blocked = Boolean(account?.jobs.some((job) => ['reserved', 'starting', 'processing', 'needs_review'].includes(job.status)));
  const currentReview = reviewWait?.prompt === prompt.trim() ? reviewWait : null;

  useEffect(() => {
    if (!reviewWait?.seconds) return;
    const timer = setTimeout(() => setReviewWait(current => current && { ...current, seconds: Math.max(0, Math.ceil((current.retryAt - Date.now()) / 1000)) }), 1000);
    return () => clearTimeout(timer);
  }, [reviewWait]);

  const refresh = useCallback(async () => {
    return refreshAccount();
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
        const data = await fetchAccount();
        if (!alive) return;
        const orderId = params.get('order') || saved(checkoutKey);
        if (orderId && data.user && params.get('checkout') !== 'cancel') {
          const result = await api<{ status: string }>('orders/complete', 'POST', { id: orderId });
          if (!alive) return;
          const current = await refresh();
          if (!alive) return;
          if (['paid', 'revoked'].includes(result.status)) save(checkoutKey, null);
          setNotice(paymentNotice(result.status, current));
        } else if (params.get('checkout') === 'return' && !data.user) {
          setNotice('Sign in with the same Google account to recover your purchase.');
        }
      } catch (err) { if (alive) setError((err as Error).message); }
      finally {
        if (alive) {
          setLoaded(true);
          // Remove payment/OAuth query values before further navigation.
          if (params.has('checkout') || params.has('auth')) history.replaceState(null, '', libraryOnly ? '/my-fonts' : '/ai-font-generator');
        }
      }
    }
    void initialize();
    return () => { alive = false; };
  }, [refresh, libraryOnly]);

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

  useEffect(() => {
    if (account?.user && window.location.hash === '#my-fonts-title') document.getElementById('my-fonts-title')?.scrollIntoView({ block: 'start' });
  }, [account?.user]);

  useEffect(() => {
    if (libraryOnly && artworkFont) document.getElementById('font-artwork')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [libraryOnly, artworkFont]);

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
    type Submission = { moderation?: 'pending'; retryAfterSeconds?: number; waitingToRetry?: boolean };
    let response: Submission;
    try {
      response = await api<Submission>('jobs', 'POST', request);
      for (let attempt = 0; response.moderation === 'pending'; attempt++) {
        const delay = typeof response.retryAfterSeconds === 'number' && Number.isFinite(response.retryAfterSeconds) ? Math.max(3, Math.min(300, Math.ceil(response.retryAfterSeconds))) : 4;
        if (response.waitingToRetry || delay > 10) {
          setReviewWait(reviewWaitState(request.prompt, delay, !response.waitingToRetry));
          setNotice(response.waitingToRetry ? 'Safety checks are waiting to retry after a temporary failure. No generation credits have been used.' : 'Your description is still being checked. No generation credits have been used.');
          return;
        }
        setReviewWait(reviewWaitState(request.prompt, 0, true));
        setNotice('Checking your description. No generation credits have been used.');
        if (attempt >= 4) {
          setReviewWait(reviewWaitState(request.prompt, delay, true));
          setNotice('Your description is still being checked. Check it again shortly to continue. No generation credits have been used.');
          return;
        }
        await new Promise<void>((resolve) => setTimeout(resolve, delay * 1000));
        response = await api<Submission>('jobs', 'POST', request);
      }
    } catch (failure) {
      if (failure instanceof ApiError && failure.restartAllowed) {
        save(pendingJobKey, null);
        setReviewWait(reviewWaitState(request.prompt, 0, false));
      }
      if (failure instanceof ApiError && failure.retryAfterSeconds > 0) setReviewWait(reviewWaitState(request.prompt, failure.retryAfterSeconds, false));
      throw failure;
    }
    setReviewWait(null);
    save(pendingJobKey, null);
    save(draftKey, prompt);
    await refresh();
    setNotice('Your font is on its way. It will appear in My fonts below.');
  }

  async function previewFont(id: string, name: string) {
    if (loadedFonts[id]) {
      setArtworkFont({ id, ...loadedFonts[id], name });
      document.getElementById('font-artwork')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const result = await api<{ url: string }>(`jobs/${id}/download`);
    const family = `generated-${id}`;
    let characters: string;
    try {
      const [response, { parse }] = await Promise.all([fetch(result.url), import('opentype.js')]);
      if (!response.ok) throw new Error();
      const bytes = await response.arrayBuffer();
      const parsed = parse(bytes, { lowMemory: true });
      characters = Object.entries(parsed.tables.cmap.glyphIndexMap as Record<string, number>)
        .filter(([, index]) => index > 0 && index < parsed.numGlyphs)
        .map(([code]) => String.fromCodePoint(Number(code))).join('');
      // Preview exactly the downloaded bytes; only select this font after the
      // browser has accepted it, so a failed load cannot masquerade as a result.
      const font = new FontFace(family, bytes);
      await font.load();
      document.fonts.add(font);
    } catch { throw new Error('Your font preview could not load. Please try again.'); }
    setLoadedFonts((current) => ({ ...current, [id]: { family, characters } }));
    setArtworkFont({ id, family, name, characters });
    document.getElementById('font-artwork')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const canGenerate = loaded && Boolean(account?.user) && (account?.credits ?? 0) >= STANDARD_FONT_CREDITS && services.generation && !account?.billingRestricted && !account?.billingUnavailable && account?.credits !== null && !blocked && !busy && !(currentReview && currentReview.seconds > 0) && prompt.trim().length >= 10;

  const refreshLibrary = () => act('refresh', async () => { if (active && !account?.billingUnavailable) await api('jobs', 'PATCH'); await refresh(); });
  const library = account?.user && <section className={libraryOnly ? 'mt-8' : 'mt-10'} aria-labelledby="my-fonts-title">
    <div className="flex items-center justify-between gap-3"><h2 id="my-fonts-title" className="scroll-mt-28 text-lg font-bold">My fonts</h2>{!libraryOnly && <button className={secondary} disabled={Boolean(busy)} onClick={refreshLibrary}>Refresh</button>}</div>
    <p className="mt-2 text-xs text-muted-foreground">Your 50 most recent generations. Open any task to see its status and details.</p>
    {account.unavailableSections?.includes('fonts') ? <p role="alert" className={workspaceStyles.banner}>Your fonts could not load. Please try Refresh again.</p> : <FontJobs jobs={account.jobs} busy={Boolean(busy)}
      preview={job => { void act(`preview-${job.id}`, () => previewFont(job.id, job.name || 'Custom English font')); }}
      download={job => { void act(`download-${job.id}`, async () => { const result = await api<{ url: string }>(`jobs/${job.id}/download`); window.location.assign(result.url); }); }}
      renderPreview={job => loadedFonts[job.id] && <><p className="mt-4 break-words rounded-xl bg-muted p-4 text-3xl" style={{ fontFamily: loadedFonts[job.id].family, overflowWrap: 'anywhere' }}>{preview || 'Your words here'}</p>{unsupportedFontCharacters(preview || 'Your words here', loadedFonts[job.id].characters) && <p role="status" className="mt-2 text-sm text-amber-800">This font does not include these characters; they may appear in another font: {unsupportedFontCharacters(preview || 'Your words here', loadedFonts[job.id].characters)}</p>}</>}
    />}
    {Boolean(account.creditEvents?.length) && <details className={`${workspaceStyles.panel} mt-6`}><summary className="cursor-pointer text-sm font-semibold">Credit activity</summary><p className="mt-2 text-xs text-muted-foreground">Your 30 most recent balance changes. Layout edits and exports are free.</p><ul className="mt-3">{account.creditEvents?.map(event => <li key={event.id} className={workspaceStyles.row}><span>{{ order: 'Pack purchase', job: 'Font generation', restore: 'Failed generation restored', revoke: 'Payment refund or reversal', billing: 'Payment credits', 'billing-refund': 'Payment refund or reversal', 'billing-adjustment': 'Refund or dispute adjustment' }[event.kind] || 'Credit adjustment'} · {new Date(event.created_at).toLocaleDateString()}</span><span className={event.delta > 0 ? 'text-emerald-700 font-semibold' : ''}>{event.delta > 0 ? '+' : ''}{event.delta} credits</span></li>)}</ul></details>}
    {account.orders.length > 0 && <details className={`${workspaceStyles.panel} mt-6`}><summary className="cursor-pointer text-sm font-semibold">Your orders</summary><ul className="mt-4">{account.orders.map(order => <li key={order.id} className={workspaceStyles.row}><span>{order.credits} credits · {(order.amount_minor / 100).toFixed(2)} {order.currency} · {order.status}</span>{order.status === 'pending' && <button className={secondary} disabled={Boolean(busy)} onClick={() => act(`order-${order.id}`, async () => { const result = await api<{ status: string }>('orders/complete', 'POST', { id: order.id }); const current = await refresh(); setNotice(paymentNotice(result.status, current)); if (['paid', 'revoked'].includes(result.status)) save(checkoutKey, null); })}>Check payment</button>}</li>)}</ul></details>}
  </section>;

  if (libraryOnly) return <AccountWorkspace page="fonts" refreshing={Boolean(busy) || accountLoading} refresh={refreshLibrary}>
    {(error || accountError) && <p role="alert" className={`${workspaceStyles.banner} ${workspaceStyles.error}`}>{error || accountError} <button className={workspaceStyles.button} onClick={() => act('refresh', async () => { await refresh(); })}>Try again</button></p>}
    {!account && !accountError && !error && <AccountLoading fonts />}
    {account && !account.user && <div className={workspaceStyles.empty}><h2>A home for your custom fonts</h2><p>Sign in to view your saved fonts and purchases.</p><Link className={`${workspaceStyles.button} ${workspaceStyles.primary}`} href="/login?next=%2Fmy-fonts">Continue to Google sign-in</Link></div>}
    {account?.user && <>
      {account.billingUnavailable && <p role="status" className={workspaceStyles.banner}>Some account services are temporarily unavailable. Available saved fonts are shown below; new generations and purchases are paused.</p>}
      <div className="grid grid-cols-3 gap-3">{[
        ['Ready to use', account.unavailableSections?.includes('fonts') ? '—' : account.jobs.filter(job => job.status === 'succeeded').length],
        ['In progress', account.unavailableSections?.includes('fonts') ? '—' : account.jobs.filter(job => !['succeeded','failed'].includes(job.status)).length],
        ['Available credits', account.credits === null ? '—' : account.credits],
      ].map(([label,value]) => <div key={label} className={`${workspaceStyles.panel} !p-4 sm:!p-5`}><p className={workspaceStyles.label}>{label}</p><p className="mt-3 text-2xl font-bold tracking-tight text-violet-800">{value}</p></div>)}</div>
    </>}
    {library}
    {account?.user && account.unavailableSections?.includes('purchases') && <p role="alert" className={workspaceStyles.banner}>Your purchases could not load. Please try Refresh again.</p>}
    {account?.user && !account.orders.length && !account.unavailableSections?.includes('purchases') && <div className={`${workspaceStyles.panel} mt-6`}><h2>Purchases</h2><p className={`${workspaceStyles.muted} mt-3`}>No purchases yet. Your one-time credit packs will appear here.</p></div>}
    {notice && <p role="status" className={`${workspaceStyles.banner} ${workspaceStyles.success} mt-6`}>{notice}</p>}
    {account?.user && artworkFont && <section id="font-artwork" className={`${workspaceStyles.panel} mt-8 scroll-mt-28`} aria-label="Font preview and artwork"><label htmlFor="library-preview" className="mb-2 block font-semibold">Your preview text</label><input id="library-preview" className={field} value={preview} maxLength={100} onChange={event => setPreview(event.target.value)} /><FontArtwork family={artworkFont.family} name={artworkFont.name} reference={false} characters={artworkFont.characters} /></section>}
  </AccountWorkspace>;

  return (
    <div className={styles.page}>
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
          <button className={button} disabled={!canGenerate} onClick={() => act('generate', generate)}>{busy === 'generate' ? currentReview?.pending ? 'Checking description…' : 'Submitting request…' : currentReview?.pending ? 'Check description again' : `Generate font · ${STANDARD_FONT_CREDITS} credits`}</button>
        </div>
      </section>
      <div className={styles.accountStatus}>
        {account?.user && !account.billingUnavailable && account.credits !== null && <p className="mt-3 text-center text-xs text-muted-foreground">{availableGenerations(account.credits ?? 0)} generations available · {account.credits} credits</p>}
        <div className="mt-3 text-center text-sm" aria-live="polite">
          {!loaded ? <p className="text-muted-foreground">Checking your account…</p> : !account ? <p className="text-muted-foreground">Account unavailable. <button className="text-primary underline" onClick={() => act('refresh', async () => { await refresh(); })}>Try again</button></p> : !account.user ? <p><Link href="/login?next=%2Fai-font-generator" className="font-semibold text-primary underline" onClick={() => save(draftKey, prompt)}>Log in</Link> <span className="text-muted-foreground">and add credits to generate your font.</span></p> : busy === 'generate' ? <p className="text-muted-foreground">{currentReview?.pending ? 'Checking your description before starting a font.' : 'Submitting your request for safety checks.'}</p> : currentReview && currentReview.seconds > 0 ? <p role="status" className="text-muted-foreground">Try safety checks again in {currentReview.seconds} seconds. No generation credits have been used.</p> : currentReview ? <p className="text-muted-foreground">{currentReview.pending ? 'Your description is still being checked. Check again to continue.' : 'Safety checks were unavailable. Try again to continue.'}</p> : error ? <p className="text-muted-foreground">Your request did not complete. Review the message below before trying again.</p> : account.billingUnavailable ? <p className="text-muted-foreground">Account services are temporarily unavailable. <button className="text-primary underline" onClick={() => act('refresh', async () => { await refresh(); })}>Try again</button></p> : blocked ? <p className="text-muted-foreground">{active ? 'Your font is being generated. Check My fonts below.' : 'Your previous generation needs review. Check My fonts below.'}</p> : (account.credits ?? 0) < 0 || account.billingRestricted ? <p className="text-muted-foreground">Your payment or balance needs review. <Link href="/contact" className="text-primary underline">Contact support</Link></p> : (account.credits ?? 0) < STANDARD_FONT_CREDITS ? <p><span className="text-muted-foreground">Not enough credits. </span><Link href="/pricing" className="font-semibold text-primary underline" onClick={() => save(draftKey, prompt)}>View plans & credits</Link></p> : !services.generation ? <p className="text-muted-foreground">Font generation is temporarily unavailable.</p> : <p className="text-muted-foreground">{prompt.trim().length < 10 ? 'Enter at least 10 characters.' : 'Ready to create your font.'}</p>}
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
        <FontArtwork family={account?.user && artworkFont ? artworkFont.family : sample.family} name={account?.user && artworkFont ? artworkFont.name : sample.name} reference={!account?.user || !artworkFont} characters={account?.user && artworkFont ? artworkFont.characters : undefined} />
        {account?.user && artworkFont && <button className={`${secondary} mt-3`} onClick={() => setArtworkFont(null)}>Back to reference font</button>}
      </div>

      <div className="mt-10 grid gap-6 border-t border-border pt-7 sm:grid-cols-3">
        {[['No subscription', 'Buy a small pack for your next project.'], ['Private font library', 'Your generated files are not listed in a public gallery.'], ['Ready for your design', 'Download TTF fonts and export PNG artwork without a watermark.']].map(([title, copy]) => <div key={title}><h2 className="text-sm font-bold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p></div>)}
      </div>

      {library}

      <section className="mt-12 grid gap-6 border-t border-border pt-8 sm:grid-cols-3" aria-label="How it works">
        {[['01', 'Explore a style', 'Try your words in our free style references. No account or generation credits needed.'], ['02', 'Make it your own', 'Describe your font and sign in. Choose a credit pack on the Pricing page if you need credits.'], ['03', 'Download and create', 'Download your TTF, or use the artwork editor to create PNG posters and transparent lettering. Layout edits do not use generations.']].map(([number, title, copy]) => <div key={number}><p className="text-sm font-semibold text-primary">{number}</p><h2 className="mt-2 font-bold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p></div>)}
      </section>
      <p className="mt-8 text-sm text-muted-foreground">Just need copy-and-paste text? <Link href="/" className="text-primary underline">Use our free font generator</Link>. <Link href="/ai-font-generator/policy" className="ml-2 underline">AI font purchase terms & privacy</Link></p>
    </div>
    </div>
  );
}
