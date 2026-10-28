import type { HalloweenPreset } from './halloween-catalog';

export interface HalloweenSettings {
  color: string; accent: string; background: string; transparent: boolean;
  size: number; outline: number; outlineColor: string; shadow: boolean;
  format: 'banner' | 'square'; align: 'left' | 'center' | 'right'; stacked: boolean;
}
export const halloweenDefaults = (preset: HalloweenPreset): HalloweenSettings => ({
  color: preset.color, accent: preset.accent, background: preset.background, transparent: false,
  size: 160, outline: preset.outline, outlineColor: preset.ink, shadow: preset.effect === 'extrude',
  format: 'banner', align: 'center', stacked: preset.category === 'Posters',
});
const random = (n: number) => { const value = Math.sin(n * 127.1 + 31.7) * 43758.5453; return value - Math.floor(value); };
const polygon = (ctx: CanvasRenderingContext2D, points: number[][]) => {
  ctx.beginPath(); points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
};
function bat(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
  ctx.beginPath(); ctx.moveTo(0, -0.1); ctx.lineTo(-0.12, -0.4); ctx.lineTo(-0.2, -0.08);
  ctx.quadraticCurveTo(-0.65, -0.15, -1, -0.6); ctx.quadraticCurveTo(-0.9, 0.25, -0.35, 0.35);
  ctx.quadraticCurveTo(-0.1, 0.1, 0, 0.45); ctx.quadraticCurveTo(0.1, 0.1, 0.35, 0.35);
  ctx.quadraticCurveTo(0.9, 0.25, 1, -0.6); ctx.quadraticCurveTo(0.65, -0.15, 0.2, -0.08);
  ctx.lineTo(0.12, -0.4); ctx.closePath(); ctx.fill(); ctx.restore();
}
function pumpkin(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
  ctx.fillStyle = '#e86716'; ctx.beginPath(); ctx.ellipse(0, 0, 1, 0.8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#a33e11'; ctx.lineWidth = 0.04;
  for (const width of [0.35, 0.7]) { ctx.beginPath(); ctx.ellipse(0, 0, width, 0.78, 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = '#629543'; polygon(ctx, [[-0.12, -0.7], [-0.06, -1.08], [0.12, -1.1], [0.08, -0.7]]);
  ctx.fillStyle = '#351a26'; polygon(ctx, [[-0.6, -0.05], [-0.25, -0.28], [-0.2, 0.02]]); polygon(ctx, [[0.6, -0.05], [0.25, -0.28], [0.2, 0.02]]);
  polygon(ctx, [[-0.55, 0.22], [-0.2, 0.33], [-0.12, 0.2], [0.15, 0.2], [0.22, 0.33], [0.55, 0.22], [0.32, 0.55], [-0.3, 0.55]]); ctx.restore();
}
function scene(ctx: CanvasRenderingContext2D, w: number, h: number, preset: HalloweenPreset, settings: HalloweenSettings) {
  if (settings.transparent) return;
  const gradient = ctx.createRadialGradient(w * 0.5, h * 0.35, 0, w * 0.5, h * 0.5, w * 0.7);
  gradient.addColorStop(0, settings.background); gradient.addColorStop(1, preset.scene === 'paper' ? '#ad815d' : settings.background);
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
  ctx.save();
  if (preset.scene === 'moon' || preset.scene === 'graveyard') {
    ctx.fillStyle = settings.accent; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.arc(w * 0.5, h * 0.32, h * 0.34, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#140e23';
    for (let i = 0; i < 6; i++) bat(ctx, w * (0.1 + random(i) * 0.8), h * (0.07 + random(i + 7) * 0.2), 25 + random(i + 10) * 35);
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, h * 0.87); ctx.bezierCurveTo(w * 0.3, h * 0.78, w * 0.6, h, w, h * 0.85); ctx.lineTo(w, h); ctx.fill();
    for (const [x, y] of [[w * 0.08, h * 0.82], [w * 0.92, h * 0.88]]) {
      ctx.fillRect(x - 8, y - 80, 16, 100); ctx.fillRect(x - 30, y - 55, 60, 13);
    }
  }
  if (preset.scene === 'pumpkins') {
    pumpkin(ctx, w * 0.09, h * 0.8, h * 0.12); pumpkin(ctx, w * 0.91, h * 0.81, h * 0.1);
    ctx.fillStyle = '#1c102d'; bat(ctx, w * 0.12, h * 0.16, 45); bat(ctx, w * 0.88, h * 0.19, 32);
  }
  if (preset.scene === 'web') {
    ctx.strokeStyle = settings.accent; ctx.lineWidth = 2; ctx.globalAlpha = 0.38;
    for (const right of [false, true]) {
      ctx.save(); if (right) { ctx.translate(w, 0); ctx.scale(-1, 1); }
      const radius = Math.min(w * 0.26, h * 0.52);
      for (let i = 0; i <= 6; i++) { const angle = i * Math.PI / 12; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius); ctx.stroke(); }
      for (let r = radius / 5; r <= radius; r += radius / 5) {
        ctx.beginPath(); ctx.moveTo(r, 0);
        for (let i = 1; i <= 6; i++) { const angle = i * Math.PI / 12, mid = angle - Math.PI / 24; ctx.quadraticCurveTo(Math.cos(mid) * r * 0.88, Math.sin(mid) * r * 0.88, Math.cos(angle) * r, Math.sin(angle) * r); } ctx.stroke();
      } ctx.restore();
    }
  }
  if (preset.scene === 'stars' || preset.scene === 'paper') {
    ctx.fillStyle = settings.accent; ctx.globalAlpha = preset.scene === 'paper' ? 0.17 : 0.55;
    for (let i = 0; i < 48; i++) {
      const x = random(i + 30) * w, y = random(i + 90) * h;
      if (preset.scene !== 'paper' && y > h * 0.23 && y < h * 0.78) continue;
      const r = 2 + random(i + 50) * 7;
      if (preset.scene === 'paper') ctx.fillRect(x, y, r * 3, 2);
      else polygon(ctx, [[x, y - r], [x + r * 0.25, y - r * 0.25], [x + r, y], [x + r * 0.25, y + r * 0.25], [x, y + r], [x - r * 0.25, y + r * 0.25], [x - r, y], [x - r * 0.25, y - r * 0.25]]);
    }
  }
  if (preset.scene === 'lightning') {
    ctx.fillStyle = settings.accent; ctx.globalAlpha = 0.65;
    polygon(ctx, [[w * 0.14, 0], [w * 0.09, h * 0.24], [w * 0.16, h * 0.22], [w * 0.08, h * 0.5], [w * 0.24, h * 0.16], [w * 0.16, h * 0.17], [w * 0.2, 0]]);
    polygon(ctx, [[w * 0.9, h], [w * 0.94, h * 0.76], [w * 0.87, h * 0.78], [w * 0.95, h * 0.55], [w * 0.78, h * 0.82], [w * 0.87, h * 0.83], [w * 0.83, h]]);
  }
  ctx.restore();
  if (preset.category === 'Gothic' || preset.scene === 'paper') {
    ctx.save(); ctx.strokeStyle = settings.accent; ctx.globalAlpha = 0.5; ctx.lineWidth = 2;
    ctx.strokeRect(48, 48, w - 96, h - 96); ctx.strokeRect(60, 60, w - 120, h - 120); ctx.restore();
  }
}

/** Independent renderer; shared artwork tools never call this module. */
export function renderHalloween(canvas: HTMLCanvasElement, text: string, preset: HalloweenPreset, settings: HalloweenSettings, thumbnail = false) {
  const w = settings.format === 'square' ? 1600 : 2000, h = settings.format === 'square' ? 1600 : 1000;
  const scale = thumbnail ? 0.3 : 1;
  canvas.width = w * scale; canvas.height = h * scale;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas is unavailable.');
  ctx.scale(scale, scale); scene(ctx, w, h, preset, settings);
  if (!text.trim()) return;
  let lines = text.replace(/\r\n?/g, '\n').split('\n');
  if (settings.stacked && lines.length === 1) {
    const words = text.trim().split(/\s+/);
    if (words.length > 1) { const middle = Math.ceil(words.length / 2); lines = [words.slice(0, middle).join(' '), words.slice(middle).join(' ')]; }
  }
  const layer = document.createElement('canvas'); layer.width = canvas.width; layer.height = canvas.height;
  const ink = layer.getContext('2d')!; ink.scale(scale, scale);
  const pad = 150, available = w - pad * 2, arch = preset.arch && lines.length === 1 && /^[\x20-\x7e]+$/.test(text);
  let size = settings.size * 2, ascent = 0, descent = 0, advance = 0;
  for (; size >= 4; size -= 2) {
    ink.font = `400 ${size}px "Artwork ${preset.font.family}"`;
    const metrics = lines.map((line) => ink.measureText(line || ' '));
    ascent = Math.max(size * 0.85, ...metrics.map((m) => m.actualBoundingBoxAscent));
    descent = Math.max(size * 0.3, ...metrics.map((m) => m.actualBoundingBoxDescent));
    advance = Math.max(size * 1.45, ascent + descent + size * 0.12);
    if (metrics.every((m) => Math.max(m.width, m.actualBoundingBoxLeft + m.actualBoundingBoxRight) <= available - settings.outline * 4 - 50)
      && ascent + descent + (lines.length - 1) * advance + (arch ? size * 0.65 : 0) <= h - pad * 2) break;
  }
  ink.textAlign = settings.align; ink.textBaseline = 'alphabetic'; ink.lineJoin = 'round';
  const x = settings.align === 'left' ? pad : settings.align === 'right' ? w - pad : w / 2;
  const firstY = (h - ascent - descent - (lines.length - 1) * advance) / 2 + ascent;
  const draw = (stroke = false, dx = 0, dy = 0) => lines.forEach((line, row) => {
    if (arch) {
      const total = ink.measureText(line).width, start = settings.align === 'left' ? x : settings.align === 'right' ? x - total : x - total / 2;
      let offset = 0;
      for (const character of line) {
        const width = ink.measureText(character).width, position = (offset + width / 2) / (total || 1) - 0.5;
        ink.save(); ink.translate(start + offset + width / 2 + dx, firstY + dy + size * (position * position * 1.8 - 0.22)); ink.rotate(position * 0.55); ink.textAlign = 'center';
        if (stroke) ink.strokeText(character, 0, 0); else ink.fillText(character, 0, 0); ink.restore(); offset += width;
      }
    } else if (stroke) ink.strokeText(line, x + dx, firstY + row * advance + dy); else ink.fillText(line, x + dx, firstY + row * advance + dy);
  });
  if (settings.shadow) { ink.fillStyle = settings.outlineColor; for (let offset = 24; offset >= 2; offset -= 2) draw(false, offset, offset); }
  if (preset.effect === 'glitch') { ink.fillStyle = '#28e7ed'; draw(false, -12, -2); ink.fillStyle = settings.accent; draw(false, 12, 2); }
  ink.strokeStyle = settings.outlineColor; ink.lineWidth = settings.outline * 2;
  if (settings.outline) draw(true);
  const fill = ink.createLinearGradient(0, firstY - ascent, 0, firstY + descent + (lines.length - 1) * advance);
  fill.addColorStop(0, settings.color);
  if (preset.effect === 'candy') { fill.addColorStop(0.32, settings.color); fill.addColorStop(0.33, settings.accent); fill.addColorStop(0.7, settings.accent); fill.addColorStop(0.71, '#ffda3d'); fill.addColorStop(1, '#ffda3d'); }
  else fill.addColorStop(1, settings.accent);
  ink.fillStyle = fill;
  if (preset.effect === 'glow' || preset.effect === 'neon') { ink.shadowColor = settings.accent; ink.shadowBlur = 32 * scale; draw(); ink.shadowBlur = 16 * scale; draw(); ink.shadowBlur = 0; }
  draw();
  if (preset.effect === 'neon') { ink.strokeStyle = '#fff5ff'; ink.lineWidth = 2.5; draw(true); }
  if (preset.effect === 'stitch' || preset.effect === 'scratch') {
    ink.save(); ink.globalCompositeOperation = 'source-atop'; ink.strokeStyle = settings.outlineColor; ink.globalAlpha = 0.6; ink.lineWidth = 3;
    for (let i = 0; i < 70; i++) {
      const sx = random(i + 10) * w, sy = h * 0.15 + random(i + 80) * h * 0.7;
      ink.beginPath(); ink.moveTo(sx, sy); ink.lineTo(sx + 35, sy - 25); ink.stroke();
      if (preset.effect === 'stitch') for (let t = 0; t < 3; t++) { ink.beginPath(); ink.moveTo(sx + t * 12 - 4, sy - t * 8 - 6); ink.lineTo(sx + t * 12 + 6, sy - t * 8 + 6); ink.stroke(); }
    } ink.restore();
  }
  // The same composition renders to a low-resolution gallery or full-size PNG.
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(layer, 0, 0); ctx.restore();
}
