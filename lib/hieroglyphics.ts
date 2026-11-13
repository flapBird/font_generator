import { segmentGraphemes } from './unicode';

export const HIEROGLYPH_INPUT_LIMIT = 120;
export const hieroglyphSamples = ['Sam', 'Sharon', 'Alex'];

// English sound approximations follow the Royal Ontario Museum activity.
// https://www.rom.on.ca/learn/resources/activity-write-your-name-egyptian-hieroglyphs
// The Unicode chart identifies the Gardiner signs and code points.
// https://www.unicode.org/charts/PDF/U13000.pdf
const signs = {
  vulture: ['G1', 0x1313f, 'Vulture'], foot: ['D58', 0x130c0, 'Foot'], basket: ['V31', 0x133a1, 'Basket'],
  hand: ['D46', 0x130a7, 'Hand'], reed: ['M17', 0x131cb, 'Reed leaf'], viper: ['I9', 0x13191, 'Horned viper'],
  stand: ['W11', 0x133bc, 'Jar stand'], shelter: ['O4', 0x13254, 'Shelter'], cobra: ['I10', 0x13193, 'Cobra'],
  lion: ['E23', 0x130ed, 'Recumbent lion'], owl: ['G17', 0x13153, 'Owl'], water: ['N35', 0x13216, 'Water ripple'],
  lasso: ['V4', 0x1336f, 'Lasso'], stool: ['Q3', 0x132aa, 'Stool'], slope: ['N29', 0x1320e, 'Sandy slope'],
  mouth: ['D21', 0x1308b, 'Mouth'], cloth: ['S29', 0x132f4, 'Folded cloth'], loaf: ['X1', 0x133cf, 'Bread loaf'],
  quail: ['G43', 0x13171, 'Quail chick'], reeds: ['M17A', 0x131cc, 'Two reed leaves'], bolt: ['O34', 0x13283, 'Door bolt'],
  pool: ['N37', 0x13219, 'Pool'], tether: ['V13', 0x1337f, 'Tether'], sieve: ['Aa1', 0x1340d, 'Sieve'],
} as const;

type Sign = (typeof signs)[keyof typeof signs];
const spellings: Record<string, readonly Sign[]> = {
  a: [signs.vulture], b: [signs.foot], c: [signs.basket], d: [signs.hand], e: [signs.reed], f: [signs.viper],
  g: [signs.stand], h: [signs.shelter], i: [signs.reed], j: [signs.cobra], k: [signs.basket], l: [signs.lion],
  m: [signs.owl], n: [signs.water], o: [signs.lasso], p: [signs.stool], q: [signs.slope], r: [signs.mouth],
  s: [signs.cloth], t: [signs.loaf], u: [signs.quail], v: [signs.viper], w: [signs.quail], x: [signs.basket, signs.cloth],
  y: [signs.reeds], z: [signs.bolt],
  ch: [signs.tether], kh: [signs.sieve], oo: [signs.quail], ph: [signs.viper], qu: [signs.basket, signs.quail],
  sh: [signs.pool], th: [signs.tether],
};

export function spellInHieroglyphs(text: string) {
  if (text.length > HIEROGLYPH_INPUT_LIMIT) return { text: '', matches: [], unmatchedLetters: 0 };
  const parts = segmentGraphemes(text);
  const latin = parts.map((part) => /^([A-Za-z])\p{Mark}*$/u.exec(part.normalize('NFD'))?.[1].toLowerCase() ?? '');
  const matches: { offset: number; input: string; signs: Sign[] }[] = [];
  let output = '';
  let unmatchedLetters = 0;

  for (let index = 0; index < parts.length; index++) {
    const pair = latin[index] && latin[index + 1] ? spellings[latin[index] + latin[index + 1]] : undefined;
    const matched = pair ?? spellings[latin[index]];
    if (!matched) {
      output += parts[index];
      if (/\p{Letter}/u.test(parts[index])) unmatchedLetters++;
      continue;
    }
    const size = pair ? 2 : 1;
    matches.push({ offset: index, input: parts.slice(index, index + size).join(''), signs: [...matched] });
    output += matched.map(([, point]) => String.fromCodePoint(point)).join('');
    index += size - 1;
  }

  return { text: output, matches, unmatchedLetters };
}
