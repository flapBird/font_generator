'use client';

import { useEffect, useRef, useState } from 'react';
import { boundedCrop, MAX_IMAGE_PIXELS, validateImage, type Crop, type FontMatch } from '@/lib/font-identifier/image';

const button = 'min-h-11 rounded-xl border border-violet-200 px-4 py-2 text-sm font-medium disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500';
export default function FontIdentifier() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const original = useRef<HTMLCanvasElement | null>(null);
  const worker = useRef<Worker | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const previewLink = useRef<HTMLLinkElement | null>(null);
  const previewGeneration = useRef(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0, width: 1, height: 1 });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Choose an image or paste a screenshot here.');
  const [error, setError] = useState('');
  const [matches, setMatches] = useState<FontMatch[]>([]);
  const [sample, setSample] = useState('The quick brown fox');
  const [selected, setSelected] = useState<FontMatch | null>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [previewStatus, setPreviewStatus] = useState('');
  function stop() { worker.current?.terminate(); worker.current = null; if (timer.current) clearTimeout(timer.current); timer.current = null; }
  function invalidate() { stop(); setBusy(false); setMatches([]); previewGeneration.current++; previewLink.current?.remove(); setSelected(null); setPreviewReady(false); setPreviewStatus(''); }
  useEffect(() => () => { generation.current++; previewGeneration.current++; worker.current?.terminate(); if (timer.current) clearTimeout(timer.current); previewLink.current?.remove(); }, []);
  useEffect(() => {
    const element = canvas.current, image = original.current;
    if (!element || !image) return;
    element.width = size.width; element.height = size.height;
    const ctx = element.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    ctx.fillStyle = 'rgba(30,20,50,.35)'; ctx.fillRect(0, 0, size.width, size.height);
    ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, crop.x, crop.y, crop.width, crop.height);
    ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = Math.max(2, size.width / 350); ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);
  }, [size, crop]);
  async function load(file: File) {
    const id = ++generation.current; invalidate(); setError(''); setMessage('Opening image locally…');
    original.current = null; setSize({ width: 0, height: 0 });
    try {
      validateImage(file);
      const image = await createImageBitmap(file);
      if (id !== generation.current) { image.close(); return; }
      if (image.width * image.height > MAX_IMAGE_PIXELS) { image.close(); throw new Error('Choose an image with at most 20 million pixels.'); }
      const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
      const source = document.createElement('canvas'); source.width = Math.max(1, Math.round(image.width * scale)); source.height = Math.max(1, Math.round(image.height * scale));
      const ctx = source.getContext('2d')!; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, source.width, source.height); ctx.drawImage(image, 0, 0, source.width, source.height); image.close();
      original.current = source; setSize({ width: source.width, height: source.height }); setCrop({ x: 0, y: 0, width: source.width, height: source.height }); setMessage('Drag around one clear line, or adjust the crop fields.');
    } catch (cause) { if (id === generation.current) { setError(cause instanceof Error ? cause.message : 'This image could not be opened.'); setMessage('Choose another image.'); } }
  }
  function changeCrop(next: Crop) { invalidate(); setError(''); setCrop(boundedCrop(next, size.width, size.height)); setMessage('Crop updated. Identify this selection when ready.'); }
  function identify() {
    if (!original.current || crop.width < 16 || crop.height < 16) { setError('Select a crop at least 16 × 16 pixels.'); return; }
    invalidate(); setError(''); setBusy(true); setMessage('Starting local matcher…');
    try {
      const instance = new Worker('/font-identifier-worker.js', { type: 'module' }); worker.current = instance;
      const fail = (text: string) => { if (worker.current !== instance) return; stop(); setBusy(false); setError(text); setMessage('Ready to retry.'); };
      instance.onerror = () => fail('The local matcher could not load. Check your connection and retry.');
      instance.onmessage = ({ data }) => {
        if (worker.current !== instance) return;
        if (data.type === 'status') setMessage(data.message);
        if (data.type === 'error') fail(data.message);
        if (data.type === 'results') { setMatches(data.matches); setBusy(false); setMessage(data.matches.length ? 'Closest Google Fonts matches — compare visually before choosing.' : 'No usable text found. Try a tighter, clearer crop.'); stop(); }
      };
      timer.current = setTimeout(() => fail('Matching took too long on this device. Try a smaller crop and retry.'), 60000);
      const image = original.current.getContext('2d')!.getImageData(crop.x, crop.y, crop.width, crop.height);
      instance.postMessage({ image }, [image.data.buffer]);
    } catch { stop(); setBusy(false); setError('Local matching is unavailable in this browser. Try an updated browser.'); }
  }
  async function preview(match: FontMatch) {
    const id = ++previewGeneration.current; setSelected(match); setPreviewReady(false); setPreviewStatus('Loading the selected Google Font…'); previewLink.current?.remove();
    const link = document.createElement('link'); link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(match.family)}:ital,wght@${match.style === 'italic' ? 1 : 0},${match.weight}&display=swap`;
    previewLink.current = link;
    try {
      await new Promise<void>((resolve, reject) => { const timeout = setTimeout(() => reject(new Error()), 12000); link.onload = () => { clearTimeout(timeout); resolve(); }; link.onerror = () => { clearTimeout(timeout); reject(new Error()); }; document.head.appendChild(link); });
      const fonts = await Promise.race([document.fonts.load(`${match.style} ${match.weight} 32px "${match.family.replace(/["\\]/g, '')}"`), new Promise<never>((_, reject) => setTimeout(() => reject(new Error()), 12000))]);
      if (!fonts.length) throw new Error();
      if (id === previewGeneration.current) { setPreviewReady(true); setPreviewStatus('Font loaded. Compare it with your crop.'); }
    } catch { if (id === previewGeneration.current) setPreviewStatus('Preview font could not load. Retry the candidate or open its Google Fonts page.'); }
  }
  return <section tabIndex={0} aria-label="Font identifier workspace" className="grid gap-6 lg:grid-cols-2" onPaste={event => { const file = [...event.clipboardData.files].find(f => f.type.startsWith('image/')); if (file) { event.preventDefault(); void load(file); } }}>
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-xl font-semibold">1. Choose and crop</h2>
      <label className="block text-sm font-medium">Image · PNG, JPEG or WebP<input className="mt-2 block w-full text-sm file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:px-4 file:text-violet-700" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { const file = event.target.files?.[0]; if (file) void load(file); event.target.value = ''; }} /></label>
      <p className="text-xs leading-5 text-slate-500">Up to 10 MB / 20 megapixels. Your image stays on this device. Large images are resized to 1,600 pixels on the longest edge.</p>
      {!!size.width && <>
        <canvas ref={canvas} aria-label="Image crop preview. Use the crop fields below as a keyboard alternative." className="w-full touch-none rounded-xl border border-slate-200" onPointerDown={event => { const box = event.currentTarget.getBoundingClientRect(); start.current = { x: (event.clientX - box.left) * size.width / box.width, y: (event.clientY - box.top) * size.height / box.height }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={event => { if (!start.current) return; const box = event.currentTarget.getBoundingClientRect(); const x = (event.clientX - box.left) * size.width / box.width, y = (event.clientY - box.top) * size.height / box.height; changeCrop({ x: Math.min(x, start.current.x), y: Math.min(y, start.current.y), width: Math.abs(x - start.current.x), height: Math.abs(y - start.current.y) }); }} onPointerUp={() => { start.current = null; }} onPointerCancel={() => { start.current = null; }} />
        <fieldset className="grid grid-cols-2 gap-3 sm:grid-cols-4"><legend className="mb-2 text-sm font-medium">Crop in resized image pixels</legend>{(['x', 'y', 'width', 'height'] as const).map(key => <label key={key} className="text-xs capitalize">{key}<input aria-label={`Crop ${key}`} type="number" min={key === 'x' || key === 'y' ? 0 : 1} max={key === 'x' || key === 'width' ? size.width : size.height} value={crop[key]} onChange={event => changeCrop({ ...crop, [key]: Number(event.target.value) })} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-transparent px-2" /></label>)}</fieldset>
        <button className={button} onClick={() => changeCrop({ x: 0, y: 0, ...size })}>Use whole image</button>
      </>}
      <div className="flex flex-wrap gap-3"><button onClick={identify} disabled={!size.width || busy} className={`${button} bg-violet-600 text-white`}>Identify font locally</button>{busy && <button className={button} onClick={() => { stop(); setBusy(false); setMessage('Cancelled. Your image is still available.'); }}>Cancel</button>} {!!size.width && <button className={button} onClick={() => { generation.current++; invalidate(); original.current = null; setSize({ width: 0, height: 0 }); setError(''); setMessage('Image cleared.'); }}>Clear image</button>}</div>
      <p role="status" className="text-sm leading-6 text-slate-500">{message}</p>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
    <div className="space-y-4 rounded-2xl border border-slate-200 p-4 sm:p-6 dark:border-slate-700">
      <h2 className="text-xl font-semibold">2. Compare candidates</h2>
      <p className="text-sm leading-6 text-slate-500">Experimental matching against Google Fonts only. A close match is not proof of the exact font; fonts outside this catalog may return a look-alike.</p>
      {!matches.length && <p className="rounded-xl bg-violet-50 p-6 text-sm text-violet-800 dark:bg-violet-950 dark:text-violet-200">Select one clear line of printed text. Candidates will appear here after local matching.</p>}
      <ol className="space-y-2">{matches.map((match, index) => <li key={`${match.family}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700"><div><span className="mr-2 text-xs text-slate-500">{index + 1}</span><strong>{match.family}</strong><p className="text-xs text-slate-500">{match.styleName}</p></div><div className="flex gap-3"><button className={button} onClick={() => void preview(match)}>Preview {match.family}</button><a className="inline-flex min-h-11 items-center text-xs text-violet-700 underline dark:text-violet-300" href={`https://fonts.google.com/specimen/${encodeURIComponent(match.family)}`} target="_blank" rel="noreferrer">Font source ↗</a></div></li>)}</ol>
      {!!matches.length && <p className="text-xs leading-5 text-slate-500">Preview downloads the selected font from Google Fonts. Your image and comparison text are not sent with that request.</p>}
      {selected && <div className="space-y-3 border-t border-slate-200 pt-4"><label className="block text-sm">Text to compare<input maxLength={120} value={sample} onChange={event => setSample(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-transparent px-3" /></label><p role="status" className="text-xs text-slate-500">{previewStatus}</p>{previewReady && <p data-testid="font-match-preview" className="break-words text-3xl [overflow-wrap:anywhere]" style={{ fontFamily: `"${selected.family}", sans-serif`, fontWeight: selected.weight, fontStyle: selected.style }}>{sample || 'Enter comparison text'}</p>}</div>}
    </div>
  </section>;
}
