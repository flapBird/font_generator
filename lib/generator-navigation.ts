// Fixed shortcuts, deliberately independent of registry growth.
// New tools belong in the full directories unless explicitly promoted here.
export const generatorShortcutSlugs = [
  'small-text-generator', 'weird-text-generator', 'upside-down-text-generator',
  'italics-font-generator', 'cursive-font-generator', 'bubble-font-generator',
  'fraktur-font-generator', 'instagram-font-generator',
  'big-font-generator', 'brat-text-generator', 'minecraft-font-generator', '3d-font-generator',
] as const;

const shortcutPaths = new Set(generatorShortcutSlugs.map((slug) => `/${slug}`));
export const isGeneratorShortcut = (href: string) => shortcutPaths.has(href);

// Opt in only these new pure-text tools; existing generator workspaces keep their behavior.
export const focusedTextSlugs = new Set([
  'bold-text-generator', 'strikethrough-text-generator', 'underline-text-generator',
  'small-caps-generator', 'vaporwave-font-generator', 'double-struck-font-generator',
]);
