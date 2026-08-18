'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VisualFontPreset, VisualGeneratorConfig } from '@/lib/visual-generator';

interface VisualGeneratorToolProps {
  config: VisualGeneratorConfig;
  pageTitle: string;
}

type CanvasFormat = 'banner' | 'social' | 'square';

const formats: Record<CanvasFormat, { label: string; width: number; height: number }> = {
  banner: { label: 'Wide banner', width: 1200, height: 420 },
  social: { label: 'Social post', width: 1200, height: 630 },
  square: { label: 'Square', width: 1080, height: 1080 },
};

const LINE_HEIGHT_RATIO = 1.18;
const MIN_FITTED_FONT_SIZE = 24;
const TEXT_AREA_RATIO = 0.84;

const palette = ['#ef4444', '#3b82f6', '#facc15', '#22c55e', '#a855f7', '#f97316'];

const fileSlug = (value: string) =>
  value.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'text-design';

const escapeXml = (value: string) =>
  value.replace(/[<>&"']/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
  })[character] ?? character);

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
};

const applyPreset = (preset: VisualFontPreset) => ({
  textColor: preset.textColor,
  backgroundColor: preset.backgroundColor,
  strokeColor: preset.strokeColor ?? '#000000',
  strokeWidth: preset.strokeWidth ?? 0,
  shadowBlur: preset.shadowBlur ?? 0,
  shadowOffset: Math.max(preset.shadowOffsetX ?? 0, preset.shadowOffsetY ?? 0),
  letterSpacing: preset.letterSpacing ?? 0,
});

