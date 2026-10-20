import 'server-only';
import * as opentype from 'opentype.js';

const TILE = 256;
const COLUMNS = 4;
const PAGE = TILE * COLUMNS;
const PADDING = 24;
const MAX_VISIBLE_GLYPHS = 128;
const MAX_COMMANDS = 50_000;
const MAX_GLYPH_COMMANDS = 4_096;
const MAX_GLYPH_SEGMENTS = 8_192;
const MAX_GLYPH_INTERSECTIONS = 131_072;
const MAX_INTERSECTIONS = 2_000_000;

type Point = { x: number; y: number };
type Edge = { x1: number; y1: number; x2: number; y2: number };
type Budget = { commands: number; intersections: number };

export class FontSpecimenError extends Error {
  constructor(message: string) { super(`Cannot moderate font: ${message}`); this.name = 'FontSpecimenError'; }
}

function requireBound(value: unknown, message: string): asserts value {
  if (!value) throw new FontSpecimenError(message);
}

// Bound the lazy parser before it allocates glyphs. The caller separately
// validates the complete delivered TTF, its checksums and character coverage.
function glyphCount(bytes: Buffer) {
  requireBound(bytes.length >= 12 && bytes.length <= 20 * 1024 * 1024, 'invalid file size');
  const tables = bytes.readUInt16BE(4);
  requireBound(tables > 0 && tables <= 64 && 12 + tables * 16 <= bytes.length, 'invalid font directory');
  for (let index = 0; index < tables; index++) {
    const position = 12 + index * 16;
    if (bytes.toString('ascii', position, position + 4) !== 'maxp') continue;
    const start = bytes.readUInt32BE(position + 8);
    const length = bytes.readUInt32BE(position + 12);
    requireBound(length >= 6 && start + length <= bytes.length, 'invalid glyph table');
    const count = bytes.readUInt16BE(start + 4);
    requireBound(count > 0 && count <= 4_096, 'too many font glyphs');
    return count;
  }
  throw new FontSpecimenError('missing glyph table');
}

function midpoint(a: Point, b: Point): Point { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }

function distanceToSegment(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const projection = lengthSquared ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared)) : 0;
  return Math.hypot(point.x - start.x - projection * dx, point.y - start.y - projection * dy);
}

function glyphEdges(glyph: opentype.Glyph, budget: Budget): Edge[] | null {
  const commands = glyph.path.commands;
  budget.commands += commands.length;
  requireBound(commands.length <= MAX_GLYPH_COMMANDS && budget.commands <= MAX_COMMANDS, 'outline is too complex');
  for (const command of commands) {
    requireBound(Object.entries(command).every(([key, value]) => key === 'type' || (typeof value === 'number' && Number.isFinite(value))), 'invalid outline coordinates');
  }
  if (!commands.length) return null;
  const box = glyph.getBoundingBox();
  requireBound([box.x1, box.x2, box.y1, box.y2].every(Number.isFinite), 'invalid outline bounds');
  // Zero-area paths cannot paint a filled glyph (spaces and empty controls).
  if (box.x2 <= box.x1 || box.y2 <= box.y1) return null;
  const scale = (TILE - PADDING * 2) / Math.max(box.x2 - box.x1, box.y2 - box.y1);
  const left = (TILE - (box.x2 - box.x1) * scale) / 2;
  const top = (TILE - (box.y2 - box.y1) * scale) / 2;
  const transform = (x: number, y: number): Point => ({ x: left + (x - box.x1) * scale, y: top + (box.y2 - y) * scale });
  const edges: Edge[] = [];
  const line = (a: Point, b: Point) => {
    requireBound(edges.length < MAX_GLYPH_SEGMENTS, 'outline has too many segments');
    if (a.y !== b.y) edges.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
  };
  const quadratic = (a: Point, control: Point, b: Point, depth = 0): void => {
    if (distanceToSegment(control, a, b) <= 0.2) { line(a, b); return; }
    requireBound(depth < 12, 'outline curve is too complex');
    const ac = midpoint(a, control); const cb = midpoint(control, b); const middle = midpoint(ac, cb);
    quadratic(a, ac, middle, depth + 1); quadratic(middle, cb, b, depth + 1);
  };
  const cubic = (a: Point, control1: Point, control2: Point, b: Point, depth = 0): void => {
    if (Math.max(distanceToSegment(control1, a, b), distanceToSegment(control2, a, b)) <= 0.2) { line(a, b); return; }
    requireBound(depth < 12, 'outline curve is too complex');
    const ac = midpoint(a, control1); const cc = midpoint(control1, control2); const cb = midpoint(control2, b);
    const leftControl = midpoint(ac, cc); const rightControl = midpoint(cc, cb); const middle = midpoint(leftControl, rightControl);
    cubic(a, ac, leftControl, middle, depth + 1); cubic(middle, rightControl, cb, b, depth + 1);
  };
  let current: Point | null = null;
  let start: Point | null = null;
  for (const command of commands) {
    if (command.type === 'M') {
      if (current && start) line(current, start);
      current = transform(command.x, command.y); start = current;
    } else if (command.type === 'Z') {
      requireBound(current && start, 'invalid closed outline');
      line(current, start); current = start; start = null;
    } else {
      requireBound(current, 'outline has no starting point');
      const next = transform(command.x, command.y);
      if (command.type === 'L') line(current, next);
      else if (command.type === 'Q') quadratic(current, transform(command.x1, command.y1), next);
      else if (command.type === 'C') cubic(current, transform(command.x1, command.y1), transform(command.x2, command.y2), next);
      else throw new FontSpecimenError('unsupported outline command');
      current = next;
    }
  }
  if (current && start) line(current, start);
  return edges.length ? edges : null;
}

