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
  return <div className="space-y-6" data-testid="symbol-browser">
    <CombinationEditor parts={parts} separator={separator} setParts={updateParts} tool={tool} message={message} expanded={expanded} setExpanded={setExpanded}
      setSeparator={(next) => {
        if (combineParts(parts.map((part) => part.text), next).length > COMBINATION_LIMIT) {
          setMessage('That separator would exceed 1,000 UTF-16 units. Your combination was kept unchanged.'); return;
        }
        setMessage(''); setSeparator(next);
      }} />
    {parts.length > 0 && <div className="sticky top-16 z-20 flex items-center justify-between gap-3 rounded-xl border border-violet-200 bg-white/95 px-4 py-1 shadow-sm backdrop-blur">
      <span className="text-sm font-medium text-violet-900">{parts.length} {parts.length === 1 ? 'piece' : 'pieces'} in your combination</span>
      <a href="#combination-editor" onClick={() => setExpanded(true)} className="inline-flex min-h-11 items-center text-sm font-semibold text-violet-700">Edit &amp; copy ↑</a>
    </div>}
    <section aria-labelledby="library-browse-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 id="library-browse-heading" className="text-2xl font-bold tracking-tight">Find your {tool === 'kaomoji' ? 'expression' : tool === 'emoji-combos' ? 'combination' : 'symbol'}</h2>
          <p className="mt-1 text-sm text-slate-500">Tap a card to copy. Use + to add it to your combination.</p></div>
        <p role="status" className="text-sm text-slate-600">{results.length} of {items.length} items</p>
      </div>
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_120px] gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div><label htmlFor="library-search" className="mb-2 block text-sm font-medium">Search this collection</label>
          <input id="library-search" type="search" maxLength={100} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, character or U+ code point" className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 focus:outline-none focus:ring-2 focus:ring-violet-500" /></div>
        <div><label htmlFor="library-category" className="mb-2 block text-sm font-medium">Category</label>
          <select id="library-category" value={category} onChange={(event) => { setCategory(event.target.value); trackTextToolEvent('tool_filter', tool); }} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3">
            <option value="All">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}
          </select></div>
      </div>
      <div className="my-4 flex flex-wrap items-center gap-2" aria-label="Saved item filters">
        {[['all', 'All items'], ['favorites', 'Favorites'], ['recent', 'Recently copied']].map(([value, label]) => <button key={value} type="button" aria-label={label} aria-pressed={view === value} onClick={() => { setView(value); trackTextToolEvent('tool_filter', tool); }}
          className={`min-h-11 rounded-full border px-3 text-sm ${view === value ? 'border-violet-600 bg-violet-50 font-medium text-violet-800' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300'}`}>{value === 'recent' ? 'Recent' : label}</button>)}
        {(saved.favorites.length > 0 || saved.recent.length > 0) && <button type="button" onClick={clear} className="min-h-11 px-2 text-xs text-slate-500 underline">Clear saved items</button>}
      </div>
      {view !== 'all' && <p className="mb-4 text-sm text-slate-500">Showing saved items in this collection. Stored in this browser; clearing removes saved items from all collections.</p>}
      {!results.length && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
        <h3 className="font-semibold">No matching items</h3><p className="mt-2 text-sm text-slate-600">Try another name or category. Save a favorite with the heart button on a card.</p>
        <button type="button" onClick={() => { setQuery(''); setCategory('All'); setView('all'); }} className="mt-4 min-h-11 rounded-xl bg-violet-700 px-4 text-sm font-medium text-white">Show all items</button>
      </div>}
      <div className={`grid gap-3 ${isCollection ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`}>
        {results.map((item) => <article key={item.id} data-library-item={item.id} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition hover:border-violet-300">
          <CopyButton text={item.text} label={`Copy ${item.name}`} tool={tool} itemId={item.id} onCopied={() => remember(item.id)} className="h-full p-3 hover:bg-violet-50/50">
            <span dir="auto" className={`flex min-h-16 items-center justify-center whitespace-pre-wrap break-words text-center leading-relaxed ${isCollection ? 'text-2xl' : 'text-4xl'}`} style={{ overflowWrap: 'anywhere' }}>{item.text}</span>
            <span className="mt-2 block text-center text-xs font-medium leading-5 text-slate-600">{item.name}</span>
            {!isCollection && <span className="mt-1 block break-words text-center font-mono text-[10px] leading-4 text-slate-400">{codePoints(item.text)}</span>}
          </CopyButton>
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-1">
            <button type="button" onClick={() => add(item)} aria-label={`Add ${item.name} to combination`} className="min-h-11 rounded-lg px-3 text-sm font-medium text-violet-700 hover:bg-violet-50">+ Add</button>
            <button type="button" aria-label={`Favorite ${item.name}`} aria-pressed={saved.favorites.includes(item.id)} onClick={() => { toggleFavorite(item.id); trackTextToolEvent('tool_favorite', tool, item.id); }}
              className="min-h-11 min-w-11 rounded-lg text-xl text-violet-700 hover:bg-violet-50">{saved.favorites.includes(item.id) ? '♥' : '♡'}</button>
          </div>
        </article>)}
      </div>
    </section>
  </div>;
}
