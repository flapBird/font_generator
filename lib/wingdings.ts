import { segmentGraphemes } from './unicode';

// Portable Unicode counterparts, not a redistributed Wingdings font. Letter
// positions checked against the installed Wingdings symbol cmap (F030–F07A).
// Some shapes have only approximate counterparts. Never claim font-exact output.
// Reference: https://www.unicode.org/L2/L2011/11344-wingdings.pdf
const upper = ['✌', '👌', '👍', '👎', '☜', '☞', '☝', '☟', '✋', '☺', '😐', '☹', '💣', '☠', '⚐', '🏱', '✈', '☼', '💧', '❄', '🕆', '✞', '🕈', '✠', '✡', '☪'];
const lower = ['♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🙰', '🙵', '●', '❍', '■', '□', '◻', '❑', '❒', '⬧', '⧫', '◆', '❖', '⬥', '⌧', '⍓', '⌘'];
const digits = ['🗀', '🗁', '🗎', '🗏', '🗐', '🗄', '⌛', '🖮', '🖰', '🖲'];
export const wingdingsEntries = [...upper.map((symbol, index) => ({ key: String.fromCharCode(65 + index), symbol })), ...lower.map((symbol, index) => ({ key: String.fromCharCode(97 + index), symbol })), ...digits.map((symbol, index) => ({ key: String(index), symbol }))];
const encode = new Map(wingdingsEntries.map(({ key, symbol }) => [key, symbol]));
const decode = new Map(wingdingsEntries.map(({ key, symbol }) => [symbol, key]));
export function convertWingdings(text: string, direction: 'encode' | 'decode', uppercase = false) {
  const source = uppercase && direction === 'encode' ? text.replace(/[a-z]/g, (letter) => letter.toUpperCase()) : text;
  return segmentGraphemes(source).map((cluster) => {
    if (direction === 'encode') return encode.get(cluster) ?? cluster;
    // Accept presentation selectors on mapped symbols without stripping selectors
    // from unrelated emoji or swallowing skin-tone/ZWJ sequences.
    return decode.get(cluster.replace(/[\uFE0E\uFE0F]/g, '')) ?? cluster;
  }).join('');
}
