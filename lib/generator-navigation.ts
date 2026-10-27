// Hide this batch from permanent navigation; the active text workspace may show a separate temporary current item.
// Preserve every older entry, its order, search behavior and collection-link placement.
export const hiddenNavigationSlugs = [
  'bold-text-generator', 'strikethrough-text-generator', 'underline-text-generator',
  'small-caps-generator', 'vaporwave-font-generator', 'double-struck-font-generator',
  'roblox-font-generator', 'twitter-font-generator', 'twitch-font-generator',
  'adopt-me-font-generator', 'discord-font-generator', 'zalgo-text-generator',
  'handwriting-font-generator',
  'halloween-font-generator', 'korean-font-generator', 'k-pop-font-generator',
  'chinese-font-generator', 'wingdings-font-generator', 'graffiti-font-generator',
  'arabic-font-generator', 'preppy-font-generator', 'emoji-font-generator', 'gaming-font-generator',
] as const;

const hiddenPaths = new Set(hiddenNavigationSlugs.map((slug) => `/${slug}`));
export const isVisibleInGeneratorNavigation = (href: string) => !hiddenPaths.has(href);

// Opt in only these new pure-text tools; existing generator workspaces keep their behavior.
export const focusedTextSlugs = new Set([
  'bold-text-generator', 'strikethrough-text-generator', 'underline-text-generator',
  'small-caps-generator', 'vaporwave-font-generator', 'double-struck-font-generator',
]);
