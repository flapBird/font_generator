import type { OctoberArtworkConfig } from './october-catalog';

const stylesheets = new Map<string, Promise<void>>();
export async function loadArtworkFont(id: string, family: string, text: string) {
  let sheet = stylesheets.get(id);
  if (!sheet) {
    sheet = new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `/fonts/artwork/${id}/400.css`;
      link.dataset.artworkFont = id;
      const timeout = window.setTimeout(() => fail(), 15000);
      const fail = () => { window.clearTimeout(timeout); link.remove(); stylesheets.delete(id); reject(new Error('Font stylesheet could not load.')); };
      link.onload = () => { window.clearTimeout(timeout); resolve(); };
      link.onerror = fail;
      document.head.appendChild(link);
    });
    stylesheets.set(id, sheet);
  }
  await sheet;
  // The actual input selects the required CJK unicode-range subsets. No text is
  // sent to a font service: every CSS/WOFF2 URL is served by this site.
  let timeout = 0;
  try {
    await Promise.race([
      document.fonts.load(`400 64px "Artwork ${family}"`, text || ' '),
      new Promise<never>((_, reject) => { timeout = window.setTimeout(() => reject(new Error('Font download timed out.')), 15000); }),
    ]);
  } catch (error) {
    // A failed FontFace can retain its error state. Recreate only this tool's
    // stylesheet on retry, so interrupted WOFF2 requests can recover as well.
    document.querySelector(`link[data-artwork-font="${id}"]`)?.remove();
    stylesheets.delete(id);
    throw error;
  } finally { window.clearTimeout(timeout); }
}

export interface ArtworkSettings {
  size: number; color: string; background: string; transparent: boolean;
  outline: number; outlineColor: string; shadow: boolean; gradient: boolean;
  accent: string; format: 'banner' | 'square'; align: 'left' | 'center' | 'right';
}
export function renderArtwork(canvas: HTMLCanvasElement, text: string, family: string, config: OctoberArtworkConfig, settings: ArtworkSettings) {
  canvas.width = settings.format === 'square' ? 1600 : 2000;
  canvas.height = settings.format === 'square' ? 1600 : 1000;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas rendering is unavailable in this browser.');
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (!settings.transparent) { context.fillStyle = settings.background; context.fillRect(0, 0, canvas.width, canvas.height); }
  if (!text.trim()) return;
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  let size = settings.size * 2;
  const pad = 100;
  const outline = config.effects ? settings.outline * 2 : 0;
  context.direction = config.direction;
  let ascent = 0, descent = 0, advance = 0;
  for (; size >= 4; size -= 2) {
    context.font = `400 ${size}px "Artwork ${family}"`;
    const metrics = lines.map((line) => context.measureText(line || ' '));
    ascent = Math.max(size * 0.85, ...metrics.map((metric) => metric.actualBoundingBoxAscent));
    descent = Math.max(size * 0.3, ...metrics.map((metric) => metric.actualBoundingBoxDescent));
    advance = Math.max(size * (config.direction === 'rtl' ? 1.7 : 1.45), ascent + descent + size * 0.1);
    if (metrics.every((metric) => Math.max(metric.width, metric.actualBoundingBoxLeft + metric.actualBoundingBoxRight) < canvas.width - pad * 2 - outline * 2)
      && ascent + descent + (lines.length - 1) * advance < canvas.height - pad * 2 - outline * 2) break;
  }
  context.textBaseline = 'alphabetic';
  context.textAlign = settings.align;
  context.lineJoin = 'round';
  context.lineWidth = outline;
  context.strokeStyle = settings.outlineColor;
  context.fillStyle = settings.color;
  if (config.effects && settings.gradient) {
    const gradient = context.createLinearGradient(0, canvas.height * 0.2, 0, canvas.height * 0.8);
    gradient.addColorStop(0, settings.color); gradient.addColorStop(1, settings.accent);
    context.fillStyle = gradient;
  }
  if (config.effects && settings.shadow) {
    context.shadowColor = settings.outlineColor; context.shadowBlur = 10;
    context.shadowOffsetX = 10; context.shadowOffsetY = 12;
  }
  const x = settings.align === 'left' ? pad + outline : settings.align === 'right' ? canvas.width - pad - outline : canvas.width / 2;
  const top = (canvas.height - ascent - descent - (lines.length - 1) * advance) / 2 + ascent;
  // Draw complete lines: splitting into glyphs would destroy Arabic joining and
  // bidirectional shaping. Existing artwork renderers are intentionally separate.
  lines.forEach((line, index) => {
    if (outline) context.strokeText(line, x, top + index * advance);
    context.fillText(line, x, top + index * advance);
  });
}
