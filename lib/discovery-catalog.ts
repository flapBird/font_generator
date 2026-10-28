// Metadata only. New workspaces and font assets are loaded only on these pages.
export const discoveryTextSlugs = ['old-english-font-generator', 'whatsapp-font-generator', 'square-text-generator', 'snapchat-font-generator', 'sad-font-generator', 'reddit-font-generator', 'keyboard-font-generator'] as const;
export const discoveryArtSlugs = ['neon-font-generator', 'cyberpunk-font-generator', 'anime-font-generator'] as const;
export const discoverySlugs = [...discoveryTextSlugs, ...discoveryArtSlugs];
export const isDiscoveryText = (slug: string) => discoveryTextSlugs.some((item) => item === slug);
export const isDiscoveryArt = (slug: string) => discoveryArtSlugs.some((item) => item === slug);

// Add links below existing related cards; never replace or reorder old entries.
export const discoveryRelatedLinks: Record<string, string[]> = {
  'fraktur-font-generator': ['old-english-font-generator'],
  'goth-font-generator': ['old-english-font-generator', 'sad-font-generator'],
  'bubble-font-generator': ['square-text-generator'],
  'instagram-font-generator': ['snapchat-font-generator', 'whatsapp-font-generator'],
  'discord-font-generator': ['whatsapp-font-generator', 'reddit-font-generator'],
  'fire-font-generator': ['neon-font-generator'],
  'y2k-font-generator': ['neon-font-generator', 'cyberpunk-font-generator'],
  'glitch-font-generator': ['cyberpunk-font-generator'],
  'gaming-font-generator': ['anime-font-generator', 'cyberpunk-font-generator', 'square-text-generator'],
};

export const discoverySamples: Record<string, string> = {
  'old-english-font-generator': 'Your Royal Name',
  'whatsapp-font-generator': 'Hello, friends!',
  'square-text-generator': 'HELLO WORLD',
  'snapchat-font-generator': 'Sunny Days',
  'sad-font-generator': 'Missing you',
  'reddit-font-generator': 'Weekly discussion',
  'keyboard-font-generator': 'Make it yours',
  'neon-font-generator': 'Stay Electric',
  'cyberpunk-font-generator': 'NIGHT SIGNAL',
  'anime-font-generator': 'Dream Squad',
};

export const discoveryStyleIds: Record<string, string[]> = {
  'old-english-font-generator': ['fraktur', 'boldFraktur'],
  'whatsapp-font-generator': ['sansBold', 'italic', 'script', 'monospace', 'smallCaps', 'circled'],
  'square-text-generator': ['squared'],
  'snapchat-font-generator': ['sansBold', 'smallCaps', 'script', 'circled', 'boldScript', 'fraktur'],
  'sad-font-generator': ['italic', 'script', 'smallCaps', 'fraktur', 'boldFraktur'],
  'reddit-font-generator': ['sansBold', 'italic', 'monospace', 'smallCaps', 'fraktur'],
  'keyboard-font-generator': ['sansBold', 'italic', 'script', 'boldScript', 'smallCaps', 'circled', 'monospace', 'doubleStruck'],
  'cyberpunk-font-generator': ['monospace', 'fullwidth', 'sansBold'],
  'anime-font-generator': ['sansBold', 'script', 'circled', 'smallCaps'],
};
