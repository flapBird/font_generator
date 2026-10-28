'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { halloweenCategories, halloweenFonts, halloweenPresets, type HalloweenPreset } from '@/lib/halloween-catalog';
import { halloweenDefaults, renderHalloween, type HalloweenSettings } from '@/lib/halloween-renderer';
import { halloweenTextCategories, halloweenTextResults } from '@/lib/halloween-text';
import { loadArtworkFont } from '@/lib/artwork-renderer';
import { useGeneratorText } from '@/lib/use-generator-text';
import TextOutputCard from './TextOutputCard';

const control = 'mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white';
const chip = (active: boolean) => `inline-flex min-h-11 items-center justify-center rounded-full border px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${active ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-orange-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'}`;
const checkerboard = { backgroundColor: '#fafafa', backgroundImage: 'conic-gradient(#e5e7eb 25%,transparent 0 50%,#e5e7eb 0 75%,transparent 0)', backgroundSize: '16px 16px' };

function useHalloweenPreview(text: string, preset: HalloweenPreset, settings: HalloweenSettings, thumbnail: boolean, active = true) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [revision, setRevision] = useState(0);
  const [rendered, setRendered] = useState('');
  const [failure, setFailure] = useState('');
  const signature = JSON.stringify([text, preset.id, settings, revision]);
  useEffect(() => {
    if (!active || text.length > 120) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        if (text.trim()) await loadArtworkFont(preset.font.id, preset.font.family, text);
        if (cancelled || !canvas.current) return;
        renderHalloween(canvas.current, text, preset, settings, thumbnail);
        setRendered(signature);
      } catch { if (!cancelled) setFailure(signature); }
    }, 160);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [text, preset, settings, thumbnail, active, signature]);
  return { canvas, ready: rendered === signature && text.length <= 120, failed: failure === signature, retry: () => setRevision((value) => value + 1) };
}

async function downloadArtwork(text: string, preset: HalloweenPreset, settings: HalloweenSettings) {
  if (!text.trim() || text.length > 120) throw new Error('Enter 1–120 characters to download artwork.');
  await loadArtworkFont(preset.font.id, preset.font.family, text);
  const canvas = document.createElement('canvas');
  renderHalloween(canvas, text, preset, settings);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('PNG export failed.')), 'image/png'));
  const url = URL.createObjectURL(blob), anchor = document.createElement('a');
  anchor.href = url; anchor.download = `halloween-${preset.id}${settings.transparent ? '-transparent' : ''}.png`; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function HalloweenArtCard({ preset, text, onCustomize }: { preset: HalloweenPreset; text: string; onCustomize: () => void }) {
  const container = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [notice, setNotice] = useState('');
  const settings = useMemo(() => halloweenDefaults(preset), [preset]);
  const preview = useHalloweenPreview(text, preset, settings, true, active);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setActive(true); observer.disconnect(); } }, { rootMargin: '160px' });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  async function download() {
    setDownloading(true); setNotice('');
    try { await downloadArtwork(text, preset, settings); setNotice('PNG downloaded'); }
    catch { setNotice('Could not download. Check your connection and try again.'); }
    finally { setDownloading(false); }
  }
  return <article ref={container} data-halloween-preset={preset.id} className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
    <button type="button" aria-label={`Customize ${preset.name}`} onClick={onCustomize} className="relative block aspect-[2/1] w-full overflow-hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-orange-400" style={{ background: preset.background }}>
      <canvas ref={preview.canvas} aria-label={`${preset.name} thumbnail`} className={`block h-full w-full ${preview.ready ? '' : 'invisible'}`} width={600} height={300} />
      {!preview.ready && <span className="absolute inset-0 flex items-center justify-center px-3 text-sm text-white"><span className="rounded-md bg-black/60 px-2 py-1">{text.length > 120 ? 'Shorten text to preview' : preview.failed ? 'Font unavailable' : active ? 'Preparing preview…' : preset.name}</span></span>}
      {preview.ready && !text.trim() && <span className="absolute inset-0 flex items-center justify-center text-sm text-white"><span className="rounded-md bg-black/60 px-2 py-1">Enter your text above</span></span>}
    </button>
    <div className="p-2 sm:p-3"><h3 className="truncate text-sm font-semibold text-slate-950 dark:text-white">{preset.name}</h3><p className="mt-0.5 truncate text-xs text-slate-500">{preset.font.family}</p>
      <div className="mt-2 flex items-center justify-between gap-1">
        <button type="button" aria-label={`Edit ${preset.name}`} onClick={onCustomize} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-orange-500 dark:text-slate-300 dark:hover:bg-slate-800"><svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 sm:hidden"><path d="m13 3 4 4-9 9-5 1 1-5L13 3Zm-1 1 4 4M3 17l5-1" /></svg><span className="hidden sm:inline">Customize</span></button>
        <button type="button" aria-label={`Download ${preset.name} PNG`} onClick={download} disabled={!preview.ready || !text.trim() || downloading} className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-orange-50 px-2 text-xs font-semibold text-orange-800 hover:bg-orange-100 focus-visible:outline-orange-500 disabled:opacity-40 dark:bg-orange-950/50 dark:text-orange-200">
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M10 2v10m-4-4 4 4 4-4M4 13v4h12v-4" /></svg>{downloading ? 'Saving…' : 'PNG'}
        </button>
      </div>
      {preview.failed && <button type="button" onClick={preview.retry} className="min-h-11 text-xs font-semibold text-orange-700">Retry font loading</button>}
      <p role="status" className={notice ? 'mt-1 text-xs text-slate-500' : 'sr-only'}>{notice}</p>
    </div>
  </article>;
}

