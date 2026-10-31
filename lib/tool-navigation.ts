export const toolCategories = [
  { id: 'font-styles', title: 'Font Styles', href: '/styles', sample: 'Aa', description: 'Copyable letter styles for bios, names and messages.' },
  { id: 'visual-art', title: 'Visual & Art', href: '/visual-art', sample: 'Art', description: 'Text artwork, image exports and signature images.' },
  { id: 'symbols', title: 'Symbols & Emoji', href: '/symbols', sample: '✦', description: 'Symbols, kaomoji and ready-to-copy emoji combinations.' },
  { id: 'unicode-tools', title: 'Unicode Tools', href: '/unicode-tools', sample: 'U+', description: 'Inspect characters, clean text and copy blank characters.' },
] as const;
export type ToolCategoryId = typeof toolCategories[number]['id'];

// These are curated navigation slots, not an automatic mirror of the directory.
// Future categories belong in /tools first; adding one must not grow the header/footer.
const featuredCategoryIds: readonly ToolCategoryId[] = ['font-styles', 'visual-art', 'symbols', 'unicode-tools'];
export const featuredToolCategories = toolCategories.filter((category) => featuredCategoryIds.includes(category.id));

// Curated shortcuts only; full lists stay in each category directory.
export const categoryShortcuts: Record<ToolCategoryId, readonly { href: string; label: string; sample?: string }[]> = {
  'font-styles': [
    { href: '/small-text-generator', label: 'Small text', sample: 'ᴬᵃ' },
    { href: '/weird-text-generator', label: 'Weird text', sample: 'ค' },
    { href: '/upside-down-text-generator', label: 'Upside down', sample: 'ɐ' },
    { href: '/italics-font-generator', label: 'Italics', sample: '𝒜' },
    { href: '/serif-font-generator', label: 'Serif', sample: '𝐀' },
    { href: '/comic-font-generator', label: 'Comic', sample: 'Aa' },
    { href: '/retro-font-generator', label: 'Retro', sample: '▤' },
    { href: '/y2k-font-generator', label: 'Y2K', sample: '✧' },
    { href: '/western-font-generator', label: 'Western', sample: '★' },
    { href: '/horror-font-generator', label: 'Horror', sample: 'Ⱥ' },
  ],
  'visual-art': [
    { href: '/brat-text-generator', label: 'Brat text', sample: 'brat' },
    { href: '/fire-font-generator', label: 'Fire text', sample: '♨' },
    { href: '/glitter-font-generator', label: 'Glitter', sample: '✦' },
    { href: '/big-font-generator', label: 'ASCII art', sample: '#_' },
    { href: '/ransom-note-font-generator', label: 'Ransom note', sample: 'aB' },
    { href: '/times-new-roman-font-generator', label: 'Times New Roman', sample: 'T' },
    { href: '/impact-font-generator', label: 'Impact', sample: 'A' },
  ],
  symbols: [
    { href: '/symbols/heart-symbols', label: 'Heart symbols' },
    { href: '/symbols/star-symbols', label: 'Star symbols' },
    { href: '/symbols/arrow-symbols', label: 'Arrow symbols' },
    { href: '/kaomoji', label: 'Kaomoji' },
    { href: '/emoji-combos', label: 'Emoji combos' },
  ],
  'unicode-tools': [
    { href: '/unicode-character-inspector', label: 'Character inspector' },
    { href: '/invisible-character-remover', label: 'Invisible character remover' },
    { href: '/fancy-text-to-normal-text', label: 'Fancy text to normal' },
    { href: '/invisible-character', label: 'Invisible character' },
  ],
};
