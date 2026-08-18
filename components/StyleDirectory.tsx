'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

export type StyleDirectoryKind = 'unicode' | 'artwork' | 'ascii';

export interface StyleDirectoryCard {
  slug: string;
  title: string;
  icon: string;
  description: string;
  badge: string;
  metaLabel: string;
  previewText: string;
  kind: StyleDirectoryKind;
  searchText: string;
}

interface StyleDirectoryProps {
  cards: StyleDirectoryCard[];
}

type ActiveFilter = 'all' | StyleDirectoryKind;

const filters: { id: ActiveFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unicode', label: 'Copy & Paste' },
  { id: 'artwork', label: 'Rendered Artwork' },
  { id: 'ascii', label: 'ASCII Art' },
];

const normalizeSearchText = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export default function StyleDirectory({ cards }: StyleDirectoryProps) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const normalizedQuery = normalizeSearchText(query);

  const filterCounts = useMemo(
    () => ({
      all: cards.length,
      unicode: cards.filter((card) => card.kind === 'unicode').length,
      artwork: cards.filter((card) => card.kind === 'artwork').length,
      ascii: cards.filter((card) => card.kind === 'ascii').length,
    }),
    [cards],
  );

  const visibleCards = useMemo(() => {
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

    return cards.filter((card) => {
      if (activeFilter !== 'all' && card.kind !== activeFilter) return false;
      if (!tokens.length) return true;

      const haystack = normalizeSearchText(card.searchText);
      return tokens.every((token) => haystack.includes(token));
    });
  }, [activeFilter, cards, normalizedQuery]);

  const clearDirectoryFilters = () => {
    setQuery('');
    setActiveFilter('all');
  };

  return (
    <>
      <section aria-labelledby="style-directory-heading" className="mb-7 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.5)] sm:p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="style-directory-heading" className="text-lg font-black text-slate-950 dark:text-white">Find a generator</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Search by style, platform, theme, or output type.</p>
          </div>
          <p id="style-search-results-count" className="text-sm font-semibold text-slate-600 dark:text-slate-300" aria-live="polite">
            {visibleCards.length} of {cards.length} generators
          </p>
        </div>

        <div className="relative mt-4">
          <label htmlFor="style-directory-search" className="sr-only">Search text style generators</label>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400">
            <circle cx="11" cy="11" r="7" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            id="style-directory-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search cursive, pixel, gothic, Instagram…"
            aria-describedby="style-search-results-count"
            autoComplete="off"
            className="w-full appearance-none rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-12 pr-12 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear generator search"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              ×
            </button>
          )}
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter generators by output type">
          {filters.map((filter) => {
            const selected = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                aria-pressed={selected}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selected
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                    : 'border border-slate-300 bg-white text-slate-600 hover:border-violet-400 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-violet-300'
                }`}
              >
                {filter.label} <span className={selected ? 'text-white/70 dark:text-slate-600' : 'text-slate-400'}>{filterCounts[filter.id]}</span>
              </button>
            );
          })}
        </div>
      </section>

      {visibleCards.length ? (
        <div id="style-directory-results" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCards.map((card) => (
            <Link
              key={card.slug}
              href={`/styles/${card.slug}`}
              className="group flex min-h-56 flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.5)] transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-[0_24px_60px_-40px_rgba(109,40,217,0.45)] dark:border-slate-800 dark:bg-slate-950 dark:hover:border-violet-700"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-2xl" aria-hidden="true">{card.icon}</span>
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                  {card.badge}
                </span>
              </div>
              <h2 className="mt-4 text-lg font-black text-slate-950 transition group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">
                {card.title}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{card.description}</p>
              <div className="mt-auto pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{card.metaLabel}</p>
                <p className="mt-1 break-words text-lg text-slate-900 dark:text-slate-100">{card.previewText}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900/60">
          <p className="text-lg font-bold text-slate-950 dark:text-white">No generators match those filters.</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Try a broader term or return to the complete directory.</p>
          <button type="button" onClick={clearDirectoryFilters} className="mt-5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-500">
            Clear search and filters
          </button>
        </div>
      )}
    </>
  );
}
