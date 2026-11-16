import { segmentGraphemes } from './unicode';

export const ALPHABET_INPUT_LIMIT = 1000;
export const ALPHABET_DECODE_LIMIT = 2 * ALPHABET_INPUT_LIMIT;
const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Common copyable Unicode lookalikes. Several symbols consist of two code points.
const galacticSymbols = [
  'ᔑ', 'ʖ', 'ᓵ', '↸', 'ᒷ', '⎓', '⊣', '⍑', '╎', '⋮', 'ꖌ', 'ꖎ', 'ᒲ',
  'リ', '𝙹', '!¡', 'ᑑ', '∷', 'ᓭ', 'ℸ\u0323', '⚍', '⍊', '∴', '\u0307/', '||', '⨅',
];

// A–Z from the fan-used Alien Language alphabet. Digits are outside this letter mapping.
// https://lingojam.com/AlienLanguage
const enderSymbols = Array.from('⏃⏚☊⎅⟒⎎☌⊑⟟⟊☍⌰⋔⋏⍜⌿⍾⍀⌇⏁⎍⎐⍙⌖⊬⋉');

export type ScriptAlphabet = 'galactic' | 'ender';
export type ScriptDirection = 'encode' | 'decode';

const toChart = (symbols: string[]) => Array.from(latin, (letter, index) => ({ letter, symbol: symbols[index] }));
export const scriptAlphabets = { galactic: toChart(galacticSymbols), ender: toChart(enderSymbols) };

function createDecoder(alphabet: typeof scriptAlphabets.galactic, aliases: [string, string][] = []) {
  const letters = new Map([...alphabet.map(({ letter, symbol }) => [symbol, letter.toLowerCase()] as const), ...aliases]);
  const alternatives = Array.from(letters.keys())
    .sort((a, b) => b.length - a.length)
    .map((symbol) => symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(alternatives.join('|'), 'gu');
  return (text: string) => text.replace(pattern, (symbol) => letters.get(symbol)!);
}

const decoders = {
  galactic: createDecoder(scriptAlphabets.galactic, [['ℸ \u0323', 't']]),
  ender: createDecoder(scriptAlphabets.ender),
};

function replaceLatin(text: string, mapLetter: (index: number) => string) {
  return segmentGraphemes(text).map((part) => /^[A-Za-z]$/.test(part) ? mapLetter(latin.indexOf(part.toUpperCase())) : part).join('');
}

export function convertScriptText(text: string, alphabet: ScriptAlphabet, direction: ScriptDirection) {
  if (text.length > (direction === 'decode' ? ALPHABET_DECODE_LIMIT : ALPHABET_INPUT_LIMIT)) return '';
  if (direction === 'decode') return decoders[alphabet](text);
  return replaceLatin(text, (index) => scriptAlphabets[alphabet][index].symbol);
}

// PUA values belong to the locally hosted Sga font. They are used only for rendering.
export function galacticSpecimen(text: string) {
  return replaceLatin(text, (index) => String.fromCodePoint(0xeb40 + index));
}
