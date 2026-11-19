import type { StencilDrawing, StencilPaper } from './stencil-letter-art';

function pathToPdf(path: string) {
  let x = 0;
  let y = 0;
  return Array.from(path.matchAll(/([MLHVZ])([^MLHVZ]*)/g), ([, command, coordinates]) => {
    const [first, second] = coordinates.trim().split(/[ ,]+/).map(Number);
    if (command === 'Z') return 'h';
    if (command !== 'V') x = first;
    if (command === 'V') y = first;
    if (command === 'M' || command === 'L') y = second;
    return `${x} ${y} ${command === 'M' ? 'm' : 'l'}`;
  }).join('\n');
}

const pagePoints = { a4: [841.89, 595.28], letter: [792, 612] } as const;
const number = (value: number) => Number(value.toFixed(6));

export function stencilPrintPdf(drawings: StencilDrawing[], paper: Exclude<StencilPaper, 'fitted'>, color: string) {
  const [width, height] = pagePoints[paper];
  const ink = (color.match(/[a-f\d]{2}/gi) ?? []).map((component) => number(parseInt(component, 16) / 255)).join(' ');
  const offsets = [0];
  let document = '%PDF-1.4\n';
  const appendObject = (id: number, body: string) => {
    offsets[id] = document.length;
    document += `${id} 0 obj\n${body}\nendobj\n`;
  };
  appendObject(1, '<< /Type /Catalog /Pages 2 0 R >>');
  appendObject(2, `<< /Type /Pages /Kids [${drawings.map((_, i) => `${3 + i * 2} 0 R`).join(' ')}] /Count ${drawings.length} >>`);
  drawings.forEach((drawing, i) => {
    const id = 3 + i * 2;
    const scale = Math.min(width / drawing.width, height / drawing.height);
    const left = (width - scale * drawing.width) / 2;
    const top = (height + scale * drawing.height) / 2;
    const stream = `q\n${ink || '0 0 0'} rg\n${number(scale)} 0 0 ${number(-scale)} ${number(left)} ${number(top)} cm\n`
      + drawing.items.map((item) =>
        `q\n${number(item.scaleX)} 0 0 ${number(item.scaleY)} ${number(item.x)} ${number(item.y)} cm\n${pathToPdf(item.path)}\nf\nQ\n`).join('') + 'Q\n';
    appendObject(id, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << >> /Contents ${id + 1} 0 R >>`);
    appendObject(id + 1, `<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
  });

  const xref = document.length;
  document += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  document += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  document += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([document], { type: 'application/pdf' });
}
