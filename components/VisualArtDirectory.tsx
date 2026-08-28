'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

export type VisualArtGroup = 'artwork' | 'font-preview' | 'ascii' | 'gaming' | 'fandom';

export interface VisualArtDirectoryItem {
  id: string;
  title: string;
  href: string;
  icon: string;
  description: string;
  group: VisualArtGroup;
  outputs: string[];
  searchText: string;
}

const groupLabels: Record<VisualArtGroup, string> = {
  artwork: 'Text Artwork',
  'font-preview': 'Font Preview',
  ascii: 'ASCII Art',
  gaming: 'Gaming',
  fandom: 'Fandom & Themes',
};

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export default function VisualArtDirectory({ items }: { items: VisualArtDirectoryItem[] }) {
  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState<'all' | VisualArtGroup>('all');
  const normalizedQuery = normalize(query);

  const counts = useMemo(() => Object.fromEntries(
    (Object.keys(groupLabels) as VisualArtGroup[]).map((group) => [group, items.filter((item) => item.group === group).length]),
  ) as Record<VisualArtGroup, number>, [items]);

  const visibleItems = useMemo(() => {
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    return items.filter((item) => {
      if (activeGroup !== 'all' && item.group !== activeGroup) return false;
      if (!tokens.length) return true;
      const haystack = normalize(`${item.title} ${item.description} ${item.searchText}`);
      return tokens.every((token) => haystack.includes(token));
    });
  }, [activeGroup, items, normalizedQuery]);

  return (
    <>
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.55)] sm:p-5 dark:border-slate-800 dark:bg-slate-950" aria-label="Find a visual or art generator">
        <div className="relative">
          <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search artwork, ASCII, gaming, Disney…"
            aria-label="Search visual and art generators"
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-12 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-lg text-slate-400 hover:bg-slate-200 sm:right-2 sm:h-9 sm:w-9 dark:hover:bg-slate-800">×</button>
          )}
        </div>

        <div className="mobile-chip-scroll mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Filter visual and art generators">
          <button type="button" onClick={() => setActiveGroup('all')} aria-pressed={activeGroup === 'all'} className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition sm:min-h-0 ${activeGroup === 'all' ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}>All {items.length}</button>
          {(Object.keys(groupLabels) as VisualArtGroup[]).filter((group) => counts[group] > 0).map((group) => (
            <button key={group} type="button" onClick={() => setActiveGroup(group)} aria-pressed={activeGroup === group} className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition sm:min-h-0 ${activeGroup === group ? 'bg-violet-600 text-white' : 'border border-slate-300 text-slate-600 hover:border-violet-400 hover:text-violet-700 dark:border-slate-700 dark:text-slate-300'}`}>
              {groupLabels[group]} {counts[group]}
            </button>
          ))}
        </div>
      </section>

      <p className="my-5 text-sm font-semibold text-slate-500 dark:text-slate-400" aria-live="polite">{visibleItems.length} generators</p>
      {visibleItems.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => (
            <Link key={item.id} href={item.href} className="group flex min-h-64 flex-col rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-[0_24px_60px_-42px_rgba(109,40,217,0.55)] dark:border-slate-800 dark:bg-slate-950 dark:hover:border-violet-700">
              <span className="flex items-start justify-between gap-3">
                <span className="text-3xl" aria-hidden="true">{item.icon}</span>
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">{groupLabels[item.group]}</span>
              </span>
              <h2 className="mt-5 text-lg font-black text-slate-950 transition group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.description}</p>
              <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.outputs.join(' · ')}</span>
                <span className="text-sm font-bold text-violet-700 dark:text-violet-300">Open →</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="font-bold text-slate-950 dark:text-white">No generators match this search.</p>
          <button type="button" onClick={() => { setQuery(''); setActiveGroup('all'); }} className="mt-4 text-sm font-bold text-violet-700 dark:text-violet-300">Show all generators</button>
        </div>
      )}
    </>
  );
}
