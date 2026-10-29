import { discoverySlugs } from './discovery-catalog';

const updateGroups = {
  '2026-10-30': [
    '/tools',
    '/symbols', '/symbols/heart-symbols', '/symbols/star-symbols', '/symbols/arrow-symbols',
    '/kaomoji', '/emoji-combos',
  ],
  '2026-10-29': [
    '/unicode-tools', '/invisible-character', '/privacy',
    '/unicode-character-inspector', '/invisible-character-remover', '/fancy-text-to-normal-text',
    '/signature-generator', '/visual-art',
  ],
  '2026-10-28': [
    '/fraktur-font-generator',
    '/goth-font-generator',
    '/bubble-font-generator',
    '/instagram-font-generator',
    '/discord-font-generator',
    '/fire-font-generator',
    '/y2k-font-generator',
    '/glitch-font-generator',
    '/gaming-font-generator',
    '/guides/reddit-fancy-text-guide',
    ...discoverySlugs.map((slug) => `/${slug}`),
    '/styles',
    '/halloween-font-generator',
    '/k-pop-font-generator', '/wingdings-font-generator', '/preppy-font-generator',
    '/emoji-font-generator',
    '/adopt-me-font-generator',
  ],
  '2026-10-27': [
    '/korean-font-generator',
    '/chinese-font-generator', '/graffiti-font-generator',
    '/arabic-font-generator',
    '/',
    '/bold-text-generator',
    '/strikethrough-text-generator',
    '/underline-text-generator',
    '/small-caps-generator',
    '/vaporwave-font-generator',
    '/double-struck-font-generator',
    '/handwriting-font-generator',
    '/twitter-font-generator',
    '/twitch-font-generator',
    '/roblox-font-generator',
    '/zalgo-text-generator',
  ],
  '2026-10-26': [
    '/fandom',
    '/small-text-generator',
    '/cursive-font-generator',
    '/serif-font-generator',
    '/linkedin-font-generator',
    '/minecraft-font-generator',
    '/aesthetic-font-generator',
    '/facebook-font-generator',
    '/guides/discord-font-guide',
  ],
  '2026-10-23': [
    '/impact-font-generator',
  ],
  '2026-08-27': [
    '/times-new-roman-font-generator',
    '/papyrus-font-generator',
    '/comic-sans-font-generator',
    '/minecraftia-font-generator',
    '/guides/how-unicode-text-works-guide',
    '/guides/unicode-font-compatibility-guide',
    '/guides/accessible-fancy-text-guide',
    '/guides/instagram-bio-font-guide',
    '/guides/fancy-text-troubleshooting-guide',
    '/guides/unicode-character-coverage-guide',
  ],
  '2026-08-31': [
    '/3d-font-generator',
  ],
  '2026-08-26': [
    '/weird-text-generator',
    '/upside-down-text-generator',
    '/brat-text-generator',
    '/italics-font-generator',
    '/comic-font-generator',
    '/retro-font-generator',
    '/western-font-generator',
    '/horror-font-generator',
    '/demon-font-generator',
    '/whisper-font-generator',
    '/christmas-font-generator',
    '/cursive-tattoo-font-generator',
    '/glitter-font-generator',
    '/heart-font-generator',
    '/big-font-generator',
    '/ransom-note-font-generator',
    '/san-francisco-font-generator',
    '/metallica-font-generator',
    '/tiktok-font-generator',
    '/chicano-font-generator',
    '/tattoo-font-generator',
    '/name-font-generator',
    '/creepy-scary-font-generator',
    '/medieval-font-generator',
    '/metal-font-generator',
    '/typewriter-font-generator',
    '/japanese-font-generator',
    '/pop-culture-font-generators',
    '/disney-font-generator',
    '/mario-font-generator',
    '/stranger-things-font-generator',
    '/fortnite-font-generator',
  ],
  '2026-08-13': ['/about'],
  '2026-08-01': ['/contact', '/terms'],
  '2026-07-28': ['/guides'],
} as const;

const entries = Object.entries(updateGroups).flatMap(([updatedAt, paths]) =>
  paths.map((path) => [path, updatedAt] as const),
);

const duplicatePaths = entries
  .map(([path]) => path)
  .filter((path, index, paths) => paths.indexOf(path) !== index);

if (duplicatePaths.length) {
  throw new Error(`Duplicate content update paths: ${duplicatePaths.join(', ')}`);
}

export const contentUpdatedAt = Object.fromEntries(entries) as Record<string, string>;
export const sitemapExcludedPaths = new Set<string>();

export const getContentUpdatedAt = (path: string) => {
  const updatedAt = contentUpdatedAt[path];
  if (!updatedAt) throw new Error(`Missing significant content update date for ${path}`);
  return updatedAt;
};

export const getContentLastModified = (path: string) =>
  new Date(`${getContentUpdatedAt(path)}T00:00:00.000Z`);

export const validateContentUpdateCoverage = (paths: string[]) => {
  const expected = new Set([...paths, ...sitemapExcludedPaths]);
  const missing = paths.filter((path) => !contentUpdatedAt[path]);
  const unknown = Object.keys(contentUpdatedAt).filter((path) => !expected.has(path));
  if (missing.length || unknown.length) {
    throw new Error([
      missing.length ? `Missing update dates: ${missing.join(', ')}` : '',
      unknown.length ? `Unknown update paths: ${unknown.join(', ')}` : '',
    ].filter(Boolean).join('\n'));
  }
};
