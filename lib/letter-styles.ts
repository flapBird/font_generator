import { generateStyleVariants } from './generator';

export const latinAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const letterStyleIds = [
  'bold', 'italic', 'boldItalic', 'script', 'boldScript', 'fraktur', 'boldFraktur',
  'sansBold', 'doubleStruck', 'circled', 'monospace', 'fullwidth', 'squared', 'parenthesized',
];

export function getLetterStyles(letter: string) {
  if (!/^[A-Za-z]$/.test(letter)) return [];
  const seen = new Set([letter]);
  return generateStyleVariants(letter, letterStyleIds).filter(({ id, text }) => {
    if ((id === 'squared' && letter === letter.toLowerCase()) || seen.has(text)) return false;
    seen.add(text);
    return true;
  });
}
