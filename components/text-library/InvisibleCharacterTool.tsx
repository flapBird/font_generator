'use client';

import { useState } from 'react';
import UnicodeToolWorkspace from './UnicodeToolWorkspace';
import { blankCharacters, createBlankText, INSPECTION_LIMIT, inspectBlankText } from '@/lib/text-library/invisible';
import { codePoints } from '@/lib/text-library/text';
import CopyButton from './CopyButton';

export default function InvisibleCharacterTool() {
  const [selectedId, setSelectedId] = useState<string>('zero-width-space');
  const [countInput, setCountInput] = useState('1');
  const [pasted, setPasted] = useState('');
  const [pasteError, setPasteError] = useState('');
  const selected = blankCharacters.find((entry) => entry.id === selectedId)!;
  const count = Number(countInput);
  const output = createBlankText(selectedId, count);
  const result = inspectBlankText(pasted);
  const invalidCount = !Number.isInteger(count) || count < 1 || count > 100;
  return <UnicodeToolWorkspace id="invisible-character-workspace" label="Invisible character workspace" stickyControls
    controls={<div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Choose a blank character</h2>
      <label htmlFor="blank-character" className="mt-4 block text-sm font-medium">Character type</label>
      <select id="blank-character" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3">
        {blankCharacters.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · {codePoints(entry.text)}</option>)}
      </select>
      <p className="mt-3 text-sm leading-6 text-slate-600">{selected.note}</p>
      <label htmlFor="blank-count" className="mt-4 block text-sm font-medium">Repeat count (1–100)</label>
      <input id="blank-count" type="number" min={1} max={100} step={1} value={countInput} aria-invalid={invalidCount} aria-describedby="blank-count-error" onChange={(event) => setCountInput(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3" />
      <p id="blank-count-error" role="status" className="mt-2 text-sm text-amber-800">{invalidCount ? 'Enter a whole number from 1 to 100. Copy is disabled until the count is valid.' : ''}</p>
      <div className="mt-3"><CopyButton text={output} label="Copy invisible text" tool="invisible-character" itemId={selectedId} className="bg-violet-700 text-white hover:bg-violet-800" /></div>
    </div>}>
    <section className="rounded-2xl border border-violet-200 bg-violet-50/50 p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Your blank text</h2>
      <p className="mt-2 font-mono text-sm text-violet-900">{codePoints(selected.text)}{!invalidCount && ` × ${count}`}</p>
      <div className="my-3 overflow-x-auto rounded-xl border border-dashed border-violet-300 bg-white p-4 text-center"><span aria-label="Start boundary" className="text-slate-400">[</span><span data-testid="blank-output">{output}</span><span aria-label="End boundary" className="text-slate-400">]</span></div>
      <p className="mb-3 text-xs leading-5 text-slate-500">Brackets show the boundaries and are not copied. Zero-width text may leave no gap.</p>
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Check what you pasted</h2>
      <label htmlFor="blank-inspector" className="mt-2 block text-sm leading-6 text-slate-600">Paste text to inspect supported blank and formatting characters (up to 2,000 UTF-16 units).</label>
      <textarea id="blank-inspector" value={pasted} rows={3} onChange={(event) => {
        if (event.target.value.length > INSPECTION_LIMIT) { setPasteError('That text is too long. The previous text was kept; nothing was truncated.'); return; }
        setPasteError(''); setPasted(event.target.value);
      }} className="mt-3 w-full rounded-xl border border-slate-300 p-3 text-base focus:outline-none focus:ring-2 focus:ring-violet-500" />
      <p role="status" className="text-sm text-amber-800">{pasteError}</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><p data-testid="blank-counts" className="text-xs leading-6 text-slate-500">{result.codePoints} code points · {result.graphemes} grapheme clusters · {result.units} UTF-16 units</p>
        <button type="button" onClick={() => { setPasted(''); setPasteError(''); }} className="min-h-11 px-2 text-sm text-violet-700">Clear checker</button></div>
      {result.detected.length > 0 ? <ul aria-label="Detected characters" className="mt-3 space-y-2">
        {result.detected.map((entry) => <li key={entry.text} className="rounded-lg bg-slate-50 p-3 text-sm"><span className="font-medium">{entry.name}</span><span className="mt-1 block font-mono text-xs text-slate-600">{codePoints(entry.text)} · {entry.count} {entry.count === 1 ? 'occurrence' : 'occurrences'}</span></li>)}
      </ul> : <p className="mt-3 text-sm text-slate-600">{pasted.length ? 'No supported blank or formatting characters found. This is not a complete Unicode or security audit.' : 'The checker is empty. Paste a copied character to see its code point.'}</p>}
      {pasted.length > 0 && <details className="mt-4"><summary className="cursor-pointer py-2 text-sm font-medium text-violet-700">Show every pasted code point</summary><p className="max-h-40 overflow-auto break-words rounded-lg bg-slate-50 p-3 font-mono text-xs leading-6">{codePoints(pasted)}</p></details>}
      <p className="mt-3 text-xs leading-5 text-slate-500">This checker reports the listed types only. It preserves your text, including joiners and variation selectors; it does not clean or normalize it.</p>
    </section>
  </UnicodeToolWorkspace>;
}
