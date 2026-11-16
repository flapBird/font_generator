'use client';

import { useState } from 'react';
import { filterUnicodeTools, unicodeGroups, type unicodeTools } from '@/lib/unicode-tool-catalog';
import LibraryLink from './LibraryLink';

type Item = typeof unicodeTools[number] & { title: string; description: string };
export default function UnicodeToolDirectory({ items }: { items: Item[] }) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const visible = filterUnicodeTools(items, query, group);
  function reset() { setQuery(''); setGroup('all'); }
  return <section aria-label="Unicode tool directory">
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <label htmlFor="unicode-tool-search" className="mb-2 block text-sm font-semibold">Find a Unicode tool</label>
      <input id="unicode-tool-search" type="search" value={query} maxLength={100} onChange={(event) => setQuery(event.target.value)} placeholder="Search by tool or task: Minecraft, name, invisible…" className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base focus:outline-violet-500" />
      <div role="group" aria-label="Filter Unicode tools" className="mt-3 flex flex-wrap gap-2">
        {[{id:'all',label:'All tools'}, ...unicodeGroups].map((item) => <button key={item.id} type="button" aria-pressed={group === item.id} onClick={() => setGroup(item.id)} className={`min-h-11 rounded-lg border px-3 text-sm focus-visible:outline-violet-500 ${group === item.id ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-200 bg-white'}`}>{item.label} · {item.id === 'all' ? items.length : items.filter((tool) => tool.group === item.id).length}</button>)}
      </div>
    </div>
    <div className="my-3 flex items-center justify-between gap-3"><p role="status" className="text-sm text-slate-500">{visible.length} of {items.length} tools</p><button type="button" onClick={reset} disabled={!query && group === 'all'} className="min-h-11 px-2 text-sm font-semibold text-violet-700 disabled:opacity-40">Clear filters</button></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{visible.map((tool) => <LibraryLink key={tool.id} href={`/${tool.id}`} tool="unicode-tools" targetId={tool.id} className="group flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-violet-400 focus-visible:outline-violet-500">
      <h2 className="text-base font-semibold leading-6">{tool.title}<span aria-hidden="true" className="ml-2 text-violet-700">→</span></h2>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{tool.description}</p>
      <p className="mt-auto pt-3 text-xs font-medium text-violet-700">{tool.output}</p>
    </LibraryLink>)}</div>
    {!visible.length && <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center"><p>No tools match this search.</p><button type="button" onClick={reset} className="mt-3 min-h-11 px-4 font-semibold text-violet-700">Show all tools</button></div>}
  </section>;
}
