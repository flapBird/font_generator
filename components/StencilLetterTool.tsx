'use client';

import { useState } from 'react';
import {
  drawStencilLetters, stencilPaperSizes, stencilPresets, stencilSvg, stencilText,
  STENCIL_INPUT_LIMIT, STENCIL_SAMPLE,
} from '@/lib/stencil-letter-art';

function downloadStencil(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function stencilPng(svg: Blob, width: number, height: number) {
  const url = URL.createObjectURL(svg);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    const ratio = 2400 / Math.max(width, height);
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error('PNG encoding failed')), 'image/png');
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

const initial = stencilPresets[0];
const primaryButton = 'inline-flex min-h-11 items-center justify-center rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50';
const secondaryButton = 'inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-violet-400 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-100 dark:hover:border-violet-500';

export default function StencilLetterTool({ pageTitle }: { pageTitle: string }) {
  const [text, setText] = useState(STENCIL_SAMPLE);
  const [preset, setPreset] = useState<(typeof stencilPresets)[number]>(initial);
  const [gap, setGap] = useState<number>(initial.gap);
  const [spacing, setSpacing] = useState<number>(initial.spacing);
  const [color, setColor] = useState<string>(initial.color);
  const [paper, setPaper] = useState<keyof typeof stencilPaperSizes>('fitted');
  const [exportingPng, setExportingPng] = useState(false);
  const [exportError, setExportError] = useState('');
  const { lines, unsupported } = stencilText(text);
  const drawing = drawStencilLetters(lines, { gap, spacing, width: preset.width, paper });

  function choosePreset(nextPreset: (typeof stencilPresets)[number]) {
    setPreset(nextPreset);
    setGap(nextPreset.gap);
    setSpacing(nextPreset.spacing);
    setColor(nextPreset.color);
  }

  async function exportArtwork(format: 'svg' | 'png') {
    if (!drawing || exportingPng) return;
    setExportError('');
    setExportingPng(format === 'png');
    try {
      const svg = new Blob([stencilSvg(drawing, color)], { type: 'image/svg+xml;charset=utf-8' });
      const output = format === 'svg' ? svg : await stencilPng(svg, drawing.width, drawing.height);
      downloadStencil(output, `stencil-letters-${preset.id}.${format}`);
    } catch {
      setExportError(`The ${format.toUpperCase()} download could not be created. Please try again.`);
    } finally {
      setExportingPng(false);
    }
  }

  return (
    <section id="generator" data-clarity-mask="true" aria-label={`${pageTitle} workspace`} className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_24px_65px_-52px_rgba(15,23,42,0.55)] sm:p-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)] lg:gap-7">
        <div className="min-w-0">
          <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
            <label htmlFor="stencil-input" className="text-sm font-bold text-slate-900 dark:text-slate-100">Your stencil text</label>
            <button type="button" onClick={() => setText('')} disabled={!text} className="min-h-11 px-1 text-sm font-semibold text-violet-700 hover:underline disabled:opacity-50 dark:text-violet-300">Clear text</button>
          </div>
          <textarea id="stencil-input" rows={3} maxLength={STENCIL_INPUT_LIMIT} value={text} onChange={(event) => setText(event.target.value)}
            placeholder="Type a short label or sign" aria-describedby="stencil-input-hint"
            className="block w-full resize-y rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-base leading-6 text-slate-950 placeholder:text-slate-500 focus:border-violet-600 focus:outline focus:outline-2 focus:outline-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
          <div className="mt-2 flex items-start justify-between gap-3 text-xs leading-5 text-slate-600 dark:text-slate-400">
            <p id="stencil-input-hint">A–Z, 0–9 and . , - / ! ? : +</p>
            <span className="shrink-0 tabular-nums">{text.length} / {STENCIL_INPUT_LIMIT}</span>
          </div>
          {unsupported.length > 0 && <p role="status" className="mt-2 text-sm text-amber-800 dark:text-amber-300">Unsupported characters are omitted from the stencil.</p>}

          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-bold text-slate-900 dark:text-slate-100">Style preset</legend>
            <div className="grid grid-cols-3 gap-2">
              {stencilPresets.map((option) => {
                const sample = drawStencilLetters(['A'], { gap: option.gap, spacing: option.spacing, width: option.width, paper: 'fitted' })!;
                return (
                  <button key={option.id} type="button" aria-pressed={preset.id === option.id} onClick={() => choosePreset(option)}
                    className="group flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-1 py-1.5 text-xs font-bold text-slate-700 hover:border-violet-400 aria-pressed:border-violet-500 aria-pressed:bg-violet-50 aria-pressed:text-violet-900 sm:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:aria-pressed:border-violet-400 dark:aria-pressed:bg-violet-950 dark:aria-pressed:text-violet-100">
                    <svg viewBox="0 0 100 120" width="25" height="29" aria-hidden="true" className="fill-violet-800 dark:fill-violet-300">
                      <path d={sample.items[0].path} transform={`translate(${(1 - option.width) * 50}, 0) scale(${option.width}, 1)`} />
                    </svg>
                    {option.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="min-w-0 lg:row-span-2">
          <div className="flex min-h-11 items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Stencil preview</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">{stencilPaperSizes[paper].label}</p>
          </div>
          <div className="grid min-h-48 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white p-3 sm:min-h-72 sm:p-4 dark:border-slate-700"
            style={{ backgroundImage: 'conic-gradient(#f1f3f6 25%, #fff 0 50%, #f1f3f6 0 75%, #fff 0)', backgroundSize: '20px 20px' }}>
            {drawing ? (
              <svg role="img" aria-label={`Stencil made from ${lines.filter(Boolean).join(' ')}`}
                viewBox={drawing.viewBox} width={drawing.width} height={drawing.height}
                className={`h-auto w-full max-w-full ${drawing.physical ? 'bg-white shadow-md' : ''}`}
                style={{ width: `min(100%, ${24 * drawing.width / drawing.height}rem)` }}>
                <g fill={color}>{drawing.items.map(({ path, transform }, index) => <path key={index} d={path} transform={transform} />)}</g>
              </svg>
            ) : <p className="rounded-md bg-white/90 px-3 py-2 text-sm text-slate-700">Enter stencil text to preview it here.</p>}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button type="button" className={primaryButton} disabled={!drawing || exportingPng} onClick={() => void exportArtwork('svg')}>Download SVG</button>
            <button type="button" className={secondaryButton} disabled={!drawing || exportingPng} onClick={() => void exportArtwork('png')}>{exportingPng ? 'Creating PNG…' : 'Download PNG'}</button>
          </div>
          {exportError && <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">{exportError}</p>}
        </div>

        <fieldset className="min-w-0 rounded-xl border border-slate-200 px-3 pb-3 pt-1 dark:border-slate-800">
          <legend className="px-1 text-sm font-bold text-slate-900 dark:text-slate-100">Adjust your stencil</legend>
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm text-slate-700 dark:text-slate-300">
              <span className="flex justify-between gap-2">Bridge width <span aria-hidden="true" className="tabular-nums text-slate-500">{gap}</span></span>
              <input type="range" min={6} max={18} value={gap} onChange={(event) => setGap(event.target.valueAsNumber)} className="h-6 w-full accent-violet-600" />
            </label>
            <label className="grid gap-1 text-sm text-slate-700 dark:text-slate-300">
              <span className="flex justify-between gap-2">Letter spacing <span aria-hidden="true" className="tabular-nums text-slate-500">{spacing}</span></span>
              <input type="range" min={12} max={40} value={spacing} onChange={(event) => setSpacing(event.target.valueAsNumber)} className="h-6 w-full accent-violet-600" />
            </label>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
              <label className="grid gap-1 text-sm text-slate-700 dark:text-slate-300">
                Print layout
                <select value={paper} onChange={(event) => setPaper(event.target.value as keyof typeof stencilPaperSizes)}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {Object.entries(stencilPaperSizes).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm text-slate-700 dark:text-slate-300">
                Ink color
                <input type="color" value={color} onChange={(event) => setColor(event.target.value)}
                  className="h-11 w-full min-w-12 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-900" />
              </label>
            </div>
          </div>
        </fieldset>
      </div>
    </section>
  );
}
