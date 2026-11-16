import type { GeneratorSearchItem } from '../components/GeneratorTool';
import { generatorRegistry, isFontStyleGenerator } from './generator-registry';

export const generatorWorkspaceItems: GeneratorSearchItem[] = generatorRegistry
  .filter((generator) => generator.kind !== 'directory')
  .map((generator) => ({
    id: generator.id,
    title: generator.title,
    href: generator.canonicalPath,
    icon: generator.icon,
    kind: generator.kind,
    description: generator.intent.primary,
    collection: isFontStyleGenerator(generator) ? 'font-style' : 'visual-art',
    searchText: `${generator.slug} ${generator.tags.join(' ')} ${generator.intent.primary} ${generator.intent.secondary.join(' ')}`,
  }));
