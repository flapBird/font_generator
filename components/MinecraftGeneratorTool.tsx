'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VisualGeneratorConfig, VisualMaterial } from '@/lib/visual-generator';
import { minecraftColors, parseFormattingLine, serializeMinecraftText, type FormattingRun } from '@/lib/minecraft-formatting';
import { getPixelGlyph } from '@/lib/pixel-font';

interface MinecraftGeneratorToolProps {
  config: VisualGeneratorConfig;
  pageTitle: string;
}

type MinecraftMode = 'game-text' | 'block-logo';
type Alignment = 'left' | 'center' | 'right';
type FillMode = 'solid' | 'gradient' | 'rainbow';

const materials: Record<VisualMaterial, {
  name: string;
  description: string;
  background: string;
  extrusion: string;
  outline: string;
}> = {
  grass: {
    name: 'Grass & Dirt',
    description: 'A bright grass cap with layered dirt pixels inside every letter.',
    background: 'linear-gradient(#65a30d 0 32%, #713f12 32% 100%)',
    extrusion: '#3f2a12',
    outline: '#1a2e05',
  },
  stone: {
    name: 'Stone & Cobble',
    description: 'Mottled gray blocks, highlights, and crack lines inside the glyphs.',
    background: 'linear-gradient(135deg,#d6d3d1,#57534e)',
    extrusion: '#292524',
    outline: '#1c1917',
  },
  diamond: {
    name: 'Diamond Block',
    description: 'Cyan facets and bright mineral highlights with deep blue depth.',
    background: 'linear-gradient(135deg,#cffafe,#06b6d4 55%,#155e75)',
    extrusion: '#164e63',
    outline: '#083344',
  },
  nether: {
    name: 'Nether & Lava',
    description: 'Dark netherrack pixels cut by glowing orange lava seams.',
    background: 'linear-gradient(135deg,#450a0a,#991b1b 55%,#f97316)',
    extrusion: '#270505',
    outline: '#1c0707',
  },
};

const fileSlug = (value: string) =>
  value.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'minecraft-text';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
};

const stripFormattingCodes = (text: string) => text.replace(/[§&][0-9a-fklmnor]/gi, '');

const darkenToGameShadow = (color: string) => {
  const normalized = color.replace('#', '');
  const channels = [0, 2, 4].map((index) => Math.floor(parseInt(normalized.slice(index, index + 2), 16) * 0.25));
  return `rgb(${channels.join(',')})`;
};


