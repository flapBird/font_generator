'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { signatureFonts, loadSignatureFont, renderStrokes, renderTypedSignature, signaturePng, SIGNATURE_WIDTH, SIGNATURE_HEIGHT, type SignatureFontId, type SignatureStroke } from '@/lib/signature';
import { trackTextToolEvent } from '@/lib/analytics/text-tools';

export default function SignatureGeneratorTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentStroke = useRef<SignatureStroke | null>(null);
  const activePointer = useRef<number | null>(null);
  const [mode, setMode] = useState<'type' | 'draw'>('type');
  const [text, setText] = useState('Alex Morgan');
  const [font, setFont] = useState<SignatureFontId>('allura');
  const [color, setColor] = useState('#172554');
  const [size, setSize] = useState(200);
  const [thickness, setThickness] = useState(6);
  const [strokes, setStrokes] = useState<SignatureStroke[]>([]);
  const [retry, setRetry] = useState(0);
  const [rendered, setRendered] = useState({ key: '', status: 'loading' as 'loading' | 'ready' | 'error' });
  const [message, setMessage] = useState('');
  const [exporting, setExporting] = useState(false);
  const renderKey = `${font}|${text}|${color}|${size}|${retry}`;
  const ready = mode === 'draw' ? strokes.some((stroke) => stroke.length) : rendered.key === renderKey && rendered.status === 'ready' && text.trim().length > 0;
  const failed = mode === 'type' && rendered.key === renderKey && rendered.status === 'error';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (mode === 'draw') { renderStrokes(canvas, strokes, color, thickness); return; }
    let cancelled = false;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    loadSignatureFont(font).then((family) => {
      if (cancelled) return;
      renderTypedSignature(canvas, text, family, color, size);
      setRendered({ key: renderKey, status: 'ready' });
    }).catch(() => { if (!cancelled) setRendered({ key: renderKey, status: 'error' }); });
    return () => { cancelled = true; };
  }, [mode, font, text, color, size, renderKey, strokes, thickness]);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(thickness, Math.min(SIGNATURE_WIDTH - thickness, (event.clientX - rect.left) * SIGNATURE_WIDTH / rect.width)),
      y: Math.max(thickness, Math.min(SIGNATURE_HEIGHT - thickness, (event.clientY - rect.top) * SIGNATURE_HEIGHT / rect.height)) };
  }
  function drawStart(event: PointerEvent<HTMLCanvasElement>) {
    if (mode !== 'draw' || event.button !== 0 || activePointer.current !== null) return;
    if (strokes.length >= 100 || strokes.reduce((total, stroke) => total + stroke.length, 0) >= 20000) { setMessage('This drawing is full. Undo a stroke or clear it before adding more.'); return; }
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    activePointer.current = event.pointerId; currentStroke.current = [point(event)]; setMessage('');
    renderStrokes(event.currentTarget, [...strokes, currentStroke.current], color, thickness);
  }
  function drawMove(event: PointerEvent<HTMLCanvasElement>) {
    if (mode !== 'draw' || activePointer.current !== event.pointerId || !currentStroke.current) return;
    event.preventDefault();
    if (currentStroke.current.length >= 2000 || strokes.reduce((total, stroke) => total + stroke.length, 0) + currentStroke.current.length >= 20000) {
      setMessage('Drawing limit reached for this stroke. Release the pointer, then undo a stroke or start a shorter one.'); return;
    }
    const next = point(event), last = currentStroke.current.at(-1)!;
    if (Math.hypot(next.x - last.x, next.y - last.y) < 1) return;
    currentStroke.current.push(next);
    renderStrokes(event.currentTarget, [...strokes, currentStroke.current], color, thickness);
  }
  function drawEnd(event: PointerEvent<HTMLCanvasElement>) {
    if (activePointer.current !== event.pointerId) return;
    if (currentStroke.current?.length) setStrokes([...strokes, currentStroke.current]);
    currentStroke.current = null; activePointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  async function download() {
    if (!ready || !canvasRef.current || exporting) return;
    setExporting(true); setMessage('');
    try {
      if (mode === 'draw') renderStrokes(canvasRef.current, strokes, color, thickness);
      else renderTypedSignature(canvasRef.current, text, await loadSignatureFont(font), color, size);
      const blob = await signaturePng(canvasRef.current);
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = 'signature.png'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Transparent PNG downloaded. The image is cropped around your signature.');
      trackTextToolEvent('tool_export_success', 'signature-generator');
    } catch { setMessage('Could not export the signature. Please try again.'); }
    finally { setExporting(false); }
  }
  return <section aria-label="Signature workspace" data-clarity-mask="true" className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6">
    <div role="tablist" aria-label="Signature method" className="mb-5 flex gap-2">{(['type', 'draw'] as const).map((value) => <button key={value} id={`signature-tab-${value}`} role="tab" tabIndex={mode === value ? 0 : -1} aria-selected={mode === value} aria-controls="signature-panel"
      onKeyDown={(event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 'type' : event.key === 'End' ? 'draw' : mode === 'type' ? 'draw' : 'type';
        setMode(next); setRetry(retry + 1); currentStroke.current = null; activePointer.current = null; setMessage('');
        document.getElementById(`signature-tab-${next}`)?.focus();
      }} onClick={() => { setMode(value); setRetry(retry + 1); currentStroke.current = null; activePointer.current = null; setMessage(''); }}
      className={`min-h-11 rounded-xl border px-5 text-sm font-semibold ${mode === value ? 'border-violet-600 bg-violet-50 text-violet-800' : 'border-slate-200 text-slate-600'}`}>{value === 'type' ? 'Type a signature' : 'Draw a signature'}</button>)}</div>
    <div id="signature-panel" role="tabpanel" aria-labelledby={`signature-tab-${mode}`} className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="space-y-4">
        {mode === 'type' ? <>
          <div><label htmlFor="signature-name" className="text-sm font-semibold">Your name</label><input id="signature-name" value={text} onChange={(event) => {
            if (event.target.value.length > 80) { setMessage('Use up to 80 UTF-16 units. Your previous name was kept.'); return; }
            setText(event.target.value); setMessage('');
          }} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 text-lg" /><p className="mt-2 text-xs text-slate-500">{text.length} / 80 UTF-16 units</p></div>
          <fieldset><legend className="mb-2 text-sm font-semibold">Choose handwriting</legend><div className="grid grid-cols-2 gap-2 lg:grid-cols-1">{signatureFonts.map((face) => <label key={face.id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-3 ${font === face.id ? 'border-violet-400 bg-violet-50' : 'border-slate-200'}`}>
            <input type="radio" name="signature-font" value={face.id} checked={font === face.id} onChange={() => setFont(face.id)} className="accent-violet-700" /><span><span className="block text-sm font-semibold">{face.label}</span><span className="mt-1 block text-xs text-slate-500">{face.description}</span></span>
          </label>)}</div></fieldset>
          <div><label htmlFor="signature-size" className="text-sm font-medium">Letter size: {size}px</label><input id="signature-size" type="range" min={80} max={360} step={10} value={size} onChange={(event) => setSize(Number(event.target.value))} className="mt-2 block min-h-11 w-full accent-violet-700" /></div>
        </> : <>
          <h2 className="text-lg font-semibold">Draw with a mouse, pen or finger</h2><p className="text-sm leading-6 text-slate-600">Use the drawing area to sign. Undo removes the last stroke. Switching modes keeps both drafts on this page.</p>
          <div><label htmlFor="signature-thickness" className="text-sm font-medium">Stroke width: {thickness}px</label><input id="signature-thickness" type="range" min={2} max={18} value={thickness} onChange={(event) => setThickness(Number(event.target.value))} className="mt-2 block min-h-11 w-full accent-violet-700" /></div>
          <div className="flex flex-wrap gap-2"><button type="button" disabled={!strokes.length} onClick={() => setStrokes(strokes.slice(0, -1))} className="min-h-11 rounded-xl border px-4 text-sm disabled:opacity-40">Undo stroke</button><button type="button" disabled={!strokes.length} onClick={() => { setStrokes([]); setMessage(''); }} className="min-h-11 rounded-xl border px-4 text-sm disabled:opacity-40">Clear drawing</button></div>
          <p className="text-xs text-slate-500">{strokes.length} {strokes.length === 1 ? 'stroke' : 'strokes'} · your drawing is not saved</p>
        </>}
        <div className="flex items-center justify-between gap-3"><label htmlFor="signature-color" className="text-sm font-semibold">Ink color</label><input id="signature-color" type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-11 w-16 cursor-pointer rounded-lg border bg-white p-1" /></div>
      </div>
      <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <h2 className="mb-3 text-lg font-semibold">{mode === 'draw' ? 'Drawing area' : 'Signature preview'}</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:p-4">
          <canvas ref={canvasRef} width={SIGNATURE_WIDTH} height={SIGNATURE_HEIGHT} aria-label={mode === 'draw' ? 'Draw your signature here' : 'Typed signature preview'}
            onPointerDown={drawStart} onPointerMove={drawMove} onPointerUp={drawEnd} onPointerCancel={drawEnd} onLostPointerCapture={drawEnd}
            className={`block w-full rounded-xl bg-white ${mode === 'draw' ? 'cursor-crosshair' : ''}`} style={{ touchAction: mode === 'draw' ? 'none' : 'auto' }} />
        </div>
        <p className="mt-3 text-xs leading-6 text-slate-500">The white preview paper is not exported. The PNG has a transparent background and is cropped to the ink with a small margin.</p>
        <p data-testid="signature-status" role="status" className="mt-3 text-sm leading-6 text-slate-600">{mode === 'draw' ? ready ? 'Ready to download your drawing.' : 'Draw a signature to enable download.' : failed ? 'The selected font could not load. Retry before downloading.' : !text.trim() ? 'Enter a name to create a signature.' : ready ? `${signatureFonts.find((face) => face.id === font)!.label} is ready.` : 'Loading selected font…'}</p>
        {failed && <button type="button" onClick={() => setRetry(retry + 1)} className="mt-2 min-h-11 rounded-xl border border-violet-300 px-4 text-sm text-violet-700">Retry font</button>}
        <button type="button" disabled={!ready || exporting} onClick={() => void download()} className="mt-4 min-h-12 w-full rounded-xl bg-violet-700 px-5 font-semibold text-white hover:bg-violet-800 disabled:opacity-40">{exporting ? 'Preparing PNG…' : 'Download transparent PNG'}</button>
        <p role="status" className="mt-3 text-sm leading-6 text-violet-800">{message}</p>
        <p className="mt-4 text-xs leading-6 text-slate-500">Typed styles use six locally hosted Latin fonts. Other scripts may use device fallback; draw by hand for any writing system. This creates an image, not an installed font or a document-signing service.</p>
      </div>
    </div>
  </section>;
}
