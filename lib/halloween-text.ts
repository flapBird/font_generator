import { generateStyleVariants } from './generator';
import { generateZalgo } from './text-effects';

export type HalloweenTextCategory = 'Gothic' | 'Spooky' | 'Cute' | 'Glitch' | 'Plain';
const definitions: { id: string; name: string; style: string; category: HalloweenTextCategory; before?: string; after?: string; glitch?: number }[] = [
  { id: 'pumpkin-fraktur', name: 'Pumpkin Blackletter', style: 'fraktur', category: 'Gothic', before: '🎃 ', after: ' 🎃' },
  { id: 'classic-fraktur', name: 'Classic Fraktur', style: 'fraktur', category: 'Gothic' },
  { id: 'bold-fraktur', name: 'Bold Blackletter', style: 'boldFraktur', category: 'Gothic' },
  { id: 'vampire', name: 'Vampire Script', style: 'boldScript', category: 'Gothic', before: '☾ ', after: ' ☽' },
  { id: 'ritual', name: 'Ritual Lettering', style: 'doubleStruck', category: 'Gothic', before: '✧ ', after: ' ✧' },
  { id: 'dark-cross', name: 'Dark Cross', style: 'fraktur', category: 'Gothic', before: '† ', after: ' †' },
  { id: 'ghost', name: 'Friendly Ghost', style: 'sansBold', category: 'Cute', before: '👻 ', after: ' 👻' },
  { id: 'candy', name: 'Candy Letters', style: 'circled', category: 'Cute', before: '🍬 ', after: ' 🍬' },
  { id: 'pumpkin', name: 'Pumpkin Party', style: 'smallCaps', category: 'Cute', before: '🎃 ', after: ' 🎃' },
  { id: 'cat', name: 'Black Cat', style: 'script', category: 'Cute', before: '🐈‍⬛ ', after: ' 🐈‍⬛' },
  { id: 'witch', name: 'Witchy Wishes', style: 'script', category: 'Cute', before: '✦ ☾ ', after: ' ☽ ✦' },
  { id: 'boo', name: 'Little Boo', style: 'smallCaps', category: 'Cute', before: '꒰ ', after: ' ꒱ 👻' },
  { id: 'skull', name: 'Skull Warning', style: 'boldFraktur', category: 'Spooky', before: '☠ ', after: ' ☠' },
  { id: 'web', name: 'Spider Web', style: 'monospace', category: 'Spooky', before: '🕸 ', after: ' 🕸' },
  { id: 'bat', name: 'Bat Wings', style: 'smallCaps', category: 'Spooky', before: '🦇 ', after: ' 🦇' },
  { id: 'bones', name: 'Bone Yard', style: 'sansBold', category: 'Spooky', before: '🦴 ', after: ' 🦴' },
  { id: 'coffin', name: 'Coffin Club', style: 'squared', category: 'Spooky', before: '⚰ ', after: ' ⚰' },
  { id: 'night', name: 'Midnight Message', style: 'fullwidth', category: 'Spooky', before: '☾ ', after: ' ☽' },
  { id: 'flicker', name: 'Flicker', style: 'monospace', category: 'Glitch', glitch: 1 },
  { id: 'haunted', name: 'Haunted Signal', style: 'sansBold', category: 'Glitch', glitch: 3 },
  { id: 'cursed', name: 'Cursed Letters', style: 'fraktur', category: 'Glitch', glitch: 5 },
  { id: 'static', name: 'Midnight Static', style: 'smallCaps', category: 'Glitch', glitch: 2, before: '⌁ ', after: ' ⌁' },
  { id: 'spell', name: 'Spell Book', style: 'boldScript', category: 'Gothic', before: '⋆ ', after: ' ⋆' },
  { id: 'original', name: 'Original text', style: '', category: 'Plain' },
];
export const halloweenTextCategories = ['All', 'Gothic', 'Spooky', 'Cute', 'Glitch', 'Plain'] as const;
export function halloweenTextResults(text: string) {
  return definitions.map((definition) => {
    const source = definition.glitch ? generateZalgo(text, { intensity: definition.glitch, above: true, middle: false, below: true, seed: 31 }) : text;
    let output = definition.style ? generateStyleVariants(source, [definition.style])[0].text : source;
    output = !text.trim() ? '' : output.split('\n').map((line) => line.trim() ? `${definition.before ?? ''}${line}${definition.after ?? ''}` : line).join('\n');
    return { id: `halloween-${definition.id}`, name: definition.name, category: definition.category, text: output };
  });
}
