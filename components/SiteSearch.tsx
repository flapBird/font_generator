'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from './IntentLink';

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
  async function begin() {
    onOpen(); setOpen(true); setFailed(false);
    try { setEntries(await loadCatalog()); } catch { setFailed(true); }
  }
  return <div ref={root} className="relative min-w-0 w-full" data-clarity-mask="true" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
    <span className="sr-only" aria-live="polite">{active >= 0 ? results[active]?.title : ''}</span>
    <form role="search" aria-label="Site tools" onSubmit={(event) => { event.preventDefault(); setOpen(false); input.current?.blur(); router.push(active >= 0 && results[active] ? results[active].href : directoryHref); }}>
      <label htmlFor={id} className="sr-only">Search tools</label>
      <input ref={input} id={id} type="search" autoComplete="off" maxLength={100} value={query} placeholder="Search fonts, symbols, tools…" aria-controls={open ? `${id}-results` : undefined} onFocus={begin} onChange={(event) => { setQuery(event.target.value); setActive(-1); setOpen(true); }} onKeyDown={(event) => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); setActive(-1); }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault(); setOpen(true);
          if (results.length) setActive((value) => event.key === 'ArrowDown' ? (value + 1) % results.length : (value <= 0 ? results.length - 1 : value - 1));
        }
      }} className="h-11 w-full rounded-full border border-border bg-muted px-5 pr-16 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20" />
      <button type="submit" aria-label="Submit tool search" className="absolute right-1 top-1 flex h-9 items-center rounded-full px-3 text-xs font-semibold text-muted-foreground hover:bg-background hover:text-foreground">Go</button>
    </form>
    {open && <div id={`${id}-results`} className="absolute inset-x-0 top-full z-[60] mt-2 overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-xl">
      {!search ? <div className="p-4"><p className="mb-2 text-xs font-semibold text-muted-foreground">Explore tools</p><div className="flex flex-wrap gap-2">{['/styles', '/symbols', '/unicode-tools'].map((href, i) => <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-full bg-muted px-3 py-2 text-xs">{['Font styles', 'Symbols & emoji', 'Unicode tools'][i]}</Link>)}</div></div>
        : <><p role="status" className="px-4 pt-3 text-xs text-muted-foreground">{failed ? 'Search is unavailable. Open the directory below.' : !entries.length ? 'Loading tools…' : matches.length ? `${matches.length} matching tools` : 'No matching tools. Try “heart” or “signature”.'}</p><ul className="max-h-[45vh] overflow-y-auto p-2">{results.map((entry, index) => <li key={entry.href}><Link href={entry.href} aria-current={active === index ? 'true' : undefined} onClick={() => setOpen(false)} className={`block rounded-xl px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${active === index ? 'bg-muted' : 'hover:bg-muted'}`}><span className="block font-medium">{entry.title}</span><span className="text-xs text-muted-foreground">{entry.category}</span></Link></li>)}</ul></>}
      <Link href={directoryHref} onClick={() => setOpen(false)} className="block border-t border-border px-5 py-3 text-sm font-semibold text-violet-700 dark:text-violet-300">{search ? 'See all results' : 'Browse all tools'} →</Link>
    </div>}
  </div>;
}
