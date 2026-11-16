import { LibraryPageShell } from './text-library/LibraryPage';
import { getLibraryPage, type ScriptToolId } from '@/lib/text-library/catalog';
import { generatorWorkspaceItems } from '@/lib/generator-workspace-navigation';
import type { GeneratorSearchItem } from './GeneratorTool';
import type { GeneratorPageConfig } from '@/lib/generator';
import type { ReactNode } from 'react';

const resources = {
  'cuneiform-translator': [
    { href: '/guides/what-is-cuneiform', title: 'What Is Cuneiform?' },
    { href: 'https://oracc.museum.upenn.edu/osl/signlist/', title: 'Oracc Sign List' },
    { href: '/fonts/cuneiform/OFL.txt', title: 'Noto Sans Cuneiform license' },
  ],
  'enchanting-table-translator': [
    { href: '/guides/minecraft-enchanting-table', title: 'Minecraft Enchanting Table Guide' },
    { href: 'https://github.com/standardgalactic/fonts', title: 'Sga typeface source' },
    { href: '/fonts/galactic/CC0.txt', title: 'Sga license' },
    { href: '/fonts/galactic/Noto-Sans-Vai-OFL.txt', title: 'Noto Sans Vai license' },
  ],
  'enderman-translator': [
    { href: 'https://www.minecraft.net/en-us/article/enderman', title: 'Minecraft’s Enderman profile' },
    { href: 'https://lingojam.com/AlienLanguage', title: 'Alien Language alphabet source' },
  ],
  'standard-galactic-alphabet': [
    { href: '/guides/minecraft-enchanting-table', title: 'Minecraft Enchanting Table Guide' },
    { href: 'https://cc314.shikadi.net/oldcc314/sga.htm', title: 'Tom Hall on designing the alphabet' },
    { href: 'https://github.com/standardgalactic/fonts', title: 'Sga typeface source' },
  ],
};

export function scriptWorkspace(id: Exclude<ScriptToolId, 'standard-galactic-alphabet'>) {
  const { path, title, description, icon } = getLibraryPage(id);
  const current: GeneratorSearchItem = { id, title, href: path, icon, kind: 'unicode', collection: 'font-style', description, searchText: title };
  const config: GeneratorPageConfig = {
    styleIds: [], initialText: '', intentLabel: title, resultIntro: description, bestFor: [], compatibilityNote: '',
  };
  return { pageTitle: title, config, navigationItems: [...generatorWorkspaceItems, current] };
}

export default function ScriptToolPage({ id, children }: { id: ScriptToolId; children: ReactNode }) {
  const category = id === 'cuneiform-translator' ? { title: 'Unicode Tools', path: '/unicode-tools' } : { title: 'Fandom', path: '/fandom' };
  return <LibraryPageShell id={id} workspace resources={resources[id]} category={category}>{children}</LibraryPageShell>;
}
