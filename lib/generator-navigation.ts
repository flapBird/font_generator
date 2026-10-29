// Hide this batch from permanent navigation; the active text workspace may show a separate temporary current item.
// Preserve every older entry, its order, search behavior and collection-link placement.
import { discoverySlugs } from './discovery-catalog';

export const hiddenNavigationSlugs = [
  'bold-text-generator', 'strikethrough-text-generator', 'underline-text-generator',
  'small-caps-generator', 'vaporwave-font-generator', 'double-struck-font-generator',
  'roblox-font-generator', 'twitter-font-generator', 'twitch-font-generator',
  'adopt-me-font-generator', 'discord-font-generator', 'zalgo-text-generator',
  'handwriting-font-generator',
  'halloween-font-generator', 'korean-font-generator', 'k-pop-font-generator',
  'chinese-font-generator', 'wingdings-font-generator', 'graffiti-font-generator',
  'arabic-font-generator', 'preppy-font-generator', 'emoji-font-generator', 'gaming-font-generator',
  ...discoverySlugs,
] as const;

// Utility pages have their own catalog; do not register them as font styles or artwork.
export const hiddenUtilityNavigationPaths = [
  '/symbols', '/symbols/heart-symbols', '/symbols/star-symbols', '/symbols/arrow-symbols',
  '/kaomoji', '/emoji-combos', '/unicode-tools', '/invisible-character',
  '/unicode-character-inspector', '/invisible-character-remover', '/fancy-text-to-normal-text',
  '/signature-generator',
] as const;

const hiddenPaths = new Set<string>([
  ...hiddenNavigationSlugs.map((slug) => `/${slug}`), ...hiddenUtilityNavigationPaths,
]);
export const isVisibleInGeneratorNavigation = (href: string) => !hiddenPaths.has(href);

// Opt in only these new pure-text tools; existing generator workspaces keep their behavior.
export const focusedTextSlugs = new Set([
  'bold-text-generator', 'strikethrough-text-generator', 'underline-text-generator',
  'small-caps-generator', 'vaporwave-font-generator', 'double-struck-font-generator',
]);
