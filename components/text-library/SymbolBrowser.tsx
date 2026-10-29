'use client';

import { useRef, useState } from 'react';
import type { LibraryId, LibraryItem } from '@/lib/text-library/catalog';
import { codePoints, COMBINATION_LIMIT, combineParts, filterLibraryItems } from '@/lib/text-library/text';
import { trackTextToolEvent } from '@/lib/analytics/text-tools';
import CopyButton from './CopyButton';
import CombinationEditor, { type CombinationPart } from './CombinationEditor';
import { useSavedLibrary } from './use-saved-library';

export default function SymbolBrowser({ items, tool }: { items: LibraryItem[]; tool: LibraryId }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [view, setView] = useState('all');
  const [parts, setParts] = useState<CombinationPart[]>([]);
  const [separator, setSeparator] = useState(' ');
  const [message, setMessage] = useState('');
  const [expanded, setExpanded] = useState(false);
  const nextKey = useRef(0);
  const { saved, toggleFavorite, remember, clear } = useSavedLibrary();
  const categories = [...new Set(items.map((item) => item.category))];
  const visibleItems = view === 'favorites' ? items.filter((item) => saved.favorites.includes(item.id))
    : view === 'recent' ? saved.recent.flatMap((id) => items.find((item) => item.id === id) ?? []) : items;
  const results = filterLibraryItems(visibleItems, query, category);
  const isCollection = tool === 'kaomoji' || tool === 'emoji-combos';
  function updateParts(next: CombinationPart[]) {
    if (combineParts(next.map((part) => part.text), separator).length > COMBINATION_LIMIT || next.length > 40) {
      setMessage('Keep your combination within 1,000 UTF-16 units and 40 pieces. Nothing was added or removed.'); return;
    }
    setMessage(''); setParts(next);
  }
  function add(item: LibraryItem) {
    const next = [...parts, { key: nextKey.current++, text: item.text, name: item.name }];
    updateParts(next);
    setExpanded(true);
    if (next.length <= 40 && combineParts(next.map((part) => part.text), separator).length <= COMBINATION_LIMIT) trackTextToolEvent('tool_combine', tool, item.id);
  }
  return <div className={expanded ? 'pb-72' : ''} data-testid="symbol-browser">
    <section aria-label="Browse symbols">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="min-w-40 flex-1"><label htmlFor="library-search" className="sr-only">Search this collection</label>
          <input id="library-search" type="search" maxLength={100} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search symbols or U+ code…" className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></div>
        <div><label htmlFor="library-category" className="sr-only">Category</label>
          <select id="library-category" value={category} onChange={(event) => { setCategory(event.target.value); trackTextToolEvent('tool_filter', tool); }} className="h-11 max-w-44 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
            <option value="All">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}
          </select></div>
        <button id="open-combination" type="button" aria-expanded={expanded} aria-controls="combination-editor" onClick={() => setExpanded(!expanded)} className="min-h-11 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-violet-700">Combine symbols{parts.length > 0 ? ` (${parts.length})` : ''}</button>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-1" aria-label="Saved item filters">
          {[['all', 'All items'], ['favorites', 'Favorites'], ['recent', 'Recently copied']].map(([value, label]) => <button key={value} type="button" aria-label={label} aria-pressed={view === value} onClick={() => { setView(value); trackTextToolEvent('tool_filter', tool); }}
            className={`min-h-11 rounded-md px-3 text-sm ${view === value ? 'bg-violet-50 font-medium text-violet-700' : 'text-slate-500 hover:bg-slate-50'}`}>{value === 'recent' ? 'Recent' : label}</button>)}
        </div>
        <div className="flex items-center gap-3">{(saved.favorites.length > 0 || saved.recent.length > 0) && <button type="button" onClick={clear} className="min-h-11 text-xs text-slate-500 underline underline-offset-4">Clear saved items</button>}
          <p role="status" className="text-xs text-slate-500">{results.length} {isCollection ? 'combinations' : 'symbols'}</p></div>
      </div>
      {view !== 'all' && <p className="mb-4 text-xs text-slate-500">Saved in this browser. Clearing removes saved items from all collections.</p>}
      {!results.length && <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
        <h3 className="font-semibold">No matching items</h3><p className="mt-2 text-sm text-slate-500">Try another name or category, or save a favorite using the heart button.</p>
        <button type="button" onClick={() => { setQuery(''); setCategory('All'); setView('all'); }} className="mt-4 min-h-11 rounded-lg bg-violet-700 px-4 text-sm font-medium text-white">Show all items</button>
      </div>}
      <div className={`grid gap-2 sm:gap-3 ${isCollection ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 min-[380px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
        {results.map((item) => <article key={item.id} data-library-item={item.id} className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-violet-300 hover:bg-violet-50/30">
          <CopyButton text={item.text} label={`Copy ${item.name}`} tool={tool} itemId={item.id} onCopied={() => remember(item.id)} feedback="badge" className="rounded-none px-2 pb-2 pt-4 hover:bg-violet-50/40 focus-visible:ring-inset">
            <span dir="auto" className={`flex min-h-16 items-center justify-center whitespace-pre-wrap break-words text-center ${isCollection ? 'text-2xl leading-relaxed' : 'text-[42px] leading-none'}`} style={{ overflowWrap: 'anywhere' }}>{item.text}</span>
            <span className="mt-2 flex min-h-8 items-center justify-center text-center text-[11px] leading-4 text-slate-600">{item.name}</span>
            {!isCollection && <span className="mt-1 block truncate text-center font-mono text-[10px] text-slate-400" title={codePoints(item.text)}>{codePoints(item.text)}</span>}
          </CopyButton>
          <div className="mt-auto flex items-center justify-between px-2">
            <button type="button" onClick={() => add(item)} aria-label={`Add ${item.name} to combination`} title="Add to a combined text" className="min-h-11 rounded-md px-2 text-xs text-slate-500 hover:text-violet-700">+ Add</button>
            <button type="button" aria-label={`Favorite ${item.name}`} aria-pressed={saved.favorites.includes(item.id)} onClick={() => { toggleFavorite(item.id); trackTextToolEvent('tool_favorite', tool, item.id); }}
              className={`min-h-11 min-w-11 rounded-md text-lg hover:text-violet-700 ${saved.favorites.includes(item.id) ? 'text-violet-700' : 'text-slate-400'}`}>{saved.favorites.includes(item.id) ? '♥' : '♡'}</button>
          </div>
        </article>)}
      </div>
    </section>
    <CombinationEditor parts={parts} separator={separator} setParts={updateParts} tool={tool} message={message} expanded={expanded} setExpanded={setExpanded}
      setSeparator={(next) => {
        if (combineParts(parts.map((part) => part.text), next).length > COMBINATION_LIMIT) {
          setMessage('That separator would exceed 1,000 UTF-16 units. Your combination was kept unchanged.'); return;
        }
        setMessage(''); setSeparator(next);
      }} />
  </div>;
}