function HalloweenEditor({ preset, text, onTextChange, onClose }: { preset: HalloweenPreset; text: string; onTextChange: (text: string) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [settings, setSettings] = useState(() => halloweenDefaults(preset));
  const [downloading, setDownloading] = useState(false);
  const [notice, setNotice] = useState('');
  const preview = useHalloweenPreview(text, preset, settings, false);
  useEffect(() => {
    const element = dialog.current, previousFocus = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow;
    element?.showModal(); document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = overflow; if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);
  const update = <K extends keyof HalloweenSettings>(key: K, value: HalloweenSettings[K]) => setSettings((valueBefore) => ({ ...valueBefore, [key]: value }));
  async function download() {
    setDownloading(true); setNotice('');
    try { await downloadArtwork(text, preset, settings); setNotice('PNG downloaded.'); }
    catch { setNotice('Could not download. Check your connection and try again.'); }
    finally { setDownloading(false); }
  }
  return <dialog ref={dialog} aria-labelledby="halloween-editor-title" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose(); } }} className="m-auto max-h-[92dvh] w-[calc(100%_-_1rem)] max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-950 shadow-2xl backdrop:bg-slate-950/70 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-950"><div><h2 id="halloween-editor-title" className="font-semibold">{preset.name}</h2><p className="text-xs text-slate-500">{preset.font.family} · PNG artwork</p></div><button autoFocus type="button" onClick={onClose} aria-label="Close artwork editor" className="flex h-11 w-11 items-center justify-center rounded-full text-2xl hover:bg-slate-100 focus-visible:outline-orange-500 dark:hover:bg-slate-800">×</button></div>
    <div data-testid="halloween-editor-controls" className="grid max-h-[calc(92dvh_-_145px)] items-start gap-4 overflow-y-auto overscroll-contain p-4 md:grid-cols-[minmax(0,1fr)_250px]">
      <div className="min-w-0 space-y-3">
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700" style={checkerboard}><canvas ref={preview.canvas} aria-label="Customized Halloween artwork" className={`block h-auto w-full ${preview.ready ? '' : 'opacity-20'}`} width={2000} height={1000} /></div>
        <p role="status" data-testid="halloween-editor-status" className="text-xs text-slate-500">{text.length > 120 ? 'Shorten your saved draft to 120 characters to render artwork.' : preview.failed ? 'The font could not load. Retry before exporting.' : !text.trim() ? 'Enter text to make artwork.' : preview.ready ? `Ready to download · ${settings.format === 'square' ? '1600 × 1600' : '2000 × 1000'} PNG` : 'Loading font and preparing preview…'}</p>
        {preview.failed && <button type="button" onClick={preview.retry} className="min-h-11 rounded-lg border border-orange-400 px-3 text-sm">Retry font loading</button>}
        <label className="block text-sm font-medium">Your text<textarea maxLength={120} rows={2} value={text} onChange={(event) => onTextChange(event.target.value)} className={control} /></label>
      </div>
      <div className="space-y-3">
        <fieldset><legend className="mb-1 text-xs font-semibold text-slate-500">Background</legend><div className="flex gap-2"><button type="button" aria-pressed={!settings.transparent} onClick={() => update('transparent', false)} className={chip(!settings.transparent)}>Theme</button><button type="button" aria-pressed={settings.transparent} onClick={() => update('transparent', true)} className={chip(settings.transparent)}>Transparent</button></div></fieldset>
        <label className="block text-sm">Canvas<select value={settings.format} onChange={(event) => update('format', event.target.value as HalloweenSettings['format'])} className={control}><option value="banner">Banner · 2000 × 1000</option><option value="square">Square · 1600 × 1600</option></select></label>
        <details><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold focus-visible:outline-orange-500">Colors & layout</summary><div className="space-y-3 pb-2">
          <div className="grid grid-cols-2 gap-2">{([['color', 'Text color'], ['accent', 'Accent color'], ['background', 'Background color'], ['outlineColor', 'Outline color']] as const).map(([key, label]) => <label key={key} className="text-xs">{label}<input type="color" value={settings[key]} onChange={(event) => update(key, event.target.value)} className={`${control} h-11`} /></label>)}</div>
          <label className="block text-sm">Text size · {settings.size}<input type="range" min={24} max={240} value={settings.size} onChange={(event) => update('size', Number(event.target.value))} className="mt-2 block w-full" /></label>
          <label className="block text-sm">Outline · {settings.outline}<input type="range" min={0} max={12} value={settings.outline} onChange={(event) => update('outline', Number(event.target.value))} className="mt-2 block w-full" /></label>
          <label className="block text-sm">Alignment<select value={settings.align} onChange={(event) => update('align', event.target.value as HalloweenSettings['align'])} className={control}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={settings.stacked} onChange={(event) => update('stacked', event.target.checked)} />Stack words on two lines</label>
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={settings.shadow} onChange={(event) => update('shadow', event.target.checked)} />Extra depth</label>
          <button type="button" onClick={() => setSettings(halloweenDefaults(preset))} className="min-h-11 text-sm font-semibold text-orange-700 dark:text-orange-300">Reset this design</button>
        </div></details>
        <p className="text-xs leading-5 text-slate-500">Latin display font; other characters may use device fallback. Long lines fit automatically. Transparent PNG keeps the lettering effects and removes the scene.</p>
        <a href={`/fonts/artwork/${preset.font.id}/LICENSE.txt`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-xs text-slate-500 underline">{preset.font.family} license</a>
      </div>
    </div>
    <div className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-3"><p className="hidden text-xs text-slate-500 sm:block">{settings.transparent ? 'Transparent' : 'Theme'} PNG · {settings.format === 'square' ? '1600 × 1600' : '2000 × 1000'}</p><button type="button" onClick={download} disabled={!preview.ready || !text.trim() || text.length > 120 || downloading} className="min-h-12 w-full rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700 focus-visible:outline-orange-500 disabled:opacity-40 sm:w-auto">{downloading ? 'Saving PNG…' : 'Download PNG'}</button></div>
      <p role="status" className={notice ? 'mt-1 text-xs text-slate-500' : 'sr-only'}>{notice}</p>
    </div>
  </dialog>;
}

