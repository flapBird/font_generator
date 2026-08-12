'use client';

import { useMemo, useRef, useState } from 'react';
import { asciiStyleLabels, generateAsciiArt, type AsciiStyle } from '@/lib/ascii-font';

interface AsciiGeneratorToolProps {
  examples: string[];
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

export default function AsciiGeneratorTool({ examples, pageTitle }: AsciiGeneratorToolProps) {
  const [inputText, setInputText] = useState('BIG TEXT');
  const [style, setStyle] = useState<AsciiStyle>('block');
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');
  const [foreground, setForeground] = useState('#f8fafc');
  const [background, setBackground] = useState('#0f172a');
  const [transparent, setTransparent] = useState(false);
  const [status, setStatus] = useState('');
  const previewRef = useRef<HTMLPreElement>(null);
  const output = useMemo(() => inputText ? generateAsciiArt(inputText, style) : '', [inputText, style]);

  const copyOutput = async () => {
    await navigator.clipboard.writeText(output);
    setStatus('ASCII art copied.');
  };

  const exportTxt = () => downloadBlob(new Blob([output], { type: 'text/plain;charset=utf-8' }), 'big-font-ascii.txt');

  const createCanvas = () => {
    const lines = output.split('\n');
    const fontSize = 24;
    const lineHeight = 31;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.font = `${fontSize}px "Courier New", monospace`;
    const contentWidth = Math.max(...lines.map((line) => context.measureText(line).width), 320);
    canvas.width = Math.ceil(contentWidth + 80);
    canvas.height = Math.max(180, lines.length * lineHeight + 80);
    if (!transparent) {
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.font = `${fontSize}px "Courier New", monospace`;
    context.textBaseline = 'top';
    context.fillStyle = foreground;
    lines.forEach((line, index) => {
      const width = context.measureText(line).width;
      const x = align === 'center' ? (canvas.width - width) / 2 : align === 'right' ? canvas.width - width - 40 : 40;
      context.fillText(line, x, 40 + index * lineHeight);
    });
    return canvas;
  };

  const exportPng = () => {
    createCanvas()?.toBlob((blob) => {
      if (blob) downloadBlob(blob, 'big-font-ascii.png');
    }, 'image/png');
    setStatus('PNG downloaded.');
  };

  const exportSvg = () => {
    const lines = output.split('\n');
    const longest = Math.max(...lines.map((line) => line.length), 20);
    const width = longest * 15 + 80;
    const height = Math.max(180, lines.length * 31 + 80);
    const anchor = align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';
    const x = align === 'center' ? '50%' : align === 'right' ? width - 40 : 40;
    const backgroundRect = transparent ? '' : `<rect width="100%" height="100%" fill="${background}"/>`;
    const text = lines.map((line, index) => `<text x="${x}" y="${64 + index * 31}" text-anchor="${anchor}" font-family="Courier New, monospace" font-size="24" fill="${foreground}" xml:space="preserve">${escapeXml(line || ' ')}</text>`).join('\n');
    downloadBlob(new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${backgroundRect}${text}</svg>`], { type: 'image/svg+xml;charset=utf-8' }), 'big-font-ascii.svg');
    setStatus('SVG downloaded.');
  };

  const cycleExample = () => {
    const candidates = ['BIG TEXT', ...examples].filter(Boolean).map((item) => item.slice(0, 24));
    const index = candidates.indexOf(inputText);
    setInputText(candidates[(index + 1) % candidates.length] ?? 'BIG TEXT');
  };

  return (
    <section id="generator" aria-labelledby="ascii-generator-heading" className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-950">
      <div className="bg-slate-950 px-5 py-6 text-white sm:px-8 sm:py-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">ASCII &amp; giant banner text</p>
        <h2 id="ascii-generator-heading" className="mt-2 text-2xl font-bold sm:text-3xl">Generate {pageTitle.replace(/\s+Generator$/i, '')}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">Turn ordinary letters into genuinely oversized, multi-line ASCII art. Copy the text or export it as TXT, PNG, or SVG.</p>
      </div>
      <div className="p-5 sm:p-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <label htmlFor="ascii-input" className="text-sm font-semibold text-slate-900 dark:text-white">Text for the banner</label>
            <textarea id="ascii-input" value={inputText} onChange={(event) => setInputText(event.target.value.toUpperCase())} rows={3} maxLength={72} placeholder="Type up to three short lines" className="mt-2 w-full resize-y rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-lg uppercase outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-900" />
            <p className="mt-2 text-xs text-slate-500">A–Z, 0–9 and basic punctuation · up to 24 characters per line</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <label htmlFor="ascii-style" className="text-xs font-semibold uppercase tracking-wide text-slate-500">ASCII style</label>
            <select id="ascii-style" value={style} onChange={(event) => setStyle(event.target.value as AsciiStyle)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950">
              {Object.entries(asciiStyleLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
            <button type="button" onClick={cycleExample} className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950">Try another example</button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-slate-300 p-1 dark:border-slate-700" aria-label="Text alignment">
            {(['left', 'center', 'right'] as const).map((item) => <button key={item} type="button" aria-pressed={align === item} onClick={() => setAlign(item)} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${align === item ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : ''}`}>{item}</button>)}
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold">Text <input aria-label="ASCII text color" type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} className="h-9 w-12 rounded border border-slate-300" /></label>
          <label className="flex items-center gap-2 text-xs font-semibold">Background <input aria-label="ASCII background color" type="color" value={background} disabled={transparent} onChange={(event) => setBackground(event.target.value)} className="h-9 w-12 rounded border border-slate-300 disabled:opacity-40" /></label>
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={transparent} onChange={(event) => setTransparent(event.target.checked)} /> Transparent export</label>
          <button type="button" onClick={() => setInputText('')} className="ml-auto rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700">Clear</button>
        </div>

        <div className="mt-5 overflow-auto rounded-2xl border border-slate-700 p-5" style={{ backgroundColor: background }}>
          {output ? <pre ref={previewRef} className={`min-w-max font-mono text-[10px] leading-[1.08] sm:text-xs lg:text-sm ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`} style={{ color: foreground }}>{output}</pre> : <p className="py-14 text-center text-sm text-slate-400">Enter text to generate a large ASCII banner.</p>}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <button type="button" onClick={() => void copyOutput()} disabled={!output} className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-45">Copy ASCII</button>
          <button type="button" onClick={exportTxt} disabled={!output} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold disabled:opacity-45 dark:border-slate-700">Download TXT</button>
          <button type="button" onClick={exportPng} disabled={!output} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold disabled:opacity-45 dark:border-slate-700">Download PNG</button>
          <button type="button" onClick={exportSvg} disabled={!output} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-45 dark:bg-white dark:text-slate-950">Download SVG</button>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">ASCII output is plain text and works best in a monospace field. PNG and SVG preserve the layout for social posts and graphics.</p>
        <p className="sr-only" aria-live="polite">{status}</p>
      </div>
    </section>
  );
}
