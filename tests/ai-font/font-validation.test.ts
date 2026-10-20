import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as opentype from 'opentype.js';
import { FontValidationError, validateEnglishTtf } from '../../lib/ai-font/validate-font';
import { REQUIRED_ENGLISH_CHARACTERS, unsupportedFontCharacters } from '../../lib/ai-font/font-characters';

const fixture = readFileSync('tests/ai-font/fixtures/mixfont-standard.ttf');

function record(bytes: Buffer, tag: string) {
  for (let index = 0; index < bytes.readUInt16BE(4); index++) {
    const start = 12 + index * 16;
    if (bytes.toString('ascii', start, start + 4) === tag) return start;
  }
  throw new Error(`Missing fixture table ${tag}`);
}
function offset(bytes: Buffer, tag: string) { return bytes.readUInt32BE(record(bytes, tag) + 8); }
function sum(bytes: Buffer) {
  const padded = Buffer.alloc(Math.ceil(bytes.length / 4) * 4);
  bytes.copy(padded);
  let result = 0;
  for (let index = 0; index < padded.length; index += 4) result = (result + padded.readUInt32BE(index)) >>> 0;
  return result;
}
// Repair checksums after semantic mutations so those tests reach the outline
// and coverage checks rather than only testing the checksum guard.
function repair(bytes: Buffer) {
  const head = offset(bytes, 'head');
  bytes.writeUInt32BE(0, head + 8);
  for (let index = 0; index < bytes.readUInt16BE(4); index++) {
    const start = 12 + index * 16;
    const position = bytes.readUInt32BE(start + 8);
    const length = bytes.readUInt32BE(start + 12);
    bytes.writeUInt32BE(sum(bytes.subarray(position, position + length)), start + 4);
  }
  bytes.writeUInt32BE((0xb1b0afba - sum(bytes)) >>> 0, head + 8);
  return bytes;
}

test('an unmodified real Mixfont TTF passes without altering its bytes', () => {
  const bytes = Buffer.from(fixture);
  validateEnglishTtf(bytes);
  assert.deepEqual(bytes, fixture);
});

test('fake headers, truncated files, corrupt checksums and table bounds are rejected', () => {
  const fake = Buffer.alloc(12); fake.writeUInt32BE(0x00010000);
  const corrupt = Buffer.from(fixture); corrupt[offset(corrupt, 'glyf') + 20] ^= 1;
  const bounds = Buffer.from(fixture); bounds.writeUInt32BE(bounds.length, record(bounds, 'glyf') + 8);
  const duplicate = Buffer.from(fixture); duplicate.copy(duplicate, 28, 12, 16);
  for (const bytes of [Buffer.from('<html>error</html>'), fake, fixture.subarray(0, fixture.length - 64), corrupt, bounds, duplicate]) {
    assert.throws(() => validateEnglishTtf(bytes), FontValidationError);
  }
});

test('missing uppercase, lowercase, digits, spaces and basic punctuation fail coverage', () => {
  for (const character of ['A', 'a', '0', ' ', ',']) {
    const bytes = Buffer.from(fixture);
    const cmap = offset(bytes, 'cmap');
    const subtable = cmap + bytes.readUInt32BE(cmap + 8);
    assert.equal(bytes.readUInt16BE(subtable), 4);
    const segments = bytes.readUInt16BE(subtable + 6) / 2;
    const code = character.charCodeAt(0);
    for (let index = 0; index < segments; index++) {
      const start = bytes.readUInt16BE(subtable + 16 + segments * 2 + index * 2);
      const end = bytes.readUInt16BE(subtable + 14 + index * 2);
      if (code < start || code > end) continue;
      assert.equal(start, code);
      // Remove only this character; retain the other mappings in the segment.
      bytes.writeUInt16BE(code + 1, subtable + 16 + segments * 2 + index * 2);
      break;
    }
    assert.throws(() => validateEnglishTtf(repair(bytes)), /Missing required character/);
  }
});

test('a mapped but blank letter and invalid glyph locations cannot pass as a usable font', () => {
  const blank = Buffer.from(fixture);
  const parsed = opentype.parse(blank.buffer.slice(blank.byteOffset, blank.byteOffset + blank.length));
  const index = parsed.charToGlyphIndex('A');
  const longLocations = blank.readInt16BE(offset(blank, 'head') + 50) === 1;
  const position = offset(blank, 'loca') + index * (longLocations ? 4 : 2);
  const glyphOffset = longLocations ? blank.readUInt32BE(position) : blank.readUInt16BE(position) * 2;
  blank.writeInt16BE(0, offset(blank, 'glyf') + glyphOffset);
  assert.throws(() => validateEnglishTtf(repair(blank)), /no visible outline/);

  const locations = Buffer.from(fixture);
  const loca = offset(locations, 'loca');
  if (longLocations) locations.writeUInt32BE(0xffffffff, loca + 4);
  else locations.writeUInt16BE(0xffff, loca + 2);
  assert.throws(() => validateEnglishTtf(repair(locations)), /Invalid glyph bounds/);
});

test('unsupported-character warnings use the actual font map and ignore line breaks', () => {
  assert.equal(unsupportedFontCharacters('Hello\nWorld! 123\r', REQUIRED_ENGLISH_CHARACTERS), '');
  assert.equal(unsupportedFontCharacters('Hello 中文中文🙂', REQUIRED_ENGLISH_CHARACTERS), '中文🙂');
  assert.equal(unsupportedFontCharacters('éA', 'Aé'), '');
});

test('alternate color, SVG, bitmap or variable content cannot bypass outline review', () => {
  for (const tag of ['SVG ', 'COLR', 'sbix', 'CBDT', 'fvar', 'gvar']) {
    const bytes = Buffer.from(fixture);
    bytes.write(tag, record(bytes, 'post'), 4, 'ascii');
    assert.throws(() => validateEnglishTtf(repair(bytes)), /Unsupported alternate font representation/);
  }
});
