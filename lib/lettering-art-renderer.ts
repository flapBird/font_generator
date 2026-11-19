import { graduateFontFamily, letteringSizes, type LetteringSettings } from './lettering-art';
import { segmentGraphemes } from './unicode';

let graduateFont: Promise<FontFace> | undefined;

export function loadLetteringFont() {
  if (graduateFont) return graduateFont;

  const face = new FontFace(graduateFontFamily, 'url(/fonts/lettering/Graduate-Regular.ttf)');
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

function paintVarsity(ctx: CanvasRenderingContext2D, text: string, size: number, top: number, height: number, settings: LetteringSettings) {
  const letters = segmentGraphemes(text);
  const { width } = ctx.canvas;

  function measure(fontSize: number) {
    ctx.font = `400 ${fontSize}px "${graduateFontFamily}", serif`;
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
  const baseline = top + height / 2 + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent + arch) / 2;
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

export function renderVarsityArt(canvas: HTMLCanvasElement, name: string, number: string, settings: LetteringSettings) {
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
  const title = name.trim().toUpperCase();
  if (number && title) {
    paintVarsity(ctx, title, height * .32, 0, height * .45, settings);
    paintVarsity(ctx, number, height * .48, height * .39, height * .61, { ...settings, curve: 0 });
  } else if (title || number) {
    paintVarsity(ctx, title || number, height * (settings.format === 'square' ? .35 : .51), 0, height,
      title ? settings : { ...settings, curve: 0 });
  }
}
