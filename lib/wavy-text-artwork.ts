import { segmentGraphemes } from './unicode';
import { discoveryFonts, type DiscoveryFont } from './discovery-art';

export const wavyTextLimit = 120;
export const waveCanvases = { banner: [2000, 1000], square: [1600, 1600], story: [1080, 1920] } as const;
export const waveShapes = ['wave', 'arc', 'custom', 'straight'] as const;

export type WaveSettings = {
  shape: typeof waveShapes[number];
  mode: 'follow' | 'warp';
  height: number;
  cycles: number;
  phase: number;
  bendStart: number;
  bendEnd: number;
  spacing: number;
  scale: number;
  x: number;
  y: number;
  font: DiscoveryFont;
  fill: string;
  outline: string;
  stroke: number;
  backdrop: 'transparent' | 'color' | 'photo';
  background: string;
  format: keyof typeof waveCanvases;
};

const initial: WaveSettings = {
  shape: 'wave', mode: 'follow', height: 42, cycles: 1, phase: 0, bendStart: -70, bendEnd: 60,
  spacing: 7, scale: 84, x: 50, y: 50, font: 'luckiest-guy', fill: '#fff2a7', outline: '#683c85', stroke: 10,
  backdrop: 'color', background: '#d597f2', format: 'banner',
};

export const waveTemplates = [
  { name: 'Retro S-curve', settings: initial },
  { name: 'Rolling tide', settings: { ...initial, mode: 'warp', cycles: 1.5, height: 56, font: 'bebas-neue', fill: '#e1fbc8', outline: '#1a5d59', background: '#0d2a3c' } },
  { name: 'Handwritten arch', settings: { ...initial, shape: 'arc', height: 53, spacing: 2, font: 'caveat', fill: '#722b46', outline: '#fff1df', stroke: 3, background: '#ffdec9' } },
  { name: 'Custom ribbon', settings: { ...initial, shape: 'custom', font: 'oswald', fill: '#fff7e9', outline: '#37236f', background: '#634fbb', height: 74 } },
] satisfies { name: string; settings: WaveSettings }[];

export function waveOffset(t: number, settings: WaveSettings, amplitude: number) {
  switch (settings.shape) {
    case 'wave':
      return amplitude * Math.sin((t - .5) * 2 * Math.PI * settings.cycles + settings.phase * Math.PI / 180);
    case 'arc':
      return -amplitude * 4 * t * (1 - t);
    case 'custom':
      return amplitude * (3 * (1 - t) ** 2 * t * settings.bendStart + 3 * (1 - t) * t ** 2 * settings.bendEnd) / 100;
    case 'straight':
      return 0;
  }
}

function renderText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, settings: WaveSettings, size: number) {
  ctx.lineJoin = 'round';
  if (settings.stroke > 0) {
    ctx.lineWidth = settings.stroke * size / 100;
    ctx.strokeStyle = settings.outline;
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = settings.fill;
  ctx.fillText(text, x, y);
}

function prepareText(ctx: CanvasRenderingContext2D, text: string, width: number, height: number, settings: WaveSettings) {
  const glyphs = segmentGraphemes(text);
  const family = discoveryFonts[settings.font].family;
  const nominalSize = Math.min(width * .4, height * .32);
  const setFont = (size: number) => {
    ctx.font = `400 ${size}px "${family}", sans-serif`;
    ctx.letterSpacing = `${size * settings.spacing / 100}px`;
  };
  setFont(nominalSize);

  const measure = () => settings.mode === 'follow' && settings.shape !== 'straight'
    ? glyphs.reduce((width, glyph) => width + ctx.measureText(glyph).width, 0) - (glyphs.length ? parseFloat(ctx.letterSpacing) : 0)
    : ctx.measureText(text).width;
  const size = Math.max(1, nominalSize * Math.min(1, width * .76 / Math.max(1, measure())) * settings.scale / 100);
  setFont(size);
  return { size, run: Math.max(1, measure()), glyphs };
}

export function drawWavyText(
  canvas: HTMLCanvasElement, input: string, settings: WaveSettings,
  photo: ImageBitmap | null, guide: boolean,
) {
  const [width, height] = waveCanvases[settings.format];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  if (settings.backdrop !== 'transparent') {
    ctx.fillStyle = settings.background;
    ctx.fillRect(0, 0, width, height);
  }
  if (settings.backdrop === 'photo' && photo) {
    const ratio = Math.max(width / photo.width, height / photo.height);
    const w = photo.width * ratio;
    const h = photo.height * ratio;
    ctx.drawImage(photo, (width - w) / 2, (height - h) / 2, w, h);
  }
  const text = input.trim();
  if (!text) return;

  const { size, run, glyphs } = prepareText(ctx, text, width, height, settings);
  const start = (width - run) * settings.x / 100;
  const center = height * settings.y / 100;
  const amplitude = settings.height / 100 * Math.min(height * .19, run * .32);
  const offset = (t: number) => waveOffset(t, settings, amplitude);

  if (guide && settings.shape !== 'straight') {
    ctx.save();
    ctx.strokeStyle = '#fafafa';
    ctx.shadowColor = '#181026';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 3;
    ctx.setLineDash([9, 9]);
    ctx.beginPath();
    for (let step = 0; step <= 100; step++) {
      const x = start + run * step / 100;
      const y = center + offset(step / 100) + size * .3;
      if (step === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  if (settings.shape === 'straight' || amplitude === 0) {
    renderText(ctx, text, start, center + size * .3, settings, size);
    return;
  }

  if (settings.mode === 'follow') {
    let x = start;
    const gap = parseFloat(ctx.letterSpacing);
    ctx.letterSpacing = '0px';
    for (const glyph of glyphs) {
      const advance = ctx.measureText(glyph).width;
      const midpoint = x + advance / 2;
      const t = (midpoint - start) / run;
      const slope = (offset(t + .001) - offset(t - .001)) / (.002 * run);
      ctx.save();
      ctx.translate(midpoint, center + offset(t) + size * .3);
      ctx.rotate(Math.atan(slope));
      renderText(ctx, glyph, -advance / 2, 0, settings, size);
      ctx.restore();
      x += advance + gap;
    }
    return;
  }

  const metrics = ctx.measureText(text);
  const pad = Math.ceil(size * .2) + 4;
  const layer = document.createElement('canvas');
  const left = Math.ceil(Math.max(0, metrics.actualBoundingBoxLeft)) + pad;
  const baseline = Math.ceil(Math.max(size, metrics.actualBoundingBoxAscent)) + pad;
  layer.width = Math.ceil(Math.max(run, metrics.actualBoundingBoxRight)) + left + pad;
  layer.height = baseline + Math.ceil(Math.max(size * .35, metrics.actualBoundingBoxDescent)) + pad;
  const ink = layer.getContext('2d');
  if (!ink) throw new Error('Text canvas unavailable');
  ink.font = ctx.font;
  ink.letterSpacing = ctx.letterSpacing;
  renderText(ink, text, left, baseline, settings, size);
  const top = center + size * .3 - baseline;
  for (let x = 0; x < layer.width; x++) {
    ctx.drawImage(layer, x, 0, 1, layer.height, Math.floor(start - left) + x,
      Math.round(top + offset((x - left) / run)), 1, layer.height);
  }
}
