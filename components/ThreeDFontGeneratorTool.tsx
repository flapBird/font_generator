'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type TextAlignment = 'left' | 'center' | 'right';
type BackgroundType = 'transparent' | 'solid' | 'gradient';

interface ThreeDTextConfig {
  text: string;
  fontFamily: string;
  fontSize: number;
  letterSpacing: number;
  alignment: TextAlignment;
  frontColor: string;
  frontColor2: string;
  sideColor: string;
  depth: number;
  angle: number;
  perspective: number;
  outlineEnabled: boolean;
  outlineWidth: number;
  outlineColor: string;
  shadowEnabled: boolean;
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  shadowColor: string;
  shadowOpacity: number;
  backgroundType: BackgroundType;
  backgroundColor: string;
  backgroundColor2: string;
}

interface ThreeDPreset extends Omit<ThreeDTextConfig, 'text' | 'fontSize' | 'letterSpacing' | 'alignment'> {
  id: string;
  name: string;
  sample: string;
}

const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 760;
const EXPORT_SCALE = 2;

const fontOptions = [
  { label: 'Anton', value: '"Anton", Impact, sans-serif' },
  { label: 'Bebas Neue', value: '"Bebas Neue", Impact, sans-serif' },
  { label: 'Montserrat', value: '"Montserrat", Arial, sans-serif' },
  { label: 'Oswald', value: '"Oswald", Impact, sans-serif' },
  { label: 'Roboto', value: '"Roboto", Arial, sans-serif' },
  { label: 'Poppins', value: '"Poppins", Arial, sans-serif' },
  { label: 'Impact', value: 'Impact, "Arial Black", sans-serif' },
  { label: 'Luckiest Guy', value: '"Luckiest Guy", Impact, sans-serif' },
  { label: 'Pixelify Sans', value: '"Pixelify Sans", monospace' },
];

