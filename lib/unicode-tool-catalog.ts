import type { LibraryId } from './text-library/catalog';

export const unicodeGroups = [
  { id: 'inspect', label: 'Inspect & clean' },
  { id: 'blank', label: 'Blank characters' },
  { id: 'ancient', label: 'Ancient scripts' },
  { id: 'game', label: 'Game alphabets' },
] as const;
export type UnicodeGroup = typeof unicodeGroups[number]['id'];
// Lightweight shared source for category discovery. No fonts or converter code.
export const unicodeTools: { id: LibraryId; label: string; group: UnicodeGroup; output: string; keywords: string }[] = [
  { id: 'unicode-character-inspector', label: 'Character inspector', group: 'inspect', output: 'Character report', keywords: 'code point utf encoding inspect' },
  { id: 'invisible-character-remover', label: 'Invisible remover', group: 'inspect', output: 'Clean text', keywords: 'remove hidden zero width spaces cleanup' },
  { id: 'fancy-text-to-normal-text', label: 'Fancy to normal', group: 'inspect', output: 'Plain text', keywords: 'normalize restore font letters' },
  { id: 'invisible-character', label: 'Invisible character', group: 'blank', output: 'Blank text', keywords: 'empty blank space copy' },
  { id: 'hieroglyphics-translator', label: 'Hieroglyphics', group: 'ancient', output: 'Copyable text', keywords: 'egyptian name symbols' },
  { id: 'cuneiform-translator', label: 'Cuneiform', group: 'ancient', output: 'Text & PNG', keywords: 'sumerian akkadian name syllables' },
  { id: 'enchanting-table-translator', label: 'Enchanting table', group: 'game', output: 'Text & PNG', keywords: 'minecraft standard galactic sga decoder' },
  { id: 'enderman-translator', label: 'Enderman', group: 'game', output: 'Copyable text', keywords: 'minecraft ender alien enderspeak skrittish' },
  { id: 'standard-galactic-alphabet', label: 'Galactic alphabet', group: 'game', output: 'Alphabet chart', keywords: 'minecraft sga enchanting table letters' },
];
export const isUnicodeTool = (id: string) => id === 'unicode-tools' || unicodeTools.some((tool) => tool.id === id);
export function filterUnicodeTools<T extends { title: string; description: string; keywords: string; group: UnicodeGroup }>(items: T[], query: string, group: string) {
  const tokens = query.normalize('NFKD').toLowerCase().trim().split(/\s+/).filter(Boolean);
  return items.filter((item) => (group === 'all' || item.group === group) && tokens.every((token) => `${item.title} ${item.description} ${item.keywords}`.normalize('NFKD').toLowerCase().includes(token)));
}
