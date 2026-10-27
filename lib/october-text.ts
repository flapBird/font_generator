import { generateStyleVariants } from './generator';
import { convertToFancyText } from './fonts';
import { segmentGraphemes } from './unicode';
import { styleSocialText } from './social-text';
import { generateZalgo } from './text-effects';

export const textFrames = {
  none: ['No frame', '', ''], hearts: ['Hearts', '♡ ', ' ♡'], stars: ['Stars', '✦ ', ' ✦'],
  bows: ['Bows', '🎀 ', ' 🎀'], clan: ['Clan brackets', '【', '】'], pumpkins: ['Pumpkins', '🎃 ', ' 🎃'], ghosts: ['Ghosts', '👻 ', ' 👻'],
} as const;
export type OctoberFrame = keyof typeof textFrames;
export const frameLines = (text: string, frame: OctoberFrame) => !text.trim() ? '' : text.split('\n').map((line) => line.trim() ? `${textFrames[frame][1]}${line}${textFrames[frame][2]}` : line).join('\n');
const packs: Record<string, string[]> = {
  'k-pop-font-generator': ['script', 'sansBold', 'fullwidth', 'smallCaps', 'boldScript', 'monospace'],
  'preppy-font-generator': ['circled', 'script', 'smallCaps', 'boldScript', 'sansBold', 'doubleStruck'],
  'gaming-font-generator': ['smallCaps', 'sansBold', 'squared', 'monospace', 'fullwidth', 'boldFraktur'],
  'halloween-font-generator': ['fraktur', 'boldFraktur', 'glitch'],
};
const emojiStyle = (text: string, style: string) => segmentGraphemes(text).map((cluster) => /^[A-Za-z]$/.test(cluster) ? convertToFancyText(cluster, style).replaceAll('🇩', '🄳') : cluster).join('');
export function octoberTextResults(text: string, slug: string, frame: OctoberFrame = 'none') {
  const original = { id: 'original', name: 'Original text', text, category: 'classic' as const, description: 'Unchanged text for a readable fallback.' };
  if (slug === 'emoji-font-generator') {
    const themes = [['emojiMix', 'Emoji letter lookalikes'], ['emojiCute', 'Cute emoji code'], ['emojiAnimals', 'Animal emoji code'], ['emojiFood', 'Food emoji code'], ['emojiNature', 'Nature emoji code']];
    return [original, ...themes.map(([id, name]) => ({ id, name, text: frameLines(emojiStyle(text, id), frame), category: 'symbols' as const, description: id === 'emojiMix' ? 'Unicode lookalikes; appearance depends on the device.' : 'Playful letter substitution, not a translation of meaning.' })), { id: 'emoji-decoration', name: 'Sparkle decoration', text: frameLines(text, 'stars'), category: 'symbols' as const, description: 'Keeps the original words readable.' }];
  }
  const results = generateStyleVariants(text, packs[slug] ?? []);
  return [original, ...results.map((result) => ({ ...result,
    text: frameLines(!text.trim() ? '' : slug === 'k-pop-font-generator' ? styleSocialText(text, (part) => generateStyleVariants(part, [result.id])[0].text)
      : slug === 'halloween-font-generator' && result.id === 'glitch' ? generateZalgo(text, { intensity: 2, above: true, middle: false, below: true, seed: 31 }) : result.text, frame),
  }))];
}
