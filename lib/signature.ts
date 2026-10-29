export const signatureFonts = [
  { id: 'allura', label: 'Allura', description: 'Light, flowing script' },
  { id: 'dancing-script', label: 'Dancing Script', description: 'Lively connected lettering' },
  { id: 'great-vibes', label: 'Great Vibes', description: 'Formal loops and flourishes' },
  { id: 'sacramento', label: 'Sacramento', description: 'Fine monoline script' },
  { id: 'caveat', label: 'Caveat', description: 'Relaxed handwritten lettering' },
  { id: 'patrick-hand', label: 'Patrick Hand', description: 'Clear hand-printed letters' },
] as const;
export type SignatureFontId = typeof signatureFonts[number]['id'];
export type SignaturePoint = { x: number; y: number };
export type SignatureStroke = SignaturePoint[];
export const SIGNATURE_WIDTH = 1600;
export const SIGNATURE_HEIGHT = 600;

export function inkBounds(data: Uint8ClampedArray, width: number, height: number, padding = 24) {
  let left = width, right = -1, top = height, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] === 0) continue;
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  if (right < 0) return null;
  const x = Math.max(0, left - padding), y = Math.max(0, top - padding);
  return { x, y, width: Math.min(width, right + padding + 1) - x, height: Math.min(height, bottom + padding + 1) - y };
}

export function renderStrokes(canvas: HTMLCanvasElement, strokes: SignatureStroke[], color: string, thickness: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable.');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = thickness;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const stroke of strokes) {
    if (!stroke.length) continue;
    ctx.beginPath();
    if (stroke.length === 1) { ctx.arc(stroke[0].x, stroke[0].y, thickness / 2, 0, Math.PI * 2); ctx.fill(); continue; }
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length - 1; i++) ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, (stroke[i].x + stroke[i + 1].x) / 2, (stroke[i].y + stroke[i + 1].y) / 2);
    const last = stroke[stroke.length - 1]; ctx.lineTo(last.x, last.y); ctx.stroke();
  }
}

export function renderTypedSignature(canvas: HTMLCanvasElement, text: string, family: string, color: string, size: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable.');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!text.trim()) return;
  let fontSize = size;
  ctx.font = `${fontSize}px "${family}"`;
  let metrics = ctx.measureText(text);
  const initialWidth = Math.max(metrics.width, metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight);
  fontSize *= Math.min(1, (canvas.width - 120) / Math.max(1, initialWidth), (canvas.height - 100) / Math.max(1, metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent));
  ctx.font = `${fontSize}px "${family}"`;
  metrics = ctx.measureText(text);
  const width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
  const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  ctx.fillStyle = color;
  ctx.fillText(text, (canvas.width - width) / 2 + metrics.actualBoundingBoxLeft, (canvas.height - height) / 2 + metrics.actualBoundingBoxAscent);
}

const fontLoads = new Map<string, Promise<string>>();
export function loadSignatureFont(id: SignatureFontId) {
  if (!fontLoads.has(id)) {
    const family = `Signature ${id}`;
    const face = new FontFace(family, `url("/fonts/signature/${id}.woff2")`, { weight: '400', style: 'normal' });
    const pending = new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Font loading timed out.')), 10000);
      face.load().then((loaded) => { clearTimeout(timer); document.fonts.add(loaded); resolve(family); }, (error) => { clearTimeout(timer); reject(error); });
    }).catch((error) => { fontLoads.delete(id); throw error; });
    fontLoads.set(id, pending);
  }
  return fontLoads.get(id)!;
}

export async function signaturePng(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable.');
  const bounds = inkBounds(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
  if (!bounds) throw new Error('Add a signature before downloading.');
  const cropped = document.createElement('canvas'); cropped.width = bounds.width; cropped.height = bounds.height;
  const target = cropped.getContext('2d');
  if (!target) throw new Error('Canvas is unavailable.');
  target.drawImage(canvas, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height);
  return new Promise<Blob>((resolve, reject) => cropped.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG export failed.')), 'image/png'));
}
