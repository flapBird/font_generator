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
export const categoryShortcuts: Record<ToolCategoryId, readonly { href: string; label: string }[]> = {
  'font-styles': [
    { href: '/small-text-generator', label: 'Small text' },
    { href: '/cursive-font-generator', label: 'Cursive' },
    { href: '/bold-text-generator', label: 'Bold text' },
    { href: '/bubble-font-generator', label: 'Bubble' },
  ],
  'visual-art': [
    { href: '/3d-font-generator', label: '3D text' },
    { href: '/fire-font-generator', label: 'Fire text' },
    { href: '/minecraft-font-generator', label: 'Minecraft' },
    { href: '/signature-generator', label: 'Signature generator' },
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
