'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useGeneratorText } from '@/lib/use-generator-text';
import { discoverySamples } from '@/lib/discovery-catalog';
import { discoveryArtPresets, discoveryFonts, initialDiscoveryArtSettings, type DiscoveryArtSettings } from '@/lib/discovery-art';
import { loadDiscoveryFont, renderDiscoveryArt } from '@/lib/discovery-renderer';
import { discoveryTextResults, type DiscoveryFrame } from '@/lib/discovery-text';
import TextToolInput from './TextToolInput';
import TextOutputCard from './TextOutputCard';

const fieldClass = 'mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const buttonClass = (active: boolean) => `min-h-11 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'}`;

export default function DiscoveryArtworkTool({ slug, pageTitle }: { slug: string; pageTitle: string }) {
  const presets = discoveryArtPresets[slug];
  const [presetId, setPresetId] = useState(presets[0].id);
  const preset = presets.find((item) => item.id === presetId)!;
  const [settings, setSettings] = useState<DiscoveryArtSettings>(() => initialDiscoveryArtSettings(presets[0]));
  const [text, setText] = useGeneratorText(discoverySamples[slug]);
  const [mode, setMode] = useState<'artwork' | 'text'>('artwork');
  const [frame, setFrame] = useState<DiscoveryFrame>('none');
  const [retry, setRetry] = useState(0);
  const [status, setStatus] = useState({ key: '', error: '' });
  const [downloadError, setDownloadError] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderedKey = useRef('');
  const isNeon = slug === 'neon-font-generator';
  const isCyber = slug === 'cyberpunk-font-generator';
  const overLimit = text.length > (mode === 'artwork' ? 120 : 1000);
  const renderKey = JSON.stringify([text, presetId, settings, retry, mode]);
  const ready = mode === 'artwork' && !overLimit && !!text.trim() && status.key === renderKey && !status.error;
  const error = status.key === renderKey ? status.error : '';
  const patch = <K extends keyof DiscoveryArtSettings>(key: K, value: DiscoveryArtSettings[K]) => setSettings((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (mode !== 'artwork') return;
    let cancelled = false;
    loadDiscoveryFont(preset.font).then(() => {
      if (cancelled || !canvas.current) return;
      renderDiscoveryArt(canvas.current, text, preset, settings);
      renderedKey.current = renderKey;
      setStatus({ key: renderKey, error: '' });
    }).catch(() => { if (!cancelled) setStatus({ key: renderKey, error: 'The selected font or preview could not load. Retry before downloading.' }); });
    return () => { cancelled = true; };
  }, [mode, preset, settings, text, renderKey]);

  async function download() {
    if (!ready || !canvas.current || renderedKey.current !== renderKey) return;
    const exportKey = renderKey;
    setDownloadError('');
    try {
      const blob = await new Promise<Blob>((resolve, reject) => canvas.current!.toBlob((value) => value ? resolve(value) : reject(new Error('PNG export failed.')), 'image/png'));
      if (renderedKey.current !== exportKey) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${slug.replace('-font-generator', '')}-${preset.id}.png`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setDownloadError('Download failed. Please try again.'); }
  }

  return <section id="generator" aria-label={`${pageTitle} studio`} className="mt-7">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500">{isNeon ? 'Light up your words.' : isCyber ? 'Give your title a signal of its own.' : 'A title for your next adventure.'}</p>
      {!isNeon && <div role="tablist" aria-label="Output type" className="flex gap-2"><button type="button" role="tab" aria-selected={mode === 'artwork'} aria-controls="discovery-art-panel" id="discovery-art-tab" className={buttonClass(mode === 'artwork')} onClick={() => setMode('artwork')}>Artwork</button><button type="button" role="tab" aria-selected={mode === 'text'} aria-controls="discovery-text-panel" id="discovery-text-tab" className={buttonClass(mode === 'text')} onClick={() => setMode('text')}>Copyable text</button></div>}
    </div>
    <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="contents lg:block lg:min-w-0 lg:space-y-4">
        <div className="order-1 min-w-0">
        <TextToolInput id="discovery-art-input" text={text} onChange={setText} limit={mode === 'artwork' ? 120 : 1000} label="Your title" />
        {overLimit && <p role="alert" className="text-sm text-red-700 dark:text-red-300">This mode accepts {mode === 'artwork' ? '120' : '1,000'} characters. Shorten the input to continue; your words have not been removed.</p>}
        </div>
        {mode === 'artwork' ? <div className="order-3 space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="grid grid-cols-3 gap-3">{([['color', isNeon ? 'Tube' : 'Fill'], ['accent', isNeon ? 'Glow' : 'Accent'], ['background', 'Scene']] as const).map(([key, label]) => <label key={key} className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}<input aria-label={`${label} color`} type="color" value={settings[key]} onChange={(event) => patch(key, event.target.value)} className="mt-2 block h-11 w-full cursor-pointer rounded border border-slate-300 bg-transparent p-1" /></label>)}</div>
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={settings.transparent} onChange={(event) => patch('transparent', event.target.checked)} />Transparent background</label>
          <label className="block text-sm">{isNeon ? 'Glow strength' : isCyber ? 'Signal distortion' : 'Outline & depth'} <span className="float-right text-slate-500">{settings.strength}</span><input aria-label={isNeon ? 'Glow strength' : isCyber ? 'Signal distortion' : 'Outline and depth'} className="mt-2 h-8 w-full accent-violet-600" type="range" min={0} max={10} value={settings.strength} onChange={(event) => patch('strength', Number(event.target.value))} /></label>
          <label className="block text-sm">Text size <span className="float-right text-slate-500">{settings.size}</span><input aria-label="Text size" className="mt-2 h-8 w-full accent-violet-600" type="range" min={48} max={200} value={settings.size} onChange={(event) => patch('size', Number(event.target.value))} /></label>
          <label className="block text-sm">Letter spacing <span className="float-right text-slate-500">{settings.spacing}</span><input aria-label="Letter spacing" className="mt-2 h-8 w-full accent-violet-600" type="range" min={0} max={12} value={settings.spacing} onChange={(event) => patch('spacing', Number(event.target.value))} /></label>
          <div className="grid grid-cols-2 gap-3"><label className="text-sm">Canvas<select aria-label="Canvas" className={fieldClass} value={settings.format} onChange={(event) => patch('format', event.target.value as 'banner' | 'square')}><option value="banner">Banner</option><option value="square">Square</option></select></label><label className="text-sm">Alignment<select aria-label="Alignment" className={fieldClass} value={settings.align} onChange={(event) => patch('align', event.target.value as DiscoveryArtSettings['align'])}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label></div>
          <p className="text-xs leading-5 text-slate-500">Long lines fit automatically. Latin typefaces; other scripts may use a device fallback.</p>
        </div> : <div className="order-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><p className="text-sm leading-6 text-slate-500">These Unicode alternatives are separate from the artwork. Copying keeps the characters, not the colors, outlines or fonts.</p><fieldset className="mt-3"><legend className="mb-2 text-sm font-medium">Decoration</legend><div className="flex flex-wrap gap-2">{(['none', 'stars', 'brackets'] as const).map((value) => <button key={value} type="button" aria-pressed={frame === value} onClick={() => setFrame(value)} className={buttonClass(frame === value)}>{value === 'none' ? 'None' : value === 'stars' ? '✦ Stars' : '「」 Brackets'}</button>)}</div></fieldset></div>}
      </div>
      {mode === 'artwork' ? <div id="discovery-art-panel" role={isNeon ? undefined : 'tabpanel'} aria-labelledby={isNeon ? undefined : 'discovery-art-tab'} className="order-2 min-w-0 space-y-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-2 dark:border-slate-700 dark:bg-slate-900" style={{ backgroundImage: settings.transparent ? 'conic-gradient(#d8dce4 25%, #f1f3f7 0 50%, #d8dce4 0 75%, #f1f3f7 0)' : undefined, backgroundSize: '20px 20px' }}>
          <canvas ref={canvas} data-testid="discovery-canvas" aria-label={`${preset.name} artwork preview`} className={`block h-auto w-full rounded-xl transition-opacity ${ready ? 'opacity-100' : 'opacity-30'}`} width={2000} height={1000} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{preset.name}</p><p role="status" data-testid="discovery-status" className="mt-1 text-xs text-slate-500">{error || (overLimit ? 'Shorten the input to preview.' : !text.trim() ? 'Enter a title to preview.' : ready ? `Ready · ${settings.format === 'banner' ? '2000 × 1000' : '1600 × 1600'} PNG` : 'Loading your lettering…')}</p></div><div className="flex gap-2">{error && <button type="button" className={buttonClass(false)} onClick={() => setRetry((value) => value + 1)}>Retry preview</button>}<button type="button" onClick={() => void download()} disabled={!ready} className="min-h-12 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 focus-visible:outline-violet-500 disabled:cursor-not-allowed disabled:opacity-40">Download PNG</button></div></div>
        {downloadError && <p role="alert" className="text-sm text-red-700">{downloadError}</p>}
        <fieldset><legend className="mb-3 text-sm font-semibold">Choose a preset</legend><div className="grid grid-cols-2 gap-3">{presets.map((item) => <button key={item.id} type="button" aria-pressed={presetId === item.id} aria-label={`Choose ${item.name}`} onClick={() => { setPresetId(item.id); setSettings((current) => ({ ...current, color: item.color, accent: item.accent, background: item.background })); }} className={`min-w-0 overflow-hidden rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${presetId === item.id ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-slate-200 hover:border-violet-400 dark:border-slate-700'}`} style={{ backgroundColor: item.background }}><span className="block text-lg font-bold leading-6" style={{ color: item.color }}>{item.name}</span><span className="mt-2 block text-xs leading-5" style={{ color: item.accent }}>{item.description}</span></button>)}</div></fieldset>
        <details className="border-t border-slate-200 pt-2 text-sm leading-6 text-slate-500 dark:border-slate-800"><summary className="min-h-11 cursor-pointer py-3 font-medium">Fonts & export details</summary><p>{discoveryFonts[preset.font].label} · Latin coverage. Rendering stays in your browser. PNG preserves the preview; no SVG, font file or AI output is generated.</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">{Array.from(new Set(presets.map((item) => item.font))).map((font) => <a key={font} className="text-violet-700 underline dark:text-violet-300" href={`/fonts/discovery/${font}/LICENSE.txt`} target="_blank" rel="noreferrer">{discoveryFonts[font].label} · {discoveryFonts[font].license}</a>)}</div></details>
      </div> : <div id="discovery-text-panel" role="tabpanel" aria-labelledby="discovery-text-tab" className="order-2 min-w-0 space-y-3">{discoveryTextResults(text, slug, frame).map((result) => <TextOutputCard key={result.id} title={result.name} text={result.text} description={result.description} />)}</div>}
    </div>
    <Link href="/visual-art" className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-violet-700 dark:text-violet-300">Browse all visual generators →</Link>
  </section>;
}
