export const blankCharacters = [
  { id: 'zero-width-space', text: '\u200B', name: 'Zero-width space', note: 'Normally has no visible width; can allow a line break. Some apps remove it.' },
  { id: 'no-break-space', text: '\u00A0', name: 'No-break space', note: 'A space that normally keeps adjacent words on the same line.' },
  { id: 'space', text: ' ', name: 'Normal space', note: 'An ordinary word space. Leading and trailing spaces are often trimmed.' },
  { id: 'thin-space', text: '\u2009', name: 'Thin space', note: 'A narrow typographic space; exact width depends on the font.' },
  { id: 'em-space', text: '\u2003', name: 'Em space', note: 'A wide typographic space based on the font size.' },
  { id: 'ideographic-space', text: '\u3000', name: 'Ideographic space', note: 'A full-width space often used with East Asian text.' },
  { id: 'braille-blank', text: '\u2800', name: 'Braille pattern blank', note: 'An empty Braille cell. It is a character, not a Unicode whitespace character.' },
  { id: 'hangul-filler', text: '\u3164', name: 'Hangul filler', note: 'A Hangul compatibility character, not a general-purpose space. Rendering and acceptance vary.' },
] as const;

const detectedCharacters: { text: string; name: string }[] = [
  ...blankCharacters,
  { text: '\u200C', name: 'Zero-width non-joiner — may affect script shaping' },
  { text: '\u200D', name: 'Zero-width joiner — may join emoji or letters' },
  { text: '\u2060', name: 'Word joiner — prevents a line break' },
  { text: '\uFEFF', name: 'Byte order mark / zero-width no-break space' },
  { text: '\uFE0E', name: 'Text presentation selector' },
  { text: '\uFE0F', name: 'Emoji presentation selector' },
  { text: '\t', name: 'Tab' }, { text: '\n', name: 'Line feed' }, { text: '\r', name: 'Carriage return' },
];
export const INSPECTION_LIMIT = 2000;
export function createBlankText(id: string, count: number) {
  const selected = blankCharacters.find((entry) => entry.id === id);
  if (!selected || !Number.isInteger(count) || count < 1 || count > 100) return '';
  return selected.text.repeat(count);
}
export function inspectBlankText(text: string) {
  if (text.length > INSPECTION_LIMIT) throw new RangeError('Paste up to 2,000 UTF-16 units.');
  const points = Array.from(text);
  return {
    units: text.length, codePoints: points.length,
    graphemes: Array.from(new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(text)).length,
    detected: detectedCharacters.flatMap((entry) => {
      const count = points.filter((point) => point === entry.text).length;
      return count ? [{ ...entry, count }] : [];
    }),
  };
}
