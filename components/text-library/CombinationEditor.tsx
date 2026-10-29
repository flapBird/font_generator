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
  return <section id="combination-editor" aria-labelledby="combination-heading" data-clarity-mask="true" className="scroll-mt-24 rounded-2xl border border-violet-200 bg-violet-50/60 px-4 py-2 sm:px-5">
    <div className="flex items-center justify-between gap-3">
      <h2 id="combination-heading" className="text-base font-semibold text-slate-950">Your combination</h2>
      <button type="button" aria-expanded={expanded} aria-controls="combination-controls" onClick={() => setExpanded(!expanded)} className="min-h-11 px-2 text-sm font-medium text-violet-800">{expanded ? 'Hide editor' : 'Open editor'}</button>
    </div>
    <div id="combination-controls" hidden={!expanded} className="pb-3">
    <p className="text-sm leading-6 text-slate-600">Add a card below, move the pieces, or type your own text. Editing the text merges the pieces into one.</p>
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
    <label htmlFor="combination-text" className="mt-3 block text-sm font-medium">Edit your combination</label>
    <textarea id="combination-text" data-clarity-mask="true" value={text} rows={3} maxLength={COMBINATION_LIMIT}
      onChange={(event) => setParts(event.target.value.length ? [{ key: -1, text: event.target.value, name: 'Edited text' }] : [])}
      placeholder="Your words, symbols and little details…" className="mt-2 w-full resize-y rounded-xl border border-violet-200 bg-white p-3 text-xl leading-8 focus:outline-none focus:ring-2 focus:ring-violet-500" />
    <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
      <p className="text-xs leading-6 text-slate-500">{text.length} / {COMBINATION_LIMIT} UTF-16 units · stays in this page</p>
      <button type="button" disabled={!parts.length} onClick={() => setParts([])} className="min-h-11 px-2 text-sm text-violet-800 disabled:opacity-40">Clear combination</button>
      <CopyButton text={text} label="Copy combination" tool={tool} className="bg-violet-700 text-white hover:bg-violet-800" />
    </div>
    <p role="status" className="mt-2 text-sm text-amber-800">{message}</p>
    </div>
  </section>;
}
