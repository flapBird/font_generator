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
