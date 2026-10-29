import { getFontStyleGenerators, getVisualArtGenerators } from './generator-registry';
import { libraryPages } from './text-library/catalog';
import { toolCategories, type ToolCategoryId } from './tool-navigation';

export type ToolDirectoryEntry = { title: string; href: string; description: string; output: string; searchText: string };
export type ToolDirectoryGroup = { id: ToolCategoryId; title: string; href: string; description: string; entries: ToolDirectoryEntry[] };

const fontEntries = (visual: boolean): ToolDirectoryEntry[] => (visual ? getVisualArtGenerators() : getFontStyleGenerators()).map((tool) => ({
  title: tool.title, href: tool.canonicalPath, description: tool.intent.primary,
  output: visual ? tool.intent.expectedOutputs.includes('text') ? 'Text & artwork' : 'Images & artwork' : 'Copyable text',
  searchText: `${tool.title} ${tool.slug} ${tool.tags.join(' ')} ${tool.intent.primary} ${tool.intent.secondary.join(' ')}`.toLowerCase(),
}));
const libraryEntries = (ids: string[]): ToolDirectoryEntry[] => libraryPages.filter((page) => ids.includes(page.id)).map((page) => ({
  title: page.title, href: page.path, description: page.description,
  output: page.id === 'signature-generator' ? 'Transparent PNG' : 'Text & characters',
  searchText: `${page.title} ${page.path} ${page.description}`.toLowerCase(),
}));
const entriesByCategory: Record<ToolCategoryId, ToolDirectoryEntry[]> = {
  'font-styles': fontEntries(false),
  'visual-art': [...fontEntries(true), ...libraryEntries(['signature-generator'])],
  symbols: libraryEntries(['symbols', 'hearts', 'stars', 'arrows', 'kaomoji', 'emoji-combos']),
  'unicode-tools': libraryEntries(['unicode-tools', 'unicode-character-inspector', 'invisible-character-remover', 'fancy-text-to-normal-text', 'invisible-character']),
};
// Server-side catalog only. Never import this module at runtime from the shared header.
export const toolDirectoryGroups: ToolDirectoryGroup[] = toolCategories.map((category) => ({
  id: category.id, title: category.title, href: category.href, description: category.description,
  entries: entriesByCategory[category.id].sort((a, b) => a.title.localeCompare(b.title, 'en')),
}));
