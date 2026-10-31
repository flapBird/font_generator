'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from './IntentLink';
import { featuredToolCategories } from '@/lib/tool-navigation';

export type SearchEntry = { title: string; href: string; category: string; searchText: string };
let catalogPromise: Promise<SearchEntry[]> | undefined;
function loadCatalog() {
  return catalogPromise ??= fetch('/tool-search.json').then((response) => {
    if (!response.ok) throw new Error('Search unavailable');
    return response.json() as Promise<SearchEntry[]>;
  }).catch((error) => { catalogPromise = undefined; throw error; });
}

export default function SiteSearch({ id, onOpen }: { id: string; onOpen: () => void }) {
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const search = query.trim().toLowerCase();
  const matches = entries.filter((entry) => search && search.split(/\s+/).every((word) => entry.searchText.includes(word)))
    .sort((a, b) => Number(b.title.toLowerCase().includes(search)) - Number(a.title.toLowerCase().includes(search)));
  const results = matches.slice(0, 7);
  const directoryHref = search ? `/tools#q=${encodeURIComponent(query.trim())}` : '/tools';
  useEffect(() => {
    function outside(event: PointerEvent) { if (!root.current?.contains(event.target as Node)) setOpen(false); }
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  useEffect(() => {
    if (active >= 0) root.current?.querySelector(`[data-search-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);
  async function begin() {
    onOpen(); setOpen(true); setFailed(false);
    try { setEntries(await loadCatalog()); } catch { setFailed(true); }
  }
  return <div ref={root} className="relative min-w-0 w-full" data-clarity-mask="true" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
    <span className="sr-only" aria-live="polite">{active >= 0 ? results[active]?.title : ''}</span>
    <form className="relative" role="search" aria-label="Site tools" onSubmit={(event) => { event.preventDefault(); setOpen(false); input.current?.blur(); router.push(active >= 0 && results[active] ? results[active].href : directoryHref); }}>
      <label htmlFor={id} className="sr-only">Search tools</label>
      <svg aria-hidden="true" className="pointer-events-none absolute left-4 top-3 h-5 w-5 text-violet-500/80 dark:text-violet-300" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" /><path strokeLinecap="round" d="m16 16 4.5 4.5" /></svg>
      <input ref={input} id={id} type="search" autoComplete="off" maxLength={100} value={query} placeholder="Find a font, symbol or tool…" aria-controls={open ? `${id}-results` : undefined} onFocus={begin} onChange={(event) => { setQuery(event.target.value); setActive(-1); setOpen(true); }} onKeyDown={(event) => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); setActive(-1); }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault(); setOpen(true);
          if (results.length) setActive((value) => event.key === 'ArrowDown' ? (value + 1) % results.length : (value <= 0 ? results.length - 1 : value - 1));
        }
      }} className={`h-11 w-full rounded-2xl border bg-white pl-11 text-sm text-foreground shadow-[0_2px_8px_rgba(15,23,42,0.03)] outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground hover:border-violet-300 focus:border-violet-400 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.12)] dark:bg-slate-900 [&::-webkit-search-cancel-button]:hidden ${query ? 'pr-24' : 'pr-12'} ${open ? 'border-violet-300 dark:border-violet-500/60' : 'border-slate-200 dark:border-slate-700'}`} />
      {query && <button type="button" aria-label="Clear tool search" onClick={() => { setQuery(''); setActive(-1); input.current?.focus(); }} className="absolute right-11 top-0 flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 20 20"><path strokeLinecap="round" d="m5 5 10 10M15 5 5 15" /></svg></button>}
      <button type="submit" aria-label="Submit tool search" className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm transition-colors hover:bg-violet-700"><svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 20 20"><path strokeLinecap="round" strokeLinejoin="round" d="M4 10h12m-5-5 5 5-5 5" /></svg></span></button>
    </form>
    {open && <div id={`${id}-results`} className="absolute inset-x-0 top-full z-[60] mt-2 flex max-h-[min(32rem,calc(100dvh-9rem))] flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white text-foreground shadow-[0_20px_60px_-16px_rgba(37,20,70,0.25)] dark:border-slate-700 dark:bg-slate-950">
      {!search ? <div className="min-h-0 overflow-y-auto p-3 sm:p-4"><p className="mb-3 text-xs font-semibold text-muted-foreground">Browse categories</p><div className="grid grid-cols-2 gap-2">{featuredToolCategories.map((category) => <Link key={category.href} href={category.href} onClick={() => setOpen(false)} className="group flex min-h-16 items-center gap-2 rounded-xl border border-border/70 px-2 py-3 text-xs font-medium transition-colors hover:border-violet-200 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:border-violet-500/40 dark:hover:bg-violet-500/10 sm:gap-3 sm:px-3 sm:text-sm"><span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 font-serif text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">{category.sample}</span><span>{category.title}</span></Link>)}</div></div>
        : <><p role="status" className="shrink-0 px-4 pb-2 pt-4 text-xs font-medium text-muted-foreground">{failed ? 'Search is unavailable. Open the directory below.' : !entries.length ? 'Loading tools…' : matches.length ? `${matches.length} matching tools` : 'No matching tools. Try “heart” or “signature”.'}</p><ul className="min-h-0 overflow-y-auto overscroll-contain p-2">{results.map((entry, index) => <li key={entry.href}><Link href={entry.href} data-search-index={index} aria-current={active === index ? 'true' : undefined} onClick={() => setOpen(false)} className={`group flex min-h-16 items-center gap-3 rounded-xl px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${active === index ? 'bg-violet-50 dark:bg-violet-500/15' : 'hover:bg-violet-50 dark:hover:bg-violet-500/10'}`}><span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-white font-serif text-violet-600 dark:bg-slate-900 dark:text-violet-300">{featuredToolCategories.find((category) => category.title === entry.category)?.sample ?? 'Aa'}</span><span className="min-w-0 flex-1"><span className="block font-medium">{entry.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{entry.category}</span></span><span aria-hidden="true" className={`text-violet-500 ${active === index ? '' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'}`}>→</span></Link></li>)}</ul></>}
      <Link href={directoryHref} onClick={() => setOpen(false)} className="flex min-h-12 shrink-0 items-center justify-between border-t border-border/70 bg-violet-50/60 px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 dark:bg-violet-500/5 dark:text-violet-300 dark:hover:bg-violet-500/15">{search ? 'See all results' : 'Browse all tools'}<span aria-hidden="true">→</span></Link>
    </div>}
  </div>;
}
