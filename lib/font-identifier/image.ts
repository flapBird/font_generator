export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 20_000_000;
export type Crop = { x: number; y: number; width: number; height: number };
export type FontMatch = { family: string; styleName: string; weight: number; style: 'normal' | 'italic' };
export function boundedCrop(crop: Crop, width: number, height: number): Crop {
  const value = (n: number) => Number.isFinite(n) ? Math.round(n) : 0;
  const x = Math.max(0, Math.min(width - 1, value(crop.x)));
  const y = Math.max(0, Math.min(height - 1, value(crop.y)));
  return { x, y, width: Math.max(1, Math.min(width - x, value(crop.width))), height: Math.max(1, Math.min(height - y, value(crop.height))) };
}
export function validateImage(file: Pick<File, 'type' | 'size'>) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPEG or WebP image.');
  if (!file.size || file.size > MAX_IMAGE_BYTES) throw new Error('Choose an image smaller than 10 MB.');
}
