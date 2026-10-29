import { segmentGraphemes } from '../unicode';
import { codePoints } from './text';

export const UNICODE_TOOL_LIMIT = 2000;
const knownNames: Record<string, string> = {
  ' ': 'Space', '\t': 'Tab', '\n': 'Line feed', '\r': 'Carriage return', '\u00A0': 'No-break space',
  '\u200B': 'Zero-width space', '\u200C': 'Zero-width non-joiner', '\u200D': 'Zero-width joiner',
  '\u2060': 'Word joiner', '\uFEFF': 'Byte order mark / zero-width no-break space',
  '\uFE0E': 'Text presentation selector', '\uFE0F': 'Emoji presentation selector', '\u00AD': 'Soft hyphen',
  '\u200E': 'Left-to-right mark', '\u200F': 'Right-to-left mark', '\u061C': 'Arabic letter mark',
  '\u202A': 'Left-to-right embedding', '\u202B': 'Right-to-left embedding', '\u202C': 'Pop directional formatting',
  '\u202D': 'Left-to-right override', '\u202E': 'Right-to-left override', '\u2066': 'Left-to-right isolate',
  '\u2067': 'Right-to-left isolate', '\u2068': 'First strong isolate', '\u2069': 'Pop directional isolate',
  '\u2800': 'Braille pattern blank', '\u3164': 'Hangul filler', '\u3000': 'Ideographic space',
};
export function characterCategory(char: string) {
  if (/\p{Cf}/u.test(char)) return 'Format';
  if (/\p{Cc}/u.test(char)) return 'Control';
  if (/\p{Cs}/u.test(char)) return 'Unpaired surrogate';
  if (/\p{Z}/u.test(char)) return 'Separator';
  if (/\p{M}/u.test(char)) return 'Mark';
  if (/\p{L}/u.test(char)) return 'Letter';
  if (/\p{N}/u.test(char)) return 'Number';
  if (/\p{P}/u.test(char)) return 'Punctuation';
  if (/\p{S}/u.test(char)) return 'Symbol';
  return 'Other';
}
export function inspectUnicode(text: string) {
  if (text.length > UNICODE_TOOL_LIMIT) throw new RangeError('Input exceeds 2,000 UTF-16 units.');
  let offset = 0;
  const rows = Array.from(text, (char, index) => {
    const category = characterCategory(char);
    const row = { index, offset, char, code: codePoints(char), category,
      name: knownNames[char] ?? (/^[a-z]$/i.test(char) ? `Latin ${char === char.toUpperCase() ? 'capital' : 'small'} letter ${char.toUpperCase()}` : /^[0-9]$/.test(char) ? `Digit ${char}` : 'Name not included in this compact inspector'),
      escaped: char.length === 2 ? `\\u{${char.codePointAt(0)!.toString(16).toUpperCase()}}` : `\\u${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`,
      utf8: category === 'Unpaired surrogate' ? 'Invalid scalar value' : Array.from(new TextEncoder().encode(char), (byte) => byte.toString(16).toUpperCase().padStart(2, '0')).join(' '),
      display: ['Format', 'Control', 'Separator', 'Unpaired surrogate'].includes(category) || /[\uFE0E\uFE0F\u2800\u3164]/u.test(char) ? '·' : char,
    };
    offset += char.length;
    return row;
  });
  return { rows, graphemes: segmentGraphemes(text), units: text.length };
}

export const removalOptions = [
  { id: 'zeroWidthSpaces', label: 'Zero-width spaces, BOM and soft hyphens', detail: 'May change line breaking or word separation.', pattern: /[\u200B\uFEFF\u00AD]/gu },
  { id: 'specialSpaces', label: 'Replace special spaces with normal spaces', detail: 'Changes width and no-break behavior; keeps tabs and line endings.', pattern: /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/gu },
  { id: 'blankLetters', label: 'Remove Braille blank and Hangul fillers', detail: 'These can be meaningful characters in Braille or Hangul.', pattern: /[\u2800\u3164\u115F\u1160]/gu },
  { id: 'joiners', label: 'Remove joiners and non-joiners', detail: 'Can break joined emoji and change script shaping. Off by default.', pattern: /[\u200C\u200D\u2060]/gu },
  { id: 'direction', label: 'Remove directional marks and controls', detail: 'Can change the reading order of mixed-direction text.', pattern: /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/gu },
  { id: 'variation', label: 'Remove variation selectors', detail: 'Can change emoji presentation or ideographic glyph variants.', pattern: /[\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/gu },
] as const;
export type RemovalId = typeof removalOptions[number]['id'];
export function cleanInvisibleText(text: string, enabled: readonly RemovalId[]) {
  if (text.length > UNICODE_TOOL_LIMIT) throw new RangeError('Input exceeds 2,000 UTF-16 units.');
  let output = text;
  const changes: { label: string; count: number; replacement: string }[] = [];
  for (const option of removalOptions) {
    if (!enabled.includes(option.id)) continue;
    const count = Array.from(output.matchAll(option.pattern)).length;
    if (!count) continue;
    const replacement = option.id === 'specialSpaces' ? ' ' : '';
    output = output.replace(option.pattern, replacement);
    changes.push({ label: option.label, count, replacement });
  }
  return { output, changes };
}

const smallCapsSource = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘʀꜱᴛᴜᴠᴡʏᴢ';
const smallCapsTarget = 'abcdefghijklmnoprstuvwyz';
const smallCaps = Object.fromEntries(Array.from(smallCapsSource, (char, index) => [char, smallCapsTarget[index]]));
const letterlike = new Set(Array.from('ℂℊℋℌℍℎℐℑℒℓℕℙℚℛℜℝℤℨℬℭℯℰℱℳℴ'));
export function normalText(text: string, options = { smallCaps: false, overlays: false }) {
  if (text.length > UNICODE_TOOL_LIMIT) throw new RangeError('Input exceeds 2,000 UTF-16 units.');
  let converted = 0;
  const output = segmentGraphemes(text).map((cluster) => {
    // Never normalize keycaps, flags, joined emoji or emoji presentation clusters.
    if (/\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20E3|\uFE0F/u.test(cluster)) return cluster;
    return Array.from(cluster, (char) => {
      if (options.overlays && /[\u0332-\u0338]/u.test(char)) { converted++; return ''; }
      if (options.smallCaps && smallCaps[char]) { converted++; return smallCaps[char]; }
      const cp = char.codePointAt(0)!;
      const supported = (cp >= 0x1D400 && cp <= 0x1D7FF) || (cp >= 0xFF01 && cp <= 0xFF5E)
        || (cp >= 0x2460 && cp <= 0x24FF) || (cp >= 0x2070 && cp <= 0x209F)
        || [0xB2, 0xB3, 0xB9].includes(cp) || letterlike.has(char);
      if (!supported) return char;
      const plain = char.normalize('NFKC');
      if (plain !== char && /^[\x21-\x7E]+$/.test(plain)) { converted++; return plain; }
      return char;
    }).join('');
  }).join('');
  return { output, converted };
}
