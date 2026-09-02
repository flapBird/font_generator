'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VisualFontPreset, VisualGeneratorConfig } from '@/lib/visual-generator';
import { convertToFancyText } from '@/lib/fonts';
import { segmentGraphemes } from '@/lib/unicode';

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

const sfWeights = [
  { label: 'Thin', value: 100 },
  { label: 'Ultralight', value: 200 },
  { label: 'Light', value: 300 },
  { label: 'Regular', value: 400 },
  { label: 'Medium', value: 500 },
  { label: 'Semibold', value: 600 },
  { label: 'Bold', value: 700 },
  { label: 'Heavy', value: 800 },
  { label: 'Black', value: 900 },
] as const;

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
  shadowOffsetX: preset.shadowOffsetX ?? 0,
  shadowOffsetY: preset.shadowOffsetY ?? 0,
  letterSpacing: preset.letterSpacing ?? 0,
});

export default function VisualGeneratorTool({
  config,
  pageTitle,
}: VisualGeneratorToolProps) {
  const isSanFrancisco = pageTitle === 'San Francisco Font Generator';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mobileCanvasRef = useRef<HTMLCanvasElement>(null);
  const [inputText, setInputText] = useState(config.initialText);
  const [presetId, setPresetId] = useState(config.presets[0]?.id ?? '');
  const [fontSize, setFontSize] = useState(112);
  const [format, setFormat] = useState<CanvasFormat>('banner');
  const [transparent, setTransparent] = useState(false);
  const [fontAvailable, setFontAvailable] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [backgroundImageDataUrl, setBackgroundImageDataUrl] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [minecraftColorCode, setMinecraftColorCode] = useState('a');
  const [minecraftBold, setMinecraftBold] = useState(false);
  const [controls, setControls] = useState(() => applyPreset(config.presets[0]));
  const [selectedFontWeight, setSelectedFontWeight] = useState(config.presets[0]?.fontWeight ?? 400);
  const [isApplePlatform, setIsApplePlatform] = useState<boolean | null>(null);

  const currentPreset = useMemo(
    () => config.presets.find((item) => item.id === presetId) ?? config.presets[0],
    [config.presets, presetId],
  );
  const activeFontWeight = isSanFrancisco ? selectedFontWeight : (currentPreset?.fontWeight ?? 700);
  const dimensions = formats[format];
  const renderedText = currentPreset?.uppercase ? inputText.toUpperCase() : inputText;
  const hasCapability = useCallback(
    (capability: NonNullable<VisualGeneratorConfig['capabilities']>[number]) => config.capabilities?.includes(capability) ?? false,
    [config.capabilities],
  );
  const minecraftCode = `§${minecraftColorCode}${minecraftBold ? '§l' : ''}${inputText}`;
  const fortniteNameAlternative = convertToFancyText(inputText, 'bold');

  const selectPreset = (preset: VisualFontPreset, preserveWeight = false) => {
    setPresetId(preset.id);
    setControls(applyPreset(preset));
    if (isSanFrancisco && !preserveWeight) setSelectedFontWeight(preset.fontWeight ?? 400);
  };

  useEffect(() => {
    if (!isSanFrancisco) return;
    const timer = window.setTimeout(() => {
      const platform = `${navigator.platform ?? ''} ${navigator.userAgent ?? ''}`;
      setIsApplePlatform(/Mac|iPhone|iPad|iPod/i.test(platform));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isSanFrancisco]);

  const loadBackgroundImage = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const image = new Image();
      image.onload = () => {
        setBackgroundImageDataUrl(reader.result as string);
        setBackgroundImage(image);
        setStatusMessage(`${file.name} loaded locally as the canvas background.`);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    let active = true;
    const checkFont = async () => {
      if (!currentPreset?.targetFont || !document.fonts) {
        setFontAvailable(null);
        return;
      }
      if (active) setFontAvailable(null);
      try {
        const fontStyle = currentPreset.fontStyle ?? 'normal';
        const fontWeight = activeFontWeight;
        const testString = 'mmmmmmmmmmlliWW@#';
        await document.fonts.load(
          `${fontStyle} ${fontWeight} 72px ${JSON.stringify(currentPreset.targetFont)}`,
          testString,
        );
        await document.fonts.ready;
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
      } catch {
        if (active) setFontAvailable(false);
      }
    };
    void checkFont();
    return () => { active = false; };
  }, [activeFontWeight, currentPreset]);

  const resolveTextLayout = useCallback((
    context: CanvasRenderingContext2D,
    lines: string[],
    width: number,
    minimumHeight: number,
  ) => {
    if (!currentPreset) return { fontSize, height: minimumHeight };

    const effectPadding = Math.max(
      controls.strokeWidth * 2,
      controls.shadowBlur + Math.max(Math.abs(controls.shadowOffsetX), Math.abs(controls.shadowOffsetY)),
    );
    const maxWidth = Math.max(1, width * TEXT_AREA_RATIO - effectPadding * 2);
    const fontSpec = (size: number) => `${currentPreset.fontStyle ?? 'normal'} ${activeFontWeight} ${size}px ${currentPreset.fontFamily}`;
    let resolvedSize = fontSize;

    while (config.fitTextToCanvas !== false && resolvedSize > MIN_FITTED_FONT_SIZE) {
      context.font = fontSpec(resolvedSize);
      const exceedsWidth = lines.some((line) => (
        context.measureText(line).width
        + Math.max(0, segmentGraphemes(line).length - 1) * controls.letterSpacing
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
  }, [activeFontWeight, config.fitTextToCanvas, controls.letterSpacing, controls.shadowBlur, controls.shadowOffsetX, controls.shadowOffsetY, controls.strokeWidth, currentPreset, fontSize]);

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

    if (backgroundImage) {
      const scale = Math.max(canvas.width / backgroundImage.width, canvas.height / backgroundImage.height);
      const width = backgroundImage.width * scale;
      const height = backgroundImage.height * scale;
      context.drawImage(backgroundImage, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
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

    const fontSpec = (size: number) => `${currentPreset.fontStyle ?? 'normal'} ${activeFontWeight} ${size}px ${currentPreset.fontFamily}`;
    const resolvedSize = hasCapability('pixel-snap')
      ? Math.max(MIN_FITTED_FONT_SIZE, Math.round(layout.fontSize / 8) * 8)
      : layout.fontSize;
    const lineHeight = resolvedSize * LINE_HEIGHT_RATIO;
    const totalHeight = lineHeight * lines.length;
    const startY = (canvas.height - totalHeight) / 2 + resolvedSize * 0.92;

    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    context.lineJoin = currentPreset.decoration === 'pixel' ? 'miter' : 'round';
    context.miterLimit = 2;
    context.shadowColor = currentPreset.shadowColor ?? '#000000';
    context.shadowBlur = controls.shadowBlur;
    context.shadowOffsetX = controls.shadowOffsetX;
    context.shadowOffsetY = controls.shadowOffsetY;

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

    if (currentPreset.decoration === 'flames') {
      const drawFlame = (x: number, baseY: number, size: number) => {
        context.beginPath();
        context.moveTo(x, baseY);
        context.bezierCurveTo(x - size * 0.65, baseY - size * 0.25, x - size * 0.35, baseY - size * 0.9, x, baseY - size * 1.3);
        context.bezierCurveTo(x + size * 0.1, baseY - size * 0.78, x + size * 0.72, baseY - size * 0.45, x, baseY);
        context.closePath();
        context.fill();
      };
      context.save();
      context.globalAlpha = 0.7;
      context.shadowBlur = controls.shadowBlur;
      context.fillStyle = currentPreset.accentColor ?? controls.textColor;
      drawFlame(canvas.width * 0.11, canvas.height * 0.83, Math.max(42, resolvedSize * 0.65));
      drawFlame(canvas.width * 0.89, canvas.height * 0.83, Math.max(42, resolvedSize * 0.65));
      context.restore();
    }

    const drawSpacedText = (line: string, x: number, y: number, mode: 'fill' | 'stroke') => {
      if (!controls.letterSpacing && !currentPreset.multicolor && currentPreset.decoration !== 'ransom') {
        if (mode === 'stroke') context.strokeText(line, x, y);
        else context.fillText(line, x, y);
        return;
      }
      const characters = segmentGraphemes(line);
      const fontForIndex = (index: number) => currentPreset.fontAlternates?.[index % currentPreset.fontAlternates.length] ?? currentPreset.fontFamily;
      const widths = characters.map((character, index) => {
        context.font = `${currentPreset.fontStyle ?? 'normal'} ${activeFontWeight} ${resolvedSize}px ${fontForIndex(index)}`;
        return context.measureText(character).width;
      });
      const totalWidth = widths.reduce((sum, width) => sum + width, 0) + Math.max(0, characters.length - 1) * controls.letterSpacing;
      let cursor = x - totalWidth / 2;
      context.textAlign = 'left';
      characters.forEach((character, index) => {
        context.font = `${currentPreset.fontStyle ?? 'normal'} ${activeFontWeight} ${resolvedSize}px ${fontForIndex(index)}`;
        if (mode === 'fill' && currentPreset.multicolor) context.fillStyle = palette[index % palette.length];
        if (mode === 'fill' && currentPreset.decoration === 'ransom' && !/\s/u.test(character)) {
          const centerX = cursor + widths[index] / 2;
          const tilt = ((index % 2 ? -1 : 1) * (currentPreset.characterTilt ?? 5) * Math.PI) / 180;
          context.save();
          context.translate(centerX, y - resolvedSize * 0.34 + (index % 3 - 1) * resolvedSize * 0.06);
          context.rotate(tilt);
          context.shadowBlur = 0;
          context.shadowOffsetX = 0;
          context.shadowOffsetY = 0;
          context.fillStyle = currentPreset.characterBackgrounds?.[index % currentPreset.characterBackgrounds.length] ?? '#ffffff';
          context.fillRect(-widths[index] / 2 - resolvedSize * 0.08, -resolvedSize * 0.7, widths[index] + resolvedSize * 0.16, resolvedSize * 0.95);
          context.fillStyle = index % 4 === 1 ? '#dc2626' : controls.textColor;
          context.textAlign = 'center';
          context.fillText(character, 0, resolvedSize * 0.34);
          context.restore();
        } else if (mode === 'stroke') context.strokeText(character, cursor, y);
        else context.fillText(character, cursor, y);
        cursor += widths[index] + controls.letterSpacing;
      });
      context.textAlign = 'center';
      context.font = fontSpec(resolvedSize);
    };

    lines.forEach((line, index) => {
      const centeredY = startY + index * lineHeight;
      const y = hasCapability('meme-layout') && lines.length > 1
        ? index === 0
          ? resolvedSize * 1.08
          : index === lines.length - 1
            ? canvas.height - resolvedSize * 0.28
            : centeredY
        : centeredY;
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
  }, [activeFontWeight, backgroundImage, controls, currentPreset, dimensions, hasCapability, renderedText, resolveTextLayout, transparent]);

  useEffect(() => {
    if (canvasRef.current) drawCanvas(canvasRef.current);
    if (mobileCanvasRef.current) drawCanvas(mobileCanvasRef.current);
  }, [drawCanvas, fontAvailable]);

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
    const resolvedSize = hasCapability('pixel-snap')
      ? Math.max(MIN_FITTED_FONT_SIZE, Math.round(layout.fontSize / 8) * 8)
      : layout.fontSize;
    const height = layout.height;
    const lineHeight = resolvedSize * LINE_HEIGHT_RATIO;
    const startY = (height - lineHeight * lines.length) / 2 + resolvedSize * 0.92;
    const gradientId = `gradient-${currentPreset.id}`;
    const filterId = `shadow-${currentPreset.id}`;
    const fill = currentPreset.gradient ? `url(#${gradientId})` : controls.textColor;
    const textAttributes = `font-family="${escapeXml(currentPreset.fontFamily)}" font-size="${resolvedSize}" font-weight="${activeFontWeight}" font-style="${currentPreset.fontStyle ?? 'normal'}" letter-spacing="${controls.letterSpacing}" fill="${fill}" stroke="${controls.strokeWidth ? controls.strokeColor : 'none'}" stroke-width="${controls.strokeWidth * 2}" paint-order="stroke fill" filter="url(#${filterId})"`;
    const textElements = lines.map((line, lineIndex) => {
      const centeredY = startY + lineIndex * lineHeight;
      const y = hasCapability('meme-layout') && lines.length > 1
        ? lineIndex === 0
          ? resolvedSize * 1.08
          : lineIndex === lines.length - 1
            ? height - resolvedSize * 0.28
            : centeredY
        : centeredY;
      if (currentPreset.multicolor) {
        const chars = segmentGraphemes(line)
          .map((character, index) => `<tspan fill="${palette[index % palette.length]}">${escapeXml(character)}</tspan>`)
          .join('');
        return `<text x="50%" y="${y}" text-anchor="middle" ${textAttributes}>${chars}</text>`;
      }
      return `<text x="50%" y="${y}" text-anchor="middle" ${textAttributes}>${escapeXml(line)}</text>`;
    }).join('\n  ');
    const background = transparent ? '' : `<rect width="100%" height="100%" fill="${controls.backgroundColor}"/>`;
    const backgroundAsset = backgroundImageDataUrl
      ? `<image href="${escapeXml(backgroundImageDataUrl)}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"/>`
      : '';
    const gradient = currentPreset.gradient
      ? `<linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${currentPreset.gradient[0]}"/><stop offset="1" stop-color="${currentPreset.gradient[1]}"/></linearGradient>`
      : '';
    const pixelPattern = currentPreset.decoration === 'pixel' && !transparent
      ? '<pattern id="pixel-grid" width="96" height="96" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#ffffff" opacity=".12"/><rect x="48" y="48" width="24" height="24" fill="#ffffff" opacity=".12"/></pattern>'
      : '';
    const decorations = [
      currentPreset.decoration === 'lines'
        ? `<path d="M ${width * 0.16} ${height * 0.25} H ${width * 0.84} M ${width * 0.16} ${height * 0.75} H ${width * 0.84}" stroke="${controls.textColor}" stroke-width="${Math.max(2, controls.strokeWidth)}"/>`
        : '',
      currentPreset.decoration === 'sparkles'
        ? `<text x="14%" y="28%" font-size="${Math.max(28, resolvedSize * 0.35)}" fill="${controls.textColor}">✦</text><text x="85%" y="72%" font-size="${Math.max(28, resolvedSize * 0.35)}" fill="${controls.textColor}">✧</text>`
        : '',
      currentPreset.decoration === 'badge' && !transparent
        ? `<rect x="12%" y="20%" width="76%" height="60%" rx="42" fill="${controls.textColor}" opacity=".16"/>`
        : '',
      currentPreset.decoration === 'pixel' && !transparent
        ? '<rect width="100%" height="100%" fill="url(#pixel-grid)"/>'
        : '',
      currentPreset.decoration === 'flames'
        ? `<g fill="${currentPreset.accentColor ?? controls.textColor}" opacity=".7"><path d="M ${width * 0.11} ${height * 0.83} C ${width * 0.06} ${height * 0.74}, ${width * 0.08} ${height * 0.55}, ${width * 0.11} ${height * 0.43} C ${width * 0.12} ${height * 0.62}, ${width * 0.17} ${height * 0.72}, ${width * 0.11} ${height * 0.83} Z"/><path d="M ${width * 0.89} ${height * 0.83} C ${width * 0.84} ${height * 0.74}, ${width * 0.86} ${height * 0.55}, ${width * 0.89} ${height * 0.43} C ${width * 0.9} ${height * 0.62}, ${width * 0.95} ${height * 0.72}, ${width * 0.89} ${height * 0.83} Z"/></g>`
        : '',
    ].join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>${gradient}${pixelPattern}<filter id="${filterId}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="${controls.shadowOffsetX}" dy="${controls.shadowOffsetY}" stdDeviation="${controls.shadowBlur / 2}" flood-color="${currentPreset.shadowColor ?? '#000000'}"/></filter></defs>
  ${background}
  ${backgroundAsset}
  ${decorations}
  ${textElements}
</svg>`;
  };

  const exportSvg = () => {
    downloadBlob(new Blob([buildSvg()], { type: 'image/svg+xml;charset=utf-8' }), `${fileSlug(pageTitle)}-${fileSlug(currentPreset.name)}.svg`);
    setStatusMessage('SVG downloaded. It keeps editable text and may need the named font on another device.');
  };

  const exportFaithfulSvg = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const png = canvas.toDataURL('image/png');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}"><image href="${png}" width="100%" height="100%"/></svg>`;
    downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${fileSlug(pageTitle)}-${fileSlug(currentPreset.name)}-faithful.svg`);
    setStatusMessage('Faithful SVG downloaded. It embeds the exact canvas as an image.');
  };

  const copyUtilityText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatusMessage(`${label} copied.`);
    } catch {
      setStatusMessage('Copy was blocked by the browser. Select the value and copy it manually.');
    }
  };

  if (isSanFrancisco) {
    const fontPresetId = currentPreset.targetFont === 'SF Pro Text' ? 'sf-text' : 'sf-display';
    const fontPresets = config.presets.filter((preset) => preset.id === 'sf-display' || preset.id === 'sf-text');
    const designPresets = config.presets.filter((preset) => preset.id !== 'sf-display' && preset.id !== 'sf-text');
    const previewText = renderedText || 'Type your text above';

    return (
      <section id="generator" aria-labelledby="visual-generator-heading" className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-950">
        <div className="bg-slate-950 px-5 py-4 text-white sm:px-8 sm:py-5">
          <h2 id="visual-generator-heading" className="text-xl font-bold sm:text-2xl">Create San Francisco-style artwork</h2>
          <p className="mt-1.5 max-w-4xl text-sm leading-5 text-slate-300 sm:leading-6">Enter your text, compare the same phrase across SF Pro weights, then refine and download the artwork.</p>
        </div>

        <div className="space-y-8 p-5 sm:p-8">
          <div>
            <label htmlFor="visual-text-input" className="text-sm font-semibold text-slate-900 dark:text-white">Your text</label>
            <textarea
              id="visual-text-input"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              rows={2}
              maxLength={120}
              placeholder="Type a short title"
              className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-lg outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-900"
            />
            <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
              <span>Every weight preview updates as you type. Your text stays in this browser.</span>
              <span>{inputText.length}/120</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-semibold text-slate-900 dark:text-white">
              Font / Style
              <select
                aria-label="Font or style"
                value={fontPresetId}
                onChange={(event) => {
                  const next = fontPresets.find((preset) => preset.id === event.target.value);
                  if (next) selectPreset(next, true);
                }}
                className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal dark:border-slate-700 dark:bg-slate-900"
              >
                {fontPresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-900 dark:text-white">
              Weight
              <select
                aria-label="Font weight"
                value={selectedFontWeight}
                onChange={(event) => setSelectedFontWeight(Number(event.target.value))}
                className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal dark:border-slate-700 dark:bg-slate-900"
              >
                {sfWeights.map((weight) => <option key={weight.value} value={weight.value}>{weight.label} {weight.value}</option>)}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-900 dark:text-white">
              Font size
              <span className="float-right font-normal text-slate-500">{fontSize}px</span>
              <input aria-label="Font size" type="range" min="44" max="180" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} className="mt-3 block w-full" />
            </label>
          </div>

          <p className={`rounded-xl border px-4 py-3 text-sm leading-6 ${isApplePlatform === false ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200' : 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'}`}>
            {isApplePlatform === null
              ? 'Checking the system font environment…'
              : isApplePlatform
                ? 'SF Pro / San Francisco is available through the Apple system font stack.'
                : 'San Francisco may not be installed on this device. A system UI fallback may be shown, and is not represented as SF Pro.'}
          </p>

          <section aria-labelledby="compare-sf-styles-heading">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 id="compare-sf-styles-heading" className="text-xl font-black text-slate-950 dark:text-white">Compare SF Pro Styles</h3>
                <p className="mt-1 text-sm text-slate-500">Choose a card to apply that weight to the live artwork.</p>
              </div>
              <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">Selected: {sfWeights.find((weight) => weight.value === selectedFontWeight)?.label} {selectedFontWeight}</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="San Francisco font weight comparison">
              {sfWeights.map((weight) => {
                const selected = weight.value === selectedFontWeight;
                return (
                  <button
                    key={weight.value}
                    type="button"
                    onClick={() => setSelectedFontWeight(weight.value)}
                    aria-pressed={selected}
                    className={`min-w-0 rounded-2xl border p-4 text-left transition ${selected ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-500/20 dark:bg-violet-950/30' : 'border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-700'}`}
                  >
                    <span className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <span>{weight.label} {weight.value}</span>
                      {selected && <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] tracking-normal text-white">Selected</span>}
                    </span>
                    <span className="mt-3 block truncate text-2xl leading-tight text-slate-950 dark:text-white" style={{ fontFamily: currentPreset.fontFamily, fontWeight: weight.value }}>{previewText}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="sf-live-preview-heading">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 id="sf-live-preview-heading" className="text-xl font-black text-slate-950 dark:text-white">Live Artwork Preview</h3>
                <p className="mt-1 text-xs text-slate-500">The PNG download matches this browser-rendered canvas.</p>
              </div>
              <select aria-label="Canvas format" value={format} onChange={(event) => setFormat(event.target.value as CanvasFormat)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
                {Object.entries(formats).map(([id, item]) => <option key={id} value={id}>{item.label} · {item.width} × {item.height}</option>)}
              </select>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0] p-2 dark:border-slate-700 dark:opacity-95">
              <canvas ref={canvasRef} role="img" aria-label={`${currentPreset.name} ${activeFontWeight} preview of ${renderedText || 'empty text'}`} className="block h-auto w-full rounded-xl" />
            </div>
            {!inputText && <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">Enter text to create a downloadable design.</p>}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <button type="button" onClick={exportPng} disabled={!inputText} className="min-h-11 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-45">Download PNG</button>
              <button type="button" onClick={exportSvg} disabled={!inputText} className="min-h-11 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-white dark:text-slate-950">Download editable SVG</button>
              <button type="button" onClick={exportFaithfulSvg} disabled={!inputText} className="min-h-11 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-800 hover:border-violet-400 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:text-slate-200">Download faithful SVG</button>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">Editable SVG keeps selectable text and may use a fallback on another device. Faithful SVG embeds the exact canvas appearance.</p>
            {statusMessage && <p className="mt-3 rounded-lg bg-violet-50 px-3 py-2 text-xs font-medium text-violet-800 dark:bg-violet-950/40 dark:text-violet-300" aria-live="polite">{statusMessage}</p>}
          </section>

          <section aria-labelledby="sf-customize-heading" className="grid items-start gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
              <h3 id="sf-customize-heading" className="font-black text-slate-950 dark:text-white">Basic customization</h3>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Text color
                  <input aria-label="Text color" type="color" value={controls.textColor} onChange={(event) => setControls((value) => ({ ...value, textColor: event.target.value }))} className="mt-2 h-11 w-full rounded border border-slate-300" />
                </label>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Background color
                  <input aria-label="Background color" type="color" value={controls.backgroundColor} disabled={transparent} onChange={(event) => setControls((value) => ({ ...value, backgroundColor: event.target.value }))} className="mt-2 h-11 w-full rounded border border-slate-300 disabled:opacity-40" />
                </label>
              </div>

              <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Design presets</p>
                <p className="mt-1 text-xs text-slate-500">These change the artwork treatment, not the font family.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {designPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => selectPreset(preset)}
                      aria-pressed={preset.id === presetId}
                      className={`rounded-xl border p-3 text-left ${preset.id === presetId ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-slate-200 hover:border-violet-300 dark:border-slate-700'}`}
                    >
                      <span className="block font-bold text-slate-950 dark:text-white">{preset.name}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">{preset.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <details className="group rounded-2xl border border-slate-200 p-5 open:border-violet-300 dark:border-slate-800 dark:open:border-violet-700">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-black text-slate-950 dark:text-white">
                Advanced customization
                <span aria-hidden="true" className="text-xl text-violet-600 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-1 text-xs text-slate-500">Spacing, outline, shadow, and transparency.</p>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Letter spacing
                  <input aria-label="Letter spacing" type="range" min="-3" max="16" value={controls.letterSpacing} onChange={(event) => setControls((value) => ({ ...value, letterSpacing: Number(event.target.value) }))} className="mt-2 w-full" />
                  <span className="mt-1 block font-normal text-slate-500">{controls.letterSpacing}px</span>
                </label>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Outline width
                  <input aria-label="Outline width" type="range" min="0" max="8" value={controls.strokeWidth} onChange={(event) => setControls((value) => ({ ...value, strokeWidth: Number(event.target.value) }))} className="mt-2 w-full" />
                  <span className="mt-1 block font-normal text-slate-500">{controls.strokeWidth}px</span>
                </label>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Shadow X
                  <input aria-label="Horizontal shadow offset" type="range" min="-24" max="24" value={controls.shadowOffsetX} onChange={(event) => setControls((value) => ({ ...value, shadowOffsetX: Number(event.target.value) }))} className="mt-2 w-full" />
                  <span className="mt-1 block font-normal text-slate-500">{controls.shadowOffsetX}px</span>
                </label>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Shadow Y
                  <input aria-label="Vertical shadow offset" type="range" min="-24" max="24" value={controls.shadowOffsetY} onChange={(event) => setControls((value) => ({ ...value, shadowOffsetY: Number(event.target.value) }))} className="mt-2 w-full" />
                  <span className="mt-1 block font-normal text-slate-500">{controls.shadowOffsetY}px</span>
                </label>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Shadow blur
                  <input aria-label="Shadow blur" type="range" min="0" max="30" value={controls.shadowBlur} onChange={(event) => setControls((value) => ({ ...value, shadowBlur: Number(event.target.value) }))} className="mt-2 w-full" />
                  <span className="mt-1 block font-normal text-slate-500">{controls.shadowBlur}px</span>
                </label>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Outline color
                  <input aria-label="Outline color" type="color" value={controls.strokeColor} onChange={(event) => setControls((value) => ({ ...value, strokeColor: event.target.value }))} className="mt-2 h-10 w-full rounded border border-slate-300" />
                </label>
              </div>
              <label className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={transparent} onChange={(event) => setTransparent(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-violet-600" />
                Transparent background
              </label>
              <button type="button" onClick={() => { setInputText(''); setStatusMessage('Canvas cleared.'); }} className="mt-5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold hover:border-violet-400 dark:border-slate-700">Clear text</button>
            </details>
          </section>

          <section aria-labelledby="sf-typeface-preview-heading" className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300">Typeface specimen</p>
            <h3 id="sf-typeface-preview-heading" className="mt-1 text-xl font-black text-slate-950 dark:text-white">Typeface Preview</h3>
            <div className="mt-4 space-y-2 break-words text-2xl leading-snug text-slate-950 sm:text-3xl dark:text-white" style={{ fontFamily: currentPreset.fontFamily, fontWeight: activeFontWeight }}>
              <p>ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
              <p>abcdefghijklmnopqrstuvwxyz</p>
              <p>0123456789</p>
              <p>! ? @ # $ % &amp;</p>
              <p className="pt-2 text-xl sm:text-2xl">The quick brown fox jumps over the lazy dog.</p>
            </div>
            <dl className="mt-5 grid gap-2 text-xs sm:grid-cols-3">
              <div><dt className="font-bold text-slate-700 dark:text-slate-300">Requested weight</dt><dd className="mt-1 text-slate-500">{activeFontWeight}</dd></div>
              <div><dt className="font-bold text-slate-700 dark:text-slate-300">Font style</dt><dd className="mt-1 text-slate-500">{fontPresetId === 'sf-text' ? 'SF Text / System UI' : 'SF Display / System UI'}</dd></div>
              <div><dt className="font-bold text-slate-700 dark:text-slate-300">Font stack</dt><dd className="mt-1 break-words text-slate-500">{currentPreset.fontFamily}</dd></div>
            </dl>
          </section>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <p><strong className="text-slate-800 dark:text-slate-200">Font source:</strong> Apple system UI stack when available; otherwise the device&apos;s system UI fallback.</p>
            <p className="mt-1"><strong className="text-slate-800 dark:text-slate-200">Licensing:</strong> No Apple SF Pro font files are uploaded, bundled, or redistributed by this site.</p>
          </div>
        </div>
      </section>
    );
  }

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
            <div className="mt-2 flex justify-between gap-3 text-xs text-slate-500"><span>{hasCapability('meme-layout') ? 'First line goes on top; the final line goes on the bottom.' : 'Canvas grows with additional lines'}</span><span>{inputText.length}/120</span></div>
            <p className="mt-1 text-xs text-slate-500">Rendered locally—your text isn&apos;t uploaded.</p>
          </div>

          <div className="xl:hidden">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-950 dark:text-white">Live artwork preview</h3>
                <p className="mt-1 text-xs text-slate-500">Updates as you adjust the controls below.</p>
              </div>
              <select aria-label="Canvas format" value={format} onChange={(event) => setFormat(event.target.value as CanvasFormat)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900">
                {Object.entries(formats).map(([id, item]) => <option key={id} value={id}>{item.label} · {item.width}px wide</option>)}
              </select>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0] p-2 dark:border-slate-700 dark:opacity-95">
              <canvas ref={mobileCanvasRef} role="img" aria-label={`${currentPreset.name} mobile preview of ${renderedText || 'empty text'}`} className="block h-auto w-full rounded-xl" />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <button type="button" onClick={exportPng} disabled={!inputText} className="min-h-11 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">Download PNG</button>
              <button type="button" onClick={exportSvg} disabled={!inputText} className="min-h-11 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45 dark:bg-white dark:text-slate-950">Download editable SVG</button>
              <button type="button" onClick={exportFaithfulSvg} disabled={!inputText} className="min-h-11 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:text-slate-200">Download faithful SVG</button>
            </div>
            {statusMessage && <p className="mt-3 rounded-lg bg-violet-50 px-3 py-2 text-xs font-medium text-violet-800 dark:bg-violet-950/40 dark:text-violet-300" aria-live="polite">{statusMessage}</p>}
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
            <div className="mt-3 grid grid-cols-2 gap-2" aria-label="Preset gallery">
              {config.presets.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectPreset(item)}
                  aria-pressed={item.id === presetId}
                  className={`overflow-hidden rounded-xl border p-2 text-left transition ${item.id === presetId ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-slate-200 hover:border-violet-300 dark:border-slate-700'}`}
                >
                  <span
                    className="block truncate rounded-lg px-2 py-3 text-center text-base"
                    style={{
                      background: item.gradient ? `linear-gradient(${item.backgroundColor}, ${item.backgroundColor})` : item.backgroundColor,
                      color: item.textColor,
                      fontFamily: item.fontFamily,
                      fontWeight: item.fontWeight ?? 700,
                    }}
                  >
                    {item.uppercase ? 'STYLE' : 'Style'}
                  </span>
                  <span className="mt-1.5 block truncate text-[11px] font-semibold text-slate-600 dark:text-slate-300">{item.name}</span>
                </button>
              ))}
            </div>
            {currentPreset.targetFont && (
              <p className={`mt-2 rounded-lg px-3 py-2 text-xs font-semibold ${fontAvailable ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                {fontAvailable
                  ? currentPreset.fontSource === 'bundled'
                    ? `${currentPreset.targetFont} loaded from this site.`
                    : `${currentPreset.targetFont} detected on this device.`
                  : currentPreset.fontSource === 'bundled'
                    ? `${currentPreset.targetFont} is still loading; the fallback is shown temporarily.`
                    : `${currentPreset.targetFont} was not detected; the labelled fallback is shown.`}
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
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Shadow X
              <input aria-label="Horizontal shadow offset" type="range" min="-24" max="24" value={controls.shadowOffsetX} onChange={(event) => setControls((value) => ({ ...value, shadowOffsetX: Number(event.target.value) }))} className="mt-2 w-full" />
              <span className="mt-1 block font-normal text-slate-500">{controls.shadowOffsetX}px</span>
            </label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Shadow Y
              <input aria-label="Vertical shadow offset" type="range" min="-24" max="24" value={controls.shadowOffsetY} onChange={(event) => setControls((value) => ({ ...value, shadowOffsetY: Number(event.target.value) }))} className="mt-2 w-full" />
              <span className="mt-1 block font-normal text-slate-500">{controls.shadowOffsetY}px</span>
            </label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Shadow blur
              <input aria-label="Shadow blur" type="range" min="0" max="30" value={controls.shadowBlur} onChange={(event) => setControls((value) => ({ ...value, shadowBlur: Number(event.target.value) }))} className="mt-2 w-full" />
              <span className="mt-1 block font-normal text-slate-500">{controls.shadowBlur}px</span>
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

          {hasCapability('background-image') && (
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <label htmlFor="visual-background-image" className="text-sm font-semibold text-slate-900 dark:text-white">Meme background image</label>
              <input
                id="visual-background-image"
                type="file"
                accept="image/*"
                onChange={(event) => loadBackgroundImage(event.target.files?.[0])}
                className="mt-2 block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:font-semibold file:text-violet-700 dark:file:bg-violet-950 dark:file:text-violet-300"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">The file stays in this browser and is cropped to cover the canvas.</p>
              {backgroundImage && (
                <button type="button" onClick={() => { setBackgroundImage(null); setBackgroundImageDataUrl(''); setStatusMessage('Background image removed.'); }} className="mt-2 text-xs font-bold text-rose-600 hover:text-rose-800 dark:text-rose-400">Remove background image</button>
              )}
            </div>
          )}

          {hasCapability('game-codes') && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
              <p className="text-sm font-bold text-emerald-950 dark:text-emerald-200">Minecraft formatting code</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">Color
                  <select value={minecraftColorCode} onChange={(event) => setMinecraftColorCode(event.target.value)} className="mt-1 block w-full rounded-lg border border-emerald-300 bg-white px-2 py-2 dark:border-emerald-800 dark:bg-slate-900">
                    <option value="f">White · §f</option><option value="e">Yellow · §e</option><option value="a">Green · §a</option><option value="b">Aqua · §b</option><option value="c">Red · §c</option><option value="d">Pink · §d</option><option value="6">Gold · §6</option><option value="9">Blue · §9</option>
                  </select>
                </label>
                <label className="flex items-end gap-2 pb-2 text-xs font-semibold text-emerald-900 dark:text-emerald-300"><input type="checkbox" checked={minecraftBold} onChange={(event) => setMinecraftBold(event.target.checked)} className="h-4 w-4" /> Bold · §l</label>
              </div>
              <code className="mt-3 block break-all rounded-lg bg-white px-3 py-2 text-xs text-slate-800 dark:bg-slate-900 dark:text-slate-200">{minecraftCode}</code>
              <button type="button" onClick={() => void copyUtilityText(minecraftCode, 'Minecraft formatting code')} className="mt-2 w-full rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600">Copy game code</button>
              <p className="mt-2 text-[11px] leading-4 text-emerald-800 dark:text-emerald-300">Compatibility depends on the Minecraft edition, server, command, and field. The image preview is separate from this code.</p>
            </div>
          )}

          {hasCapability('copyable-name') && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-900/60 dark:bg-sky-950/30">
              <p className="text-sm font-bold text-sky-950 dark:text-sky-200">Copyable player-name alternative</p>
              <p className="mt-2 break-all rounded-lg bg-white px-3 py-2 text-base text-slate-900 dark:bg-slate-900 dark:text-white">{fortniteNameAlternative}</p>
              <button type="button" onClick={() => void copyUtilityText(fortniteNameAlternative, 'Player-name alternative')} className="mt-2 w-full rounded-lg bg-sky-700 px-3 py-2 text-xs font-bold text-white hover:bg-sky-600">Copy alternative</button>
              <p className="mt-2 text-[11px] leading-4 text-sky-800 dark:text-sky-300">This uses Unicode lookalikes, not an in-game font. Some games reject styled characters, so test it before relying on it.</p>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={transparent} onChange={(event) => setTransparent(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-violet-600" />
            Transparent background
          </label>

          <button type="button" onClick={() => { setInputText(''); setStatusMessage('Canvas cleared.'); }} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold hover:border-violet-400 dark:border-slate-700">Clear</button>
        </div>

        <div className="min-w-0">
          <div className="mb-3 hidden flex-wrap items-center justify-between gap-3 xl:flex">
            <div>
              <h3 className="font-bold text-slate-950 dark:text-white">Live artwork preview</h3>
              <p className="mt-1 text-xs text-slate-500">The PNG download matches this browser-rendered canvas.</p>
            </div>
            <select aria-label="Canvas format" value={format} onChange={(event) => setFormat(event.target.value as CanvasFormat)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
              {Object.entries(formats).map(([id, item]) => <option key={id} value={id}>{item.label} · {item.width}px wide</option>)}
            </select>
          </div>
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0] p-2 xl:block dark:border-slate-700 dark:opacity-95">
            <canvas ref={canvasRef} role="img" aria-label={`${currentPreset.name} preview of ${renderedText || 'empty text'}`} className="block h-auto w-full rounded-xl" />
          </div>
          {!inputText && <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">Enter text to create a downloadable design.</p>}

          <div className="mt-4 hidden gap-3 xl:grid xl:grid-cols-3">
            <button type="button" onClick={exportPng} disabled={!inputText} className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-45">Download PNG</button>
            <button type="button" onClick={exportSvg} disabled={!inputText} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-white dark:text-slate-950">Download editable SVG</button>
            <button type="button" onClick={exportFaithfulSvg} disabled={!inputText} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-800 hover:border-violet-400 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:text-slate-200">Download faithful SVG</button>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">Editable SVG keeps selectable text and can simplify complex per-letter effects. Faithful SVG embeds the exact canvas appearance.</p>

          {hasCapability('font-specimen') && (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300">Typeface specimen</p>
                <p className="mt-2 break-words text-3xl leading-tight text-slate-950 dark:text-white" style={{ fontFamily: currentPreset.fontFamily, fontWeight: currentPreset.fontWeight ?? 700, fontStyle: currentPreset.fontStyle ?? 'normal' }}>Aa Bb Cc 0123 &amp;?!</p>
                <p className="mt-2 text-xs text-slate-500">{currentPreset.sourceLabel}</p>
                <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                  <div><dt className="font-bold text-slate-700 dark:text-slate-300">Requested weight</dt><dd className="mt-1 text-slate-500">{currentPreset.fontWeight ?? 700}</dd></div>
                  <div><dt className="font-bold text-slate-700 dark:text-slate-300">Requested style</dt><dd className="mt-1 text-slate-500">{currentPreset.fontStyle ?? 'normal'}</dd></div>
                  <div><dt className="font-bold text-slate-700 dark:text-slate-300">Font stack</dt><dd className="mt-1 break-words text-slate-500">{currentPreset.fontFamily}</dd></div>
                </dl>
              </div>

              {config.fontGuide && (
                <section className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-900/60 dark:bg-violet-950/20">
                  <h3 className="font-black text-slate-950 dark:text-white">{config.fontGuide.heading}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{config.fontGuide.intro}</p>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    {config.fontGuide.checks.map((check) => (
                      <div key={check.label} className="rounded-xl bg-white p-3 dark:bg-slate-950">
                        <dt className="text-xs font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300">{check.label}</dt>
                        <dd className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{check.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}
            </div>
          )}

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <p><strong className="text-slate-800 dark:text-slate-200">Font source:</strong> {currentPreset.sourceLabel}</p>
            <p className="mt-1"><strong className="text-slate-800 dark:text-slate-200">Export note:</strong> {currentPreset.licenseNote}</p>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">{config.compatibilityNote}</p>
          {statusMessage && <p className="mt-3 hidden rounded-lg bg-violet-50 px-3 py-2 text-xs font-medium text-violet-800 xl:block dark:bg-violet-950/40 dark:text-violet-300" aria-live="polite">{statusMessage}</p>}
        </div>
      </div>
    </section>
  );
}