const presets: ThreeDPreset[] = [
  { id: 'classic', name: 'Classic 3D', sample: '3D', fontFamily: '"Anton", Impact, sans-serif', frontColor: '#f8fafc', frontColor2: '#cbd5e1', sideColor: '#475569', depth: 42, angle: 42, perspective: 8, outlineEnabled: true, outlineWidth: 3, outlineColor: '#0f172a', shadowEnabled: true, shadowX: 24, shadowY: 28, shadowBlur: 20, shadowColor: '#020617', shadowOpacity: 0.42, backgroundType: 'gradient', backgroundColor: '#c7d2fe', backgroundColor2: '#f5d0fe' },
  { id: 'gold', name: 'Gold', sample: 'GOLD', fontFamily: '"Anton", Impact, sans-serif', frontColor: '#fff3a6', frontColor2: '#d99000', sideColor: '#825000', depth: 34, angle: 55, perspective: 6, outlineEnabled: true, outlineWidth: 3, outlineColor: '#3f2600', shadowEnabled: true, shadowX: 18, shadowY: 24, shadowBlur: 22, shadowColor: '#2b1600', shadowOpacity: 0.55, backgroundType: 'solid', backgroundColor: '#18120b', backgroundColor2: '#000000' },
  { id: 'chrome', name: 'Chrome', sample: 'CHROME', fontFamily: '"Bebas Neue", Impact, sans-serif', frontColor: '#ffffff', frontColor2: '#64748b', sideColor: '#1e293b', depth: 32, angle: 36, perspective: 10, outlineEnabled: true, outlineWidth: 3, outlineColor: '#020617', shadowEnabled: true, shadowX: 16, shadowY: 22, shadowBlur: 16, shadowColor: '#020617', shadowOpacity: 0.6, backgroundType: 'gradient', backgroundColor: '#0f172a', backgroundColor2: '#334155' },
  { id: 'neon', name: 'Neon', sample: 'NEON', fontFamily: '"Oswald", Impact, sans-serif', frontColor: '#d9fffb', frontColor2: '#22d3ee', sideColor: '#7e22ce', depth: 24, angle: 50, perspective: 4, outlineEnabled: true, outlineWidth: 3, outlineColor: '#ec4899', shadowEnabled: true, shadowX: 5, shadowY: 10, shadowBlur: 34, shadowColor: '#22d3ee', shadowOpacity: 0.9, backgroundType: 'solid', backgroundColor: '#09031d', backgroundColor2: '#000000' },
  { id: 'retro', name: 'Retro', sample: 'RETRO', fontFamily: '"Bebas Neue", Impact, sans-serif', frontColor: '#fde68a', frontColor2: '#fb7185', sideColor: '#0f766e', depth: 38, angle: 135, perspective: 12, outlineEnabled: true, outlineWidth: 4, outlineColor: '#422006', shadowEnabled: true, shadowX: 16, shadowY: 18, shadowBlur: 0, shadowColor: '#422006', shadowOpacity: 0.65, backgroundType: 'solid', backgroundColor: '#fef3c7', backgroundColor2: '#000000' },
  { id: 'bubble', name: 'Bubble', sample: 'POP', fontFamily: '"Luckiest Guy", Impact, sans-serif', frontColor: '#f9a8d4', frontColor2: '#c084fc', sideColor: '#7e22ce', depth: 26, angle: 48, perspective: 3, outlineEnabled: true, outlineWidth: 5, outlineColor: '#ffffff', shadowEnabled: true, shadowX: 15, shadowY: 20, shadowBlur: 12, shadowColor: '#581c87', shadowOpacity: 0.48, backgroundType: 'gradient', backgroundColor: '#dbeafe', backgroundColor2: '#fae8ff' },
  { id: 'gaming', name: 'Gaming', sample: 'PLAY', fontFamily: '"Oswald", Impact, sans-serif', frontColor: '#a3e635', frontColor2: '#16a34a', sideColor: '#14532d', depth: 46, angle: 36, perspective: 14, outlineEnabled: true, outlineWidth: 4, outlineColor: '#052e16', shadowEnabled: true, shadowX: 20, shadowY: 24, shadowBlur: 14, shadowColor: '#000000', shadowOpacity: 0.65, backgroundType: 'gradient', backgroundColor: '#111827', backgroundColor2: '#052e16' },
  { id: 'cartoon', name: 'Cartoon', sample: 'WOW!', fontFamily: '"Luckiest Guy", Impact, sans-serif', frontColor: '#fef08a', frontColor2: '#f97316', sideColor: '#dc2626', depth: 30, angle: 60, perspective: 5, outlineEnabled: true, outlineWidth: 6, outlineColor: '#172554', shadowEnabled: true, shadowX: 12, shadowY: 18, shadowBlur: 0, shadowColor: '#172554', shadowOpacity: 0.8, backgroundType: 'solid', backgroundColor: '#7dd3fc', backgroundColor2: '#000000' },
  { id: 'metallic', name: 'Metallic', sample: 'STEEL', fontFamily: 'Impact, "Arial Black", sans-serif', frontColor: '#e2e8f0', frontColor2: '#475569', sideColor: '#0f172a', depth: 50, angle: 32, perspective: 15, outlineEnabled: true, outlineWidth: 3, outlineColor: '#020617', shadowEnabled: true, shadowX: 28, shadowY: 30, shadowBlur: 18, shadowColor: '#020617', shadowOpacity: 0.7, backgroundType: 'solid', backgroundColor: '#27272a', backgroundColor2: '#000000' },
  { id: 'shadow', name: 'Long Shadow', sample: 'BOLD', fontFamily: '"Montserrat", Arial, sans-serif', frontColor: '#ffffff', frontColor2: '#f8fafc', sideColor: '#4338ca', depth: 70, angle: 45, perspective: 0, outlineEnabled: false, outlineWidth: 0, outlineColor: '#111827', shadowEnabled: false, shadowX: 0, shadowY: 0, shadowBlur: 0, shadowColor: '#000000', shadowOpacity: 0.4, backgroundType: 'solid', backgroundColor: '#818cf8', backgroundColor2: '#000000' },
  { id: 'red-blue', name: 'Red / Blue 3D', sample: 'SHIFT', fontFamily: '"Anton", Impact, sans-serif', frontColor: '#f8fafc', frontColor2: '#e2e8f0', sideColor: '#06b6d4', depth: 24, angle: 180, perspective: 4, outlineEnabled: true, outlineWidth: 2, outlineColor: '#ef4444', shadowEnabled: true, shadowX: 16, shadowY: 4, shadowBlur: 0, shadowColor: '#ef4444', shadowOpacity: 0.85, backgroundType: 'solid', backgroundColor: '#111827', backgroundColor2: '#000000' },
  { id: 'extruded', name: 'Extruded', sample: 'DEEP', fontFamily: '"Poppins", Arial, sans-serif', frontColor: '#f97316', frontColor2: '#facc15', sideColor: '#7c2d12', depth: 78, angle: 52, perspective: 16, outlineEnabled: true, outlineWidth: 3, outlineColor: '#431407', shadowEnabled: true, shadowX: 32, shadowY: 38, shadowBlur: 20, shadowColor: '#431407', shadowOpacity: 0.55, backgroundType: 'transparent', backgroundColor: '#ffffff', backgroundColor2: '#000000' },
  { id: 'cyberpunk', name: 'Cyberpunk', sample: 'CYBER', fontFamily: '"Bebas Neue", Impact, sans-serif', frontColor: '#fef08a', frontColor2: '#ec4899', sideColor: '#06b6d4', depth: 36, angle: 145, perspective: 18, outlineEnabled: true, outlineWidth: 3, outlineColor: '#111827', shadowEnabled: true, shadowX: 18, shadowY: 20, shadowBlur: 26, shadowColor: '#d946ef', shadowOpacity: 0.75, backgroundType: 'gradient', backgroundColor: '#0f172a', backgroundColor2: '#3b0764' },
  { id: 'pixel', name: 'Pixel', sample: 'PIXEL', fontFamily: '"Pixelify Sans", monospace', frontColor: '#fef08a', frontColor2: '#eab308', sideColor: '#854d0e', depth: 34, angle: 45, perspective: 0, outlineEnabled: true, outlineWidth: 3, outlineColor: '#422006', shadowEnabled: true, shadowX: 12, shadowY: 12, shadowBlur: 0, shadowColor: '#000000', shadowOpacity: 0.6, backgroundType: 'solid', backgroundColor: '#14532d', backgroundColor2: '#000000' },
  { id: 'purple-neon', name: 'Purple Neon', sample: 'GLOW', fontFamily: '"Roboto", Arial, sans-serif', frontColor: '#faf5ff', frontColor2: '#c084fc', sideColor: '#6d28d9', depth: 22, angle: 65, perspective: 8, outlineEnabled: true, outlineWidth: 2, outlineColor: '#e879f9', shadowEnabled: true, shadowX: 6, shadowY: 10, shadowBlur: 38, shadowColor: '#c026d3', shadowOpacity: 0.92, backgroundType: 'solid', backgroundColor: '#13051f', backgroundColor2: '#000000' },
];

