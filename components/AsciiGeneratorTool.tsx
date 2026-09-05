'use client';

import { useMemo, useRef, useState } from 'react';
import { asciiStyleLabels, generateAsciiArt, type AsciiStyle } from '@/lib/ascii-font';

interface AsciiGeneratorToolProps {
  pageTitle: string;
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
};

const escapeXml = (value: string) =>
  value.replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character] ?? character);

export default function AsciiGeneratorTool({ pageTitle }: AsciiGeneratorToolProps) {
  const [inputText, setInputText] = useState(pageTitle.toUpperCase());
  const [style, setStyle] = useState<AsciiStyle>('block');
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');
  const [foreground, setForeground] = useState('#f8fafc');
  const [background, setBackground] = useState('#0f172a');
  const [transparent, setTransparent] = useState(false);
  const [status, setStatus] = useState('');
  const previewRef = useRef<HTMLPreElement>(null);
  const output = useMemo(() => inputText ? generateAsciiArt(inputText, style, align) : '', [inputText, style, align]);

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setStatus('ASCII art copied.');
    } catch {
      setStatus('Copy was blocked. Select the banner and copy it manually.');
    }
  };

  const exportTxt = () => {
    downloadBlob(new Blob([output], { type: 'text/plain;charset=utf-8' }), 'big-font-ascii.txt');
    setStatus('TXT downloaded.');
  };

  const createCanvas = () => {
    const lines = output.split('\n');
    const fontSize = 24;
    const lineHeight = 31;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.font = `${fontSize}px "Courier New", monospace`;
    const contentWidth = Math.max(...lines.map((line) => context.measureText(line).width), 320);
    const width = Math.ceil(contentWidth + 80);
    const height = Math.max(180, lines.length * lineHeight + 80);
    const scale = Math.min(1, 8192 / width, 8192 / height, Math.sqrt(16000000 / (width * height)));
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(height * scale);
    if (!transparent) {
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.scale(scale, scale);
    context.font = `${fontSize}px "Courier New", monospace`;
    context.textBaseline = 'top';
    context.fillStyle = foreground;
    lines.forEach((line, index) => {
      const x = 40;
      context.fillText(line, x, 40 + index * lineHeight);
    });
    return canvas;
  };

  const exportPng = () => {
    createCanvas()?.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, 'big-font-ascii.png');
        setStatus('PNG downloaded.');
      } else setStatus('PNG could not be created. Try SVG or TXT instead.');
    }, 'image/png');
  };

  const exportSvg = () => {
    const lines = output.split('\n');
    const longest = Math.max(...lines.map((line) => line.length), 20);
    const width = longest * 15 + 80;
    const height = Math.max(180, lines.length * 31 + 80);
    const anchor = 'start';
    const x = 40;
    const backgroundRect = transparent ? '' : `<rect width="100%" height="100%" fill="${background}"/>`;
    const text = lines.map((line, index) => `<text x="${x}" y="${64 + index * 31}" text-anchor="${anchor}" font-family="Courier New, monospace" font-size="24" fill="${foreground}" xml:space="preserve">${escapeXml(line || ' ')}</text>`).join('\n');
    downloadBlob(new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${backgroundRect}${text}</svg>`], { type: 'image/svg+xml;charset=utf-8' }), 'big-font-ascii.svg');
    setStatus('SVG downloaded.');
  };

  return (
    <section id="generator" aria-labelledby="ascii-generator-heading" className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-950">
      <div className="bg-slate-950 px-5 py-4 text-white sm:px-8 sm:py-5">
        <h2 id="ascii-generator-heading" className="text-xl font-bold sm:text-2xl">Generate {pageTitle.replace(/\s+Generator$/i, '')}</h2>
        <p className="mt-1.5 max-w-4xl text-sm leading-5 text-slate-300 sm:leading-6">Turn ordinary letters into genuinely oversized, multi-line ASCII art. Copy the text or export it as TXT, PNG, or SVG.</p>
      </div>
      <div className="p-5 sm:p-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <label htmlFor="ascii-input" className="text-sm font-semibold text-slate-900 dark:text-white">Text for the banner</label>
            <textarea id="ascii-input" value={inputText} onChange={(event) => setInputText(event.target.value.toUpperCase())} rows={3} maxLength={72} placeholder={pageTitle} className="mt-2 w-full resize-y rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-lg uppercase outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-900" />
            <p className="mt-2 text-xs text-slate-500">A–Z, 0–9, ! ? - . · 72 characters total. All lines are preserved; unsupported characters appear as ?.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <label htmlFor="ascii-style" className="text-xs font-semibold uppercase tracking-wide text-slate-500">ASCII style</label>
            <select id="ascii-style" value={style} onChange={(event) => setStyle(event.target.value as AsciiStyle)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950">
              {Object.entries(asciiStyleLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-slate-300 p-1 dark:border-slate-700" aria-label="Text alignment">
            {(['left', 'center', 'right'] as const).map((item) => <button key={item} type="button" aria-pressed={align === item} onClick={() => setAlign(item)} className={`min-h-11 rounded-lg px-3 py-2 text-xs font-semibold capitalize sm:min-h-0 ${align === item ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : ''}`}>{item}</button>)}
          </div>
          <label className="flex min-h-11 items-center gap-2 text-xs font-semibold sm:min-h-0">Text <input aria-label="ASCII text color" type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} className="h-11 w-12 rounded border border-slate-300 sm:h-9" /></label>
          <label className="flex min-h-11 items-center gap-2 text-xs font-semibold sm:min-h-0">Background <input aria-label="ASCII background color" type="color" value={background} disabled={transparent} onChange={(event) => setBackground(event.target.value)} className="h-11 w-12 rounded border border-slate-300 sm:h-9 disabled:opacity-40" /></label>
          <label className="flex min-h-11 items-center gap-2 text-sm font-medium sm:min-h-0"><input type="checkbox" checked={transparent} onChange={(event) => setTransparent(event.target.checked)} className="h-5 w-5" /> Transparent export</label>
          <button type="button" onClick={() => setInputText('')} className="ml-auto min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold sm:min-h-0 dark:border-slate-700">Clear</button>
        </div>

        <p className="mt-5 text-xs font-medium text-slate-500 sm:hidden">Swipe horizontally inside the preview to see the complete ASCII banner.</p>
        <div className="mt-2 overflow-auto rounded-2xl border border-slate-700 p-5 sm:mt-5" style={{ backgroundColor: background }}>
          {output ? <pre ref={previewRef} className={`min-w-max font-mono text-[10px] leading-[1.08] sm:text-xs lg:text-sm text-left`} style={{ color: foreground }}>{output}</pre> : <p className="py-14 text-center text-sm text-slate-400">Enter text to generate a large ASCII banner.</p>}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <button type="button" onClick={() => void copyOutput()} disabled={!output} className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-45">Copy ASCII</button>
          <button type="button" onClick={exportTxt} disabled={!output} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold disabled:opacity-45 dark:border-slate-700">Download TXT</button>
          <button type="button" onClick={exportPng} disabled={!output} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold disabled:opacity-45 dark:border-slate-700">Download PNG</button>
          <button type="button" onClick={exportSvg} disabled={!output} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-45 dark:bg-white dark:text-slate-950">Download SVG</button>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">ASCII output is plain text and works best in a monospace field. PNG and SVG preserve the layout for social posts and graphics.</p>
        <p className="mt-3 text-sm text-violet-700 dark:text-violet-300" aria-live="polite">{status}</p>
      </div>
    </section>
  );
}
