import { segmentGraphemes } from './unicode';

// Keep emoji sequences intact; decorate a whole visible grapheme at a time.
export function strikeText(text: string, mark = '\u0336') {
  return segmentGraphemes(text).map((part) => (
    /\s|\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20e3/u.test(part) || part.includes(mark)
      ? part : `${part}${mark}`
  )).join('');
}

export const ZALGO_INPUT_LIMIT = 1000;
export const zalgoMarks = {
  above: ['\u0300', '\u0301', '\u0302', '\u0303', '\u0304', '\u0306', '\u0307', '\u0308', '\u030a', '\u030b', '\u030c', '\u0311'],
  middle: ['\u0334', '\u0335', '\u0336', '\u0337', '\u0338'],
  below: ['\u0316', '\u0317', '\u0318', '\u0319', '\u031c', '\u031d', '\u0320', '\u0323', '\u0324', '\u0325', '\u0329', '\u0330'],
} as const;

export interface ZalgoOptions {
  intensity: number;
  above: boolean;
  middle: boolean;
  below: boolean;
  seed: number;
}

export function generateZalgo(text: string, options: ZalgoOptions) {
  if (text.length > ZALGO_INPUT_LIMIT) return '';
  const intensity = Number.isFinite(options.intensity) ? Math.max(0, Math.min(10, Math.round(options.intensity))) : 0;
  let state = options.seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  return segmentGraphemes(text).map((part) => {
    // Avoid attaching marks to emoji, complex scripts, or existing Zalgo stacks.
    const normalized = part.normalize('NFD');
    if (!/^[\x21-\x7e]\p{Mark}{0,3}$/u.test(normalized) || /\u20e3|\ufe0f/u.test(part)) return part;
    let result = part;
    for (const zone of ['above', 'middle', 'below'] as const) {
      if (!options[zone]) continue;
      const count = zone === 'middle' ? Math.min(intensity, 2) : intensity;
      for (let i = 0; i < count; i++) result += zalgoMarks[zone][Math.floor(random() * zalgoMarks[zone].length)];
    }
    return result;
  }).join('');
}

export const discordFormats = [
  { id: 'bold', name: 'Bold', marker: '**', className: 'font-bold' },
  { id: 'italic', name: 'Italic', marker: '*', className: 'italic' },
  { id: 'boldItalic', name: 'Bold italic', marker: '***', className: 'font-bold italic' },
  { id: 'underline', name: 'Underline', marker: '__', className: 'underline' },
  { id: 'underlineBold', name: 'Underline bold', marker: '__**', className: 'underline font-bold' },
  { id: 'strike', name: 'Strikethrough', marker: '~~', className: 'line-through' },
] as const;
export type DiscordFormat = typeof discordFormats[number]['id'];

export function formatDiscordMessage(text: string, format: DiscordFormat) {
  const marker = discordFormats.find((item) => item.id === format)!.marker;
  const closing = [...marker].reverse().join('');
  // Wrap lines separately so blank lines and leading/trailing spaces remain intact.
  return text.split(/(\r?\n)/).map((line) => {
    if (!line.trim()) return line;
    const [, before, content, after] = /^(\s*)(.*?)(\s*)$/.exec(line)!;
    const escaped = content.replace(/[\\`*_~|>#[\]()]/g, '\\$&');
    return `${before}${marker}${escaped}${closing}${after}`;
  }).join('');
}