/** Nonzero fill preserves counters and overlapping contours, with 2x sampling. */
function rasterize(edges: Edge[], budget: Budget) {
  const coverage = new Uint8Array(TILE * TILE);
  const crossings: { x: number; winding: number }[][] = Array.from({ length: TILE * 2 }, () => []);
  let glyphIntersections = 0;
  for (const edge of edges) {
    const begin = Math.max(0, Math.ceil(Math.min(edge.y1, edge.y2) * 2 - 0.5));
    const end = Math.min(TILE * 2, Math.ceil(Math.max(edge.y1, edge.y2) * 2 - 0.5));
    budget.intersections += end - begin;
    glyphIntersections += end - begin;
    requireBound(budget.intersections <= MAX_INTERSECTIONS && glyphIntersections <= MAX_GLYPH_INTERSECTIONS, 'rasterization is too complex');
    for (let y = begin; y < end; y++) {
      crossings[y].push({ x: edge.x1 + ((y + 0.5) / 2 - edge.y1) * (edge.x2 - edge.x1) / (edge.y2 - edge.y1), winding: edge.y2 > edge.y1 ? 1 : -1 });
    }
  }
  let painted = false;
  for (let y = 0; y < crossings.length; y++) {
    const row = crossings[y].sort((a, b) => a.x - b.x || a.winding - b.winding);
    let winding = 0;
    for (let index = 0; index < row.length - 1; index++) {
      winding += row[index].winding;
      if (!winding) continue;
      const begin = Math.max(0, Math.ceil(row[index].x * 2 - 0.5));
      const end = Math.min(TILE * 2, Math.ceil(row[index + 1].x * 2 - 0.5));
      for (let x = begin; x < end; x++) { coverage[(y >> 1) * TILE + (x >> 1)]++; painted = true; }
    }
  }
  // An outline that disappears at this moderation resolution must not silently
  // escape review. Empty zero-area paths have already been skipped explicitly.
  requireBound(painted, 'outline is not visible at review resolution');
  return coverage;
}

function pngChunk(type: string, data: Buffer) {
  const chunk = Buffer.alloc(data.length + 12);
  chunk.writeUInt32BE(data.length, 0); chunk.write(type, 4, 4, 'ascii'); data.copy(chunk, 8);
  let crc = 0xffffffff;
  for (let index = 4; index < data.length + 8; index++) {
    crc ^= chunk[index];
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  chunk.writeUInt32BE((crc ^ 0xffffffff) >>> 0, data.length + 8);
  return chunk;
}

async function encodePng(pixels: Uint8Array) {
  const scanlines = new Uint8Array(PAGE * (PAGE + 1));
  for (let y = 0; y < PAGE; y++) scanlines.set(pixels.subarray(y * PAGE, (y + 1) * PAGE), y * (PAGE + 1) + 1);
  // CompressionStream is supported by both Workers and Node 22; no native
  // canvas, system font, browser, WASM binary or platform package is required.
  const stream = new ReadableStream<BufferSource>({ start(controller) { controller.enqueue(scanlines); controller.close(); } });
  const compressed = Buffer.from(await new Response(stream.pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
  const header = Buffer.alloc(13);
  header.writeUInt32BE(PAGE, 0); header.writeUInt32BE(PAGE, 4); header[8] = 8; // grayscale, no alpha
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk('IHDR', header), pngChunk('IDAT', compressed), pngChunk('IEND', Buffer.alloc(0))]);
}

/** Render every visible glyph index in the validated file, in ascending order.
 * No cmap/sample string is used: .notdef and unencoded glyphs are included too.
 * At most 128 visible glyphs/8 pages; any budget overflow rejects the entire
 * font rather than returning an incomplete set of moderation specimens.
 */
export async function renderFontSpecimens(bytes: Buffer): Promise<Buffer[]> {
  try {
    return await renderValidatedFont(bytes);
  } catch (error) {
    if (error instanceof FontSpecimenError) throw error;
    throw new FontSpecimenError('font outlines could not be rendered');
  }
}

async function renderValidatedFont(bytes: Buffer): Promise<Buffer[]> {
  const count = glyphCount(bytes);
  const font = opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length), { lowMemory: true });
  requireBound(font.numGlyphs === count, 'inconsistent glyph count');
  const budget: Budget = { commands: 0, intersections: 0 };
  const pages: Buffer[] = [];
  let page = new Uint8Array(PAGE * PAGE).fill(255);
  let visible = 0;
  for (let index = 0; index < count; index++) {
    const edges = glyphEdges(font.glyphs.get(index), budget);
    if (!edges) continue;
    requireBound(visible < MAX_VISIBLE_GLYPHS, 'too many visible glyphs');
    const coverage = rasterize(edges, budget);
    const slot = visible % (COLUMNS * COLUMNS);
    const left = (slot % COLUMNS) * TILE;
    const top = Math.floor(slot / COLUMNS) * TILE;
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) page[(top + y) * PAGE + left + x] = 255 - Math.round(coverage[y * TILE + x] * 255 / 4);
    }
    visible++;
    if (visible % (COLUMNS * COLUMNS) === 0) {
      pages.push(await encodePng(page));
      page = new Uint8Array(PAGE * PAGE).fill(255);
    }
  }
  requireBound(visible > 0, 'no visible glyphs');
  if (visible % (COLUMNS * COLUMNS)) pages.push(await encodePng(page));
  return pages;
}
