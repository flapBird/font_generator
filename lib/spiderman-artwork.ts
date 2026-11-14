import { titleArtworkFormats, wrapArtworkLines, type TitleArtworkSettings } from './title-artwork';

export const SPIDERMAN_SAMPLE = 'WEB SLINGER';
const fontFamily = 'Spider-Man Artwork Bangers';

export const spidermanPresets = [
  { name: 'Classic Cover', fill: '#ed2639', outline: '#171925', scene: '#f8e9d4', slant: 4, depth: '#183b87', rim: '#fff2dc', web: '#441727' },
  { name: 'Midnight Web', fill: '#c5ddf8', outline: '#101525', scene: '#1b2743', slant: 1, depth: '#334c78', rim: '#8eaddc', web: '#305074' },
  { name: 'Retro Issue', fill: '#ffcf4d', outline: '#771a31', scene: '#f9e0bf', slant: 7, depth: '#321524', rim: '#fff3ce', web: '#663623' },
] as const;

let fontRequest: Promise<FontFace> | undefined;

export function loadSpidermanFont() {
  if (fontRequest) return fontRequest;
  fontRequest = new Promise<FontFace>((resolve, reject) => {
    const face = new FontFace(fontFamily, 'url(/fonts/spiderman/bangers-latin.woff2)');
    const timer = window.setTimeout(() => reject(new Error('Font loading timed out.')), 15000);
    face.load().then(resolve, reject).finally(() => window.clearTimeout(timer));
  }).then((face) => {
    document.fonts.add(face);
    return face;
  }).catch((error) => {
    fontRequest = undefined;
    throw error;
  });
  return fontRequest;
}

function strokeWeb(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, spacing: number, lineWidth: number) {
  const spokes = Array.from({ length: 10 }, (_, index) => {
    const angle = index * Math.PI / 5;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  });
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  for (const direction of spokes) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + direction.x * radius, y + direction.y * radius);
  }
  for (let ring = spacing; ring < radius; ring += spacing) {
    ctx.moveTo(x + ring, y);
    spokes.forEach((direction, index) => {
      const next = spokes[(index + 1) % spokes.length];
      ctx.quadraticCurveTo(
        x + (direction.x + next.x) * ring * 0.38,
        y + (direction.y + next.y) * ring * 0.38,
        x + next.x * ring,
        y + next.y * ring,
      );
    });
  }
  ctx.stroke();
}

export function drawSpidermanArtwork(canvas: HTMLCanvasElement, text: string, preset: typeof spidermanPresets[number], settings: TitleArtworkSettings, webTexture: boolean) {
  const [width, height] = titleArtworkFormats[settings.format];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable.');

  if (!settings.transparent) {
    ctx.fillStyle = settings.scene;
    ctx.fillRect(0, 0, width, height);
    // Keep the halftone near the edges so the headline remains readable.
    ctx.fillStyle = preset.web;
    for (let y = 18; y < height; y += 36) {
      for (let x = 18; x < width; x += 36) {
        const edge = Math.min(x, y, width - x, height - y);
        if (edge >= 180) continue;
        ctx.globalAlpha = 0.18 * (1 - edge / 180);
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  const lines = wrapArtworkLines(text);
  const lettering = document.createElement('canvas');
  lettering.width = width;
  lettering.height = height;
  const ink = lettering.getContext('2d');
  if (!ink) throw new Error('Canvas is unavailable.');
  const font = (size: number) => `400 ${size}px "${fontFamily}", sans-serif`;
  ink.font = font(100);
  ink.textAlign = 'center';
  ink.textBaseline = 'middle';
  ink.lineJoin = 'round';
  const slant = Math.tan(settings.slant * Math.PI / 180);
  const tilt = -2.5 * Math.PI / 180;
  const stride = 1.11;
  const metrics = lines.map((line) => ink.measureText(line));
  const lineWidth = Math.max(100, ...metrics.map((line) => 2 * Math.max(Math.abs(line.actualBoundingBoxLeft), Math.abs(line.actualBoundingBoxRight), line.width / 2))) / 100 + slant * 1.45;
  const blockHeight = Math.max(1.45, ...metrics.map((line) => (line.actualBoundingBoxAscent + line.actualBoundingBoxDescent) / 100)) + (lines.length - 1) * stride;
  const size = Math.min(470, (width - 176) / (lineWidth + blockHeight * Math.abs(Math.sin(tilt)) + 0.2), (height - 128) / (blockHeight + lineWidth * Math.abs(Math.sin(tilt)) + 0.2));
  const depth = Math.min(26, size * 0.13);
  const outline = Math.max(2, size * 0.095);

  ink.font = font(size);
  ink.translate((width - depth) / 2, (height - depth) / 2);
  ink.rotate(tilt);
  ink.transform(1, 0, -slant, 1, 0, 0);
  const drawLines = (offset: number, stroke: string, fill: string | CanvasGradient, lineWidth: number) => {
    ink.strokeStyle = stroke;
    ink.fillStyle = fill;
    ink.lineWidth = lineWidth;
    lines.forEach((line, index) => {
      const baseline = (index - (lines.length - 1) / 2) * size * stride + offset;
      if (lineWidth > 0) ink.strokeText(line, offset, baseline);
      ink.fillText(line, offset, baseline);
    });
  };

  for (let offset = depth; offset > 0; offset -= 2) drawLines(offset, preset.depth, preset.depth, outline * 1.4);
  drawLines(0, preset.rim, settings.fill, outline * 1.7);
  drawLines(0, settings.outline, settings.fill, outline);
  ctx.drawImage(lettering, 0, 0);

  // Reuse the lettering layer as a mask so webs can only mark the letter faces.
  ink.save();
  ink.resetTransform();
  ink.clearRect(0, 0, width, height);
  ink.restore();
  const color = ink.createLinearGradient(0, -size * blockHeight / 2, 0, size * blockHeight / 2);
  color.addColorStop(0, preset.rim);
  color.addColorStop(0.21, settings.fill);
  color.addColorStop(0.75, settings.fill);
  color.addColorStop(1, settings.outline);
  drawLines(0, settings.outline, color, 0);

  if (webTexture) {
    ink.resetTransform();
    ink.globalCompositeOperation = 'source-atop';
    ink.globalAlpha = 0.5;
    ink.strokeStyle = preset.web;
    const radius = Math.hypot(width, height);
    const spacing = Math.max(42, size * 0.15);
    const weight = Math.max(1.7, size * 0.008);
    strokeWeb(ink, width * 0.27, height * 0.42, radius, spacing, weight);
    strokeWeb(ink, width * 0.74, height * 0.55, radius, spacing * 1.12, weight);
  }
  ctx.drawImage(lettering, 0, 0);
}
