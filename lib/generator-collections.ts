import type { GeneratorKind } from './generator-registry';
import { generatorRegistry, getGeneratorsByCategory } from './generator-registry';

export interface GeneratorCollection {
  id: string;
  title: string;
  description: string;
  generatorIds: string[];
  display: 'grid' | 'featured' | 'compact' | 'carousel';
  priority: number;
}

const idsForKinds = (kinds: GeneratorKind[]) => generatorRegistry
  .filter((generator) => kinds.includes(generator.kind))
  .map((generator) => generator.id);

export const generatorCollections: GeneratorCollection[] = [
  {
    id: 'styles',
    title: 'Text Style Generators',
    description: 'Copyable Unicode, ASCII banners, real-font previews, memes, and rendered artwork.',
    generatorIds: getGeneratorsByCategory('styles').map((generator) => generator.id),
    display: 'grid',
    priority: 10,
  },
  {
    id: 'fandom',
    title: 'Fandom Generators',
    description: 'Unofficial themed artwork and game-text tools.',
    generatorIds: getGeneratorsByCategory('fandom').map((generator) => generator.id),
    display: 'grid',
    priority: 20,
  },
  {
    id: 'copy-paste',
    title: 'Copy & Paste Text',
    description: 'Unicode text that can be copied into supported apps.',
    generatorIds: idsForKinds(['unicode', 'hybrid']),
    display: 'compact',
    priority: 30,
  },
  {
    id: 'artwork',
    title: 'Logo & Image Makers',
    description: 'Rendered titles with page-specific visual effects and downloads.',
    generatorIds: idsForKinds(['font-preview', 'meme', 'theme-logo', 'game-text', 'hybrid']),
    display: 'featured',
    priority: 40,
  },
  {
    id: 'gaming',
    title: 'Gaming Generators',
    description: 'Gaming artwork, player-name styles, and compatible text formats.',
    generatorIds: generatorRegistry
      .filter((generator) => generator.kind === 'game-text' || generator.tags.includes('gaming'))
      .map((generator) => generator.id),
    display: 'carousel',
    priority: 50,
  },
];

const registeredIds = new Set(generatorRegistry.map((generator) => generator.id));
const unknownCollectionIds = generatorCollections.flatMap((collection) => (
  collection.generatorIds
    .filter((id) => !registeredIds.has(id))
    .map((id) => `${collection.id}: ${id}`)
));
if (unknownCollectionIds.length) {
  throw new Error(`Generator collections contain unknown ids:\n${unknownCollectionIds.join('\n')}`);
}

const collectionMap = new Map(generatorCollections.map((collection) => [collection.id, collection]));

export const getGeneratorCollection = (id: string) => collectionMap.get(id);

export const getCollectionGenerators = (id: string) => {
  const collection = collectionMap.get(id);
  if (!collection) return [];
  const ids = new Set(collection.generatorIds);
  return generatorRegistry.filter((generator) => ids.has(generator.id));
};

export interface HomepageEntry {
  id: string;
  icon: string;
  title: string;
  description: string;
  preview: string;
  tone: 'violet' | 'rose' | 'cyan' | 'amber' | 'emerald';
  href?: string;
  linkLabel: string;
}

// These are presentation collections only. Their href values intentionally
// preserve the site's existing public routes.
export const homepageEntries: HomepageEntry[] = [
  { id: 'copy-paste', icon: '✨', title: 'Copy & Paste Text', description: 'Turn plain text into copyable Unicode styles.', preview: 'Hello → 𝐻ℯ𝓁𝓁ℴ', tone: 'violet', linkLabel: 'You are here' },
  { id: 'artwork', icon: '🎨', title: 'Text Artwork', description: 'Design rendered titles and download PNG or SVG.', preview: 'TYPE · COLOR · EXPORT', tone: 'rose', href: '/styles', linkLabel: 'Browse style tools' },
  { id: 'ascii', icon: '🔠', title: 'ASCII Banners', description: 'Build large multi-line art that remains plain text.', preview: '[ F O N T ]\n== TEXT ==', tone: 'cyan', href: '/styles/big-font-generator', linkLabel: 'Make a banner' },
  { id: 'fandom', icon: '⭐', title: 'Fandom Styles', description: 'Create unofficial artwork inspired by visual themes.', preview: 'PIXEL · FANTASY · RETRO', tone: 'amber', href: '/fandom', linkLabel: 'Explore fandom tools' },
  { id: 'guides', icon: '📖', title: 'Guides', description: 'Check Unicode, compatibility, and accessibility.', preview: '✓ Unicode  ✓ Compatibility', tone: 'emerald', href: '/guides', linkLabel: 'Read practical guides' },
];
