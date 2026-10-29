'use client';

import { COMBINATION_LIMIT, combineParts } from '@/lib/text-library/text';
import type { LibraryId } from '@/lib/text-library/catalog';
import CopyButton from './CopyButton';

export type CombinationPart = { key: number; text: string; name: string };
export default function CombinationEditor({ parts, separator, setSeparator, setParts, tool, message, expanded, setExpanded }: {
  parts: CombinationPart[]; separator: string; setSeparator: (value: string) => void;
  setParts: (parts: CombinationPart[]) => void; tool: LibraryId; message: string;
  expanded: boolean; setExpanded: (value: boolean) => void;
}) {
  const text = combineParts(parts.map((part) => part.text), separator);
  function move(index: number, direction: number) {
    const next = [...parts];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    setParts(next);
  }
  function close() { setExpanded(false); document.getElementById('open-combination')?.focus({ preventScroll: true }); }
  return <section id="combination-editor" hidden={!expanded} aria-labelledby="combination-heading" data-clarity-mask="true" onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); close(); } }} className="fixed inset-x-0 bottom-0 z-40 max-h-[55dvh] overflow-y-auto border-t border-slate-200 bg-white px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] sm:inset-x-6 sm:bottom-4 sm:mx-auto sm:max-w-4xl sm:rounded-2xl sm:border sm:px-5">
    <div className="flex items-center justify-between gap-3">
      <div><h2 id="combination-heading" className="text-sm font-semibold text-slate-950">Combine symbols</h2><p className="mt-1 text-xs text-slate-500">Add symbols and your own text, then copy them together.</p></div>
      <button type="button" onClick={close} className="min-h-11 px-2 text-sm text-slate-500">Close editor</button>
    </div>
    <div id="combination-controls">
    <div className="mt-3 flex items-start gap-2">
    <label htmlFor="combination-text" className="sr-only">Edit your combination</label>
    <textarea id="combination-text" data-clarity-mask="true" value={text} rows={1} maxLength={COMBINATION_LIMIT}
      onChange={(event) => setParts(event.target.value.length ? [{ key: -1, text: event.target.value, name: 'Edited text' }] : [])}
      placeholder="e.g. ♡ Alex ✦" className="min-h-12 min-w-0 flex-1 resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-lg leading-8 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
    <CopyButton text={text} label="Copy combination" tool={tool} className="bg-violet-700 text-sm text-white hover:bg-violet-800" />
    </div>
    <details className="mt-2">
    <summary className="w-fit cursor-pointer py-2 text-xs font-medium text-slate-600">Arrange pieces &amp; spacing{parts.length ? ` (${parts.length})` : ''}</summary>
    <p className="text-xs text-slate-500">Editing the text merges your pieces into one.</p>
    {parts.length > 0 && <ol className="mt-3 flex max-h-48 flex-wrap gap-2 overflow-y-auto" aria-label="Combination pieces">
      {parts.map((part, index) => <li key={part.key} className="flex max-w-full items-center gap-1 rounded-lg border border-violet-200 bg-white px-2">
        <span className="max-w-32 truncate text-sm" title={part.name}>{part.text}</span>
        <button type="button" disabled={index === 0} aria-label={`Move piece ${index + 1} earlier`} onClick={() => move(index, -1)} className="min-h-11 min-w-11 text-violet-800 disabled:opacity-30">←</button>
        <button type="button" disabled={index === parts.length - 1} aria-label={`Move piece ${index + 1} later`} onClick={() => move(index, 1)} className="min-h-11 min-w-11 text-violet-800 disabled:opacity-30">→</button>
        <button type="button" aria-label={`Remove piece ${index + 1}`} onClick={() => setParts(parts.filter((_, at) => at !== index))} className="min-h-11 min-w-11 text-slate-600">×</button>
      </li>)}
    </ol>}
    <div className="mt-3 flex items-center gap-3 text-sm">
      <label htmlFor="combination-separator">Between pieces</label>
      <select id="combination-separator" value={separator} onChange={(event) => setSeparator(event.target.value)} className="min-h-11 rounded-lg border border-violet-200 bg-white px-3">
        <option value=" ">Space</option><option value="">Nothing</option><option value={'\n'}>New line</option>
      </select>
    </div>
    </details>
    <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
      <p className="text-xs leading-6 text-slate-400" title="Length is measured in UTF-16 units">{text.length} / {COMBINATION_LIMIT}</p>
      <button type="button" disabled={!parts.length} onClick={() => setParts([])} className="min-h-11 px-2 text-sm text-violet-800 disabled:opacity-40">Clear combination</button>
    </div>
    <p role="status" className="mt-2 text-sm text-amber-800">{message}</p>
    </div>
  </section>;
}
