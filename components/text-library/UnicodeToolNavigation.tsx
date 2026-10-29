import { getLibraryPage, type LibraryId } from '@/lib/text-library/catalog';
import LibraryLink from './LibraryLink';

const tools = [
  ['unicode-tools', 'All tools'],
  ['unicode-character-inspector', 'Character inspector'],
  ['invisible-character-remover', 'Invisible remover'],
  ['fancy-text-to-normal-text', 'Fancy to normal'],
  ['invisible-character', 'Invisible character'],
] as const;

export default function UnicodeToolNavigation({ current }: { current: LibraryId }) {
  return <nav aria-label="Unicode tool navigation" className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
    {tools.map(([id, label]) => <LibraryLink key={id} href={getLibraryPage(id).path} tool={current} targetId={id} current={current === id}
      className={`inline-flex min-h-12 shrink-0 items-center border-b-2 px-4 text-sm transition-colors ${current === id ? 'border-violet-600 font-semibold text-violet-700' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-950'}`}>{label}</LibraryLink>)}
  </nav>;
}
