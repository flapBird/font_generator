/** One-page A4 PDF embedding the exact browser-rendered worksheet at 2× resolution. */
export async function worksheetPdf(svg: SVGSVGElement): Promise<Blob> {
  await document.fonts.ready;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width', '1600'); clone.setAttribute('height', '2000');
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
  try {
    const image = new Image(); image.src = url; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 2000;
    const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas is unavailable.');
    context.fillStyle = 'white'; context.fillRect(0, 0, 1600, 2000); context.drawImage(image, 0, 0);
    const bytes = Uint8Array.from(atob(canvas.toDataURL('image/jpeg', 0.98).split(',')[1]), c => c.charCodeAt(0));
    const encoder = new TextEncoder(); const chunks: Uint8Array[] = []; const offsets = [0]; let length = 0;
    const append = (part: string | Uint8Array) => { const data = typeof part === 'string' ? encoder.encode(part) : part; chunks.push(data); length += data.length; };
    const object = (id: number, value: string) => { offsets[id] = length; append(`${id} 0 obj\n${value}\nendobj\n`); };
    append('%PDF-1.4\n');
    object(1, '<< /Type /Catalog /Pages 2 0 R >>');
    object(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    object(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
    offsets[4] = length; append(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width 1600 /Height 2000 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`); append(bytes); append('\nendstream\nendobj\n');
    const content = 'q\n547.28 0 0 684.10 24 78.90 cm\n/Im0 Do\nQ\n';
    object(5, `<< /Length ${encoder.encode(content).length} >>\nstream\n${content}endstream`);
    const xref = length; append('xref\n0 6\n0000000000 65535 f \n');
    for (let i = 1; i <= 5; i++) append(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
    append(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(chunks as BlobPart[], { type: 'application/pdf' });
  } finally { URL.revokeObjectURL(url); }
}