export default function VisualGeneratorTool({
  config,
  pageTitle,
}: VisualGeneratorToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inputText, setInputText] = useState(config.initialText);
  const [presetId, setPresetId] = useState(config.presets[0]?.id ?? '');
  const [fontSize, setFontSize] = useState(112);
  const [format, setFormat] = useState<CanvasFormat>('banner');
  const [transparent, setTransparent] = useState(false);
  const [fontAvailable, setFontAvailable] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [controls, setControls] = useState(() => applyPreset(config.presets[0]));

  const currentPreset = useMemo(
    () => config.presets.find((item) => item.id === presetId) ?? config.presets[0],
    [config.presets, presetId],
  );
  const dimensions = formats[format];
  const renderedText = currentPreset?.uppercase ? inputText.toUpperCase() : inputText;

  const selectPreset = (preset: VisualFontPreset) => {
    setPresetId(preset.id);
    setControls(applyPreset(preset));
  };

  useEffect(() => {
    let active = true;
    const checkFont = async () => {
      if (!currentPreset?.targetFont || !document.fonts) {
        setFontAvailable(null);
        return;
      }
      await document.fonts.ready;
      const testString = 'mmmmmmmmmmlliWW@#';
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        if (active) setFontAvailable(null);
        return;
      }
      const generics = ['monospace', 'serif', 'sans-serif'];
      const available = generics.some((generic) => {
        context.font = `72px ${generic}`;
        const baseline = context.measureText(testString).width;
        context.font = `72px ${JSON.stringify(currentPreset.targetFont)}, ${generic}`;
        return context.measureText(testString).width !== baseline;
      });
      if (active) setFontAvailable(available);
    };
    void checkFont();
    return () => { active = false; };
  }, [currentPreset]);

  const resolveTextLayout = useCallback((
    context: CanvasRenderingContext2D,
    lines: string[],
    width: number,
    minimumHeight: number,
  ) => {
    if (!currentPreset) return { fontSize, height: minimumHeight };

    const effectPadding = Math.max(
      controls.strokeWidth * 2,
      controls.shadowBlur + Math.abs(controls.shadowOffset),
    );
    const maxWidth = Math.max(1, width * TEXT_AREA_RATIO - effectPadding * 2);
    const fontSpec = (size: number) => `${currentPreset.fontStyle ?? 'normal'} ${currentPreset.fontWeight ?? 700} ${size}px ${currentPreset.fontFamily}`;
    let resolvedSize = fontSize;

    while (resolvedSize > MIN_FITTED_FONT_SIZE) {
      context.font = fontSpec(resolvedSize);
      const exceedsWidth = lines.some((line) => (
        context.measureText(line).width
        + Math.max(0, line.length - 1) * controls.letterSpacing
        > maxWidth
      ));
      if (!exceedsWidth) break;
      resolvedSize = Math.max(MIN_FITTED_FONT_SIZE, resolvedSize - 2);
    }

    context.font = fontSpec(resolvedSize);
    const textHeight = resolvedSize * LINE_HEIGHT_RATIO * Math.max(lines.length, 1);
    const verticalPadding = Math.max(24, effectPadding * 2 + resolvedSize * 0.12);
    return {
      fontSize: resolvedSize,
      height: Math.max(minimumHeight, Math.ceil(textHeight + verticalPadding)),
    };
  }, [controls.letterSpacing, controls.shadowBlur, controls.shadowOffset, controls.strokeWidth, currentPreset, fontSize]);

  const drawCanvas = useCallback((canvas: HTMLCanvasElement) => {
    if (!currentPreset) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const sourceLines = renderedText.split('\n');
    const lines = sourceLines.length ? sourceLines : [''];
    const layout = resolveTextLayout(context, lines, dimensions.width, dimensions.height);
    canvas.height = layout.height;
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (!transparent) {
      context.fillStyle = controls.backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (currentPreset.decoration === 'pixel' && !transparent) {
      context.globalAlpha = 0.12;
      context.fillStyle = '#ffffff';
      for (let y = 0; y < canvas.height; y += 48) {
        for (let x = (y / 48) % 2 ? 24 : 0; x < canvas.width; x += 48) {
          context.fillRect(x, y, 24, 24);
        }
      }
      context.globalAlpha = 1;
    }

    const fontSpec = (size: number) => `${currentPreset.fontStyle ?? 'normal'} ${currentPreset.fontWeight ?? 700} ${size}px ${currentPreset.fontFamily}`;
    const resolvedSize = layout.fontSize;
    const lineHeight = resolvedSize * LINE_HEIGHT_RATIO;
    const totalHeight = lineHeight * lines.length;
    const startY = (canvas.height - totalHeight) / 2 + resolvedSize * 0.92;

    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    context.lineJoin = currentPreset.decoration === 'pixel' ? 'miter' : 'round';
    context.miterLimit = 2;
    context.shadowColor = currentPreset.shadowColor ?? '#000000';
    context.shadowBlur = controls.shadowBlur;
    context.shadowOffsetX = controls.shadowOffset;
    context.shadowOffsetY = controls.shadowOffset;

    if (currentPreset.decoration === 'badge' && !transparent) {
      context.save();
      context.globalAlpha = 0.16;
      context.fillStyle = controls.textColor;
      context.beginPath();
      context.roundRect(canvas.width * 0.12, canvas.height * 0.2, canvas.width * 0.76, canvas.height * 0.6, 42);
      context.fill();
      context.restore();
    }

    if (currentPreset.decoration === 'lines') {
      context.save();
      context.shadowBlur = 0;
      context.strokeStyle = controls.textColor;
      context.lineWidth = Math.max(2, controls.strokeWidth);
      context.beginPath();
      context.moveTo(canvas.width * 0.16, canvas.height * 0.25);
      context.lineTo(canvas.width * 0.84, canvas.height * 0.25);
      context.moveTo(canvas.width * 0.16, canvas.height * 0.75);
      context.lineTo(canvas.width * 0.84, canvas.height * 0.75);
      context.stroke();
      context.restore();
    }

    if (currentPreset.decoration === 'sparkles') {
      context.save();
      context.shadowBlur = controls.shadowBlur;
      context.fillStyle = controls.textColor;
      context.font = `${Math.max(28, resolvedSize * 0.35)}px serif`;
      context.fillText('✦', canvas.width * 0.14, canvas.height * 0.28);
      context.fillText('✧', canvas.width * 0.85, canvas.height * 0.72);
      context.restore();
      context.font = fontSpec(resolvedSize);
    }

    const drawSpacedText = (line: string, x: number, y: number, mode: 'fill' | 'stroke') => {
      if (!controls.letterSpacing && !currentPreset.multicolor) {
        if (mode === 'stroke') context.strokeText(line, x, y);
        else context.fillText(line, x, y);
        return;
      }
      const characters = Array.from(line);
      const widths = characters.map((character) => context.measureText(character).width);
      const totalWidth = widths.reduce((sum, width) => sum + width, 0) + Math.max(0, characters.length - 1) * controls.letterSpacing;
      let cursor = x - totalWidth / 2;
      context.textAlign = 'left';
      characters.forEach((character, index) => {
        if (mode === 'fill' && currentPreset.multicolor) context.fillStyle = palette[index % palette.length];
        if (mode === 'stroke') context.strokeText(character, cursor, y);
        else context.fillText(character, cursor, y);
        cursor += widths[index] + controls.letterSpacing;
      });
      context.textAlign = 'center';
    };

    lines.forEach((line, index) => {
      const y = startY + index * lineHeight;
      context.font = fontSpec(resolvedSize);
      if (controls.strokeWidth > 0) {
        context.strokeStyle = controls.strokeColor;
        context.lineWidth = controls.strokeWidth * 2;
        drawSpacedText(line, canvas.width / 2, y, 'stroke');
      }
      if (currentPreset.gradient) {
        const gradient = context.createLinearGradient(0, y - resolvedSize, 0, y + resolvedSize * 0.2);
        gradient.addColorStop(0, currentPreset.gradient[0]);
        gradient.addColorStop(1, currentPreset.gradient[1]);
        context.fillStyle = gradient;
      } else {
        context.fillStyle = controls.textColor;
      }
      drawSpacedText(line, canvas.width / 2, y, 'fill');
    });
  }, [controls, currentPreset, dimensions, renderedText, resolveTextLayout, transparent]);

  useEffect(() => {
    if (canvasRef.current) drawCanvas(canvasRef.current);
  }, [drawCanvas]);

  const exportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(blob, `${fileSlug(pageTitle)}-${fileSlug(currentPreset.name)}.png`);
      setStatusMessage('PNG downloaded.');
    }, 'image/png');
  };

  const buildSvg = () => {
    const width = dimensions.width;
    const lines = renderedText.split('\n');
    const measureCanvas = document.createElement('canvas');
    const measureContext = measureCanvas.getContext('2d');
    const layout = measureContext
      ? resolveTextLayout(measureContext, lines, width, dimensions.height)
      : { fontSize, height: dimensions.height };
    const resolvedSize = layout.fontSize;
    const height = layout.height;
    const lineHeight = resolvedSize * LINE_HEIGHT_RATIO;
    const startY = (height - lineHeight * lines.length) / 2 + resolvedSize * 0.92;
    const gradientId = `gradient-${currentPreset.id}`;
    const filterId = `shadow-${currentPreset.id}`;
    const fill = currentPreset.gradient ? `url(#${gradientId})` : controls.textColor;
    const textAttributes = `font-family="${escapeXml(currentPreset.fontFamily)}" font-size="${resolvedSize}" font-weight="${currentPreset.fontWeight ?? 700}" font-style="${currentPreset.fontStyle ?? 'normal'}" letter-spacing="${controls.letterSpacing}" fill="${fill}" stroke="${controls.strokeWidth ? controls.strokeColor : 'none'}" stroke-width="${controls.strokeWidth * 2}" paint-order="stroke fill" filter="url(#${filterId})"`;
    const textElements = lines.map((line, lineIndex) => {
      const y = startY + lineIndex * lineHeight;
      if (currentPreset.multicolor) {
        const chars = Array.from(line).map((character, index) => `<tspan fill="${palette[index % palette.length]}">${escapeXml(character)}</tspan>`).join('');
        return `<text x="50%" y="${y}" text-anchor="middle" ${textAttributes}>${chars}</text>`;
      }
      return `<text x="50%" y="${y}" text-anchor="middle" ${textAttributes}>${escapeXml(line)}</text>`;
    }).join('\n  ');
    const background = transparent ? '' : `<rect width="100%" height="100%" fill="${controls.backgroundColor}"/>`;
    const gradient = currentPreset.gradient ? `<linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${currentPreset.gradient[0]}"/><stop offset="1" stop-color="${currentPreset.gradient[1]}"/></linearGradient>` : '';
    const decorations = currentPreset.decoration === 'lines'
      ? `<path d="M ${width * 0.16} ${height * 0.25} H ${width * 0.84} M ${width * 0.16} ${height * 0.75} H ${width * 0.84}" stroke="${controls.textColor}" stroke-width="${Math.max(2, controls.strokeWidth)}"/>`
      : currentPreset.decoration === 'sparkles'
        ? `<text x="14%" y="28%" font-size="${Math.max(28, resolvedSize * 0.35)}" fill="${controls.textColor}">✦</text><text x="85%" y="72%" font-size="${Math.max(28, resolvedSize * 0.35)}" fill="${controls.textColor}">✧</text>`
        : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>${gradient}<filter id="${filterId}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="${controls.shadowOffset}" dy="${controls.shadowOffset}" stdDeviation="${controls.shadowBlur / 2}" flood-color="${currentPreset.shadowColor ?? '#000000'}"/></filter></defs>
  ${background}
  ${decorations}
  ${textElements}
</svg>`;
  };

  const exportSvg = () => {
    downloadBlob(new Blob([buildSvg()], { type: 'image/svg+xml;charset=utf-8' }), `${fileSlug(pageTitle)}-${fileSlug(currentPreset.name)}.svg`);
    setStatusMessage('SVG downloaded. It keeps editable text and may need the named font on another device.');
  };

  return (
    <section id="generator" aria-labelledby="visual-generator-heading" className="mt-8 rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-950">
      <div className="rounded-t-[2rem] bg-slate-950 px-5 py-4 text-white sm:px-8 sm:py-5">
        <h2 id="visual-generator-heading" className="text-xl font-bold sm:text-2xl">Create {pageTitle.replace(/\s+Generator$/i, '')}</h2>
        <p className="mt-1.5 max-w-4xl text-sm leading-5 text-slate-300 sm:leading-6">{config.resultIntro}</p>
      </div>

      <div className="grid items-start gap-7 p-5 sm:p-8 xl:grid-cols-[330px_minmax(0,1fr)]">
        <div className="space-y-5">
          <div>
            <label htmlFor="visual-text-input" className="text-sm font-semibold text-slate-900 dark:text-white">Your text</label>
            <textarea id="visual-text-input" value={inputText} onChange={(event) => setInputText(event.target.value)} rows={3} maxLength={120} placeholder="Type a short title" className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-base outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-900" />
            <div className="mt-2 flex justify-between text-xs text-slate-500"><span>Canvas grows with additional lines</span><span>{inputText.length}/120</span></div>
            <p className="mt-1 text-xs text-slate-500">Rendered locally—your text isn&apos;t uploaded.</p>
          </div>

          <div>
            <label htmlFor="visual-preset" className="text-sm font-semibold text-slate-900 dark:text-white">Style preset</label>
            <select id="visual-preset" value={presetId} onChange={(event) => {
              const next = config.presets.find((item) => item.id === event.target.value);
              if (next) selectPreset(next);
            }} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900">
              {config.presets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <p className="mt-2 text-xs leading-5 text-slate-500">{currentPreset.description}</p>
            {currentPreset.targetFont && (
              <p className={`mt-2 rounded-lg px-3 py-2 text-xs font-semibold ${fontAvailable ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                {fontAvailable ? `${currentPreset.targetFont} detected on this device.` : `${currentPreset.targetFont} was not detected; the labelled fallback is shown.`}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Font size
              <input aria-label="Font size" type="range" min="44" max="180" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} className="mt-2 w-full" />
              <span className="mt-1 block font-normal text-slate-500">{fontSize}px</span>
            </label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Letter spacing
              <input aria-label="Letter spacing" type="range" min="-3" max="16" value={controls.letterSpacing} onChange={(event) => setControls((value) => ({ ...value, letterSpacing: Number(event.target.value) }))} className="mt-2 w-full" />
              <span className="mt-1 block font-normal text-slate-500">{controls.letterSpacing}px</span>
            </label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Outline
              <input aria-label="Outline width" type="range" min="0" max="8" value={controls.strokeWidth} onChange={(event) => setControls((value) => ({ ...value, strokeWidth: Number(event.target.value) }))} className="mt-2 w-full" />
              <span className="mt-1 block font-normal text-slate-500">{controls.strokeWidth}px</span>
            </label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Shadow
              <input aria-label="Shadow amount" type="range" min="0" max="24" value={controls.shadowOffset} onChange={(event) => setControls((value) => ({ ...value, shadowOffset: Number(event.target.value) }))} className="mt-2 w-full" />
              <span className="mt-1 block font-normal text-slate-500">{controls.shadowOffset}px</span>
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Text
              <input aria-label="Text color" type="color" value={controls.textColor} onChange={(event) => setControls((value) => ({ ...value, textColor: event.target.value }))} className="mt-2 h-10 w-full rounded border border-slate-300" />
            </label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Outline
              <input aria-label="Outline color" type="color" value={controls.strokeColor} onChange={(event) => setControls((value) => ({ ...value, strokeColor: event.target.value }))} className="mt-2 h-10 w-full rounded border border-slate-300" />
            </label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Background
              <input aria-label="Background color" type="color" value={controls.backgroundColor} disabled={transparent} onChange={(event) => setControls((value) => ({ ...value, backgroundColor: event.target.value }))} className="mt-2 h-10 w-full rounded border border-slate-300 disabled:opacity-40" />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={transparent} onChange={(event) => setTransparent(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-violet-600" />
            Transparent background
          </label>

          <button type="button" onClick={() => { setInputText(''); setStatusMessage('Canvas cleared.'); }} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold hover:border-violet-400 dark:border-slate-700">Clear</button>
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-950 dark:text-white">Live artwork preview</h3>
              <p className="mt-1 text-xs text-slate-500">The PNG download matches this browser-rendered canvas.</p>
            </div>
            <select aria-label="Canvas format" value={format} onChange={(event) => setFormat(event.target.value as CanvasFormat)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
              {Object.entries(formats).map(([id, item]) => <option key={id} value={id}>{item.label} · {item.width}px wide</option>)}
            </select>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0] p-2 dark:border-slate-700 dark:opacity-95">
            <canvas ref={canvasRef} role="img" aria-label={`${currentPreset.name} preview of ${renderedText || 'empty text'}`} className="block h-auto w-full rounded-xl" />
          </div>
          {!inputText && <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">Enter text to create a downloadable design.</p>}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={exportPng} disabled={!inputText} className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-45">Download PNG</button>
            <button type="button" onClick={exportSvg} disabled={!inputText} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-white dark:text-slate-950">Download editable SVG</button>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <p><strong className="text-slate-800 dark:text-slate-200">Font source:</strong> {currentPreset.sourceLabel}</p>
            <p className="mt-1"><strong className="text-slate-800 dark:text-slate-200">Export note:</strong> {currentPreset.licenseNote}</p>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">{config.compatibilityNote}</p>
          <p className="sr-only" aria-live="polite">{statusMessage}</p>
        </div>
      </div>
    </section>
  );
}
