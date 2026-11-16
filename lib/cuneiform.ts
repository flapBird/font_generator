import { segmentGraphemes } from './unicode';

export const CUNEIFORM_INPUT_LIMIT = 120;
export const cuneiformExamples = ['Luna', 'Sam', 'Nina'];
export const cuneiformFontSample = '𒀀';

// Selected readings from the CC0 Oracc Sign List. The same sign can have several readings.
// https://github.com/oracc/osl/blob/master/00lib/osl.asl
const signPoints = {
  a: 0x12000, e: 0x1208a, i: 0x1213f, u: 0x1230b,
  ba: 0x12040, be: 0x12041, bi: 0x12049, bu: 0x1204d,
  da: 0x12055, de: 0x12072, di: 0x12072, du: 0x1207a,
  ga: 0x120b5, ge: 0x12100, gi: 0x12100, gu: 0x12116,
  ha: 0x12129, he: 0x1212d, hi: 0x1212d, hu: 0x12137,
  ka: 0x12157, ke: 0x121a0, ki: 0x121a0, ku: 0x121aa,
  la: 0x121b7, le: 0x121f7, li: 0x121f7, lu: 0x121fb,
  ma: 0x12220, me: 0x12228, mi: 0x1222a, mu: 0x1222c,
  na: 0x1223e, ne: 0x12248, ni: 0x1224c, nu: 0x12261,
  pa: 0x1227a, pe: 0x1227f, pi: 0x1227f, pu: 0x1204d,
  ra: 0x1228f, re: 0x12291, ri: 0x12291, ru: 0x12292,
  sa: 0x12293, se: 0x122db, si: 0x122db, su: 0x122e2,
  ša: 0x122ad, še: 0x122ba, ši: 0x12146, šu: 0x122d7,
  ta: 0x122eb, te: 0x122fc, ti: 0x122fe, tu: 0x12305,
  wa: 0x1227f, we: 0x1227f, wi: 0x1227f, wu: 0x1227f,
  ya: 0x1227f, ye: 0x1227f, yi: 0x1227f, yu: 0x1227f,
  za: 0x1235d, ze: 0x12363, zi: 0x12363, zu: 0x1236a,
  ab: 0x1200a, ad: 0x1201c, ak: 0x1201d, al: 0x12020, am: 0x12120, an: 0x1202d,
  ar: 0x12148, as: 0x1228d, aš: 0x12038, at: 0x1201c, az: 0x1228d,
  eb: 0x12141, ek: 0x12145, el: 0x12096, em: 0x1214e, en: 0x12097,
  er: 0x12155, es: 0x12111, eš: 0x1230d, et: 0x12009,
  ib: 0x12141, ik: 0x12145, il: 0x1214b, im: 0x1214e, in: 0x12154,
  ir: 0x12155, is: 0x12111, iš: 0x12156, it: 0x12009, iz: 0x12111,
  ub: 0x12312, uk: 0x1228c, ul: 0x1230c, um: 0x1231d, un: 0x12326,
  ur: 0x12328, us: 0x122bb, uš: 0x12351, ut: 0x12313, uz: 0x122bb,
};

export const cuneiformSignChart = Object.entries(signPoints).map(([reading, point]) => ({
  reading,
  glyph: String.fromCodePoint(point),
  code: `U+${point.toString(16).toUpperCase()}`,
}));
const signsByReading = new Map(cuneiformSignChart.map((sign) => [sign.reading, sign]));

type Sign = typeof cuneiformSignChart[number];
type Match = { input: string; offset: number; signs: Sign[] };
const vowel = /^[aeiu]$/;
const digraphs: Record<string, string> = { ch: 'š', ck: 'k', ee: 'i', oo: 'u', ph: 'p', sh: 'š', th: 't' };
const approximations: Record<string, string> = { c: 'k', f: 'p', j: 'z', o: 'u', q: 'k', v: 'b' };

export function spellInCuneiform(text: string) {
  const matches: Match[] = [];
  let unmatchedLetters = 0;
  if (text.length > CUNEIFORM_INPUT_LIMIT) return { text: '', matches, unmatchedLetters };
  const parts = segmentGraphemes(text);
  const latin = parts.map((part) => {
    if (part.normalize('NFC').toLowerCase() === 'š') return 'š';
    return /^([A-Za-z])\p{Mark}*$/u.exec(part.normalize('NFD'))?.[1].toLowerCase() ?? '';
  });
  const units: { input: string; sound: string }[] = [];

  for (let index = 0; index < parts.length; index++) {
    const letter = latin[index];
    const pair = letter && latin[index + 1] ? digraphs[letter + latin[index + 1]] : undefined;
    if (pair) {
      units.push({ input: parts[index] + parts[index + 1], sound: pair });
      index++;
      continue;
    }
    units.push({ input: parts[index], sound: approximations[letter] ?? letter });
  }

  let output = '';
  for (let index = 0; index < units.length;) {
    const { input, sound } = units[index];
    const next = units[index + 1]?.sound ?? '';
    const syllable = sound && vowel.test(next) ? signsByReading.get(sound + next) : undefined;
    const defaultSign = signsByReading.get(sound) ?? (sound ? signsByReading.get(sound + 'a') : undefined);
    const first = syllable ?? defaultSign;
    const xSigns = sound === 'x' ? [signsByReading.get('ka')!, signsByReading.get('sa')!] : undefined;
    if (!first && !xSigns) {
      output += input;
      if (/\p{Letter}/u.test(input) && !/^\p{Script=Cuneiform}$/u.test(input)) unmatchedLetters++;
      index++;
      continue;
    }
    const signs = xSigns ?? [first!];
    let end = index + (syllable ? 2 : 1);
    const lastSound = units[end - 1].sound;
    const closingSound = units[end]?.sound ?? '';
    // A closed syllable such as Sam uses sa + am. Leave the next consonant
    // for the next syllable when it already has a vowel, as in lu + na.
    if (vowel.test(lastSound) && closingSound && !vowel.test(units[end + 1]?.sound ?? '')) {
      const closing = signsByReading.get(lastSound + closingSound);
      if (closing) {
        signs.push(closing);
        end++;
      }
    }
    matches.push({ input: units.slice(index, end).map((unit) => unit.input).join(''), offset: index, signs });
    output += signs.map((sign) => sign.glyph).join('');
    index = end;
  }
  return { text: output, matches, unmatchedLetters };
}
