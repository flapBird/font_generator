'use client';

import { useEffect, useRef, useState } from 'react';
import {
  getLetteringSettings,
  varsityConfiguration,
  letteringSizes,
  letteringTextLimit,
  type LetteringSettings,
} from '@/lib/lettering-art';
import { loadLetteringFont, renderVarsityArt } from '@/lib/lettering-art-renderer';

const panel = 'min-w-0 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:p-5';
const field = 'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

interface PreviewState {
  settings: LetteringSettings;
  text: string;
  number: string;
  attempt: number;
  status: 'ready' | 'error';
}

export default function LetteringArtworkTool() {
  const config = varsityConfiguration;
  const [text, setText] = useState(config.sample);
  const [presetIndex, setPresetIndex] = useState(0);
  const [layout, setLayout] = useState<'single' | 'jersey'>('single');
  const [jerseyNumber, setJerseyNumber] = useState('24');
  const number = layout === 'jersey' ? jerseyNumber : '';
  const hasArtwork = Boolean(text.trim() || number);
  const [settings, setSettings] = useState(() => getLetteringSettings(config.presets[0]));
  const [preview, setPreview] = useState<PreviewState>();
  const [attempt, setAttempt] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, height] = letteringSizes[settings.format];

  const current = preview?.settings === settings && preview.text === text
    && preview.number === number && preview.attempt === attempt;
  const failed = current && preview.status === 'error';
  const ready = current && preview.status === 'ready';

  useEffect(() => {
    let cancelled = false;
    const update = (status: PreviewState['status']) => {
      if (!cancelled) setPreview({ settings, text, number, attempt, status });
    };
    loadLetteringFont().then(() => {
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      renderVarsityArt(canvas, text, number, settings);
      update('ready');
    }).catch(() => update('error'));
    return () => { cancelled = true; };
  }, [attempt, number, settings, text]);

  function patch<K extends keyof LetteringSettings>(key: K, value: LetteringSettings[K]) {
    setSettings((old) => ({ ...old, [key]: value }));
    setExportError(false);
  }

  function selectPreset(index: number) {
    setPresetIndex(index);
    setSettings(({ format, transparent }) => ({
      ...getLetteringSettings(config.presets[index]),
      format,
      transparent,
    }));
    setExportError(false);
  }

  function download() {
    if (!ready || !hasArtwork || !canvasRef.current || exporting) return;
    setExporting(true);
    setExportError(false);
    canvasRef.current.toBlob((blob) => {
      setExporting(false);
      if (!blob) {
        setExportError(true);
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'varsity-lettering.png';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  }

  return (
    <section id="generator" aria-label="Varsity lettering editor" data-clarity-mask="true" className="mt-5 grid items-start gap-4 lg:grid-cols-[minmax(18rem,1fr)_minmax(0,1.65fr)] lg:gap-x-6">
      <div className={panel}>
        <fieldset className="mb-4 grid grid-cols-2 gap-2">
          <legend className="mb-2 text-sm font-bold">Lettering layout</legend>
          {(['single', 'jersey'] as const).map((option) => <button key={option} type="button" aria-pressed={layout === option}
            onClick={() => setLayout(option)}
            className="min-h-11 rounded-lg border border-slate-200 px-2 text-xs font-semibold aria-pressed:border-violet-500 aria-pressed:bg-violet-50 dark:border-slate-700 dark:aria-pressed:bg-violet-950">
            {option === 'single' ? 'Single line' : 'Name + number'}
          </button>)}
        </fieldset>
        <label htmlFor="lettering-art-input" className="mb-1 block text-sm font-semibold text-slate-950 dark:text-white">{layout === 'single' ? 'Team name or number' : 'Team name'}</label>
        <input
          id="lettering-art-input"
          className={field}
          type="text"
          maxLength={letteringTextLimit}
          placeholder="WESTFIELD"
          value={text}
          onChange={(event) => { setText(event.target.value); setExportError(false); }}
          aria-describedby="lettering-art-count"
        />
        <p id="lettering-art-count" className="mt-1 text-right text-xs tabular-nums text-slate-500">{text.length} / {letteringTextLimit}</p>
        {layout === 'jersey' && <label className="mt-2 grid gap-1 text-sm font-semibold">Jersey number
          <input className={field} inputMode="numeric" maxLength={3} value={jerseyNumber}
            onChange={(event) => setJerseyNumber(event.target.value.replace(/[^0-9]/g, ''))} />
        </label>}
      </div>

      <div className={`${panel} lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-20`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-950 dark:text-white">Preview</h2>
          <span className="text-xs tabular-nums text-slate-600 dark:text-slate-300">{width} × {height} PNG</span>
        </div>
        <div
          className="relative mx-auto max-w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900"
          style={{
            aspectRatio: `${width} / ${height}`,
            maxWidth: settings.format === 'square' ? '30rem' : undefined,
            backgroundImage: settings.transparent ? 'conic-gradient(#cbd5e1 25%, #f1f5f9 0 50%, #cbd5e1 0 75%, #f1f5f9 0)' : undefined,
            backgroundSize: '16px 16px',
          }}
        >
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            role="img"
            aria-label="Live lettering artwork"
            className={`block h-full w-full ${ready ? '' : 'invisible'}`}
          />
          {(!ready || !hasArtwork) && (
            <div role="status" className={`absolute inset-0 grid place-items-center p-4 text-center text-sm ${ready ? 'text-slate-700 [text-shadow:0_0_6px_white]' : 'text-slate-700 dark:text-slate-300'}`}>
              <span className="rounded-md bg-white/90 px-3 py-2 text-slate-700 dark:bg-slate-950/90 dark:text-slate-300">
                {failed ? 'The artwork could not be rendered.' : ready ? 'Enter text to see your artwork.' : 'Preparing preview…'}
              </span>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <input type="checkbox" checked={settings.transparent} onChange={(event) => patch('transparent', event.target.checked)} className="h-4 w-4 accent-violet-600" />
            Transparent background
          </label>
          {failed ? (
            <button type="button" onClick={() => setAttempt((previous) => previous + 1)} className="min-h-11 rounded-lg border border-violet-300 px-4 text-sm font-semibold text-violet-700 dark:text-violet-300">
              Retry preview
            </button>
          ) : (
            <button
              type="button"
              onClick={download}
              disabled={!ready || !hasArtwork || exporting}
              className="min-h-11 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting ? 'Preparing PNG…' : 'Download PNG'}
            </button>
          )}
        </div>
        {exportError && <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">The PNG could not be saved. Try downloading it again.</p>}
      </div>

      <div className={`${panel} space-y-5`}>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-950 dark:text-white">Preset</legend>
          <div className="grid grid-cols-3 gap-2">
            {config.presets.map((option, index) => (
              <button
                key={option.name}
                type="button"
                aria-pressed={index === presetIndex}
                onClick={() => selectPreset(index)}
                className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1.5 rounded-lg border p-2 text-center text-xs font-medium text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-slate-100 ${index === presetIndex ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/60' : 'border-slate-200 hover:border-violet-300 dark:border-slate-800'}`}
              >
                <span aria-hidden="true" className="h-3.5 w-8 rounded-sm" style={{ background: `linear-gradient(90deg, ${option.fill} 0 50%, ${option.outline} 50% 100%)` }} />
                <span>{option.name}</span>
              </button>
            ))}
          </div>
          <a
            className="mt-2 inline-flex min-h-8 items-center text-xs text-slate-600 underline decoration-slate-400 underline-offset-2 dark:text-slate-300"
            href="/fonts/lettering/OFL.txt"
          >
            Graduate · SIL OFL 1.1
          </a>
        </fieldset>

        <fieldset className="grid grid-cols-3 gap-2">
          <legend className="mb-2 text-sm font-semibold text-slate-950 dark:text-white">Colors</legend>
          {([{ key: 'fill', label: 'Fill' }, { key: 'outline', label: 'Outline' }, { key: 'background', label: 'Background' }] as const).map(({ key, label }) => (
            <label key={key} className="grid gap-1 text-xs font-medium text-slate-700 dark:text-slate-200">
              {label}
              <input
                type="color"
                value={settings[key]}
                disabled={key === 'background' && settings.transparent}
                onChange={(event) => patch(key, event.target.value)}
                className="min-h-11 w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-1.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
          ))}
        </fieldset>

        <div className="grid gap-2">
          {([{ key: 'curve', label: 'Arch height' }, { key: 'outlineWidth', label: 'Outline width' }] as const).map(({ key, label }) => (
            <label key={key} className="grid gap-0.5 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span className="flex justify-between gap-2"><span>{label}</span><span aria-hidden="true" className="tabular-nums">{settings[key]}%</span></span>
              <input
                type="range"
                min={0}
                max={100}
                value={settings[key]}
                onChange={(event) => patch(key, event.target.valueAsNumber)}
                className="h-9 w-full cursor-pointer accent-violet-600"
              />
            </label>
          ))}
        </div>

        <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">Canvas
          <select aria-label="Canvas" value={settings.format} className={field} onChange={(event) => patch('format', event.target.value === 'square' ? 'square' : 'banner')}>
            <option value="banner">Banner</option>
            <option value="square">Square</option>
          </select>
        </label>
      </div>
    </section>
  );
}
