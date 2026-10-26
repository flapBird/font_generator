const updateGroups = {
  '2026-10-27': [
    '/twitter-font-generator',
    '/twitch-font-generator',
    '/roblox-font-generator',
    '/adopt-me-font-generator',
    '/discord-font-generator',
    '/zalgo-text-generator',
  ],
  '2026-10-26': [
    '/underline-text-generator',
    '/small-caps-generator',
    '/double-struck-font-generator',
    '/vaporwave-font-generator',
    '/handwriting-font-generator',
    '/visual-art',
    '/fandom',
    '/small-text-generator',
    '/cursive-font-generator',
    '/y2k-font-generator',
    '/serif-font-generator',
    '/linkedin-font-generator',
    '/minecraft-font-generator',
    '/aesthetic-font-generator',
    '/strikethrough-text-generator',
    '/glitch-font-generator',
    '/facebook-font-generator',
    '/guides/discord-font-guide',
    '/',
    '/styles',
    '/bold-text-generator',
  ],
  '2026-10-23': [
    '/impact-font-generator',
  ],
  '2026-08-27': [
    '/times-new-roman-font-generator',
    '/papyrus-font-generator',
    '/comic-sans-font-generator',
    '/minecraftia-font-generator',
    '/guides/reddit-fancy-text-guide',
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
    '/fire-font-generator',
    '/whisper-font-generator',
    '/christmas-font-generator',
    '/cursive-tattoo-font-generator',
    '/bubble-font-generator',
    '/glitter-font-generator',
    '/heart-font-generator',
    '/big-font-generator',
    '/ransom-note-font-generator',
    '/san-francisco-font-generator',
    '/metallica-font-generator',
    '/tiktok-font-generator',
    '/chicano-font-generator',
    '/fraktur-font-generator',
    '/instagram-font-generator',
    '/tattoo-font-generator',
    '/name-font-generator',
    '/creepy-scary-font-generator',
    '/goth-font-generator',
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
  '2026-08-01': ['/contact', '/privacy', '/terms'],
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
