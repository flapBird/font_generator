'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { octoberArtwork } from '@/lib/october-catalog';
import { loadArtworkFont, renderArtwork, type ArtworkSettings } from '@/lib/artwork-renderer';
import { useGeneratorText } from '@/lib/use-generator-text';
import type { GeneratorPageConfig } from '@/lib/generator';
import TextOutputCard from './TextOutputCard';

const OctoberTextGeneratorTool = dynamic(() => import('./OctoberTextGeneratorTool'));

const controlClass = 'mt-2 block w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
export default function OctoberArtworkTool({ slug, pageTitle, textConfig }: { slug: string; pageTitle: string; textConfig: GeneratorPageConfig }) {
  const config = octoberArtwork[slug];
  const [text, setText] = useGeneratorText(config.sample);
  const [fontId, setFontId] = useState(config.fonts[0].id);
  const font = config.fonts.find((entry) => entry.id === fontId)!;
  const canvas = useRef<HTMLCanvasElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const [retry, setRetry] = useState(0);
  const [loaded, setLoaded] = useState('');
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const [downloadNotice, setDownloadNotice] = useState('');
  const [settings, setSettings] = useState<ArtworkSettings>({ size: 140, color: config.color, background: config.background, transparent: true, outline: 0, outlineColor: '#18181b', shadow: false, gradient: false, accent: '#a855f7', format: 'banner', align: config.direction === 'rtl' ? 'right' : 'center' });
  const expectedScript = slug === 'arabic-font-generator' ? /\p{Script=Arabic}/u : slug === 'korean-font-generator' ? /\p{Script=Hangul}/u : slug === 'chinese-font-generator' ? /\p{Script=Han}/u : null;
  const languageName = slug === 'arabic-font-generator' ? 'Arabic' : slug === 'korean-font-generator' ? 'Korean' : 'Chinese';
  const needsLanguageHint = expectedScript && text.trim() && !expectedScript.test(text);
  const overLimit = text.length > 120;
  const signature = JSON.stringify([slug, fontId, text, settings, retry]);
  const ready = loaded === signature && !overLimit && Boolean(text.trim());
  const error = failure?.key === signature ? failure.message : '';
  const update = <K extends keyof ArtworkSettings>(key: K, value: ArtworkSettings[K]) => setSettings((previous) => ({ ...previous, [key]: value }));

  useEffect(() => {
    let cancelled = false;
    const current = canvas.current;
    current?.getContext('2d')?.clearRect(0, 0, current.width, current.height);
    if (overLimit) return;
    const timeout = window.setTimeout(async () => {
      try {
        await loadArtworkFont(font.id, font.family, text);
        if (cancelled || !current) return;
        renderArtwork(current, text, font.family, config, settings);
        setLoaded(signature);
      } catch {
        if (!cancelled) setFailure({ key: signature, message: 'The selected font could not load. Check your connection and retry; export is disabled until the preview is ready.' });
      }
    }, 100);
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, [signature, config, font, overLimit, settings, text]);

  async function download() {
    const target = canvas.current;
    if (!target || !ready) return;
    setDownloadNotice('');
    try {
      const blob = await new Promise<Blob>((resolve, reject) => target.toBlob((value) => value ? resolve(value) : reject(new Error('PNG export failed')), 'image/png'));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = `${slug}-${font.id}.png`;
      link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDownloadNotice('PNG downloaded. The checkerboard is not part of the image.');
    } catch { setDownloadNotice('PNG export failed. Try again or choose another browser.'); }
  }

  return <>
    <section id="generator" aria-label={`${pageTitle} artwork workspace`} className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-950">
      <p className="mb-5 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">{config.intro}</p>
      <div className="grid items-start gap-6 lg:grid-cols-[310px_minmax(0,1fr)]">
        <div className="contents min-w-0 lg:block lg:space-y-5">
          <div className="order-first lg:order-none"><div className="flex items-center justify-between gap-2"><label htmlFor="artwork-input" className="text-sm font-semibold">Your text</label><button type="button" className="min-h-11 px-2 text-sm text-violet-700 dark:text-violet-300" onClick={() => { setText(''); input.current?.focus(); }}>Clear text</button></div>
            <textarea id="artwork-input" ref={input} lang={config.language} dir="auto" maxLength={120} rows={3} value={text} onChange={(event) => setText(event.target.value)} className={`${controlClass} resize-y text-xl`} />
            <p className="mt-2 text-xs text-slate-500">{text.length} / 120 characters · Manual line breaks supported</p>
            {needsLanguageHint && <p role="status" className="mt-2 text-sm text-slate-600 dark:text-slate-400">Enter {languageName} text to compare these typefaces, or try a sample below. Fonts style your characters; they do not translate them. Other scripts may use a fallback font.</p>}
            {overLimit && <p role="alert" className="mt-2 text-sm text-red-700">Your saved draft is longer than 120 characters. Shorten it to render artwork; nothing has been truncated.</p>}
            <div className="mt-3 flex flex-wrap gap-2">{config.samples.map((sample) => <button type="button" key={sample} onClick={() => setText(sample)} className="min-h-11 rounded-lg bg-slate-100 px-3 text-sm dark:bg-slate-900">{sample}</button>)}</div>
          </div>
          <fieldset className="order-2 lg:order-none"><legend className="text-sm font-semibold">Choose a typeface</legend><div className="mt-2 grid gap-2">{config.fonts.map((entry) => <button type="button" key={entry.id} aria-pressed={font.id === entry.id} onClick={() => setFontId(entry.id)} className={`min-h-16 rounded-xl border px-3 py-3 text-left ${font.id === entry.id ? 'border-violet-500 bg-violet-50 text-violet-950 dark:bg-violet-950 dark:text-violet-100' : 'border-slate-200 dark:border-slate-700'}`}><span className="block text-sm font-semibold">{entry.family}</span><span className="mt-1 block text-xs opacity-75">{entry.label} · {entry.coverage}</span></button>)}</div></fieldset>
          <div className="order-3 space-y-5 lg:order-none"><label className="block text-sm font-medium">Text size · {settings.size}px<input type="range" min={24} max={240} value={settings.size} onChange={(event) => update('size', Number(event.target.value))} className="mt-3 block w-full" /></label>
          <div className="grid grid-cols-2 gap-3"><label className="text-sm">Text color<input type="color" value={settings.color} onChange={(event) => update('color', event.target.value)} className={`${controlClass} h-11`} /></label><label className="text-sm">Background color<input type="color" value={settings.background} onChange={(event) => update('background', event.target.value)} className={`${controlClass} h-11`} /></label></div>
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={settings.transparent} onChange={(event) => update('transparent', event.target.checked)} />Transparent background</label>
          <div className="grid grid-cols-2 gap-3"><label className="text-sm">Canvas<select aria-label="Canvas" value={settings.format} onChange={(event) => update('format', event.target.value as ArtworkSettings['format'])} className={controlClass}><option value="banner">Banner</option><option value="square">Square</option></select></label><label className="text-sm">Alignment<select aria-label="Alignment" value={settings.align} onChange={(event) => update('align', event.target.value as ArtworkSettings['align'])} className={controlClass}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label></div>
          {config.effects && <details className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><summary className="cursor-pointer py-2 text-sm font-semibold">Outline, gradient & shadow</summary><div className="mt-3 space-y-4">
            <label className="block text-sm">Outline · {settings.outline}px<input type="range" min={0} max={12} value={settings.outline} onChange={(event) => update('outline', Number(event.target.value))} className="mt-2 block w-full" /></label>
            <label className="block text-sm">Outline / shadow color<input type="color" value={settings.outlineColor} onChange={(event) => update('outlineColor', event.target.value)} className={`${controlClass} h-11`} /></label>
            <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={settings.gradient} onChange={(event) => update('gradient', event.target.checked)} />Gradient fill</label>
            {settings.gradient && <label className="block text-sm">Gradient end color<input type="color" value={settings.accent} onChange={(event) => update('accent', event.target.value)} className={`${controlClass} h-11`} /></label>}
            <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={settings.shadow} onChange={(event) => update('shadow', event.target.checked)} />Drop shadow</label>
          </div></details>}
          </div>
        </div>
        <div className="order-1 min-w-0 space-y-4 lg:order-none lg:sticky lg:top-24">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">{font.family} preview</h2><span className="text-xs text-slate-500">{settings.format === 'banner' ? '2000 × 1000' : '1600 × 1600'} PNG</span></div>
          <div className="overflow-hidden rounded-2xl border border-slate-200" style={{ backgroundColor: '#fafafa', backgroundImage: 'conic-gradient(#e5e7eb 25%,transparent 0 50%,#e5e7eb 0 75%,transparent 0)', backgroundSize: '20px 20px' }}>
            <canvas ref={canvas} role="img" aria-label={`${font.family} artwork preview`} className="block h-auto w-full" width={2000} height={1000} />
          </div>
          <p role="status" data-testid="artwork-status" className={`text-sm ${error ? 'text-red-700' : 'text-slate-500'}`}>{error || (overLimit ? 'Shorten the draft to render artwork.' : !text.trim() ? 'Enter text to create artwork.' : ready ? 'Ready to download · Long lines are fitted automatically.' : 'Loading font and preparing preview…')}</p>
          {error && <button type="button" onClick={() => setRetry((value) => value + 1)} className="min-h-11 rounded-xl border border-violet-400 px-4">Retry font loading</button>}
          <button type="button" onClick={download} disabled={!ready} className="min-h-12 w-full rounded-xl bg-violet-600 px-5 py-3 font-bold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40">Download PNG</button>
          <p role="status" className="text-sm text-slate-500">{downloadNotice}</p>
          <p className="text-xs leading-6 text-slate-500">Font coverage: {font.coverage}. Characters outside this font may use a device fallback. Your text stays in this browser; no account or payment is needed.</p>
          <p className="text-xs text-slate-500"><a className="underline" href={`/fonts/artwork/${font.id}/LICENSE.txt`} target="_blank" rel="noreferrer">{font.family} license</a> · <Link className="underline" href="/visual-art">Browse all art generators</Link></p>
          {slug === 'halloween-font-generator' ? <a href="#copyable-styles" className="inline-flex min-h-11 items-center text-sm font-semibold text-violet-700 dark:text-violet-300">Need text for a bio? Copy Halloween text below ↓</a> : <TextOutputCard title="Original characters" text={overLimit ? '' : text} description="Copies plain text only. Use PNG to preserve the chosen typeface and colors." />}
        </div>
      </div>
    </section>
    {slug === 'halloween-font-generator' && <div className="mt-8"><OctoberTextGeneratorTool slug={slug} pageTitle={pageTitle} config={textConfig} embedded /></div>}
  </>;
}
