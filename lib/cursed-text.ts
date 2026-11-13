import { getStyleDefinition } from './generator';
import { generateZalgo, zalgoMarks, ZALGO_INPUT_LIMIT } from './text-effects';
import { segmentGraphemes } from './unicode';

export const CURSED_INPUT_LIMIT = ZALGO_INPUT_LIMIT;
export const CURSED_CLEAN_LIMIT = CURSED_INPUT_LIMIT * 23;
export const cursedSamples = ['The signal is lost', 'Do not open', 'See you after dark'];

// Use a dedicated palette so the cleaner can target these effects and leave
// common spelling accents such as an acute, tilde or diaeresis alone.
const cursedMarks = {
  above: ['\u0305', '\u033d', '\u0346', '\u034a', '\u034b', '\u0350', '\u0351', '\u0357'],
  middle: zalgoMarks.middle,
  below: ['\u0339', '\u033a', '\u033b', '\u0347', '\u0348', '\u0349', '\u0359', '\u035a'],
};
const removableMarks = new Set<string>([...cursedMarks.above, ...cursedMarks.middle, ...cursedMarks.below]);
const stackPresets = [
  { id: 'haunted', name: 'Haunted', description: 'Marks above and below the letters.', above: true, middle: false, below: true },
  { id: 'static', name: 'Overhead Static', description: 'A stack that rises above the baseline.', above: true, middle: false, below: false },
  { id: 'falling', name: 'Falling', description: 'Marks drop below the letters.', above: false, middle: false, below: true },
  { id: 'heavy', name: 'Heavy Stack', description: 'Dense marks above, through and below the letters.', above: true, middle: true, below: true },
] as const;

export function cursedTextResults(text: string, intensity = 2, seed = 42) {
  const source = text.length <= CURSED_INPUT_LIMIT ? text : '';
  const stacks = stackPresets.map(({ id, name, description, above, middle, below }) => ({
    id, name, description, spacious: true,
    text: generateZalgo(source, {
      above, middle, below, seed, marks: cursedMarks,
      intensity: id === 'heavy' ? intensity + 3 : intensity,
    }),
  }));
  return [
    ...stacks,
    { id: 'scratched', name: 'Scratched', description: 'A single slash through each supported character.', spacious: false,
      text: generateZalgo(source, { intensity: 1, above: false, middle: true, below: false, seed, marks: { ...cursedMarks, middle: ['\u0338'] } }) },
    { id: 'blackletter', name: 'Blackletter', description: 'Angular Unicode letterforms without stacked marks.', spacious: false,
      text: getStyleDefinition('boldFraktur')!.transform(source) },
  ];
}

export function cleanCursedText(text: string) {
  if (text.length > CURSED_CLEAN_LIMIT) return { text: '', removed: 0 };
  let removed = 0;
  const cleaned = segmentGraphemes(text).map((part) => {
    // Keep emoji, whitespace and other scripts intact. Inspect the original
    // code points so cleaning never normalizes or decomposes an accent.
    if (!/^[\x21-\x7e]\p{Mark}*$/u.test(part.normalize('NFD')) || /[\u20e3\ufe0f]/u.test(part)) return part;
    return Array.from(part).filter((character) => {
      if (!removableMarks.has(character)) return true;
      removed++;
      return false;
    }).join('');
  }).join('');
  return { text: cleaned, removed };
}
