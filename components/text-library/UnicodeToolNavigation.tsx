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
  const currentLabel = tools.find(([id]) => id === current)?.[1] ?? 'All tools';
  return <nav aria-label="Unicode tool navigation" className="mb-6">
    <details key={current} className="rounded-xl border border-slate-200 bg-white sm:hidden">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
        <span>{currentLabel}</span><span className="shrink-0 text-xs text-violet-700">Change tool</span>
      </summary>
      <div className="border-t border-slate-200 p-2">{tools.map(([id, label]) => <LibraryLink key={id} href={getLibraryPage(id).path} tool={current} targetId={id} current={current === id} className={`flex min-h-11 items-center rounded-lg px-3 text-sm ${current === id ? 'bg-violet-50 font-semibold text-violet-700' : 'text-slate-600 hover:bg-slate-50'}`}>{label}</LibraryLink>)}</div>
    </details>
    <div className="hidden gap-1 overflow-x-auto border-b border-slate-200 sm:flex">{tools.map(([id, label]) => <LibraryLink key={id} href={getLibraryPage(id).path} tool={current} targetId={id} current={current === id}
      className={`inline-flex min-h-12 shrink-0 items-center border-b-2 px-4 text-sm transition-colors ${current === id ? 'border-violet-600 font-semibold text-violet-700' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-950'}`}>{label}</LibraryLink>)}</div>
  </nav>;
}
