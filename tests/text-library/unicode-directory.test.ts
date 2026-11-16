import test from 'node:test';
import assert from 'node:assert/strict';
import { unicodeTools, filterUnicodeTools } from '../../lib/unicode-tool-catalog';
import { getLibraryPage } from '../../lib/text-library/catalog';

const items = unicodeTools.map((tool) => ({ ...tool, ...getLibraryPage(tool.id) }));
test('Unicode search finds Minecraft tools by task and composes with group filters', () => {
  assert.deepEqual(filterUnicodeTools(items, ' Minecraft ', 'all').map((tool) => tool.id), ['enchanting-table-translator', 'enderman-translator', 'standard-galactic-alphabet']);
  assert.equal(filterUnicodeTools(items, 'Minecraft', 'ancient').length, 0);
  assert.deepEqual(filterUnicodeTools(items, 'sumerian', 'ancient').map((tool) => tool.id), ['cuneiform-translator']);
  assert.equal(filterUnicodeTools(items, '', 'all').length, items.length);
  assert.equal(filterUnicodeTools(items, 'no-such-tool', 'all').length, 0);
});
test('Unicode tools resolve to independent canonical library pages', () => {
  assert.equal(new Set(items.map((tool) => tool.path)).size, items.length);
  for (const tool of items) assert.equal(tool.path, `/${tool.id}`);
});