export default function HalloweenGeneratorTool() {
  const [text, setText] = useGeneratorText('Happy Halloween');
  const [mode, setMode] = useState<'art' | 'text'>('art');
  const [artCategory, setArtCategory] = useState<string>('All');
  const [textCategory, setTextCategory] = useState<string>('All');
  const [selected, setSelected] = useState<HalloweenPreset | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const limit = mode === 'art' ? 120 : 1000;
  const overLimit = text.length > limit;
  const textResults = useMemo(() => halloweenTextResults(text.length > 1000 ? '' : text), [text]);
  const filteredArt = halloweenPresets.filter((preset) => artCategory === 'All' || preset.category === artCategory);
  const filteredText = textResults.filter((result) => textCategory === 'All' || result.category === textCategory);
  const changeMode = (value: 'art' | 'text') => { setMode(value); };
  return <section id="generator" aria-label="Halloween style studio" className="mt-6 rounded-3xl border border-slate-200 bg-white p-3 sm:p-6 dark:border-slate-800 dark:bg-slate-950">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-orange-700 dark:text-orange-300">Make it spooky.</p><span className="text-xs text-slate-500">12 fonts · 48 styles</span></div>
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><label htmlFor="halloween-input" className="text-sm font-semibold">Your text</label><button type="button" onClick={() => { setText(''); input.current?.focus(); }} className="min-h-11 px-2 text-sm font-medium text-orange-700 dark:text-orange-300">Clear text</button></div>
      <textarea id="halloween-input" ref={input} maxLength={limit} rows={2} value={text} onChange={(event) => setText(event.target.value)} placeholder="Your spooky message…" className={`${control} resize-y text-lg`} />
      <div className="mt-2 flex flex-wrap justify-between gap-1 text-xs text-slate-500"><span><span className="sm:hidden">Live preview</span><span className="hidden sm:inline">One message, every style. Manual line breaks welcome.</span></span><span>{text.length} / {limit}</span></div>
      {overLimit && <p role="alert" className="mt-2 text-sm text-red-700">Your saved draft exceeds {limit} characters. Shorten it for this output; nothing has been truncated.</p>}
    </div>
    <div role="tablist" aria-label="Halloween output type" className="mt-4 flex gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">{(['art', 'text'] as const).map((value) => <button key={value} type="button" id={`halloween-${value}-tab`} role="tab" aria-selected={mode === value} aria-controls={`halloween-${value}-panel`} tabIndex={mode === value ? 0 : -1} onClick={() => changeMode(value)} onKeyDown={(event) => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 'art' : event.key === 'End' ? 'text' : mode === 'art' ? 'text' : 'art'; changeMode(next); document.getElementById(`halloween-${next}-tab`)?.focus(); } }} className={`${chip(mode === value)} flex-1 !px-2 !text-xs sm:flex-none sm:!px-3 sm:!text-sm`}>{value === 'art' ? '🎨 Artwork · 24' : 'Aa Copyable text · 24'}</button>)}</div>
    {mode === 'art' ? <div id="halloween-art-panel" role="tabpanel" aria-labelledby="halloween-art-tab">
      <div className="my-4 flex flex-wrap items-center justify-between gap-3"><div role="group" aria-label="Artwork categories" className="flex flex-wrap gap-1.5">{halloweenCategories.map((category) => <button type="button" key={category} aria-pressed={artCategory === category} onClick={() => setArtCategory(category)} className={chip(artCategory === category)}>{category}</button>)}</div><span className="text-xs text-slate-500">{filteredArt.length} designs · Customize or download PNG</span></div>
      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">{filteredArt.map((preset) => <HalloweenArtCard key={preset.id} preset={preset} text={text} onCustomize={() => setSelected(preset)} />)}</div>
      <details className="mt-5 border-t border-slate-200 pt-2 dark:border-slate-800"><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">About the artwork & font licenses</summary><p className="text-sm leading-6 text-slate-500">24 original presets use 12 open-source typefaces with browser-rendered effects and scenes. PNG preserves the design; plain-text copying cannot. No font files or AI images are generated. Fonts load locally as previews enter view. Text stays in your browser.</p><div className="mt-2 flex flex-wrap gap-x-4">{halloweenFonts.map((font) => <a key={font.id} href={`/fonts/artwork/${font.id}/LICENSE.txt`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-xs text-slate-500 underline">{font.family}</a>)}</div></details>
    </div> : <div id="halloween-text-panel" role="tabpanel" aria-labelledby="halloween-text-tab">
      <div id="copyable-styles" className="my-4"><div role="group" aria-label="Text categories" className="flex flex-wrap gap-1.5">{halloweenTextCategories.map((category) => <button type="button" key={category} aria-pressed={textCategory === category} onClick={() => setTextCategory(category)} className={chip(textCategory === category)}>{category}</button>)}</div><p className="mt-3 text-xs text-slate-500">{filteredText.length} copyable styles · Tap a card to copy. Appearance varies by app.</p></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filteredText.map((result) => <TextOutputCard key={result.id} title={result.name} text={result.text} description={result.category === 'Glitch' ? 'Combining marks may render differently in each app.' : undefined} />)}</div>
    </div>}
    {selected && <HalloweenEditor key={selected.id} preset={selected} text={text} onTextChange={setText} onClose={() => setSelected(null)} />}
  </section>;
}
