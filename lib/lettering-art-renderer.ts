import {
  letteringFonts,
  letteringSizes,
  type LetteringFont,
  type LetteringSettings,
  type LetteringVariant,
} from './lettering-art';
import { loadDiscoveryFont } from './discovery-renderer';

let graduateFont: Promise<FontFace> | undefined;

export function loadLetteringFont(font: LetteringFont) {
  if (font !== 'graduate') return loadDiscoveryFont(font);
  if (graduateFont) return graduateFont;

  const face = new FontFace(letteringFonts.graduate.family, 'url(/fonts/lettering/Graduate-Regular.ttf)');
  graduateFont = new Promise<FontFace>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('Font loading timed out.')), 15_000);
    face.load().then((loaded) => {
      window.clearTimeout(timer);
      resolve(loaded);
    }, (error) => {
      window.clearTimeout(timer);
      reject(error);
    });
  }).then((loaded) => {
    document.fonts.add(loaded);
    return loaded;
  }).catch((error: unknown) => {
    graduateFont = undefined;
    throw error;
  });
  return graduateFont;
}

const englishGraphemes = new Intl.Segmenter('en', { granularity: 'grapheme' });

function makeLayer(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable.');
  return ctx;
}

function paintLettering(ctx: CanvasRenderingContext2D, text: string, x: number, baseline: number, size: number, settings: LetteringSettings) {
  const stroke = size * settings.outlineWidth / 820;
  ctx.lineJoin = 'round';
  if (stroke > 0) {
    ctx.lineWidth = stroke * 1.55;
    ctx.strokeStyle = settings.outline;
    ctx.strokeText(text, x, baseline);
  }
  ctx.fillStyle = settings.fill;
  ctx.fillText(text, x, baseline);
}

function paintVarsity(ctx: CanvasRenderingContext2D, text: string, font: string, size: number, settings: LetteringSettings) {
  const letters = Array.from(englishGraphemes.segment(text), ({ segment }) => segment);
  const { width, height } = ctx.canvas;

  function measure(fontSize: number) {
    ctx.font = font.replace('{size}', String(fontSize));
    const spacing = fontSize * .065;
    const advances = letters.map((letter) => ctx.measureText(letter).width);
    const run = advances.reduce((total, advance) => total + advance, 0) + (letters.length - 1) * spacing;
    return { advances, spacing, run };
  }

  const initialRun = measure(size).run;
  size *= Math.min(1, width * .75 / Math.max(1, initialRun));
  const { advances, spacing, run } = measure(size);
  const metrics = ctx.measureText(text);
  const arch = letters.length > 1 ? Math.min(run * .17, height * .18) * settings.curve / 100 : 0;
  const baseline = height / 2 + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent + arch) / 2;
  let x = (width - run) / 2;
  letters.forEach((letter, index) => {
    const advance = advances[index];
    const center = x + advance / 2;
    const position = (center - width / 2) / Math.max(run / 2, 1);
    const y = baseline - arch * (1 - position ** 2);
    const angle = Math.atan(4 * arch * position / Math.max(run, 1));
    ctx.save();
    ctx.translate(center, y);
    ctx.rotate(angle);
    paintLettering(ctx, letter, -advance / 2, 0, size, settings);
    ctx.restore();
    x += advance + spacing;
  });
}

function paintWave(ctx: CanvasRenderingContext2D, text: string, font: string, size: number, settings: LetteringSettings) {
  const { width, height } = ctx.canvas;
  ctx.font = font.replace('{size}', String(size));
  const initialMetrics = ctx.measureText(text);
  const inkWidth = initialMetrics.actualBoundingBoxLeft + initialMetrics.actualBoundingBoxRight;
  size *= Math.min(1, width * .76 / Math.max(1, inkWidth));
  ctx.font = font.replace('{size}', String(size));
  const metrics = ctx.measureText(text);
  const padding = Math.ceil(size / 8) + 8;
  const layerWidth = Math.ceil(metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight) + padding * 2;
  const layerHeight = Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) + padding * 2;
  const ink = makeLayer(layerWidth, layerHeight);
  ink.font = ctx.font;
  paintLettering(ink, text, padding + metrics.actualBoundingBoxLeft, padding + metrics.actualBoundingBoxAscent, size, settings);

  const originX = Math.round((width - layerWidth) / 2);
  const originY = Math.round((height - layerHeight) / 2);
  const amplitude = Math.min(height * .17, layerWidth * .2) * settings.curve / 100;
  if (!amplitude) {
    ctx.drawImage(ink.canvas, originX, originY);
    return;
  }
  // Shift narrow strips of one shaped line so the glyph outlines follow the wave too.
  const waveWidth = Math.max(1, layerWidth - padding * 2);
  for (let x = 0; x < layerWidth; x++) {
    const phase = ((x - padding) / waveWidth - .5) * Math.PI * 2 * settings.waves;
    const y = originY + amplitude * Math.sin(phase);
    ctx.drawImage(ink.canvas, x, 0, 1, layerHeight, originX + x, y, 1, layerHeight);
  }
}

export function renderLetteringArt(
  canvas: HTMLCanvasElement,
  input: string,
  variant: LetteringVariant,
  fontId: LetteringFont,
  settings: LetteringSettings,
) {
  const [width, height] = letteringSizes[settings.format];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable.');

  if (!settings.transparent) {
    ctx.fillStyle = settings.background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.textBaseline = 'alphabetic';
  ctx.direction = 'ltr';
  const inputLine = input.trim();
  if (!inputLine) return;

  const font = `400 {size}px "${letteringFonts[fontId].family}", ${variant === 'varsity' ? 'serif' : 'sans-serif'}`;
  const size = height * (settings.format === 'square' ? .35 : .51);
  if (variant === 'varsity') {
    paintVarsity(ctx, inputLine.toUpperCase(), font, size, settings);
  } else {
    paintWave(ctx, inputLine, font, size, settings);
  }
}
