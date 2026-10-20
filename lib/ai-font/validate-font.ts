import 'server-only';
import * as opentype from 'opentype.js';
import { REQUIRED_ENGLISH_CHARACTERS } from './font-characters';

export class FontValidationError extends Error {
  constructor(message: string) { super(message); this.name = 'FontValidationError'; }
}

function ensure(valid: unknown, message: string): asserts valid {
  if (!valid) throw new FontValidationError(message);
}

type Table = { offset: number; length: number };

function checksum(bytes: Buffer, offset: number, length: number, head = false) {
  let sum = 0;
  for (let index = 0; index < length; index += 4) {
    let word = 0;
    for (let byte = 0; byte < 4; byte++) {
      const position = index + byte;
      word = (word << 8) | (position < length && !(head && position >= 8 && position < 12) ? bytes[offset + position] : 0);
    }
    sum = (sum + (word >>> 0)) >>> 0;
  }
  return sum;
}

/** Validate the actual delivered TTF, without rewriting its bytes. */
export function validateEnglishTtf(bytes: Buffer) {
  try {
    ensure(bytes.length >= 12 && bytes.length <= 20 * 1024 * 1024, 'Invalid font size');
    ensure(bytes.readUInt32BE(0) === 0x00010000 || bytes.toString('ascii', 0, 4) === 'true', 'Expected a TrueType font');
    const count = bytes.readUInt16BE(4);
    const directoryEnd = 12 + count * 16;
    ensure(count > 0 && count <= 64 && directoryEnd <= bytes.length, 'Invalid font directory');
    const tables = new Map<string, Table>();
    for (let index = 0; index < count; index++) {
      const record = 12 + index * 16;
      const tag = bytes.toString('ascii', record, record + 4);
      const offset = bytes.readUInt32BE(record + 8);
      const length = bytes.readUInt32BE(record + 12);
      ensure(!tables.has(tag) && offset >= directoryEnd && offset % 4 === 0 && offset + length <= bytes.length, 'Invalid font table bounds');
      ensure(checksum(bytes, offset, length, tag === 'head') === bytes.readUInt32BE(record + 4), 'Font table checksum mismatch');
      tables.set(tag, { offset, length });
    }
    const ordered = [...tables.values()].sort((a, b) => a.offset - b.offset);
    ensure(ordered.every((table, index) => index === 0 || ordered[index - 1].offset + ordered[index - 1].length <= table.offset), 'Overlapping font tables');
    // Specimen review covers static monochrome TrueType outlines. Alternate
    // bitmap/SVG/color or variable representations could display unchecked art.
    ensure(!['SVG ', 'COLR', 'CPAL', 'sbix', 'CBDT', 'CBLC', 'EBDT', 'EBLC', 'fvar', 'gvar'].some((tag) => tables.has(tag)), 'Unsupported alternate font representation');
    const table = (tag: string, minimum: number) => {
      const entry = tables.get(tag);
      ensure(entry && entry.length >= minimum, `Missing or truncated ${tag} table`);
      return entry;
    };
    const head = table('head', 54);
    ensure(bytes.readUInt32BE(head.offset + 12) === 0x5f0f3cf5, 'Invalid font header');
    ensure(checksum(bytes, 0, bytes.length) === 0xb1b0afba, 'Font checksum mismatch');
    const unitsPerEm = bytes.readUInt16BE(head.offset + 18);
    ensure(unitsPerEm >= 16 && unitsPerEm <= 16384, 'Invalid font units');
    const maxp = table('maxp', 32);
    const glyphCount = bytes.readUInt16BE(maxp.offset + 4);
    // This integration only requests a small English font. Bound work before
    // parsing outlines inside a Workers isolate, including unencoded glyphs.
    ensure(glyphCount > 1 && glyphCount <= 4096, 'Invalid glyph count');
    const hhea = table('hhea', 36);
    const metrics = bytes.readUInt16BE(hhea.offset + 34);
    ensure(metrics > 0 && metrics <= glyphCount, 'Invalid horizontal metrics');
    table('hmtx', metrics * 4 + (glyphCount - metrics) * 2);
    table('cmap', 4); table('name', 6); table('post', 32); table('OS/2', 78);
    const glyf = table('glyf', 10);
    const locationFormat = bytes.readInt16BE(head.offset + 50);
    ensure(locationFormat === 0 || locationFormat === 1, 'Invalid glyph location format');
    const stride = locationFormat === 0 ? 2 : 4;
    const loca = table('loca', (glyphCount + 1) * stride);
    let previous = 0;
    for (let index = 0; index <= glyphCount; index++) {
      const position = loca.offset + index * stride;
      const offset = stride === 2 ? bytes.readUInt16BE(position) * 2 : bytes.readUInt32BE(position);
      ensure(offset >= previous && offset <= glyf.length && (index === 0 || offset === previous || offset - previous >= 10), 'Invalid glyph bounds');
      previous = offset;
    }

    const font = opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), { lowMemory: true });
    ensure(font.numGlyphs === glyphCount && font.ascender > font.descender, 'Invalid font metrics');
    ensure(font.getEnglishName('fontFamily')?.trim() && font.getEnglishName('fontSubfamily')?.trim(), 'Missing font names');
    for (let index = 0; index < glyphCount; index++) {
      const glyph = font.glyphs.get(index);
      ensure(Number.isFinite(glyph.advanceWidth) && glyph.advanceWidth! >= 0, 'Invalid glyph metrics');
      // Paths are lazy: force every outline to decode, not just the cmap/header.
      for (const command of glyph.path.commands) {
        ensure(Object.entries(command).every(([key, value]) => key === 'type' || (typeof value === 'number' && Number.isFinite(value))), 'Invalid glyph outline');
      }
    }
    const mapping = font.tables.cmap.glyphIndexMap as Record<string, number>;
    ensure(Object.entries(mapping).every(([code, index]) => Number(code) <= 0x10ffff && Number.isInteger(index) && index >= 0 && index < glyphCount), 'Invalid character mapping');
    for (const character of REQUIRED_ENGLISH_CHARACTERS) {
      const index = font.charToGlyphIndex(character);
      ensure(index > 0 && index < glyphCount, `Missing required character: ${character}`);
      const glyph = font.glyphs.get(index);
      ensure(glyph.advanceWidth! > 0, 'Required character has no advance width');
      if (character !== ' ') {
        const box = glyph.getBoundingBox();
        ensure(glyph.path.commands.length > 0 && box.x2 > box.x1 && box.y2 > box.y1, 'Required character has no visible outline');
      }
    }
  } catch (error) {
    if (error instanceof FontValidationError) throw error;
    throw new FontValidationError('Font structure could not be parsed');
  }
}
