'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { discoveryFonts, type DiscoveryFont } from '@/lib/discovery-art';
import { loadDiscoveryFont } from '@/lib/discovery-renderer';
import { drawWavyText, waveCanvases, waveShapes, waveTemplates, wavyTextLimit, type WaveSettings } from '@/lib/wavy-text-artwork';

const field = 'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const labelStyle = 'grid gap-1.5 text-sm font-medium';
const button = 'min-h-11 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:border-violet-500 disabled:opacity-50 dark:border-slate-700';
const shapeNames = { wave: 'Wave', arc: 'Arc', custom: 'Custom curve', straight: 'Straight' };
const backdrops = { transparent: 'Transparent', color: 'Solid color', photo: 'Photo' };

export default function WavyTextArtworkTool() {
  const [text, setText] = useState('GOOD VIBRATIONS');
  const [settings, setSettings] = useState<WaveSettings>(waveTemplates[0].settings);
  const [template, setTemplate] = useState(waveTemplates[0].name);
  const [guide, setGuide] = useState(false);
  const [photo, setPhoto] = useState<{ image: ImageBitmap; name: string } | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [exportError, setExportError] = useState('');
  const [busy, setBusy] = useState(false);
  const [fontState, setFontState] = useState<{ key: string; error: boolean }>();
  const [attempt, setAttempt] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const activePhoto = useRef<ImageBitmap | null>(null);
  const importSequence = useRef(0);
  const [width, height] = waveCanvases[settings.format];
  const fontKey = `${settings.font}-${attempt}`;
  const ready = fontState?.key === fontKey && !fontState.error;
  const failed = fontState?.key === fontKey && fontState.error;

  useEffect(() => {
    let active = true;
    loadDiscoveryFont(settings.font).then(() => {
      if (active) setFontState({ key: fontKey, error: false });
    }).catch(() => {
      if (active) setFontState({ key: fontKey, error: true });
    });
    return () => { active = false; };
  }, [fontKey, settings.font]);

  useEffect(() => {
    if (ready && canvas.current) drawWavyText(canvas.current, text, settings, photo?.image ?? null, guide);
  }, [ready, text, settings, photo, guide]);

  useEffect(() => () => {
    importSequence.current++;
    activePhoto.current?.close();
  }, []);

  function patch<K extends keyof WaveSettings>(key: K, value: WaveSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
    setTemplate('');
    setExportError('');
  }

  function selectTemplate(next: typeof waveTemplates[number]) {
    setSettings(({ format, backdrop, x, y }) => ({ ...next.settings, format, x, y, backdrop: backdrop === 'color' ? next.settings.backdrop : backdrop }));
    setTemplate(next.name);
    setExportError('');
  }

  async function importPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const sequence = ++importSequence.current;
    setPhotoError('');
    if (file.size > 12 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Choose a JPG, PNG or WebP up to 12 MB.');
      return;
    }
    try {
      const image = await createImageBitmap(file);
      if (sequence !== importSequence.current || image.width * image.height > 24_000_000) {
        image.close();
        if (sequence === importSequence.current) setPhotoError('Choose an image up to 24 megapixels.');
        return;
      }
      const previous = activePhoto.current;
      activePhoto.current = image;
      setPhoto({ image, name: file.name });
      patch('backdrop', 'photo');
      previous?.close();
    } catch {
      if (sequence === importSequence.current) setPhotoError('This image could not be opened. Try another file.');
    }
  }

  function removePhoto() {
    importSequence.current++;
    activePhoto.current?.close();
    activePhoto.current = null;
    setPhoto(null);
    patch('backdrop', 'transparent');
    setPhotoError('');
  }

  async function download(extension: 'png' | 'jpg') {
    if (!ready || !text.trim() || busy) return;
    setBusy(true);
    setExportError('');
    try {
      const output = document.createElement('canvas');
      const exportSettings = extension === 'jpg' && settings.backdrop === 'transparent'
        ? { ...settings, backdrop: 'color' as const, background: '#ffffff' } : settings;
      drawWavyText(output, text, exportSettings, photo?.image ?? null, false);
      const type = extension === 'png' ? 'image/png' : 'image/jpeg';
      const blob = await new Promise<Blob>((resolve, reject) => {
        output.toBlob((value) => value ? resolve(value) : reject(new Error('Export failed')), type, .95);
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wavy-text.${extension}`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setExportError('The image could not be downloaded. Try again.');
    } finally {
      setBusy(false);
    }
  }

  function range(key: 'height' | 'cycles' | 'phase' | 'bendStart' | 'bendEnd' | 'spacing' | 'scale' | 'x' | 'y' | 'stroke', label: string, min: number, max: number, step = 1, unit = '') {
    return <label className={labelStyle}>
      <span className="flex justify-between gap-2">{label}<span aria-hidden="true" className="tabular-nums text-slate-500">{settings[key]}{unit}</span></span>
      <input className="min-h-8 w-full accent-violet-600" type="range" value={settings[key]} min={min} max={max} step={step}
        aria-valuetext={`${settings[key]}${unit}`} onChange={(event) => patch(key, event.target.valueAsNumber)} />
    </label>;
  }

  return <section id="generator" aria-label="Wavy text studio" data-clarity-mask="true"
    className="mt-6 grid min-w-0 gap-4 lg:grid-cols-[minmax(17rem,.8fr)_minmax(0,1.65fr)] lg:gap-6">
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <label className={labelStyle}>Your text
        <input className={field} value={text} maxLength={wavyTextLimit} placeholder="Type a short title" onChange={(event) => setText(event.target.value)} />
      </label>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
        <span>{text.length} / {wavyTextLimit}</span>
        <button type="button" onClick={() => setText('')} className="min-h-11 font-semibold text-violet-700 dark:text-violet-300">Clear text</button>
      </div>
    </div>
    <div className="min-w-0 space-y-4 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-start lg:sticky lg:top-32">
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950 sm:p-3">
        <div className="relative flex min-h-36 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900"
          style={{ minHeight: settings.format === 'story' ? undefined : '10rem' }}>
          <canvas ref={canvas} width={width} height={height} aria-label="Wavy lettering preview" role="img"
            className={`block h-auto max-w-full ${settings.format === 'story' ? 'w-[min(100%,17rem)]' : 'w-full'} ${ready ? 'opacity-100' : 'opacity-0'}`}
            style={settings.backdrop === 'transparent' ? { background: 'conic-gradient(#e3def1 25%, #faf8ff 0 50%, #e3def1 0 75%, #faf8ff 0) 0 0/20px 20px' } : undefined} />
          {(!ready || !text.trim()) && <div className="absolute inset-0 grid place-items-center p-2 text-center" role="status">
            <span className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700 shadow dark:bg-slate-950 dark:text-slate-100">
              {failed ? 'This font could not load.' : !ready ? 'Loading the preview…' : 'Enter text to start.'}
            </span>
          </div>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-1 pt-3">
          <div className="text-xs text-slate-500">{width} × {height} px
            <label className="ml-3 inline-flex min-h-9 items-center gap-1.5"><input type="checkbox" checked={guide} onChange={(event) => setGuide(event.target.checked)} /> Path guide</label>
          </div>
          <div className="flex flex-wrap gap-2">
            {failed && <button type="button" className={button} onClick={() => setAttempt((value) => value + 1)}>Retry font</button>}
            <button type="button" className={button} disabled={busy || !ready || !text.trim()} title="JPG uses white behind transparent art"
              onClick={() => void download('jpg')}>Download JPG</button>
            <button type="button" className="min-h-11 rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
              disabled={busy || !ready || !text.trim()} onClick={() => void download('png')}>Download PNG</button>
          </div>
        </div>
        {exportError && <p role="alert" className="px-1 text-sm text-red-700 dark:text-red-300">{exportError}</p>}
      </div>
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-bold">Start with a template</legend>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible">
          {waveTemplates.map((option) => <button key={option.name} type="button" aria-pressed={template === option.name}
            className="flex min-h-14 shrink-0 items-center gap-2 rounded-xl border border-slate-200 p-2 text-left text-xs font-semibold hover:border-violet-400 aria-pressed:border-violet-600 aria-pressed:bg-violet-50 dark:border-slate-800 dark:aria-pressed:bg-violet-950 sm:min-h-16 sm:min-w-0"
            onClick={() => selectTemplate(option)}>
            <span aria-hidden="true" className="h-6 w-6 shrink-0 rounded-full border border-black/10"
              style={{ background: `linear-gradient(135deg, ${option.settings.fill} 50%, ${option.settings.background} 50%)` }} />
            {option.name}
          </button>)}
        </div>
      </fieldset>
    </div>
    <div className="min-w-0 divide-y divide-slate-200 self-start rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
      <div className="space-y-4 p-4">
        <h2 className="text-sm font-bold">Shape the path</h2>
        <fieldset className="grid grid-cols-2 gap-2" aria-label="Path shape">
          {waveShapes.map((shape) => <button key={shape} type="button" aria-pressed={settings.shape === shape}
            className={`${button} aria-pressed:border-violet-600 aria-pressed:bg-violet-50 dark:aria-pressed:bg-violet-950`}
            onClick={() => patch('shape', shape)}>{shapeNames[shape]}</button>)}
        </fieldset>
        {settings.shape !== 'straight' && <>
          <label className={labelStyle}>Letter behavior
            <select aria-label="Letter behavior" className={field} value={settings.mode} onChange={(event) => patch('mode', event.target.value as WaveSettings['mode'])}>
              <option value="follow">Follow and turn</option><option value="warp">Warp letter shapes</option>
            </select>
          </label>
          {range('height', 'Curve height', 0, 100, 1, '%')}
          {settings.shape === 'wave' && <>{range('cycles', 'Waves', .5, 3, .25)}{range('phase', 'Wave phase', -180, 180, 5, '°')}</>}
          {settings.shape === 'custom' && <>
            <svg viewBox="0 0 216 90" aria-hidden="true" className="block w-full rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
              <path d={`M10 45 C75 ${45 + settings.bendStart * .35} 141 ${45 + settings.bendEnd * .35} 206 45`}
                fill="none" className="stroke-violet-600 dark:stroke-violet-400" strokeWidth="2" />
              {(['bendStart', 'bendEnd'] as const).map((key, index) => <circle key={key}
                cx={index === 0 ? 75 : 141} cy={45 + settings[key] * .35} r="9"
                className="touch-none cursor-ns-resize fill-white stroke-violet-700 dark:fill-violet-950 dark:stroke-violet-400"
                strokeWidth="2" onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
                onPointerMove={(event) => {
                  if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                  const bounds = event.currentTarget.ownerSVGElement!.getBoundingClientRect();
                  const value = Math.round(((event.clientY - bounds.top) * 90 / bounds.height - 45) / .35);
                  patch(key, Math.min(100, Math.max(-100, value)));
                }} />)}
            </svg>
            {range('bendStart', 'First bend', -100, 100)}{range('bendEnd', 'Second bend', -100, 100)}
          </>}
        </>}
        {range('spacing', 'Letter spacing', 0, 25, 1, '%')}
      </div>
      <details className="px-4">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-bold">Typography and color</summary>
        <div className="space-y-3 pb-4">
          <label className={labelStyle}>Typeface
            <select aria-label="Typeface" className={field} value={settings.font} onChange={(event) => patch('font', event.target.value as DiscoveryFont)}>
              {Object.entries(discoveryFonts).map(([id, font]) => <option key={id} value={id}>{font.label}</option>)}
            </select>
          </label>
          {range('scale', 'Text size', 25, 110, 1, '%')}
          {range('stroke', 'Outline width', 0, 14, 1, '%')}
          <div className="grid grid-cols-2 gap-3">
            {(['fill', 'outline'] as const).map((key) => <label className={labelStyle} key={key}>{key === 'fill' ? 'Fill' : 'Outline'}
              <input className="h-11 w-full cursor-pointer rounded border border-slate-300 bg-transparent p-1" type="color"
                value={settings[key]} onChange={(event) => patch(key, event.target.value)} />
            </label>)}
          </div>
        </div>
      </details>
      <details className="px-4">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-bold">Canvas and background</summary>
        <div className="space-y-3 pb-4">
          <label className={labelStyle}>Canvas size
            <select aria-label="Canvas size" className={field} value={settings.format} onChange={(event) => patch('format', event.target.value as WaveSettings['format'])}>
              <option value="banner">Banner · 2:1</option><option value="square">Square · 1:1</option><option value="story">Story · 9:16</option>
            </select>
          </label>
          {range('x', 'Horizontal position', 10, 90, 1, '%')}
          {range('y', 'Vertical position', 27, 73, 1, '%')}
          <label className={labelStyle}>Background
            <select aria-label="Background" className={field} value={settings.backdrop} onChange={(event) => patch('backdrop', event.target.value as WaveSettings['backdrop'])}>
              {Object.entries(backdrops).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
            </select>
          </label>
          {settings.backdrop === 'color' && <label className={labelStyle}>Background color
            <input className="h-11 w-full rounded border border-slate-300 bg-transparent p-1" type="color"
              value={settings.background} onChange={(event) => patch('background', event.target.value)} />
          </label>}
          {settings.backdrop === 'photo' && <>
            <input ref={fileInput} type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(event) => void importPhoto(event)} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => fileInput.current?.click()} className={button}>{photo ? 'Replace photo' : 'Choose photo'}</button>
              {photo && <button type="button" onClick={removePhoto} className={button}>Remove</button>}
            </div>
            {photo && <p className="break-all text-xs text-slate-500">{photo.name}</p>}
            {photoError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{photoError}</p>}
          </>}
        </div>
      </details>
    </div>
  </section>;
}
