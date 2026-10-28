import { getStyleDefinition } from './generator';
import { discoveryStyleIds } from './discovery-catalog';
import { segmentGraphemes } from './unicode';
import { strikeText } from './text-effects';

export const DISCOVERY_TEXT_LIMIT = 1000;
export const discoveryFrames = {
  none: ['None', '', ''], royal: ['Royal', '♔ ', ' ♔'], brackets: ['Brackets', '「', '」'],
  broken: ['Broken heart', '💔 ', ' 💔'], rain: ['Rain', '☂ ', ' ☂'], rose: ['Wilted rose', '🥀 ', ' 🥀'],
  stars: ['Stars', '✦ ', ' ✦'], sparkles: ['Sparkles', '✧ ', ' ✧'],
} as const;
export type DiscoveryFrame = keyof typeof discoveryFrames;
export type MessageMode = 'text' | 'format';
export interface DiscoveryResult { id: string; name: string; text: string; description?: string; previewText?: string; previewClassName?: string }

// Preserve destinations before applying letter substitutions; Reddit references
// are not Twitter entities. No changes to the existing social-text parser.
export function styleDiscoveryText(text: string, transform: (value: string) => string) {
  return text.split(/((?:https?:\/\/|www\.)[^\s<>]+|\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?<![\w/])\/?[ur]\/[A-Za-z0-9_-]+|(?<!\w)@[\w]+|(?<!\w)#[\p{L}\p{N}_]+)/gu)
    .map((part, index) => index % 2 ? part : transform(part)).join('');
}

export function frameDiscoveryText(text: string, frame: DiscoveryFrame) {
  const [, before, after] = discoveryFrames[frame];
  return text.split(/(\r?\n)/).map((line) => line.trim() ? `${before}${line}${after}` : line).join('');
}

export function squareText(text: string, mode: 'outline' | 'filled' | 'alternating', spaced = false) {
  let letterIndex = 0;
  return segmentGraphemes(text).map((part) => {
    const match = /^([a-zA-Z])(\p{Mark}*)$/u.exec(part.normalize('NFD'));
    if (!match) { letterIndex = 0; return part; }
    const index = letterIndex++;
    const start = mode === 'filled' || (mode === 'alternating' && index % 2 === 0) ? 0x1f170 : 0x1f130;
    return (spaced && index ? ' ' : '') + String.fromCodePoint(start + match[1].toUpperCase().charCodeAt(0) - 65) + match[2];
  }).join('');
}

const formats = [
  { id: 'bold', name: 'Bold', whatsapp: '*', reddit: '**', className: 'font-bold' },
  { id: 'italic', name: 'Italic', whatsapp: '_', reddit: '*', className: 'italic' },
  { id: 'strike', name: 'Strikethrough', whatsapp: '~', reddit: '~~', className: 'line-through' },
  { id: 'code', name: 'Inline code', whatsapp: '`', reddit: '`', className: 'font-mono' },
] as const;

export function messageResults(text: string, platform: 'whatsapp' | 'reddit'): DiscoveryResult[] {
  return formats.map<DiscoveryResult>((format) => {
    const marker = format[platform];
    const hasConflict = platform === 'whatsapp' && text.includes(marker);
    // WhatsApp does not share Markdown's escaping rules. Show a clear conflict
    // instead of silently stripping user characters or promising a false preview.
    const result = hasConflict ? '' : text.split(/(\r?\n)/).map((line) => {
      if (!line.trim()) return line;
      const [, left, body, right] = /^(\s*)(.*?)(\s*)$/u.exec(line)!;
      if (format.id === 'code' && platform === 'reddit') {
        const runs = body.match(/`+/g) ?? [];
        const fence = '`'.repeat(Math.max(0, ...runs.map((run) => run.length)) + 1);
        return `${left}${fence} ${body} ${fence}${right}`;
      }
      const escaped = platform === 'reddit' ? body.replace(/[\\`*_~|>#[\]()]/g, '\\$&') : body;
      return `${left}${marker}${escaped}${marker}${right}`;
    }).join('');
    return { id: format.id, name: `${format.name} source`, text: result, previewText: hasConflict ? '' : text, previewClassName: format.className,
      description: hasConflict ? `Your input contains ${marker}. Remove that formatting delimiter to generate this result; your input is unchanged.` : platform === 'reddit' ? 'Paste into the desktop Markdown editor. Mobile uses rich text controls.' : 'Paste into a WhatsApp message, then check its formatting before sending.' };
  }).concat(platform === 'whatsapp' ? [{ id: 'monospace', name: 'Monospace source', text: !text.trim() || text.includes('`') ? '' : text.split(/(\r?\n)/).map((line) => line.trim() ? '```' + line + '```' : line).join(''), previewText: text.includes('`') ? '' : text, previewClassName: 'font-mono', description: text.includes('`') ? 'Remove backticks to generate monospace formatting; your input is unchanged.' : 'Triple-backtick WhatsApp message formatting.' }] : []);
}

export function discoveryTextResults(text: string, slug: string, frame: DiscoveryFrame = 'none', spaced = false): DiscoveryResult[] {
  if (text.length > DISCOVERY_TEXT_LIMIT) text = '';
  const results: DiscoveryResult[] = slug === 'square-text-generator'
    ? (['outline', 'filled', 'alternating'] as const).map((mode) => ({ id: `square-${mode}`, name: `${mode === 'outline' ? 'Outline' : mode === 'filled' ? 'Filled' : 'Alternating'} squares`, text: styleDiscoveryText(text, (value) => squareText(value, mode, spaced)), description: 'Latin letters become capitals. Digits, punctuation and other scripts are kept; filled letters may appear as emoji on some devices.' }))
    : (discoveryStyleIds[slug] ?? []).map((id) => {
      const style = getStyleDefinition(id)!;
      return { id, name: style.name, text: frameDiscoveryText(styleDiscoveryText(text, style.transform), frame) };
    });
  if (slug === 'sad-font-generator') for (const [id, name, mark] of [['sad-strike', 'Crossed-out words', '\u0336'], ['sad-broken', 'Broken strokes', '\u0335']]) {
    results.push({ id, name, text: frameDiscoveryText(styleDiscoveryText(text, (value) => segmentGraphemes(value).map((part) => /^[A-Za-z]\p{Mark}*$/u.test(part.normalize('NFD')) ? strikeText(part, mark) : part).join('')), frame) });
  }
  return [...results, { id: 'original', name: 'Original text', text, description: 'Unchanged spelling, without decoration.' }];
}
