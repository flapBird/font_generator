import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CUNEIFORM_INPUT_LIMIT, cuneiformSignChart, spellInCuneiform } from '../../lib/cuneiform';
import { ALPHABET_DECODE_LIMIT, ALPHABET_INPUT_LIMIT, convertScriptText, galacticSpecimen, scriptAlphabets } from '../../lib/script-alphabets';

test('cuneiform spelling uses attested readings in visible syllable matches', () => {
  assert.equal(spellInCuneiform('Luna').text, '𒇻𒈾');
  assert.equal(spellInCuneiform('Sam').text, '𒊓𒄠');
  assert.deepEqual(spellInCuneiform('Sam').matches[0].signs.map(({ reading, code }) => [reading, code]), [
    ['sa', 'U+12293'], ['am', 'U+12120'],
  ]);
  assert.equal(spellInCuneiform('Shira').text, spellInCuneiform('Šira').text);
  assert.ok(!/[A-Za-z]/.test(spellInCuneiform('Alex').text));
  assert.ok(cuneiformSignChart.every(({ glyph }) => /^\p{Script=Cuneiform}$/u.test(glyph)));
});

test('cuneiform preserves unsupported scripts, emoji clusters, punctuation and line breaks', () => {
  assert.equal(spellInCuneiform('Luna, 中文 👩🏽‍🚀 1️⃣!\n𒈾').text, '𒇻𒈾, 中文 👩🏽‍🚀 1️⃣!\n𒈾');
  assert.equal(spellInCuneiform('Sam A!\n👩🏽‍🚀A').text, '𒊓𒄠 𒀀!\n👩🏽‍🚀𒀀');
  assert.equal(spellInCuneiform('中文 👩🏽‍🚀 𒈾').unmatchedLetters, 2);
  assert.equal(spellInCuneiform('').text, '');
  assert.equal(spellInCuneiform('a'.repeat(CUNEIFORM_INPUT_LIMIT + 1)).text, '');
});

test('both alphabets cover 26 letters and decode the exact encoded alphabet', () => {
  const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (const alphabet of ['galactic', 'ender'] as const) {
    const symbols = scriptAlphabets[alphabet].map(({ symbol }) => symbol);
    assert.equal(new Set(symbols).size, 26);
    const encoded = convertScriptText(latin, alphabet, 'encode');
    assert.equal(encoded, symbols.join(''));
    assert.equal(convertScriptText(encoded, alphabet, 'decode'), latin.toLowerCase());
    assert.equal(convertScriptText('Ée\u0301 123\n中文 👩🏽‍🚀 1️⃣', alphabet, 'encode'), 'Ée\u0301 123\n中文 👩🏽‍🚀 1️⃣');
  }
  assert.equal(convertScriptText('Minecraft', 'galactic', 'encode'), 'ᒲ╎リᒷᓵ∷ᔑ⎓ℸ̣');
  assert.equal(convertScriptText('Hello human', 'ender', 'encode'), '⊑⟒⌰⌰⍜ ⊑⎍⋔⏃⋏');
  assert.equal(convertScriptText('!¡ℸ \u0323\u0307/||!', 'galactic', 'decode'), 'ptxy!');
  assert.equal(galacticSpecimen('Az 1'), '\ueb40\ueb59 1');
});

test('maximum-length galactic encoding can be decoded without truncation', () => {
  const source = 'p'.repeat(ALPHABET_INPUT_LIMIT);
  const encoded = convertScriptText(source, 'galactic', 'encode');
  assert.equal(encoded.length, ALPHABET_DECODE_LIMIT);
  assert.equal(convertScriptText(encoded, 'galactic', 'decode'), source);
  assert.equal(convertScriptText(source + 'x', 'galactic', 'encode'), '');
  assert.equal(convertScriptText(encoded + '!', 'galactic', 'decode'), '');
});
