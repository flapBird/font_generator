import { generatorRegistry, isFontStyleGenerator } from '../generator-registry';
import { getLibraryPage, type LibraryId } from './catalog';
import type { GeneratorSearchItem } from '@/components/GeneratorTool';

export function utilityNavigation(id: LibraryId): GeneratorSearchItem[] {
  const current = getLibraryPage(id);
  return [
    ...generatorRegistry.filter((generator) => generator.kind !== 'directory').map((generator) => ({
      id: generator.id, title: generator.title, href: generator.canonicalPath, icon: generator.icon,
      kind: generator.kind, description: generator.intent.primary,
      collection: isFontStyleGenerator(generator) ? 'font-style' as const : 'visual-art' as const,
      searchText: `${generator.slug} ${generator.tags.join(' ')} ${generator.intent.primary} ${generator.intent.secondary.join(' ')}`,
    })),
    { id: current.id, title: current.title, href: current.path, icon: current.icon, kind: 'unicode-utility', description: current.description, collection: 'font-style', searchText: current.title },
  ];
}
