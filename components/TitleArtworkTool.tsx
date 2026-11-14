'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { TITLE_ARTWORK_INPUT_LIMIT, titleArtworkFormats, type TitleArtworkFormat, type TitleArtworkPreset, type TitleArtworkSettings } from '@/lib/title-artwork';
import { useGeneratorText } from '@/lib/use-generator-text';
import TextToolInput from './TextToolInput';

const checkerboard = {
  backgroundImage: 'conic-gradient(var(--checker-tile) 25%, var(--checker-base) 0 50%, var(--checker-tile) 0 75%, var(--checker-base) 0)',
  backgroundSize: '20px 20px',
};

type DrawArtwork<Preset> = (canvas: HTMLCanvasElement, text: string, preset: Preset, settings: TitleArtworkSettings) => void;

export default function TitleArtworkTool<Preset extends TitleArtworkPreset>({ id, name, sample, presets, loadFont, drawArtwork, children }: {
  id: string;
  name: string;
  sample: string;
  presets: readonly [Preset, ...Preset[]];
  loadFont: () => Promise<FontFace>;
  drawArtwork: DrawArtwork<Preset>;
  children?: ReactNode;
}) {
  const [text, setText] = useGeneratorText(sample);
  const initialPreset = presets[0];
  const [presetIndex, setPresetIndex] = useState(0);
  const [settings, setSettings] = useState<TitleArtworkSettings>({
    fill: initialPreset.fill, outline: initialPreset.outline, scene: initialPreset.scene, slant: initialPreset.slant,
    transparent: true, format: 'banner',
  });
  const [attempt, setAttempt] = useState(0);
  const [preview, setPreview] = useState<{ key: string; draw: DrawArtwork<Preset>; error: boolean } | null>(null);
  const [downloadError, setDownloadError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, height] = titleArtworkFormats[settings.format];
  const preset = presets[presetIndex];
  const renderKey = JSON.stringify([text, presetIndex, settings, attempt]);
  const hasText = text.trim().length > 0 && text.length <= TITLE_ARTWORK_INPUT_LIMIT;
  const currentPreview = preview?.key === renderKey && preview.draw === drawArtwork ? preview : null;
  const ready = hasText && currentPreview !== null && !currentPreview.error;
  const previewError = currentPreview?.error;

  useEffect(() => {
    if (!hasText) return;
    let cancelled = false;
    loadFont().then(() => {
      if (cancelled || !canvasRef.current) return;
      drawArtwork(canvasRef.current, text, preset, settings);
      setPreview({ key: renderKey, draw: drawArtwork, error: false });
    }).catch(() => {
      if (!cancelled) setPreview({ key: renderKey, draw: drawArtwork, error: true });
    });
    return () => { cancelled = true; };
  }, [drawArtwork, hasText, loadFont, preset, renderKey, settings, text]);

  function download() {
    if (!ready || !canvasRef.current) return;
    setDownloadError(false);
    canvasRef.current.toBlob((blob) => {
      if (!blob) { setDownloadError(true); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${id}-${preset.name.toLowerCase().replace(' ', '-')}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  }

  return (
    <section id="generator" aria-label={`${name} title artwork studio`} className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
      <div role="group" aria-label="Artwork controls" className="contents lg:col-start-1 lg:row-start-1 lg:block lg:min-w-0 lg:space-y-4">
        <div className="order-1 min-w-0 space-y-3">
          <TextToolInput id={`${id}-input`} text={text} onChange={setText} limit={TITLE_ARTWORK_INPUT_LIMIT} label="Your title" />
          <fieldset className="space-y-3 rounded-2xl border border-slate-200 p-3 sm:p-4 dark:border-slate-800">
            <legend className="px-1 text-sm font-semibold">Preset</legend>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((item, index) => (
                <button key={item.name} type="button" aria-pressed={index === presetIndex} onClick={() => {
                  setPresetIndex(index);
                  setSettings((current) => ({ ...current, fill: item.fill, outline: item.outline, scene: item.scene, slant: item.slant }));
                }} className={`min-h-14 rounded-lg border p-2 text-xs font-semibold focus-visible:outline-violet-600 ${index === presetIndex ? 'border-violet-600 bg-violet-50 text-violet-800 dark:bg-violet-950 dark:text-violet-200' : 'border-slate-200 dark:border-slate-700'}`}>
                  <span aria-hidden="true" className="mx-auto mb-1 block h-2 w-7 rounded-full" style={{ background: `linear-gradient(90deg, ${item.fill} 50%, ${item.outline} 50%)` }} />
                  {item.name}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="order-3 min-w-0 space-y-3 rounded-2xl border border-slate-200 p-3 sm:p-4 dark:border-slate-800">
          <div className="grid grid-cols-3 gap-2">
            {(['fill', 'outline', 'scene'] as const).map((color) => <label key={color} className="block text-sm capitalize">
              {color}
              <input type="color" value={settings[color]} disabled={color === 'scene' && settings.transparent}
                onChange={(event) => setSettings({ ...settings, [color]: event.target.value })} className="mt-1 h-11 w-full cursor-pointer rounded-lg disabled:opacity-40" />
            </label>)}
          </div>
          <label className="block text-sm">Slant <span className="float-right text-slate-500 dark:text-slate-400">{settings.slant}°</span>
            <input type="range" min={0} max={26} value={settings.slant} onChange={(event) => setSettings({ ...settings, slant: Number(event.target.value) })} className="mt-1 h-7 w-full accent-violet-600" />
          </label>
          <label className="block text-sm">Canvas format
            <select value={settings.format} onChange={(event) => setSettings({ ...settings, format: event.target.value as TitleArtworkFormat })} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
              <option value="banner">Banner</option><option value="square">Square</option>
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={settings.transparent} onChange={(event) => setSettings({ ...settings, transparent: event.target.checked })} className="h-4 w-4 accent-violet-600" />Transparent background
          </label>
          {children}
        </div>
      </div>

      <section aria-label="Preview and download" className="order-2 flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:col-start-2 lg:row-start-1">
        <div className={`relative min-h-0 max-h-[30rem] flex-1 bg-slate-100 dark:bg-slate-900 lg:aspect-auto lg:max-h-none ${settings.format === 'square' ? 'aspect-square' : 'aspect-[1.8]'}`}>
          <div className="absolute inset-3 flex items-center justify-center sm:inset-5">
            <canvas
              ref={canvasRef}
              aria-label={`${name} title preview`}
              width={2000}
              height={1000}
              className={`block h-auto max-h-full w-auto max-w-full flex-none rounded-lg shadow-sm ring-1 ring-slate-900/10 [--checker-base:#f8fafc] [--checker-tile:#dbe3ef] dark:ring-white/10 dark:[--checker-base:#283345] dark:[--checker-tile:#37445a] ${ready ? '' : 'invisible'}`}
              style={settings.transparent ? checkerboard : undefined}
            />
          </div>
        </div>
        <div className="border-t border-slate-200 p-3 sm:px-5 sm:py-4 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{preset.name}</p>
              <p role="status" className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{previewError ? 'The font or preview could not load.' : !hasText ? 'Enter a title to preview.' : ready ? `${width} × ${height} PNG ready` : 'Loading the preview…'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {previewError && <button type="button" onClick={() => setAttempt((value) => value + 1)} className="min-h-11 rounded-xl border px-4 text-sm font-semibold">Retry preview</button>}
              <button type="button" disabled={!ready} onClick={download} className="min-h-12 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-700 focus-visible:outline-violet-600 disabled:opacity-50">Download PNG</button>
            </div>
          </div>
          {downloadError && <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">Download failed. Try again.</p>}
        </div>
      </section>
    </section>
  );
}
