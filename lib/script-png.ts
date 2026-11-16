import { wrapArtworkLines } from './title-artwork';

export async function exportScriptPng(text: string, family: string, fontSample: string, filename: string) {
  const loaded = await document.fonts.load(`64px "${family}"`, fontSample);
  if (!loaded.length) throw new Error('Font unavailable');

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas unavailable');
  const lines = wrapArtworkLines(text);
  const padding = 36;
  const maxHeight = 4096;
  const size = Math.min(64, Math.floor((maxHeight - padding * 2) / (1.6 * lines.length)));
  const lineHeight = Math.floor(size * 1.6);
  const font = `${size}px "${family}", system-ui, sans-serif`;
  context.font = font;
  context.textAlign = 'center';
  const widest = Math.max(...lines.map((line) => {
    const metrics = context.measureText(line);
    return 2 * Math.max(metrics.width / 2, metrics.actualBoundingBoxLeft, metrics.actualBoundingBoxRight);
  }));

  canvas.width = Math.min(1600, Math.ceil(widest + padding * 2));
  canvas.height = padding * 2 + lineHeight * lines.length;
  context.font = font;
  context.fillStyle = '#0f172a';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  lines.forEach((line, index) => {
    context.fillText(line, canvas.width / 2, padding + (index + 0.5) * lineHeight, canvas.width - padding * 2);
  });

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error('PNG encoding failed')), 'image/png');
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