const basePreset = presets[0];
const defaultConfig: ThreeDTextConfig = {
  text: '3D TEXT',
  fontSize: 230,
  letterSpacing: 3,
  alignment: 'center',
  ...basePreset,
};

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized.length === 3 ? normalized.split('').map((part) => part + part).join('') : normalized, 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
};

const mixHex = (from: string, to: string, amount: number) => {
  const channels = (hex: string) => {
    const normalized = hex.replace('#', '');
    const value = Number.parseInt(normalized, 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  };
  const first = channels(from);
  const second = channels(to);
  return `rgb(${first.map((channel, index) => Math.round(channel + (second[index] - channel) * amount)).join(',')})`;
};

const safeFilename = (text: string) => text.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || '3d-text';

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
};

const measureSpacedText = (context: CanvasRenderingContext2D, text: string, spacing: number) => {
  const characters = Array.from(text);
  return characters.reduce((total, character) => total + context.measureText(character).width, 0)
    + Math.max(0, characters.length - 1) * spacing;
};

const drawSpacedText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  alignment: TextAlignment,
  mode: 'fill' | 'stroke',
) => {
  const characters = Array.from(text);
  const width = measureSpacedText(context, text, spacing);
  let cursor = alignment === 'left' ? x : alignment === 'right' ? x - width : x - width / 2;
  context.textAlign = 'left';
  for (const character of characters) {
    if (mode === 'fill') context.fillText(character, cursor, y);
    else context.strokeText(character, cursor, y);
    cursor += context.measureText(character).width + spacing;
  }
};

