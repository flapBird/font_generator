'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { unsupportedFontCharacters } from '@/lib/ai-font/font-characters';

const formats = {
  square: { label: 'Square post', width: 1080, height: 1080 },
  wide: { label: 'Wide banner', width: 1600, height: 900 },
  transparent: { label: 'Transparent lettering', width: 1600, height: 600 },
} as const;
const control = 'min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm';

export default function FontArtwork({ family, name, reference = false, characters }: { family: string; name: string; reference?: boolean; characters?: string }) {
  const id = useId();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState('Make something\nyours');
  const [format, setFormat] = useState<keyof typeof formats>('square');
  const [size, setSize] = useState(88);
  const [ink, setInk] = useState('#4c1d95');
  const [paper, setPaper] = useState('#f5f3ff');
  const [align, setAlign] = useState<CanvasTextAlign>('center');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const dimensions = formats[format];
  const missingCharacters = characters === undefined ? '' : unsupportedFontCharacters(text, characters);

  useEffect(() => {
    let alive = true;
    async function draw() {
      setReady(false); setError('');
      try {
        await document.fonts.load(`${size}px ${family}`, text || 'A');
        if (!alive || !canvas.current) return;
        const ctx = canvas.current.getContext('2d');
        if (!ctx) throw new Error('Your browser could not open the canvas.');
        const { width, height } = dimensions;
        canvas.current.width = width; canvas.current.height = height;
        if (format !== 'transparent') { ctx.fillStyle = paper; ctx.fillRect(0, 0, width, height); }
        const margin = 80;
        let fontSize = size * 2;
        let lines: string[] = [];
        // Wrap long words too, and shrink text to keep the complete design in the image.
        do {
          ctx.font = `${fontSize}px ${family}`;
          lines = [];
          for (const paragraph of text.split('\n')) {
            let line = '';
            for (const letter of Array.from(paragraph)) {
              if (line && ctx.measureText(line + letter).width > width - margin * 2) { lines.push(line); line = ''; }
              line += letter;
            }
            lines.push(line);
          }
          if (lines.length * fontSize * 1.4 <= height - margin * 2 || fontSize <= 1) break;
          fontSize = Math.max(1, fontSize - 2);
        } while (true);
        ctx.fillStyle = ink; ctx.textAlign = align; ctx.textBaseline = 'middle';
        const x = align === 'left' ? margin : align === 'right' ? width - margin : width / 2;
        const top = height / 2 - (lines.length - 1) * fontSize * 1.4 / 2;
        lines.forEach((line, index) => ctx.fillText(line, x, top + index * fontSize * 1.4));
        setReady(true);
      } catch { if (alive) setError('The font preview could not load. Try another font or reload this page.'); }
    }
    void draw();
    return () => { alive = false; };
  }, [family, text, dimensions, format, size, ink, paper, align]);

  async function download() {
    if (!canvas.current || !ready || !text.trim()) return;
    setExporting(true); setError('');
    try {
      const blob = await new Promise<Blob>((resolve, reject) => canvas.current!.toBlob((value) => value ? resolve(value) : reject(new Error()), 'image/png'));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `${name.replace(/[^a-z0-9-]/gi, '-').slice(0, 60) || 'font'}-${format}.png`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch { setError('Export failed. Please try again.'); }
    finally { setExporting(false); }
  }

  return <section aria-label="Font artwork editor" className="mt-12 border-t border-border bg-background pt-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Make artwork with your font</h2><span className="rounded-md bg-muted px-3 py-1 text-xs font-semibold">No generation credits used</span></div>
    <p className="mt-2 text-sm text-muted-foreground">{reference ? `Try the editor for free with ${name}, an existing reference font. This is not an AI-generated result.` : `Editing with your generated font: ${name}.`} Change the layout and export as often as you like.</p>
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      <div className="order-2 min-w-0 space-y-4 md:order-1">
        <label className="block text-sm font-semibold" htmlFor={`${id}-text`}>Artwork text</label>
        <textarea id={`${id}-text`} value={text} maxLength={240} rows={3} className={`${control} w-full`} onChange={(event) => setText(event.target.value)} />
        <p className="text-xs text-muted-foreground">Up to 240 characters. Text wraps and scales to fit. English letters, numbers and basic punctuation work best; other characters may use a fallback font.</p>
        {missingCharacters && <p role="status" className="text-sm text-amber-800">This font does not include these characters; they may appear in another font: {missingCharacters}</p>}
        <label className="block text-sm font-semibold" htmlFor={`${id}-format`}>Image format</label>
        <select id={`${id}-format`} className={`${control} w-full`} value={format} onChange={(event) => setFormat(event.target.value as keyof typeof formats)}>{Object.entries(formats).map(([key, item]) => <option value={key} key={key}>{item.label} · {item.width} × {item.height}</option>)}</select>
        <label className="block text-sm font-semibold" htmlFor={`${id}-size`}>Text size</label>
        <input id={`${id}-size`} className="w-full accent-violet-600" type="range" min="24" max="120" value={size} onChange={(event) => setSize(Number(event.target.value))} />
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm">Text color<input aria-label="Text color" className="mt-2 block h-11 w-14" type="color" value={ink} onChange={(event) => setInk(event.target.value)} /></label>
          {format !== 'transparent' && <label className="text-sm">Background color<input aria-label="Background color" className="mt-2 block h-11 w-14" type="color" value={paper} onChange={(event) => setPaper(event.target.value)} /></label>}
          <label className="text-sm">Alignment<select aria-label="Alignment" className={`${control} mt-2 block`} value={align} onChange={(event) => setAlign(event.target.value as CanvasTextAlign)}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
        </div>
        <button onClick={download} disabled={!ready || !text.trim() || exporting} className="min-h-11 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{exporting ? 'Exporting…' : 'Download PNG'}</button>
        <p className="text-xs text-muted-foreground">{dimensions.width} × {dimensions.height} PNG · {format === 'transparent' ? 'Transparent background' : 'Solid background'} · No watermark</p>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>
      <div className="order-1 flex min-w-0 items-center justify-center self-start rounded-lg border border-border p-3 md:order-2" style={{ background: 'repeating-conic-gradient(#e2e8f0 0% 25%, #f8fafc 0% 50%) 0 / 20px 20px' }}>
        <canvas ref={canvas} aria-label={`${reference ? 'Reference' : 'Generated'} font artwork preview`} className="h-auto w-full" style={{ aspectRatio: `${dimensions.width}/${dimensions.height}` }} />
      </div>
    </div>
  </section>;
}
