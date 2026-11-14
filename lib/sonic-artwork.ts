import { discoveryFonts } from './discovery-art';
import { titleArtworkFormats, wrapArtworkLines, type TitleArtworkSettings } from './title-artwork';

export const SONIC_SAMPLE = 'SPEED RUN';
export const sonicPresets = [
  { name: 'Arcade Gold', fill: '#ffd54b', outline: '#254ba9', depth: '#13275f', scene: '#e9f4ff', slant: 14, layers: 22 },
  { name: 'Blue Boost', fill: '#83e4ff', outline: '#153ba6', depth: '#0b1d63', scene: '#0e1951', slant: 20, layers: 32 },
  { name: 'Sunset Sprint', fill: '#ff9f39', outline: '#56318f', depth: '#301751', scene: '#ffe8dc', slant: 8, layers: 14 },
] as const;

export function drawSonicArtwork(canvas: HTMLCanvasElement, text: string, preset: typeof sonicPresets[number], settings: TitleArtworkSettings) {
  const [width, height] = titleArtworkFormats[settings.format];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable.');

  if (!settings.transparent) {
    ctx.fillStyle = settings.scene;
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = settings.outline;
    for (let row = 0; row < 13; row++) {
      const y = height * (0.16 + row * 0.057);
      const length = 110 + (row * 83) % 380;
      ctx.fillRect(0, y, length, row % 3 === 0 ? 8 : 3);
      ctx.fillRect(width - length * 0.7, y + 20, length, 4);
    }
    ctx.restore();
  }

  const lines = wrapArtworkLines(text);

  const slant = Math.tan(settings.slant * Math.PI / 180);
  const font = (size: number) => `400 ${size}px "${discoveryFonts['luckiest-guy'].family}", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font(100);
  const maxLineWidth = Math.max(100, ...lines.map((line) => {
    const measured = ctx.measureText(line);
    return Math.max(measured.width, 2 * Math.abs(measured.actualBoundingBoxLeft), 2 * Math.abs(measured.actualBoundingBoxRight));
  }));
  const size = Math.min(410, (width - 240) * 100 / (maxLineWidth + 100 * slant), (height - 200) / (lines.length * 1.16));
  ctx.font = font(size);
  ctx.lineJoin = 'round';
  const outline = Math.max(2, size * 0.11);
  const depth = Math.min(preset.layers, size * 0.18);
  const stride = size * 1.16;
  const center = (height - depth) / 2;
  const draw = (fill: string, stroke: string, thickness: number, offset = 0) => {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = thickness;
    lines.forEach((line, index) => {
      ctx.save();
      ctx.translate((width - depth) / 2 + offset, center + (index - (lines.length - 1) / 2) * stride + offset);
      ctx.transform(1, 0, -slant, 1, 0, 0);
      ctx.strokeText(line, 0, 0);
      ctx.fillText(line, 0, 0);
      ctx.restore();
    });
  };

  for (let layer = depth; layer > 0; layer -= 2) draw(preset.depth, preset.depth, outline * 1.35, layer);
  draw(settings.fill, '#ffffff', outline * 1.25);
  draw(settings.fill, settings.outline, outline);
}
