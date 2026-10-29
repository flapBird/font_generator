import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanInvisibleText, inspectUnicode, normalText, removalOptions } from '../../lib/text-library/unicode-tools';

test('inspector exposes actual code points and offsets without silently fixing malformed input', () => {
  const result = inspectUnicode('A👋e\u0301\u200b');
  assert.deepEqual(result.rows.map((row) => row.offset), [0, 1, 3, 4, 5]);
  assert.equal(result.graphemes.length, 4);
  assert.equal(result.rows[1].utf8, 'F0 9F 91 8B');
  assert.equal(result.rows[4].display, '·');
  assert.equal(inspectUnicode('\ud800').rows[0].category, 'Unpaired surrogate');
  assert.equal(inspectUnicode('\ud800').rows[0].utf8, 'Invalid scalar value');
  assert.throws(() => inspectUnicode('a'.repeat(2001)), RangeError);
});

test('removal is explicit and preserves scripts, emoji, accents, whitespace and original text by default', () => {
  const input = 'é e\u0301\r\nA\u200b\u00a0👨‍👩‍👧‍👦 ❤️ فارسی\u200c';
  assert.equal(cleanInvisibleText(input, []).output, input);
  assert.equal(cleanInvisibleText(input, ['zeroWidthSpaces', 'specialSpaces']).output, input.replace('\u200b', '').replace('\u00a0', ' '));
  assert.equal(cleanInvisibleText('a\u200dب\u200c', ['joiners']).output, 'aب');
  assert.equal(cleanInvisibleText('❤️', ['variation']).output, '❤');
  assert.equal(cleanInvisibleText('\u202Eabc\u202C', ['direction']).output, 'abc');
  assert.equal(cleanInvisibleText('\u2800\u3164', ['blankLetters']).output, '');
  assert.equal(cleanInvisibleText(' \t\r\n', removalOptions.map((option) => option.id)).output, ' \t\r\n');
  assert.equal(cleanInvisibleText('x\u200b\u200b', ['zeroWidthSpaces']).changes[0].count, 2);
});

test('normal text supports selected compatibility forms while keeping semantic sequences and unsupported letters', () => {
  assert.equal(normalText('𝐀𝒃 𝟙𝟚 Ｃ！ ① ²').output, 'Ab 12 C! 1 2');
  assert.equal(normalText('ℋℯℓℓℴ ℊ').output, 'Hello g');
  for (const value of ['👨‍👩‍👧‍👦', '🇨🇳', '👍🏽', '1️⃣', '❤️', '中文 हिन्दी العربية', 'é e\u0301', 'a\r\nb', 'ﬃ', 'Ж']) assert.equal(normalText(value).output, value);
  assert.equal(normalText('ᴀʙᴄ ᴢ', { smallCaps: true, overlays: false }).output, 'abc z');
  assert.equal(normalText('ᴀʙᴄ').output, 'ᴀʙᴄ');
  assert.equal(normalText('A\u0336e\u0301', { smallCaps: false, overlays: true }).output, 'Ae\u0301');
  assert.equal(normalText('').output, '');
});
