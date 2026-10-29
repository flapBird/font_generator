import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inkBounds, signatureFonts } from '../../lib/signature';

test('transparent PNG bounds are empty-safe, padded and clipped to the source canvas', () => {
  const data = new Uint8ClampedArray(10 * 8 * 4);
  assert.equal(inkBounds(data, 10, 8), null);
  data[(3 * 10 + 4) * 4 + 3] = 1;
  assert.deepEqual(inkBounds(data, 10, 8, 1), { x: 3, y: 2, width: 3, height: 3 });
  data[3] = 255;
  assert.deepEqual(inkBounds(data, 10, 8, 2), { x: 0, y: 0, width: 7, height: 6 });
  assert.deepEqual(inkBounds(data, 10, 8, 100), { x: 0, y: 0, width: 10, height: 8 });
});

test('each selectable signature font is a real WOFF2 with its original OFL license', () => {
  assert.equal(signatureFonts.length, 6);
  for (const font of signatureFonts) {
    const bytes = readFileSync(`public/fonts/signature/${font.id}.woff2`);
    assert.equal(bytes.subarray(0, 4).toString(), 'wOF2');
    assert.match(readFileSync(`public/fonts/signature/${font.id}-LICENSE.txt`, 'utf8'), /SIL OPEN FONT LICENSE/);
  }
});
