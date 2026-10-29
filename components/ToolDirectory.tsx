'use client';

import { useEffect, useState } from 'react';
import Link from './IntentLink';
import type { ToolDirectoryGroup } from '@/lib/tool-directory';

export default function ToolDirectory({ groups }: { groups: ToolDirectoryGroup[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  useEffect(() => {
    function readSearch() {
      const value = new URLSearchParams(window.location.hash.slice(1)).get('q');
      if (value !== null) { setQuery(value.slice(0, 100)); setCategory('all'); }
    }
    readSearch(); window.addEventListener('hashchange', readSearch);
    return () => window.removeEventListener('hashchange', readSearch);
  }, []);
  const search = query.trim().toLowerCase();
  const visible = groups.filter((group) => category === 'all' || group.id === category)
    .map((group) => ({ ...group, entries: group.entries.filter((entry) => !search || search.split(/\s+/).every((word) => entry.searchText.includes(word))) }))
    .filter((group) => group.entries.length);
  const count = visible.reduce((total, group) => total + group.entries.length, 0);
  function reset() { setQuery(''); setCategory('all'); }
  return <section aria-label="Tool directory" data-clarity-mask="true">
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <label htmlFor="tool-directory-search" className="sr-only">Search all tools</label>
      <input id="tool-directory-search" type="search" maxLength={100} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by tool name or task…" className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
      <div aria-label="Tool category filters" className="mt-4 flex flex-wrap gap-2">
        {[{ id: 'all', title: 'All tools' }, ...groups].map((group) => <button key={group.id} type="button" aria-pressed={category === group.id} onClick={() => setCategory(group.id)} className={`min-h-11 rounded-lg px-3 text-sm ${category === group.id ? 'bg-violet-700 font-medium text-white' : 'bg-white text-slate-600 hover:text-violet-700'}`}>{group.title}</button>)}
      </div>
    </div>
    <div className="my-5 flex items-center justify-between gap-3"><p role="status" className="text-sm text-slate-500">{count} tools and collections</p>{(query || category !== 'all') && <button type="button" onClick={reset} className="min-h-11 px-2 text-sm text-violet-700">Clear filters</button>}</div>
    {visible.map((group) => <section key={group.id} aria-labelledby={`directory-${group.id}`} className="mb-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 id={`directory-${group.id}`} className="text-2xl font-semibold tracking-tight">{group.title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{group.description}</p></div><Link href={group.href} className="inline-flex min-h-11 items-center text-sm font-medium text-violet-700">Open category →</Link></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{group.entries.map((entry) => <Link key={entry.href} href={entry.href} aria-label={entry.title} data-directory-tool={entry.href} className="group min-w-0 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-violet-300 hover:bg-violet-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
        <h3 className="text-sm font-semibold leading-6 text-slate-950">{entry.title}<span aria-hidden="true" className="ml-2 text-violet-600">→</span></h3><p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-500">{entry.description}</p><span className="mt-3 block text-[11px] font-medium text-violet-700">{entry.output}</span>
      </Link>)}</div>
    </section>)}
    {!count && <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center"><h2 className="text-lg font-semibold">No matching tools</h2><p className="mt-2 text-sm text-slate-500">Try a shorter tool name or choose another category.</p><button type="button" onClick={reset} className="mt-5 min-h-11 rounded-lg bg-violet-700 px-5 text-sm font-medium text-white">Show all tools</button></div>}
  </section>;
}
