import { test } from 'node:test';
import assert from 'node:assert/strict';
import { availableGenerations, FONT_PACK, STANDARD_FONT_CREDITS } from '../../lib/ai-font/catalog';
import { matchFontStyle } from '../../lib/ai-font/style-match';

test('credit presentation preserves the three-generation pack and handles partial/negative balances', () => {
  assert.equal(FONT_PACK.credits, 3 * STANDARD_FONT_CREDITS);
  assert.equal(availableGenerations(FONT_PACK.credits), 3);
  assert.equal(availableGenerations(99), 0);
  assert.equal(availableGenerations(199), 1);
  assert.equal(availableGenerations(-100), 0);
});

test('local matching handles English/Chinese directions and unknown styles without inventing a match', () => {
  assert.equal(matchFontStyle('A retro pixel font for a game')?.id, 'arcade');
  assert.equal(matchFontStyle('圆润可爱的儿童字体')?.id, 'playful');
  assert.equal(matchFontStyle('An elegant serif for a wedding')?.id, 'editorial');
  assert.equal(matchFontStyle('Bold sports headline')?.id, 'bold');
  assert.equal(matchFontStyle(''), null);
  assert.equal(matchFontStyle('something utterly different'), null);
});