const mixHex = (from: string, to: string, amount: number) => {
  const channel = (value: string, index: number) => parseInt(value.slice(index, index + 2), 16);
  const fromHex = from.replace('#', '');
  const toHex = to.replace('#', '');
  const mixed = [0, 2, 4].map((index) => Math.round(channel(fromHex, index) + (channel(toHex, index) - channel(fromHex, index)) * amount));
  return `#${mixed.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
};

const paintMaterial = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  material: VisualMaterial,
  lineBands: { top: number; height: number }[] = [],
) => {
  const bands = lineBands.length > 0 ? lineBands : [{ top: 0, height }];
  bands.forEach((band) => {
    const gradient = context.createLinearGradient(0, band.top, 0, band.top + band.height);
    if (material === 'grass') {
      gradient.addColorStop(0, '#ca8a04');
      gradient.addColorStop(0.42, '#a16207');
      gradient.addColorStop(1, '#4a2c12');
    } else if (material === 'stone') {
      gradient.addColorStop(0, '#f5f5f4');
      gradient.addColorStop(0.5, '#a8a29e');
      gradient.addColorStop(1, '#57534e');
    } else if (material === 'diamond') {
      gradient.addColorStop(0, '#ecfeff');
      gradient.addColorStop(0.42, '#22d3ee');
      gradient.addColorStop(1, '#0e7490');
    } else {
      gradient.addColorStop(0, '#dc2626');
      gradient.addColorStop(0.5, '#991b1b');
      gradient.addColorStop(1, '#450a0a');
    }
    context.fillStyle = gradient;
    context.fillRect(0, band.top, width, band.height);
  });
  if (material === 'grass') {
    bands.forEach((band) => {
      const grassHeight = band.height * 0.28;
      context.fillStyle = '#a3e635';
      context.fillRect(0, band.top, width, grassHeight * 0.38);
      context.fillStyle = '#65a30d';
      context.fillRect(0, band.top + grassHeight * 0.38, width, grassHeight * 0.62);
    });
  }

  const tile = 14;
  for (let y = 0; y < height; y += tile) {
    for (let x = 0; x < width; x += tile) {
      const noise = ((x * 17 + y * 31 + x * y) % 101) / 100;
      if (material === 'grass') {
        const grassPixel = lineBands.some((band) => y >= band.top && y < band.top + band.height * 0.28);
        context.fillStyle = grassPixel
          ? noise > 0.55 ? '#bef264' : '#65a30d'
          : noise > 0.72 ? '#ca8a04' : noise < 0.2 ? '#422006' : '#78350f';
      } else if (material === 'stone') {
        context.fillStyle = noise > 0.72 ? '#d6d3d1' : noise < 0.2 ? '#57534e' : '#a8a29e';
      } else if (material === 'diamond') {
        context.fillStyle = noise > 0.7 ? '#cffafe' : noise < 0.22 ? '#0891b2' : '#67e8f9';
      } else {
        context.fillStyle = noise > 0.78 ? '#f97316' : noise < 0.2 ? '#270505' : '#7f1d1d';
      }
      context.globalAlpha = material === 'nether' && noise > 0.78 ? 0.95 : 0.48;
      context.fillRect(x, y, tile - 2, tile - 2);
    }
  }
  context.globalAlpha = 1;

  // Give every text line a guaranteed, recognizable material feature. Random
  // tiles alone can miss a narrow glyph after a line break and make that line
  // look like plain outlined text.
  bands.forEach((band, bandIndex) => {
    if (material === 'grass') {
      context.fillStyle = 'rgba(250,204,21,.42)';
      context.fillRect(0, band.top + band.height * 0.48, width, Math.max(3, band.height * 0.06));
      context.fillStyle = 'rgba(66,32,6,.48)';
      context.fillRect(0, band.top + band.height * 0.76, width, Math.max(4, band.height * 0.08));
    } else if (material === 'stone') {
      const blockWidth = Math.max(18, band.height * 0.24);
      for (let x = -blockWidth + (bandIndex % 2) * blockWidth * 0.5; x < width; x += blockWidth * 1.6) {
        context.fillStyle = 'rgba(245,245,244,.42)';
        context.fillRect(x, band.top + band.height * 0.18, blockWidth, Math.max(3, band.height * 0.09));
        context.fillStyle = 'rgba(68,64,60,.42)';
        context.fillRect(x + blockWidth * 0.55, band.top + band.height * 0.66, blockWidth * 0.9, Math.max(3, band.height * 0.1));
      }
    } else if (material === 'diamond') {
      context.fillStyle = 'rgba(236,254,255,.78)';
      context.fillRect(0, band.top + band.height * 0.16, width, Math.max(4, band.height * 0.08));
      context.fillStyle = 'rgba(8,145,178,.52)';
      context.fillRect(0, band.top + band.height * 0.68, width, Math.max(5, band.height * 0.1));
    } else {
      context.fillStyle = '#fb923c';
      context.fillRect(0, band.top + band.height * 0.3, width, Math.max(5, band.height * 0.075));
      context.fillStyle = '#f97316';
      context.fillRect(0, band.top + band.height * 0.7, width, Math.max(4, band.height * 0.06));
    }
  });

  context.lineWidth = material === 'diamond' ? 3 : 4;
  context.strokeStyle = material === 'diamond' ? 'rgba(236,254,255,.55)' : material === 'nether' ? 'rgba(251,146,60,.72)' : 'rgba(15,23,42,.26)';
  bands.forEach((band, bandIndex) => {
    for (let x = -45 + (bandIndex % 2) * 28; x < width; x += 90) {
      context.beginPath();
      context.moveTo(x, band.top);
      context.lineTo(x + 42, band.top + band.height * 0.38);
      context.lineTo(x + 12, band.top + band.height * 0.7);
      context.lineTo(x + 68, band.top + band.height);
      context.stroke();
    }
  });
};

export default function MinecraftGeneratorTool({ config, pageTitle }: MinecraftGeneratorToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mobileCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const mobilePreviewRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<MinecraftMode>('game-text');
  const [gameText, setGameText] = useState(config.initialText);
  const [logoText, setLogoText] = useState(config.initialText);
  const [baseColor, setBaseColor] = useState('#ffff55');
  const [fillMode, setFillMode] = useState<FillMode>('solid');
  const [scale, setScale] = useState(8);
  const [boldText, setBoldText] = useState(false);
  const [italicText, setItalicText] = useState(false);
  const [underlineText, setUnderlineText] = useState(false);
  const [strikeText, setStrikeText] = useState(false);
  const [gameShadow, setGameShadow] = useState(true);
  const [outlineText, setOutlineText] = useState(false);
  const [shadowDistance, setShadowDistance] = useState(1);
  const [padding, setPadding] = useState(0);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineSpacing, setLineSpacing] = useState(1);
  const [alignment, setAlignment] = useState<Alignment>('center');
  const [material, setMaterial] = useState<VisualMaterial>('grass');
  const [logoSize, setLogoSize] = useState(136);
  const [outlineWidth, setOutlineWidth] = useState(7);
  const [depth, setDepth] = useState(18);
  const [transparent, setTransparent] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('#172554');
  const [statusMessage, setStatusMessage] = useState('');
  const [fontReady, setFontReady] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(720);
  const [obfuscationFrame, setObfuscationFrame] = useState(0);

  const logoPresets = useMemo(() => config.presets.filter((preset) => preset.material), [config.presets]);
  const activeText = mode === 'game-text' ? gameText : logoText;
  const gamePlainText = stripFormattingCodes(gameText).slice(0, 120);
  const logoPlainText = stripFormattingCodes(logoText).slice(0, 120);

  useEffect(() => {
    let active = true;
    void document.fonts.load('700 32px "Pixelify Sans"').then(() => {
      if (active) setFontReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (mode !== 'game-text' || !/[§&]k/i.test(gameText)) return;
    const interval = window.setInterval(() => setObfuscationFrame((frame) => frame + 1), 120);
    return () => window.clearInterval(interval);
  }, [gameText, mode]);

  useEffect(() => {
    const previews = [previewRef.current, mobilePreviewRef.current].filter((item): item is HTMLDivElement => Boolean(item));
    if (!previews.length) return;
    const updateWidth = () => setPreviewWidth(Math.max(280, ...previews.filter((preview) => preview.getClientRects().length > 0).map((preview) => Math.floor(preview.clientWidth))));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    previews.forEach((preview) => observer.observe(preview));
    return () => observer.disconnect();
  }, []);

  const drawGameText = useCallback((canvas: HTMLCanvasElement) => {
    type PixelToken = Omit<FormattingRun, 'text'> & { character: string; index: number };
    let canvasWidth = Math.max(280, previewWidth);
    const sourceLines = gameText.split('\n');
    let tokenIndex = 0;

    const tokenWidth = (token: PixelToken) => {
      const glyph = getPixelGlyph(token.character);
      return glyph.width + 1 + letterSpacing + (boldText || token.bold ? 1 : 0);
    };

    const visualLines = sourceLines.map((sourceLine) =>
      parseFormattingLine(sourceLine, baseColor).flatMap((run) => {
        const { text, ...formatting } = run;
        return Array.from(text).map((character) => ({ ...formatting, character, index: tokenIndex++ }));
      }),
    );

    const widestLineUnits = Math.max(1, ...visualLines.map((line) => line.reduce((sum, token) => sum + tokenWidth(token), 0)));
    const horizontalEffectUnits = 4 + (outlineText ? 2 : 0) + (gameShadow ? shadowDistance : 0);
    canvasWidth = Math.max(canvasWidth, widestLineUnits + padding * 2 + horizontalEffectUnits);
    const fittedScale = Math.floor(canvasWidth / (widestLineUnits + padding * 2 + horizontalEffectUnits));
    const renderScale = Math.max(1, Math.min(scale, fittedScale));
    const pixelPadding = (padding + (outlineText ? 1 : 0)) * renderScale;
    const lineHeightUnits = 8 + lineSpacing;
    const contentHeight = Math.max(1, visualLines.length) * lineHeightUnits * renderScale;
    const effectOverflow = (outlineText ? renderScale : 0) + (gameShadow ? shadowDistance * renderScale : 0);
    const naturalHeight = pixelPadding * 2 + contentHeight + effectOverflow;
    canvas.width = canvasWidth;
    canvas.height = Math.max(128, naturalHeight);
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.dataset.renderScale = String(renderScale);
    canvas.dataset.obfuscationFrame = String(obfuscationFrame);
    const context = canvas.getContext('2d');
    if (!context) return;
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!transparent) {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    const lineWidthInUnits = (line: PixelToken[]) => line.reduce((sum, token) => sum + tokenWidth(token), 0);
    const visibleCharacter = (token: PixelToken) => {
      if (!token.obfuscated) return token.character;
      const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      return pool[(token.index * 17 + token.character.charCodeAt(0) + obfuscationFrame * 7) % pool.length];
    };
    const fillColor = (token: PixelToken, x: number, row: number) => {
      if (!token.usesBaseColor) return token.color;
      if (fillMode === 'rainbow') return `hsl(${Math.round((x / canvas.width) * 300 + token.index * 13) % 360} 92% 62%)`;
      if (fillMode === 'gradient') return mixHex(baseColor, '#ffffff', Math.max(0, Math.min(1, (6 - row) / 12)));
      return baseColor;
    };
    const drawToken = (token: PixelToken, originX: number, originY: number, offsetX: number, offsetY: number, colorOverride?: string) => {
      const glyph = getPixelGlyph(visibleCharacter(token));
      const effectiveBold = boldText || token.bold;
      const effectiveItalic = italicText || token.italic;
      glyph.rows.forEach((bits, row) => {
        const italicOffset = effectiveItalic ? Math.floor((6 - row) / 3) : 0;
        for (let column = 0; column < glyph.width; column += 1) {
          if ((bits & (1 << (glyph.width - column - 1))) === 0) continue;
          context.fillStyle = colorOverride ?? fillColor(token, originX + column * renderScale, row);
          const x = originX + (column + italicOffset + offsetX) * renderScale;
          const y = originY + (row + offsetY) * renderScale;
          context.fillRect(x, y, renderScale, renderScale);
          if (effectiveBold) context.fillRect(x + renderScale, y, renderScale, renderScale);
        }
      });
      const decorationWidth = (glyph.width + (effectiveBold ? 1 : 0)) * renderScale;
      if (underlineText || token.underline) {
        context.fillStyle = colorOverride ?? fillColor(token, originX, 6);
        context.fillRect(originX + offsetX * renderScale, originY + (7 + offsetY) * renderScale, decorationWidth, renderScale);
      }
      if (strikeText || token.strike) {
        context.fillStyle = colorOverride ?? fillColor(token, originX, 3);
        context.fillRect(originX + offsetX * renderScale, originY + (3 + offsetY) * renderScale, decorationWidth, renderScale);
      }
    };

    const verticalOffset = Math.max(0, Math.floor((canvas.height - naturalHeight) / 2));
    canvas.dataset.verticalOffset = String(verticalOffset);
    visualLines.forEach((line, lineIndex) => {
      const lineWidth = lineWidthInUnits(line) * renderScale;
      let cursor = alignment === 'center'
        ? (canvas.width - lineWidth) / 2
        : alignment === 'right'
          ? canvas.width - pixelPadding - lineWidth - (2 + (gameShadow ? shadowDistance : 0)) * renderScale
          : pixelPadding;
      const y = verticalOffset + pixelPadding + lineIndex * lineHeightUnits * renderScale;
      line.forEach((token) => {
        if (outlineText) {
          [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([offsetX, offsetY]) => drawToken(token, cursor, y, offsetX, offsetY, '#020617'));
        }
        if (gameShadow) drawToken(token, cursor, y, shadowDistance, shadowDistance, darkenToGameShadow(token.usesBaseColor ? baseColor : token.color));
        drawToken(token, cursor, y, 0, 0);
        cursor += tokenWidth(token) * renderScale;
      });
    });
  }, [alignment, backgroundColor, baseColor, boldText, fillMode, gameShadow, gameText, italicText, letterSpacing, lineSpacing, obfuscationFrame, outlineText, padding, previewWidth, scale, shadowDistance, strikeText, transparent, underlineText]);

  const drawBlockLogo = useCallback((canvas: HTMLCanvasElement) => {
    const width = 1200;
    const lines = (logoPlainText || 'CREEPER CLUB').toUpperCase().split('\n');
    let fittedSize = logoSize;
    const fontSpec = (size: number) => `700 ${size}px "Pixelify Sans", monospace`;
    const measureCanvas = document.createElement('canvas');
    const measure = measureCanvas.getContext('2d');
    if (!measure) return;
    while (fittedSize > 4) {
      measure.font = fontSpec(fittedSize);
      if (lines.every((line) => measure.measureText(line).width <= width * 0.82)) break;
      fittedSize = Math.max(4, fittedSize - 4);
    }
    const lineHeight = fittedSize * 1.08;
    const textBlockHeight = fittedSize + Math.max(0, lines.length - 1) * lineHeight;
    const verticalPadding = Math.max(56, fittedSize * 0.38 + depth);
    const height = Math.max(360, Math.ceil(textBlockHeight + verticalPadding * 2 + depth));
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.dataset.lineCount = String(lines.length);
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, width, height);
    if (!transparent) {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, width, height);
    }

    const startY = (height - textBlockHeight) / 2 + fittedSize * 0.82;
    const selected = materials[material];
    const drawLines = (target: CanvasRenderingContext2D, offsetX = 0, offsetY = 0) => {
      target.font = fontSpec(fittedSize);
      target.textAlign = 'center';
      target.textBaseline = 'alphabetic';
      target.lineJoin = 'miter';
      target.miterLimit = 2;
      lines.forEach((line, index) => target.fillText(line, width / 2 + offsetX, startY + index * lineHeight + offsetY));
    };

    context.save();
    context.font = fontSpec(fittedSize);
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    context.lineJoin = 'miter';
    context.miterLimit = 2;
    context.strokeStyle = selected.outline;
    context.lineWidth = outlineWidth * 2;
    context.fillStyle = selected.extrusion;
    for (let step = depth; step >= 1; step -= 1) {
      const offset = Math.round(step * 0.72);
      lines.forEach((line, index) => {
        context.strokeText(line, width / 2 + offset, startY + index * lineHeight + offset);
        context.fillText(line, width / 2 + offset, startY + index * lineHeight + offset);
      });
    }
    context.restore();

    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = width;
    textureCanvas.height = height;
    const texture = textureCanvas.getContext('2d');
    if (!texture) return;
    paintMaterial(texture, width, height, material, lines.map((_, index) => ({
      top: startY + index * lineHeight - fittedSize * 0.82,
      height: fittedSize,
    })));
    const materialPattern = context.createPattern(textureCanvas, 'no-repeat');

    context.save();
    context.font = fontSpec(fittedSize);
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    context.lineJoin = 'miter';
    context.miterLimit = 2;
    context.strokeStyle = selected.outline;
    context.lineWidth = outlineWidth * 2;
    lines.forEach((line, index) => context.strokeText(line, width / 2, startY + index * lineHeight));
    context.restore();

    if (materialPattern) {
      context.save();
      context.fillStyle = materialPattern;
      drawLines(context);
      context.restore();
    }

    context.save();
    context.globalAlpha = 0.42;
    context.font = fontSpec(fittedSize);
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    context.strokeStyle = '#ffffff';
    context.lineWidth = 2;
    lines.forEach((line, index) => context.strokeText(line, width / 2 - 1, startY + index * lineHeight - 2));
    context.restore();
  }, [backgroundColor, depth, logoPlainText, logoSize, material, outlineWidth, transparent]);

  const drawCanvas = useCallback(() => {
    [canvasRef.current, mobileCanvasRef.current].forEach((canvas) => {
      if (!canvas) return;
      if (mode === 'game-text') drawGameText(canvas);
      else drawBlockLogo(canvas);
    });
  }, [drawBlockLogo, drawGameText, mode]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas, fontReady]);

  const exportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(blob, `${fileSlug(pageTitle)}-${mode}.png`);
      setStatusMessage(`${transparent ? 'Transparent ' : ''}PNG downloaded.`);
    }, 'image/png');
  };

  const copyPng = () => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ClipboardItem === 'undefined') {
      setStatusMessage('PNG copying is not supported in this browser. Download the PNG instead.');
      return;
    }
    canvas.toBlob((blob) => {
      if (!blob) return;
      void navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        .then(() => setStatusMessage('PNG copied to the clipboard.'))
        .catch(() => setStatusMessage('PNG copying was blocked. Download the PNG instead.'));
    }, 'image/png');
  };

  const exportFaithfulSvg = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const png = canvas.toDataURL('image/png');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}"><image href="${png}" width="100%" height="100%"/></svg>`;
    downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${fileSlug(pageTitle)}-${mode}.svg`);
    setStatusMessage('Faithful SVG downloaded with the exact pixel rendering embedded.');
  };

  const codeOutput = serializeMinecraftText(gameText, baseColor, {
    bold: boldText, italic: italicText, underline: underlineText, strike: strikeText,
  });

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeOutput);
      setStatusMessage('Formatting-code text copied.');
    } catch {
      setStatusMessage('Copy was blocked. Select the input text and copy it manually.');
    }
  };

  return (
    <section id="generator" aria-labelledby="minecraft-generator-heading" className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-950">
      <div className="bg-slate-950 px-5 py-5 text-white sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-300">Two outputs, one Minecraft tool</p>
        <h2 id="minecraft-generator-heading" className="mt-1 text-xl font-black sm:text-2xl">Create Minecraft text that fits the job</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">Use Game Text for pixel UI, signs, MOTDs, and formatting codes. Use Block Logo when you need textured letters with outlines and 3D depth for a banner or thumbnail.</p>
      </div>

      <div className="border-b border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto grid max-w-2xl grid-cols-2 gap-2" role="tablist" aria-label="Minecraft output mode">
          <button type="button" role="tab" aria-selected={mode === 'game-text'} onClick={() => setMode('game-text')} className={`rounded-xl px-4 py-3 text-sm font-black transition ${mode === 'game-text' ? 'bg-lime-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-lime-50 dark:bg-slate-950 dark:text-slate-200'}`}>Game Text</button>
          <button type="button" role="tab" aria-selected={mode === 'block-logo'} onClick={() => setMode('block-logo')} className={`rounded-xl px-4 py-3 text-sm font-black transition ${mode === 'block-logo' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-cyan-50 dark:bg-slate-950 dark:text-slate-200'}`}>Block Logo</button>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 items-start gap-7 p-5 sm:p-8 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          <div>
            <label htmlFor="minecraft-text-input" className="text-sm font-bold text-slate-950 dark:text-white">Your text</label>
            <textarea id="minecraft-text-input" placeholder={pageTitle} value={activeText} onChange={(event) => mode === 'game-text' ? setGameText(event.target.value.slice(0, 120)) : setLogoText(event.target.value.slice(0, 120))} rows={mode === 'game-text' ? 5 : 6} className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 font-mono text-base outline-none focus:border-lime-500 focus:ring-4 focus:ring-lime-500/10 dark:border-slate-700 dark:bg-slate-900" />
            <div className="mt-2 flex justify-between gap-3 text-xs text-slate-500"><span>{mode === 'game-text' ? 'Formatting codes work inline with § or &: &a green, &l bold, &o italic, &n underline, &m strikethrough, &k obfuscated, &r reset.' : 'Logo text has its own clean input without game codes.'}</span><span className="shrink-0">{activeText.length}/120</span></div>
          </div>

          <div className="xl:hidden">
            <h3 className="mb-3 text-lg font-black text-slate-950 dark:text-white">Live preview</h3>
            <div ref={mobilePreviewRef} className="min-w-0 min-h-32 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 bg-[linear-gradient(45deg,#263449_25%,transparent_25%),linear-gradient(-45deg,#263449_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#263449_75%),linear-gradient(-45deg,transparent_75%,#263449_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0]">
              <canvas ref={mobileCanvasRef} role="img" aria-label={`${mode === 'game-text' ? 'Minecraft game text' : `${materials[material].name} block logo`} mobile preview`} className={`block w-full ${mode === 'game-text' ? '[image-rendering:pixelated]' : 'h-auto max-w-full'}`} />
            </div>
            <p className="mt-2 text-xs text-slate-500">The preview updates while you adjust the controls below.</p>
          </div>

          {mode === 'game-text' ? (
            <>
              <div>
                <p className="text-sm font-bold text-slate-950 dark:text-white">Minecraft colors</p>
                <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-1.5">
                  {minecraftColors.map((item) => (
                    <button key={item.code} type="button" title={`${item.name} · &${item.code}`} aria-label={`Use ${item.name} as the base color`} aria-pressed={baseColor === item.color} onClick={() => setBaseColor(item.color)} className={`aspect-square rounded-md border border-black/20 shadow-sm transition hover:scale-105 ${baseColor === item.color ? 'ring-2 ring-lime-500 ring-offset-2' : ''}`} style={{ backgroundColor: item.color }} />
                  ))}
                </div>
                <label className="mt-3 block text-xs font-bold text-slate-700 dark:text-slate-300">Custom base color
                  <input type="color" value={baseColor} onChange={(event) => setBaseColor(event.target.value)} className="mt-2 h-10 w-full rounded border border-slate-300" />
                </label>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-bold">
                  {(['solid', 'gradient', 'rainbow'] as FillMode[]).map((item) => <button key={item} type="button" aria-pressed={fillMode === item} onClick={() => setFillMode(item)} className={`min-h-11 rounded-lg border px-2 py-2.5 capitalize sm:min-h-0 ${fillMode === item ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200' : 'border-slate-300 dark:border-slate-700'}`}>{item}</button>)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-950 dark:text-white">Size and style</p>
                <label className="mt-3 block text-xs font-bold text-slate-700 dark:text-slate-300">Pixel scale: {scale}×
                <input type="range" min="3" max="12" value={scale} onChange={(event) => setScale(Number(event.target.value))} className="mt-2 w-full" />
                <span className="mt-1 block font-normal text-slate-500">Maximum scale; a long input line scales down to fit without wrapping.</span>
                </label>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold">
                  {[
                    ['Bold', boldText, setBoldText],
                    ['Italic', italicText, setItalicText],
                    ['Underline', underlineText, setUnderlineText],
                    ['Strike', strikeText, setStrikeText],
                  ].map(([label, active, setter]) => <button key={String(label)} type="button" aria-pressed={Boolean(active)} onClick={() => (setter as typeof setBoldText)(!active)} className={`min-h-11 rounded-lg border px-2 py-2.5 sm:min-h-0 ${active ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200' : 'border-slate-300 dark:border-slate-700'}`}>{label as string}</button>)}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold">
                  <button type="button" aria-pressed={gameShadow} onClick={() => setGameShadow((value) => !value)} className={`min-h-11 rounded-lg border px-2 py-2.5 sm:min-h-0 ${gameShadow ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200' : 'border-slate-300 dark:border-slate-700'}`}>Drop shadow</button>
                  <button type="button" aria-pressed={outlineText} onClick={() => setOutlineText((value) => !value)} className={`min-h-11 rounded-lg border px-2 py-2.5 sm:min-h-0 ${outlineText ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200' : 'border-slate-300 dark:border-slate-700'}`}>Outline</button>
                </div>
                {gameShadow && <label className="mt-3 block text-xs font-bold text-slate-700 dark:text-slate-300">Shadow distance: {shadowDistance}px
                  <input type="range" min="1" max="4" value={shadowDistance} onChange={(event) => setShadowDistance(Number(event.target.value))} className="mt-2 w-full" />
                </label>}
              </div>

              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-950 dark:text-white">Spacing and layout</p>
                <label className="mt-3 block text-xs font-bold text-slate-700 dark:text-slate-300">Padding: {padding}px
                  <input type="range" min="0" max="8" value={padding} onChange={(event) => setPadding(Number(event.target.value))} className="mt-2 w-full" />
                </label>
                <label className="mt-3 block text-xs font-bold text-slate-700 dark:text-slate-300">Letter spacing: {letterSpacing}px
                  <input type="range" min="0" max="4" value={letterSpacing} onChange={(event) => setLetterSpacing(Number(event.target.value))} className="mt-2 w-full" />
                </label>
                <label className="mt-3 block text-xs font-bold text-slate-700 dark:text-slate-300">Line spacing: {lineSpacing}px
                  <input type="range" min="0" max="8" value={lineSpacing} onChange={(event) => setLineSpacing(Number(event.target.value))} className="mt-2 w-full" />
                </label>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(['left', 'center', 'right'] as Alignment[]).map((item) => <button key={item} type="button" aria-pressed={alignment === item} onClick={() => setAlignment(item)} className={`min-h-11 rounded-lg border px-2 py-2 text-xs font-bold capitalize sm:min-h-0 ${alignment === item ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200' : 'border-slate-300 dark:border-slate-700'}`}>{item}</button>)}
                </div>
              </div>
              <button type="button" onClick={() => void copyCode()} className="w-full rounded-xl bg-lime-700 px-4 py-3 text-sm font-black text-white hover:bg-lime-600">Copy formatting-code text</button>
              <p className="text-xs text-slate-500">Copied codes include standard colors and text formatting. Custom colors, gradients, shadows and layout apply to images only.</p>
              <pre aria-label="Formatting-code output" className="max-h-32 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-slate-300 p-2 text-xs">{codeOutput}</pre>
            </>
          ) : (
            <>
              <div>
                <p className="text-sm font-bold text-slate-950 dark:text-white">Material inside the letters</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {logoPresets.map((preset) => {
                    const presetMaterial = preset.material as VisualMaterial;
                    return <button key={preset.id} type="button" aria-pressed={material === presetMaterial} onClick={() => setMaterial(presetMaterial)} className={`rounded-xl border p-2 text-left transition ${material === presetMaterial ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-slate-200 hover:border-cyan-300 dark:border-slate-700'}`}><span className="block h-10 rounded-lg" style={{ background: materials[presetMaterial].background }} /><span className="mt-1.5 block text-xs font-black text-slate-800 dark:text-slate-200">{materials[presetMaterial].name}</span></button>;
                  })}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">{materials[material].description}</p>
              </div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Logo size
                <input type="range" min="64" max="190" value={logoSize} onChange={(event) => setLogoSize(Number(event.target.value))} className="mt-2 w-full" />
                <span className="mt-1 block font-normal text-slate-500">{logoSize}px before auto-fit</span>
              </label>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Block outline
                <input type="range" min="0" max="14" value={outlineWidth} onChange={(event) => setOutlineWidth(Number(event.target.value))} className="mt-2 w-full" />
                <span className="mt-1 block font-normal text-slate-500">{outlineWidth}px</span>
              </label>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">3D depth
                <input type="range" min="0" max="34" value={depth} onChange={(event) => setDepth(Number(event.target.value))} className="mt-2 w-full" />
                <span className="mt-1 block font-normal text-slate-500">{depth}px extrusion</span>
              </label>
            </>
          )}

          <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700 sm:min-h-0 dark:text-slate-300"><input type="checkbox" checked={transparent} onChange={(event) => setTransparent(event.target.checked)} className="h-5 w-5 sm:h-4 sm:w-4" /> Transparent background</label>
          {!transparent && <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Background color<input type="color" value={backgroundColor} onChange={(event) => setBackgroundColor(event.target.value)} className="mt-2 h-10 w-full rounded border border-slate-300" /></label>}
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="order-1 mb-3 hidden xl:block">
            <h3 className="text-lg font-black text-slate-950 dark:text-white">Preview</h3>
          </div>
          <div ref={previewRef} className="order-1 hidden min-h-32 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 bg-[linear-gradient(45deg,#263449_25%,transparent_25%),linear-gradient(-45deg,#263449_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#263449_75%),linear-gradient(-45deg,transparent_75%,#263449_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0] xl:block">
            <canvas ref={canvasRef} role="img" aria-label={`${mode === 'game-text' ? 'Minecraft game text' : `${materials[material].name} block logo`} preview`} className={`block w-full ${mode === 'game-text' ? '[image-rendering:pixelated]' : 'h-auto max-w-full'}`} />
          </div>
          {mode === 'game-text' && (
            <section aria-labelledby="minecraft-color-codes-heading" className="order-5 mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 xl:order-2 dark:border-emerald-900/70 dark:bg-emerald-950/20">
              <h4 id="minecraft-color-codes-heading" className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                Minecraft color codes
              </h4>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {minecraftColors.map((item) => {
                  const isSelected = baseColor === item.color;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      aria-label={`Use ${item.name} as the base color (${item.code})`}
                      aria-pressed={isSelected}
                      onClick={() => setBaseColor(item.color)}
                      className={`flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                        isSelected
                          ? 'border-emerald-500 bg-white shadow-sm ring-2 ring-emerald-500/20 dark:bg-slate-900'
                          : 'border-emerald-200 bg-white/70 hover:border-emerald-400 hover:bg-white dark:border-emerald-900 dark:bg-slate-950 dark:hover:border-emerald-700'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="h-6 w-6 shrink-0 border border-black/25 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {item.name}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-slate-500 dark:text-slate-400">§{item.code}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-400">
                Click a color to use it as the base color, or type its § or &amp; code directly in your text to color individual words.
              </p>
            </section>
          )}
          <h3 className="order-2 mt-4 text-lg font-black text-slate-950 xl:hidden dark:text-white">Export artwork</h3>
          <div className={`order-3 mt-4 grid gap-3 ${mode === 'game-text' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            {mode === 'game-text' && <button type="button" onClick={copyPng} disabled={!gamePlainText} className="rounded-xl border border-cyan-600 px-4 py-3 text-sm font-black text-cyan-800 hover:bg-cyan-50 disabled:opacity-45 dark:text-cyan-300 dark:hover:bg-cyan-950/30">Copy PNG</button>}
            <button type="button" onClick={exportPng} disabled={mode === 'game-text' ? !gamePlainText : !logoPlainText} className="rounded-xl bg-cyan-600 px-4 py-3 text-sm font-black text-white hover:bg-cyan-500 disabled:opacity-45">Download PNG</button>
            <button type="button" onClick={exportFaithfulSvg} disabled={mode === 'game-text' ? !gamePlainText : !logoPlainText} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-45 dark:bg-white dark:text-slate-950">Download faithful SVG</button>
          </div>
          <div className="order-6 mt-4 grid gap-3 sm:grid-cols-2 xl:order-4">
            <div className="rounded-xl border border-lime-200 bg-lime-50 p-4 text-xs leading-5 text-lime-950 dark:border-lime-900/60 dark:bg-lime-950/30 dark:text-lime-200"><strong>Game Text:</strong> uses an original 5×7 bitmap alphabet drawn directly onto the pixel grid. Choose any of the 16 base colors above; inline § or &amp; codes override the base color for individual words. Only a manual line break creates another output line.</div>
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-xs leading-5 text-cyan-950 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-200"><strong>Block Logo:</strong> uses original procedural grass, dirt, stone, diamond, and nether-inspired textures. The textures, depth, and outline are rendered into the letters—not placed behind unchanged text.</div>
          </div>
          <p className="order-7 mt-3 text-xs leading-5 text-slate-500 xl:order-5">Unofficial fan tool. No Mojang/Microsoft font sheet, logo, block texture, or game asset is included.</p>
          {statusMessage && <p aria-live="polite" className="order-8 mt-3 rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-800 xl:order-6 dark:bg-violet-950/40 dark:text-violet-300">{statusMessage}</p>}
        </div>
      </div>
    </section>
  );
}
