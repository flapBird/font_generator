import { fandomBrushConfigs, type FandomBrushPreset, type FandomBrushSlug } from './fandom-brush-catalog';
import { titleArtworkFormats, wrapArtworkLines, type TitleArtworkSettings } from './title-artwork';

const fonts = new Map<FandomBrushSlug, Promise<FontFace>>();

export function loadFandomBrushFont(slug: FandomBrushSlug) {
  const cached = fonts.get(slug);
  if (cached) return cached;
  const { font, fontName } = fandomBrushConfigs[slug];
  const face = new FontFace(`Fan title ${fontName}`, `url(/fonts/artwork/${font}/files/${font}-latin-400-normal.woff2)`);
  let timeout = 0;
  const loading = Promise.race([
    face.load(),
    new Promise<never>((_, reject) => { timeout = window.setTimeout(() => reject(new Error('Title font timed out.')), 15000); }),
  ]).then((loaded) => {
    document.fonts.add(loaded);
    return loaded;
  }).catch((error: unknown) => {
    fonts.delete(slug);
    throw error;
  }).finally(() => window.clearTimeout(timeout));
  fonts.set(slug, loading);
  return loading;
}

function motionTrails(ctx: CanvasRenderingContext2D, edge: number, y: number, size: number, ink: string, edgeInk: string) {
  ctx.save();
  for (let trail = 0; trail < 6; trail++) {
    const length = size * (.19 + ((trail * 7 + 3) % 11) / 17);
    const x = edge - size * (trail % 2 ? .08 : .18);
    const baseline = y + size * (.13 * trail - .37);
    ctx.fillStyle = trail % 3 ? ink : edgeInk;
    ctx.globalAlpha = trail % 3 ? .88 : .72;
    ctx.beginPath();
    ctx.moveTo(x - length, baseline + size * .14);
    ctx.lineTo(x + size * .18, baseline - size * .075);
    ctx.lineTo(x + size * .035, baseline + size * .015);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function weatherInk(ctx: CanvasRenderingContext2D, left: number, right: number, y: number, size: number, outline: string) {
  const span = right - left;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = .61;
  for (let index = 0; index < Math.min(480, Math.ceil(span / 2)); index++) {
    const x = left + ((index * 97) % 997) / 997 * span;
    const row = y + size * (((index * 61) % 149) / 149 - .91);
    ctx.fillRect(x, row, size * (.008 + index % 5 * .006), Math.max(1, size * .007));
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = outline;
  for (let index = 0; index < 11; index++) {
    const x = (index % 2 ? left : right) + size * ((index * 13 % 17) / 17 - .5);
    const row = y + size * ((index * 17 % 23) / 23 - .75);
    ctx.beginPath();
    ctx.ellipse(x, row, size * (.007 + index % 4 * .007), size * .009, -.36, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function inkAccent(ctx: CanvasRenderingContext2D, left: number, right: number, size: number, color: string, wave: boolean) {
  const span = Math.max(right - left, size);
  ctx.fillStyle = color;
  ctx.globalAlpha = .78;
  ctx.beginPath();
  ctx.moveTo(left - size * .15, size * .28);
  if (wave) {
    ctx.bezierCurveTo(left + span * .3, -size * .14, left + span * .52, size * .48, right + size * .14, size * .09);
    ctx.bezierCurveTo(left + span * .63, size * .61, left + span * .28, size * .12, left - size * .15, size * .28);
  } else {
    ctx.quadraticCurveTo(left + span * .44, size * .29, right + size * .12, size * .02);
    ctx.quadraticCurveTo(left + span * .66, size * .48, left - size * .15, size * .28);
  }
  ctx.fill();
  ctx.globalAlpha = 1;
}

function embers(ctx: CanvasRenderingContext2D, left: number, right: number, size: number, color: string) {
  ctx.fillStyle = color;
  for (let i = 0; i < 20; i++) {
    const x = left - size * .22 + (right - left + size * .44) * ((i * 17 % 29) / 29);
    const y = i % 2 === 0 ? -.75 - i % 4 * .08 : .18 + i % 4 * .052;
    ctx.save();
    ctx.translate(x, y * size);
    ctx.rotate(-.55);
    ctx.fillRect(0, 0, size * (.022 + i % 3 * .014), size * .009);
    ctx.restore();
  }
}

export function drawFandomBrushArtwork(canvas: HTMLCanvasElement, text: string, slug: FandomBrushSlug, preset: FandomBrushPreset, settings: TitleArtworkSettings, decorated: boolean) {
  const { effect, fontName } = fandomBrushConfigs[slug];
  const [width, height] = titleArtworkFormats[settings.format];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable.');

  const lines = wrapArtworkLines(text.trim());
  let size = Math.min(340, Math.floor(height * .72 / (lines.length * 1.2)));
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  const setFont = () => { ctx.font = `${size}px "Fan title ${fontName}", sans-serif`; };
  setFont();
  const widest = Math.max(1, ...lines.map((line) => {
    const metrics = ctx.measureText(line);
    return Math.max(metrics.width, metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight);
  }));
  size = Math.max(2, Math.floor(size * Math.min(1, width * .79 / (widest + size * 1.7))));
  setFont();

  const shear = -Math.tan(settings.slant * Math.PI / 180);
  const spacing = size * 1.19;
  const firstBaseline = (height - (lines.length - 1) * spacing) / 2 + size * .32;
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    const baseline = firstBaseline + index * spacing;
    const metrics = ctx.measureText(line);
    ctx.save();
    ctx.translate(width / 2, baseline);
    ctx.transform(1, 0, shear, 1, 0, 0);
    const left = -metrics.actualBoundingBoxLeft;
    const right = metrics.actualBoundingBoxRight;
    if (decorated && preset.detail === 'trails') motionTrails(ctx, left, 0, size, settings.fill, settings.outline);
    if (decorated && preset.detail === 'echo') {
      ctx.fillStyle = settings.outline;
      for (const [distance, opacity] of [[.28, .17], [.15, .31]]) {
        ctx.globalAlpha = opacity;
        ctx.fillText(line, -size * distance, size * distance * .19);
      }
      ctx.globalAlpha = 1;
    }
    if (decorated && (preset.detail === 'water' || preset.detail === 'sweep')) {
      inkAccent(ctx, left, right, size, settings.outline, preset.detail === 'water');
    }
    ctx.strokeStyle = settings.outline;
    ctx.lineWidth = Math.max(1, size * (effect === 'motion' ? .11 : .038));
    if (effect === 'motion') {
      ctx.fillStyle = settings.outline;
      ctx.fillText(line, size * .025, size * .064);
      ctx.strokeText(line, size * .025, size * .064);
    }
    ctx.strokeText(line, 0, 0);
    ctx.fillStyle = settings.fill;
    ctx.fillText(line, 0, 0);
    if (decorated && preset.detail === 'dry') weatherInk(ctx, left, right, 0, size, settings.outline);
    if (decorated && preset.detail === 'embers') embers(ctx, left, right, size, settings.fill);
    ctx.restore();
  });

  if (!settings.transparent) {
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = settings.scene;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  }
}
