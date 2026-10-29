import assert from 'node:assert/strict';
import { test } from 'node:test';
import { symbolItems } from '../../lib/text-library/symbols';
import { emojiComboItems, kaomojiItems } from '../../lib/text-library/combinations';
import { libraryPages } from '../../lib/text-library/catalog';
import { codePoints, filterLibraryItems, parseSavedLibrary } from '../../lib/text-library/text';
import { blankCharacters, createBlankText, inspectBlankText } from '../../lib/text-library/invisible';
import { generatorRegistry } from '../../lib/generator-registry';
import { isVisibleInGeneratorNavigation } from '../../lib/generator-navigation';

test('curated collections have stable unique IDs, exact sequences, categories and names', () => {
  assert.equal(symbolItems.length, 261);
  assert.equal(kaomojiItems.length, 100);
  assert.equal(emojiComboItems.length, 100);
  const items = [...symbolItems, ...kaomojiItems, ...emojiComboItems];
  assert.equal(new Set(items.map((item) => item.id)).size, items.length);
  for (const collection of [symbolItems, kaomojiItems, emojiComboItems]) {
    assert.equal(new Set(collection.map((item) => item.text)).size, collection.length, 'No duplicate sequences');
  }
  for (const item of items) {
    assert.match(item.id, /^[a-z0-9-]{1,100}$/);
    assert.ok(item.text && item.name && item.category && item.tags.length);
    assert.ok(!item.text.includes('\uFFFD') && item.text.isWellFormed());
  }
  assert.equal(symbolItems.find((item) => item.id === 'symbol-2764-fe0f')?.text, '❤️');
  assert.equal(symbolItems.find((item) => item.id === 'symbol-2764-fe0f-200d-1f525')?.text, '❤️‍🔥');
  assert.equal(kaomojiItems.find((item) => item.id === 'kaomoji-shrug')?.text, '¯\\_(ツ)_/¯');
});

test('name, category, direction and exact code-point searches select the intended items', () => {
  assert.equal(codePoints('❤️‍🔥'), 'U+2764 U+FE0F U+200D U+1F525');
  assert.equal(filterLibraryItems(symbolItems, 'u+2661', 'All')[0]?.text, '♡');
  assert.ok(filterLibraryItems(symbolItems, 'right', 'Right').some((item) => item.text === '→'));
  assert.equal(filterLibraryItems(symbolItems, 'right', 'Left').length, 0);
  assert.equal(filterLibraryItems(emojiComboItems, 'quiet morning', 'Cozy')[0]?.text, '☕ 📖 🌤️');
  assert.equal(filterLibraryItems(symbolItems, 'no-such-symbol', 'All').length, 0);
});

test('blank generation never trims whitespace and rejects invalid counts', () => {
  for (const entry of blankCharacters) {
    assert.equal(createBlankText(entry.id, 3), entry.text.repeat(3));
    assert.equal(createBlankText(entry.id, 100).length, 100);
  }
  for (const value of [0, -1, 101, 1.5, NaN, Infinity]) assert.equal(createBlankText('space', value), '');
  assert.equal(createBlankText('unknown', 1), '');
});

test('inspection distinguishes code points, graphemes and units without modifying joined sequences', () => {
  const original = '👨‍👩‍👧‍👦 🇨🇳 e\u0301\u200b\u00a0\u2800';
  const before = original;
  const result = inspectBlankText(original);
  assert.equal(original, before);
  assert.equal(result.detected.find((item) => item.text === '\u200d')?.count, 3);
  assert.equal(result.detected.find((item) => item.text === '\u200b')?.count, 1);
  assert.ok(result.units > result.codePoints && result.codePoints > result.graphemes);
  assert.deepEqual(inspectBlankText(''), { units: 0, codePoints: 0, graphemes: 0, detected: [] });
  assert.equal(inspectBlankText(' '.repeat(2000)).detected[0].count, 2000);
  assert.throws(() => inspectBlankText('x'.repeat(2001)), RangeError);
});

test('local saved data is bounded and malformed records never break rendering', () => {
  for (const value of ['', '{', 'null', 'true', '[]', 'x'.repeat(50001)]) assert.deepEqual(parseSavedLibrary(value), { favorites: [], recent: [] });
  assert.deepEqual(parseSavedLibrary(JSON.stringify({ favorites: ['symbol-2661', 'symbol-2661', '<script>', 1], recent: ['kaomoji-shrug'] })), { favorites: ['symbol-2661'], recent: ['kaomoji-shrug'] });
  assert.equal(parseSavedLibrary(JSON.stringify({ recent: Array.from({ length: 100 }, (_, i) => `item-${i}`) })).recent.length, 24);
});

test('utility catalog stays separate from all old generators and hidden from permanent navigation', () => {
  assert.equal(libraryPages.length, 12);
  assert.equal(new Set(libraryPages.map((page) => page.path)).size, 12);
  assert.equal(generatorRegistry.length, 85);
  for (const page of libraryPages) {
    assert.ok(!generatorRegistry.some((generator) => generator.canonicalPath === page.path));
    assert.equal(isVisibleInGeneratorNavigation(page.path), false);
    for (const related of page.related) assert.ok(libraryPages.some((target) => target.id === related));
  }
  assert.equal(isVisibleInGeneratorNavigation('/small-text-generator'), true);
});
