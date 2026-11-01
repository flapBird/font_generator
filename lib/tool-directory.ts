import { getFontStyleGenerators, getVisualArtGenerators } from './generator-registry';
import { libraryPages } from './text-library/catalog';
import { toolCategories, type ToolCategoryId } from './tool-navigation';

export type ToolDirectoryEntry = { title: string; href: string; description: string; output: string; searchText: string };
export type ToolDirectoryGroup = { id: ToolCategoryId; title: string; href: string; description: string; entries: ToolDirectoryEntry[] };

// Search synonyms reuse canonical tools rather than creating duplicate landing pages.
const keywordAliases: Record<string, string> = {
  'cursive-font-generator': 'cursive text generator',
  'keyboard-font-generator': 'font keyboard online copy paste',
  'small-caps-generator': 'small caps text generator',
  'instagram-font-generator': 'instagram bio font generator',
  'name-font-generator': 'nickname font generator',
  'preppy-font-generator': 'preppy fonts copy and paste',
};
const fontEntries = (visual: boolean): ToolDirectoryEntry[] => (visual ? getVisualArtGenerators() : getFontStyleGenerators()).map((tool) => ({
  title: tool.title, href: tool.canonicalPath, description: tool.intent.primary,
  output: visual ? tool.intent.expectedOutputs.includes('text') ? 'Text & artwork' : 'Images & artwork' : 'Copyable text',
  searchText: `${tool.title} ${tool.slug} ${keywordAliases[tool.slug] ?? ''} ${tool.tags.join(' ')} ${tool.intent.primary} ${tool.intent.secondary.join(' ')}`.toLowerCase(),
}));
const libraryEntries = (ids: string[]): ToolDirectoryEntry[] => libraryPages.filter((page) => ids.includes(page.id)).map((page) => ({
  title: page.title, href: page.path, description: page.description,
  output: page.id === 'signature-generator' ? 'Transparent PNG' : 'Text & characters',
  searchText: `${page.title} ${page.path} ${page.description}`.toLowerCase(),
}));
const entriesByCategory: Record<ToolCategoryId, ToolDirectoryEntry[]> = {
  'font-tools': [{ title: 'Font Identifier', href: '/font-identifier', description: 'Find close Google Fonts matches from an image locally in your browser.', output: 'Font candidates', searchText: 'font identifier font finder font detector image screenshot local google fonts' }],
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
