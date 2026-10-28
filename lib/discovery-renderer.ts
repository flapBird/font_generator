import { discoveryFonts, type DiscoveryFont, type DiscoveryArtPreset, type DiscoveryArtSettings } from './discovery-art';

const fonts = new Map<DiscoveryFont, Promise<FontFace>>();
export function loadDiscoveryFont(id: DiscoveryFont) {
  const cached = fonts.get(id);
  if (cached) return cached;
  const face = new FontFace(discoveryFonts[id].family, `url(/fonts/discovery/${id}/latin.woff2)`);
  const loading = new Promise<FontFace>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('Font loading timed out. Try again.')), 15000);
    face.load().then((loaded) => { window.clearTimeout(timer); resolve(loaded); }, (error) => { window.clearTimeout(timer); reject(error); });
  }).then((loaded) => { document.fonts.add(loaded); return loaded; }).catch((error) => { fonts.delete(id); throw error; });
  fonts.set(id, loading);
  return loading;
}

function newLayer(width: number, height: number) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable.');
  return { canvas, ctx };
}

// Each theme renders into its own canvas. No shared renderer or global CSS is changed.
export function renderDiscoveryArt(canvas: HTMLCanvasElement, text: string, preset: DiscoveryArtPreset, settings: DiscoveryArtSettings) {
  const width = settings.format === 'square' ? 1600 : 2000;
  const height = settings.format === 'square' ? 1600 : 1000;
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable.');
  ctx.clearRect(0, 0, width, height);
  const strength = settings.strength;
  const isNeon = preset.effect === 'tube' || preset.effect === 'glow';
  const isSignal = preset.effect === 'signal' || preset.effect === 'terminal';
  if (!settings.transparent) {
    ctx.fillStyle = settings.background; ctx.fillRect(0, 0, width, height);
    ctx.save(); ctx.strokeStyle = settings.accent; ctx.globalAlpha = 0.12; ctx.lineWidth = 2;
    if (isNeon || isSignal) {
      for (let y = 0; y < height; y += isSignal ? 12 : 100) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
      if (isNeon) for (let x = 0; x < width; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    } else if (preset.effect === 'action') {
      ctx.lineWidth = 8;
      for (let i = 0; i < 36; i++) { const angle = i * Math.PI / 18; ctx.beginPath(); ctx.moveTo(width / 2 + Math.cos(angle) * 420, height / 2 + Math.sin(angle) * 240); ctx.lineTo(width / 2 + Math.cos(angle) * width, height / 2 + Math.sin(angle) * width); ctx.stroke(); }
    } else {
      ctx.globalAlpha = 0.28; ctx.lineWidth = 3;
      for (let i = 0; i < 22; i++) { const x = ((i * 317 + 87) % (width - 120)) + 60; const y = ((i * 197 + 53) % (height - 120)) + 60; const r = 5 + i % 4 * 3; ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke(); }
    }
    ctx.restore();
  }
  if (!text.trim() || text.length > 120) return;
  const { canvas: layer, ctx: ink } = newLayer(width, height);
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const padding = 210; // Reserve space for halos, strokes and displaced slices.
  let size = settings.size * 2;
  let advance = 0, ascent = 0, descent = 0;
  ink.textAlign = settings.align;
  for (; size >= 2; size -= 2) {
    ink.letterSpacing = `${settings.spacing * size / settings.size}px`;
    ink.font = `400 ${size}px "${discoveryFonts[preset.font].family}", sans-serif`;
    const metrics = lines.map((line) => ink.measureText(line || ' '));
    ascent = Math.max(size * .85, ...metrics.map((m) => m.actualBoundingBoxAscent));
    descent = Math.max(size * .25, ...metrics.map((m) => m.actualBoundingBoxDescent));
    advance = ascent + descent + size * .2;
    if (metrics.every((m) => Math.max(m.width, m.actualBoundingBoxLeft + m.actualBoundingBoxRight) <= width - padding * 2)
      && ascent + descent + (lines.length - 1) * advance <= height - padding * 2) break;
  }
  const blockHeight = ascent + descent + (lines.length - 1) * advance;
  const y = (height - blockHeight) / 2 + ascent;
  const x = settings.align === 'left' ? padding : settings.align === 'right' ? width - padding : width / 2;
  const draw = (stroke = false, dx = 0, dy = 0) => lines.forEach((line, index) => stroke ? ink.strokeText(line, x + dx, y + index * advance + dy) : ink.fillText(line, x + dx, y + index * advance + dy));
  ink.lineJoin = 'round'; ink.lineCap = 'round';
  if (isNeon) {
    ink.strokeStyle = settings.color; ink.fillStyle = settings.color; ink.lineWidth = Math.max(2, size * .012);
    for (const scale of [9, 4, 1.5]) { ink.shadowBlur = strength * scale; ink.shadowColor = settings.accent; draw(preset.effect === 'tube'); }
    ink.shadowBlur = 0;
    if (preset.effect === 'tube') { ink.strokeStyle = '#fff9fc'; ink.lineWidth = Math.max(1, size * .004); draw(true); }
    else { ink.fillStyle = settings.color; draw(); }
  } else if (isSignal) {
    const offset = strength * 2;
    ink.fillStyle = settings.accent; draw(false, -offset, offset / 3);
    ink.fillStyle = preset.effect === 'terminal' ? '#0c8d49' : '#f64a8a'; draw(false, offset, -offset / 3);
    ink.fillStyle = settings.color; draw();
    if (preset.effect === 'signal' && strength > 0) {
      const snapshot = newLayer(width, height); snapshot.ctx.drawImage(layer, 0, 0);
      for (let i = 0; i < 5; i++) {
        const sy = Math.round((height - blockHeight) / 2 + blockHeight * (i + 1) / 6);
        const h = Math.max(3, strength * 1.2); const shift = (i % 2 ? -1 : 1) * strength * 3;
        ink.clearRect(0, sy, width, h); ink.drawImage(snapshot.canvas, 0, sy, width, h, shift, sy, width, h);
      }
    }
    if (preset.effect === 'terminal') { ink.globalCompositeOperation = 'destination-out'; ink.fillStyle = '#000'; ink.globalAlpha = strength / 30; for (let sy = 0; sy < height; sy += 9) ink.fillRect(0, sy, width, 2); ink.globalCompositeOperation = 'source-over'; ink.globalAlpha = 1; }
  } else {
    ink.strokeStyle = '#171a39'; ink.lineWidth = 4 + strength * 2;
    if (preset.effect === 'action' || preset.effect === 'space') { ink.fillStyle = '#171a39'; for (let depth = strength * 2; depth > 0; depth -= 2) { draw(true, depth, depth); draw(false, depth, depth); } }
    draw(true);
    const gradient = ink.createLinearGradient(0, (height - blockHeight) / 2, 0, (height + blockHeight) / 2);
    gradient.addColorStop(0, settings.color); gradient.addColorStop(1, settings.accent);
    ink.fillStyle = gradient; draw();
    if (preset.effect === 'candy') { ink.strokeStyle = '#ffffff'; ink.lineWidth = 2; draw(true, -1, -1); }
  }
  ctx.drawImage(layer, 0, 0);
}
