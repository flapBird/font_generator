import { LibraryPageShell } from './text-library/LibraryPage';
import { type ScriptToolId } from '@/lib/text-library/catalog';
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

export default function ScriptToolPage({ id, children }: { id: ScriptToolId; children: ReactNode }) {
  const category = { title: 'Unicode Tools', path: '/unicode-tools' };
  return <LibraryPageShell id={id} workspace centeredHeading resources={resources[id]} category={category}>{children}</LibraryPageShell>;
}
