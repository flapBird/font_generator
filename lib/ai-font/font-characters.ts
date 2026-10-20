// Mixfont documents 72 standard glyphs but does not enumerate every punctuation
// mark. Require this core set and inspect the delivered font for other characters.
export const REQUIRED_ENGLISH_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?';

export function unsupportedFontCharacters(text: string, characters: string) {
  const supported = new Set(characters);
  return [...new Set(Array.from(text).filter((character) => character !== '\n' && character !== '\r' && !supported.has(character)))].join('');
}