const drawArtwork = (canvas: HTMLCanvasElement, config: ThreeDTextConfig, renderScale = 1) => {
  canvas.width = CANVAS_WIDTH * renderScale;
  canvas.height = CANVAS_HEIGHT * renderScale;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.setTransform(renderScale, 0, 0, renderScale, 0, 0);
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (config.backgroundType === 'solid') {
    context.fillStyle = config.backgroundColor;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else if (config.backgroundType === 'gradient') {
    const background = context.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    background.addColorStop(0, config.backgroundColor);
    background.addColorStop(1, config.backgroundColor2);
    context.fillStyle = background;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  const content = config.text || ' ';
  const lines = content.split('\n').slice(0, 3);
  const radians = (config.angle * Math.PI) / 180;
  const unitX = Math.cos(radians);
  const unitY = Math.sin(radians);
  const depthX = unitX * config.depth;
  const depthY = unitY * config.depth;
  const shear = Math.tan((config.perspective * Math.PI) / 180) * 0.38;
  const availableWidth = CANVAS_WIDTH - 180 - Math.abs(depthX) - Math.abs(shear * 300);
  const availableHeight = CANVAS_HEIGHT - 170 - Math.abs(depthY);
  const requestedSize = config.fontSize;
  let fittedSize = requestedSize;
  const font = (size: number) => `900 ${size}px ${config.fontFamily}`;
  context.font = font(fittedSize);
  const maxLineWidth = () => Math.max(...lines.map((line) => measureSpacedText(context, line, config.letterSpacing)), 1);
  while ((maxLineWidth() > availableWidth || fittedSize * 1.08 * lines.length > availableHeight) && fittedSize > 42) {
    fittedSize -= 4;
    context.font = font(fittedSize);
  }

  const lineHeight = fittedSize * 1.08;
  const totalTextHeight = lineHeight * lines.length;
  const centerY = CANVAS_HEIGHT / 2 - depthY * 0.32;
  const firstBaseline = centerY - totalTextHeight / 2 + fittedSize * 0.84;
  const anchorX = config.alignment === 'left'
    ? 90 + Math.max(0, -depthX)
    : config.alignment === 'right'
      ? CANVAS_WIDTH - 90 - Math.max(0, depthX)
      : CANVAS_WIDTH / 2 - depthX * 0.28;

  const renderText = (offsetX: number, offsetY: number, mode: 'fill' | 'stroke') => {
    lines.forEach((line, index) => {
      const baseline = firstBaseline + index * lineHeight;
      context.save();
      context.transform(1, 0, shear, 1, offsetX - shear * centerY, offsetY);
      drawSpacedText(context, line, anchorX, baseline, config.letterSpacing, config.alignment, mode);
      context.restore();
    });
  };

  context.font = font(fittedSize);
  context.textBaseline = 'alphabetic';
  context.lineJoin = 'round';
  context.miterLimit = 2;

  if (config.shadowEnabled) {
    context.save();
    context.fillStyle = hexToRgba(config.shadowColor, config.shadowOpacity);
    context.shadowColor = hexToRgba(config.shadowColor, config.shadowOpacity);
    context.shadowBlur = config.shadowBlur;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    renderText(depthX + config.shadowX, depthY + config.shadowY, 'fill');
    context.restore();
  }

  const layers = Math.max(1, Math.ceil(config.depth));
  for (let layer = layers; layer >= 1; layer -= 1) {
    const progress = layer / layers;
    context.fillStyle = mixHex(config.sideColor, '#000000', 0.18 * progress);
    renderText(unitX * layer, unitY * layer, 'fill');
    if (config.outlineEnabled && config.outlineWidth > 0 && (layer === layers || layer % 5 === 0)) {
      context.strokeStyle = mixHex(config.outlineColor, config.sideColor, 0.35);
      context.lineWidth = Math.max(1, config.outlineWidth * 0.7);
      renderText(unitX * layer, unitY * layer, 'stroke');
    }
  }

  if (config.outlineEnabled && config.outlineWidth > 0) {
    context.strokeStyle = config.outlineColor;
    context.lineWidth = config.outlineWidth * 2;
    renderText(0, 0, 'stroke');
  }

  const face = context.createLinearGradient(0, centerY - fittedSize, 0, centerY + fittedSize * 0.65);
  face.addColorStop(0, config.frontColor);
  face.addColorStop(0.42, mixHex(config.frontColor, '#ffffff', 0.22));
  face.addColorStop(0.55, config.frontColor2);
  face.addColorStop(1, mixHex(config.frontColor2, '#000000', 0.12));
  context.fillStyle = face;
  renderText(0, 0, 'fill');

  context.save();
  context.globalAlpha = 0.38;
  context.strokeStyle = '#ffffff';
  context.lineWidth = Math.max(1, config.outlineWidth * 0.45);
  renderText(-1.2, -1.2, 'stroke');
  context.restore();
};

function RangeControl({ label, value, min, max, step = 1, suffix = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (value: number) => void }) {
  return (
    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
      <span className="flex items-center justify-between gap-3"><span>{label}</span><output className="font-mono text-[11px] text-slate-500">{value}{suffix}</output></span>
      <input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1.5 w-full accent-violet-600" />
    </label>
  );
}

function ColorControl({ label, value, disabled = false, onChange }: { label: string; value: string; disabled?: boolean; onChange: (value: string) => void }) {
  return (
    <label className={`text-xs font-semibold text-slate-700 dark:text-slate-300 ${disabled ? 'opacity-45' : ''}`}>
      <span>{label}</span>
      <span className="mt-1.5 flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-2 dark:border-slate-700 dark:bg-slate-900">
        <input aria-label={label} type="color" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0 disabled:cursor-not-allowed" />
        <span className="truncate font-mono text-[11px] font-normal text-slate-500">{value.toUpperCase()}</span>
      </span>
    </label>
  );
}

export default function ThreeDFontGeneratorTool() {
  const desktopCanvasRef = useRef<HTMLCanvasElement>(null);
  const mobileCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [config, setConfig] = useState<ThreeDTextConfig>(defaultConfig);
  const [presetId, setPresetId] = useState(basePreset.id);
  const [status, setStatus] = useState('');

  const update = useCallback(<K extends keyof ThreeDTextConfig>(key: K, value: ThreeDTextConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }));
    if (key !== 'text') setPresetId('custom');
  }, []);

  const applyPreset = useCallback((preset: ThreeDPreset) => {
    const { id, name: _name, sample: _sample, ...style } = preset;
    void _name;
    void _sample;
    setConfig((current) => ({ ...current, ...style }));
    setPresetId(id);
    setStatus(`${preset.name} preset applied.`);
  }, []);

  const renderPreview = useCallback(() => {
    if (desktopCanvasRef.current) drawArtwork(desktopCanvasRef.current, config);
    if (mobileCanvasRef.current) drawArtwork(mobileCanvasRef.current, config);
  }, [config]);

  useEffect(() => {
    if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(renderPreview);
    return () => {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [renderPreview]);

  useEffect(() => {
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) renderPreview();
    });
    return () => { cancelled = true; };
  }, [renderPreview]);

  const downloadPng = useCallback(() => {
    if (!config.text.trim()) return;
    const exportCanvas = document.createElement('canvas');
    drawArtwork(exportCanvas, config, EXPORT_SCALE);
    exportCanvas.toBlob((blob) => {
      if (!blob) {
        setStatus('The PNG could not be created. Please try again.');
        return;
      }
      triggerDownload(blob, `${safeFilename(config.text)}-3d-text.png`);
      setStatus(`High-resolution ${CANVAS_WIDTH * EXPORT_SCALE} × ${CANVAS_HEIGHT * EXPORT_SCALE} PNG downloaded.`);
    }, 'image/png');
  }, [config]);

  const reset = () => {
    setConfig(defaultConfig);
    setPresetId(basePreset.id);
    setStatus('Default 3D style restored.');
  };

  const randomize = () => {
    const preset = presets[Math.floor(Math.random() * presets.length)];
    applyPreset(preset);
    setConfig((current) => ({
      ...current,
      depth: clamp(current.depth + Math.round(Math.random() * 20 - 10), 4, 90),
      angle: Math.round(Math.random() * 360),
    }));
    setPresetId('custom');
    setStatus('A randomized 3D style is ready.');
  };

  const previewLabel = useMemo(() => `3D artwork preview of ${config.text || 'empty text'}`, [config.text]);

  const previewPanel = (canvasRef: React.RefObject<HTMLCanvasElement | null>, mobile = false) => (
    <div className={mobile ? 'lg:hidden' : 'hidden lg:block'}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-slate-950 dark:text-white">Live 3D preview</h2>
          <p className="mt-0.5 text-xs text-slate-500">Auto-fit preview · export size 2800 × 1520</p>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">Live</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0] p-2 shadow-inner dark:border-slate-700 dark:bg-[linear-gradient(45deg,#334155_25%,transparent_25%),linear-gradient(-45deg,#334155_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#334155_75%),linear-gradient(-45deg,transparent_75%,#334155_75%)]">
        <canvas ref={canvasRef} role="img" aria-label={previewLabel} className="block h-auto w-full rounded-xl" />
      </div>
      <button type="button" onClick={downloadPng} disabled={!config.text.trim()} className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-400/40 disabled:cursor-not-allowed disabled:opacity-45">
        Download transparent-ready PNG · 2×
      </button>
    </div>
  );

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_28px_80px_-56px_rgba(15,23,42,0.65)] sm:p-6 dark:border-slate-800 dark:bg-slate-950" aria-label="3D text design tool">
      <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
        <label htmlFor="three-d-text" className="text-sm font-black text-slate-950 dark:text-white">Enter your text</label>
        <textarea id="three-d-text" value={config.text} maxLength={80} rows={2} onChange={(event) => update('text', event.target.value.split('\n').slice(0, 3).join('\n'))} placeholder="Type up to three short lines" className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-xl font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
          <span>Updates instantly—no Generate button.</span>
          <span>{config.text.length}/80</span>
        </div>
      </div>

      <div className="mt-5">{previewPanel(mobileCanvasRef, true)}</div>

      <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(330px,0.82fr)_minmax(0,1.4fr)]">
        <div className="min-w-0 space-y-6">
          <fieldset>
            <legend className="text-sm font-black text-slate-950 dark:text-white">3D style presets</legend>
            <p className="mt-1 text-xs text-slate-500">Choose a complete look, then fine-tune any setting.</p>
            <div className="mobile-chip-scroll mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3" aria-label="3D style preset gallery">
              {presets.map((preset) => (
                <button key={preset.id} type="button" onClick={() => applyPreset(preset)} aria-pressed={presetId === preset.id} className={`group min-h-24 overflow-hidden rounded-xl border p-2 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-400/30 ${presetId === preset.id ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-500/20 dark:bg-violet-950/30' : 'border-slate-200 hover:border-violet-300 dark:border-slate-700 dark:hover:border-violet-700'}`}>
                  <span className="flex h-14 items-center justify-center overflow-hidden rounded-lg px-1" style={{ background: preset.backgroundType === 'gradient' ? `linear-gradient(135deg, ${preset.backgroundColor}, ${preset.backgroundColor2})` : preset.backgroundType === 'transparent' ? 'repeating-conic-gradient(#e2e8f0 0 25%,#fff 0 50%) 0/14px 14px' : preset.backgroundColor }}>
                    <span className="truncate text-2xl font-black leading-none" style={{ color: preset.frontColor, fontFamily: preset.fontFamily, WebkitTextStroke: `${Math.min(preset.outlineWidth, 2)}px ${preset.outlineColor}`, textShadow: `2px 2px 0 ${preset.sideColor}, 4px 4px 0 ${preset.sideColor}, 7px 7px 8px ${hexToRgba(preset.shadowColor, preset.shadowOpacity)}` }}>{preset.sample}</span>
                  </span>
                  <span className="mt-1.5 block truncate text-[11px] font-bold text-slate-700 dark:text-slate-300">{preset.name}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800" aria-labelledby="basic-controls-heading">
            <h2 id="basic-controls-heading" className="text-sm font-black text-slate-950 dark:text-white">Text &amp; 3D</h2>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
              <label className="col-span-2 text-xs font-semibold text-slate-700 dark:text-slate-300">Font family
                <select value={config.fontFamily} onChange={(event) => update('fontFamily', event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                  {fontOptions.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
                </select>
              </label>
              <RangeControl label="Font size" value={config.fontSize} min={80} max={320} suffix="px" onChange={(value) => update('fontSize', value)} />
              <RangeControl label="Letter spacing" value={config.letterSpacing} min={-6} max={30} suffix="px" onChange={(value) => update('letterSpacing', value)} />
              <RangeControl label="Depth / extrusion" value={config.depth} min={0} max={90} suffix="px" onChange={(value) => update('depth', value)} />
              <RangeControl label="Direction / angle" value={config.angle} min={0} max={360} suffix="°" onChange={(value) => update('angle', value)} />
              <div className="col-span-2"><RangeControl label="Perspective / slant" value={config.perspective} min={-22} max={22} suffix="°" onChange={(value) => update('perspective', value)} /></div>
              <fieldset className="col-span-2">
                <legend className="text-xs font-semibold text-slate-700 dark:text-slate-300">Text alignment</legend>
                <div className="mt-1.5 grid grid-cols-3 rounded-lg border border-slate-300 p-1 dark:border-slate-700">
                  {(['left', 'center', 'right'] as TextAlignment[]).map((alignment) => <button key={alignment} type="button" aria-pressed={config.alignment === alignment} onClick={() => update('alignment', alignment)} className={`min-h-9 rounded-md text-xs font-bold capitalize ${config.alignment === alignment ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{alignment}</button>)}
                </div>
              </fieldset>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800" aria-labelledby="color-controls-heading">
            <h2 id="color-controls-heading" className="text-sm font-black text-slate-950 dark:text-white">Colors</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ColorControl label="Front color" value={config.frontColor} onChange={(value) => update('frontColor', value)} />
              <ColorControl label="Face gradient" value={config.frontColor2} onChange={(value) => update('frontColor2', value)} />
              <ColorControl label="Side / depth" value={config.sideColor} onChange={(value) => update('sideColor', value)} />
              <ColorControl label="Outline" value={config.outlineColor} disabled={!config.outlineEnabled} onChange={(value) => update('outlineColor', value)} />
            </div>
          </section>

          <details className="group rounded-2xl border border-slate-200 p-4 open:border-violet-300 dark:border-slate-800 dark:open:border-violet-800">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-black text-slate-950 dark:text-white">Advanced effects <span aria-hidden="true" className="text-lg text-violet-600 transition group-open:rotate-45">+</span></summary>
            <div className="mt-5 space-y-5">
              <fieldset>
                <legend className="flex w-full items-center justify-between gap-3 text-xs font-black text-slate-800 dark:text-slate-200">Outline <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={config.outlineEnabled} onChange={(event) => update('outlineEnabled', event.target.checked)} className="h-4 w-4 accent-violet-600" /> Enabled</label></legend>
                <div className="mt-3 grid grid-cols-2 gap-4"><RangeControl label="Width" value={config.outlineWidth} min={0} max={10} suffix="px" onChange={(value) => update('outlineWidth', value)} /><ColorControl label="Color" value={config.outlineColor} disabled={!config.outlineEnabled} onChange={(value) => update('outlineColor', value)} /></div>
              </fieldset>
              <fieldset className="border-t border-slate-200 pt-5 dark:border-slate-800">
                <legend className="flex w-full items-center justify-between gap-3 text-xs font-black text-slate-800 dark:text-slate-200">Shadow <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={config.shadowEnabled} onChange={(event) => update('shadowEnabled', event.target.checked)} className="h-4 w-4 accent-violet-600" /> Enabled</label></legend>
                <div className="mt-3 grid grid-cols-2 gap-4"><RangeControl label="X offset" value={config.shadowX} min={-50} max={70} suffix="px" onChange={(value) => update('shadowX', value)} /><RangeControl label="Y offset" value={config.shadowY} min={-50} max={70} suffix="px" onChange={(value) => update('shadowY', value)} /><RangeControl label="Blur" value={config.shadowBlur} min={0} max={60} suffix="px" onChange={(value) => update('shadowBlur', value)} /><RangeControl label="Opacity" value={config.shadowOpacity} min={0} max={1} step={0.05} onChange={(value) => update('shadowOpacity', value)} /><div className="col-span-2"><ColorControl label="Shadow color" value={config.shadowColor} disabled={!config.shadowEnabled} onChange={(value) => update('shadowColor', value)} /></div></div>
              </fieldset>
            </div>
          </details>

          <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800" aria-labelledby="background-controls-heading">
            <h2 id="background-controls-heading" className="text-sm font-black text-slate-950 dark:text-white">Background</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(['transparent', 'solid', 'gradient'] as BackgroundType[]).map((type) => <button key={type} type="button" aria-pressed={config.backgroundType === type} onClick={() => update('backgroundType', type)} className={`min-h-10 rounded-lg border px-2 text-xs font-bold capitalize ${config.backgroundType === type ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300 text-slate-600 hover:border-violet-400 dark:border-slate-700 dark:text-slate-300'}`}>{type}</button>)}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3"><ColorControl label="Background" value={config.backgroundColor} disabled={config.backgroundType === 'transparent'} onChange={(value) => update('backgroundColor', value)} /><ColorControl label="Gradient end" value={config.backgroundColor2} disabled={config.backgroundType !== 'gradient'} onChange={(value) => update('backgroundColor2', value)} /></div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={reset} className="min-h-11 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-violet-400 dark:border-slate-700 dark:text-slate-300">Reset</button>
            <button type="button" onClick={randomize} className="min-h-11 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-violet-400 dark:border-slate-700 dark:text-slate-300">Random style</button>
          </div>
        </div>

        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          {previewPanel(desktopCanvasRef)}
          {status && <p className="mt-3 rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-800 dark:bg-violet-950/40 dark:text-violet-300" aria-live="polite">{status}</p>}
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <strong className="text-slate-800 dark:text-slate-200">Private by design:</strong> rendering and PNG export happen entirely in your browser. Your text is not uploaded for image processing.
          </div>
        </div>
      </div>
    </section>
  );
}
