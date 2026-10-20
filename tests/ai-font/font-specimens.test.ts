import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import * as opentype from 'opentype.js';
import { FontSpecimenError, renderFontSpecimens } from '../../lib/ai-font/font-specimens';
import { validateEnglishTtf } from '../../lib/ai-font/validate-font';

const fixture = readFileSync('tests/ai-font/fixtures/mixfont-standard.ttf');
const PAGE = 1024;
const TILE = 256;

function decodePng(png: Buffer) {
  assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assert.equal(png.readUInt32BE(16), PAGE); assert.equal(png.readUInt32BE(20), PAGE);
  assert.equal(png[24], 8); assert.equal(png[25], 0);
  const chunks: Buffer[] = [];
  for (let index = 8; index < png.length;) {
    const length = png.readUInt32BE(index);
    if (png.toString('ascii', index + 4, index + 8) === 'IDAT') chunks.push(png.subarray(index + 8, index + 8 + length));
    index += length + 12;
  }
  const raw = inflateSync(Buffer.concat(chunks));
  assert.equal(raw.length, PAGE * (PAGE + 1));
  const pixels = Buffer.alloc(PAGE * PAGE);
  for (let y = 0; y < PAGE; y++) {
    assert.equal(raw[y * (PAGE + 1)], 0);
    raw.copy(pixels, y * PAGE, y * (PAGE + 1) + 1, (y + 1) * (PAGE + 1));
  }
  return pixels;
}

function tile(pixels: Buffer, index: number) {
  const result = Buffer.alloc(TILE * TILE);
  const left = index % 4 * TILE; const top = Math.floor(index / 4) * TILE;
  for (let y = 0; y < TILE; y++) pixels.copy(result, y * TILE, (top + y) * PAGE + left, (top + y) * PAGE + left + TILE);
  return result;
}

function fontBytes(glyphs: opentype.Glyph[]) {
  return Buffer.from(new opentype.Font({ familyName: 'Moderation test', styleName: 'Regular', unitsPerEm: 1000, ascender: 800, descender: -200, glyphs }).toArrayBuffer());
}

function rectangle(hole = false) {
  const path = new opentype.Path();
  path.moveTo(0, 0); path.lineTo(600, 0); path.lineTo(600, 600); path.lineTo(0, 600); path.close();
  if (hole) { path.moveTo(150, 150); path.lineTo(150, 450); path.lineTo(450, 450); path.lineTo(450, 150); path.close(); }
  return path;
}

test('real validated TTF renders every distinct visible glyph into clear deterministic PNG tiles', async () => {
  validateEnglishTtf(fixture);
  const font = opentype.parse(fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.length));
  const visible = Array.from({ length: font.numGlyphs }, (_, index) => font.glyphs.get(index)).filter((glyph) => {
    const box = glyph.getBoundingBox();
    return glyph.path.commands.length && box.x2 > box.x1 && box.y2 > box.y1;
  });
  assert.equal(visible.length, 72);
  const pages = await renderFontSpecimens(fixture);
  assert.equal(pages.length, Math.ceil(visible.length / 16));
  assert.deepEqual(await renderFontSpecimens(fixture), pages);
  const images = pages.map(decodePng);
  const hashes = new Set<string>();
  for (let index = 0; index < pages.length * 16; index++) {
    const pixels = tile(images[Math.floor(index / 16)], index % 16);
    const black = pixels.filter((value) => value < 128).length;
    if (index >= visible.length) { assert.equal(black, 0); continue; }
    assert.ok(black > 250, `glyph ${index} needs a meaningful visible outline`);
    assert.ok(pixels.some((value) => value > 0 && value < 255), `glyph ${index} is antialiased`);
    const occupiedRows = Array.from({ length: TILE }, (_, y) => pixels.subarray(y * TILE, (y + 1) * TILE).some((value) => value < 255));
    const occupiedColumns = Array.from({ length: TILE }, (_, x) => occupiedRows.some((_, y) => pixels[y * TILE + x] < 255));
    const extent = Math.max(occupiedRows.lastIndexOf(true) - occupiedRows.indexOf(true) + 1, occupiedColumns.lastIndexOf(true) - occupiedColumns.indexOf(true) + 1);
    assert.ok(extent >= 207, `glyph ${index} has extent ${extent}`);
    hashes.add(createHash('sha256').update(pixels).digest('hex'));
  }
  assert.equal(hashes.size, visible.length, 'no repeated sample letters may replace distinct glyphs');
});

test('visible .notdef, unencoded glyphs and contour holes are included while whitespace is skipped', async () => {
  const triangle = new opentype.Path(); triangle.moveTo(0, 0); triangle.lineTo(600, 0); triangle.lineTo(300, 600); triangle.close();
  const bytes = fontBytes([
    new opentype.Glyph({ name: '.notdef', advanceWidth: 700, path: rectangle(true) }),
    new opentype.Glyph({ name: 'space', unicode: 32, advanceWidth: 300, path: new opentype.Path() }),
    new opentype.Glyph({ name: 'A', unicode: 65, advanceWidth: 700, path: rectangle() }),
    new opentype.Glyph({ name: 'unencoded', advanceWidth: 700, path: triangle }),
  ]);
  const pages = await renderFontSpecimens(bytes);
  assert.equal(pages.length, 1);
  const pixels = decodePng(pages[0]);
  const missing = tile(pixels, 0); const encoded = tile(pixels, 1); const unencoded = tile(pixels, 2);
  assert.equal(missing[128 * TILE + 128], 255, '.notdef counter remains white');
  assert.equal(missing[128 * TILE + 32], 0, '.notdef actual outline is painted');
  assert.equal(encoded[128 * TILE + 128], 0, 'encoded rectangle is solid');
  assert.equal(unencoded[32 * TILE + 32], 255, 'unencoded triangle is rendered with its actual shape');
  assert.equal(unencoded[200 * TILE + 128], 0);
  for (let index = 3; index < 16; index++) assert.ok(tile(pixels, index).every((value) => value === 255));
});

test('file, glyph and complexity limits reject rather than return partial moderation coverage', async () => {
  await assert.rejects(renderFontSpecimens(Buffer.alloc(5)), FontSpecimenError);
  const excessive = Buffer.from(fixture);
  for (let index = 0; index < excessive.readUInt16BE(4); index++) {
    const position = 12 + index * 16;
    if (excessive.toString('ascii', position, position + 4) === 'maxp') excessive.writeUInt16BE(4097, excessive.readUInt32BE(position + 8) + 4);
  }
  await assert.rejects(renderFontSpecimens(excessive), /too many font glyphs/);
  const glyphs = Array.from({ length: 129 }, (_, index) => new opentype.Glyph({ name: index ? `glyph${index}` : '.notdef', advanceWidth: 700, path: rectangle() }));
  await assert.rejects(renderFontSpecimens(fontBytes(glyphs)), /too many visible glyphs/);
  const complex = new opentype.Path(); complex.moveTo(0, 0);
  for (let index = 0; index < 4200; index++) complex.lineTo(index % 2 ? 600 : 0, Math.floor(index / 2));
  complex.close();
  await assert.rejects(renderFontSpecimens(fontBytes([new opentype.Glyph({ name: '.notdef', advanceWidth: 700, path: complex })])), /outline is too complex/);
  await assert.rejects(renderFontSpecimens(fontBytes([new opentype.Glyph({ name: '.notdef', advanceWidth: 700, path: new opentype.Path() })])), /no visible glyphs/);
});
