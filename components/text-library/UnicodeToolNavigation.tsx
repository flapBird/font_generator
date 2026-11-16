'use client';

import { useState } from 'react';
import { unicodeGroups, unicodeTools } from '@/lib/unicode-tool-catalog';
import type { LibraryId } from '@/lib/text-library/catalog';
import LibraryLink from './LibraryLink';

export default function UnicodeToolNavigation({ current }: { current: LibraryId }) {
  const [query, setQuery] = useState('');
  const currentTool = unicodeTools.find((tool) => tool.id === current);
  return <nav aria-label="Unicode tool navigation" className="mb-6 flex flex-wrap items-start gap-3">
    <LibraryLink href="/unicode-tools" tool={current} targetId="unicode-tools" className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-violet-700 dark:border-slate-700 dark:text-violet-300">All Unicode tools</LibraryLink>
    <details key={current} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
      <summary className="flex min-h-11 cursor-pointer flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm focus-visible:outline-violet-500">
        <span className="font-semibold">{currentTool?.label ?? 'Browse by task'}</span><span className="text-violet-700 dark:text-violet-300">Change tool ▾</span>
      </summary>
      <div className="border-t border-slate-200 p-3 dark:border-slate-700">
        <input type="search" aria-label="Find a Unicode tool" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tools…" className="mb-3 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-900" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{unicodeGroups.map((group) => {
          const items = unicodeTools.filter((tool) => tool.group === group.id && `${tool.label} ${tool.id} ${tool.keywords}`.toLowerCase().includes(query.trim().toLowerCase()));
          return items.length ? <div key={group.id}><p className="mb-1 text-xs font-semibold text-slate-500">{group.label}</p>{items.map((tool) => <LibraryLink key={tool.id} href={`/${tool.id}`} tool={current} targetId={tool.id} current={tool.id === current} className={`flex min-h-11 items-center rounded-lg px-2 text-sm focus-visible:outline-violet-500 ${tool.id === current ? 'bg-violet-50 font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300' : 'hover:bg-slate-50 dark:hover:bg-slate-900'}`}>{tool.label}</LibraryLink>)}</div> : null;
        })}</div>
        {!unicodeTools.some((tool) => `${tool.label} ${tool.id} ${tool.keywords}`.toLowerCase().includes(query.trim().toLowerCase())) && <p role="status" className="text-sm text-slate-500">No matching tools. Try another name.</p>}
      </div>
    </details>
  </nav>;
}
