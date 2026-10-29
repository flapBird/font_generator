'use client';

import { useState } from 'react';
import type { GeneratorSearchItem } from '@/components/GeneratorTool';
import TextToolLayout from '@/components/TextToolLayout';
import { cleanInvisibleText, inspectUnicode, normalText, removalOptions, UNICODE_TOOL_LIMIT, type RemovalId } from '@/lib/text-library/unicode-tools';
import { codePoints } from '@/lib/text-library/text';
import type { UnicodeUtilityId } from '@/lib/text-library/catalog';
import CopyButton from './CopyButton';

const examples: Record<UnicodeUtilityId, string> = {
  'unicode-character-inspector': 'Café e\u0301 👨‍👩‍👧‍👦',
  'invisible-character-remover': 'Hello\u200B world\u00A0👨‍👩‍👧‍👦',
  'fancy-text-to-normal-text': '𝐇𝐞𝐥𝐥𝐨 Ｗｏｒｌｄ 𝟚𝟘𝟚𝟞 👋',
};
const config = { styleIds: [], initialText: '', intentLabel: 'Unicode text tools', resultIntro: 'Inspect before changing text.', bestFor: ['Character inspection', 'Text cleanup'], compatibilityNote: 'Unsupported characters are preserved.' };

export default function UnicodeUtilityTool({ id, title, navigationItems }: { id: UnicodeUtilityId; title: string; navigationItems: GeneratorSearchItem[] }) {
  const [text, setText] = useState(examples[id]);
  const [error, setError] = useState('');
  const [enabled, setEnabled] = useState<RemovalId[]>([]);
  const [smallCaps, setSmallCaps] = useState(false);
  const [overlays, setOverlays] = useState(false);
  const [limit, setLimit] = useState(80);
  const inspected = inspectUnicode(text);
  const cleaned = cleanInvisibleText(text, enabled);
  const normalized = normalText(text, { smallCaps, overlays });
  const isInspector = id === 'unicode-character-inspector';
  const isRemover = id === 'invisible-character-remover';
  const report = text ? ['Position\tUTF-16 offset\tCode point\tCategory\tEscape\tUTF-8', ...inspected.rows.map((row) => `${row.index + 1}\t${row.offset}\t${row.code}\t${row.category}\t${row.escaped}\t${row.utf8}`)].join('\n') : '';
  const output = isInspector ? report : isRemover ? cleaned.output : normalized.output;
  return <div data-clarity-mask="true"><TextToolLayout id="unicode-utility-workspace" label={`${title} workspace`} workspace={{ pageTitle: title, config, navigationItems, outputLabel: isInspector ? 'Character report' : 'Result', mobileDirectoryAfterResults: true,
    preview: { id, name: isInspector ? 'Original text' : 'Result', text: isInspector ? text : output, category: 'classic' } }}
    controls={<div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div><label htmlFor="unicode-utility-input" className="block text-sm font-semibold">Text to {isInspector ? 'inspect' : isRemover ? 'clean' : 'restore'}</label>
        <textarea id="unicode-utility-input" value={text} rows={4} onChange={(event) => {
          if (event.target.value.length > UNICODE_TOOL_LIMIT) { setError('Use up to 2,000 UTF-16 units. The previous input was kept; nothing was truncated.'); return; }
          setError(''); setText(event.target.value); setLimit(80);
        }} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-lg leading-8 focus:outline-none focus:ring-2 focus:ring-violet-500" />
        <p role="status" className="text-sm text-amber-800">{error}</p>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>{text.length} / 2,000 UTF-16 units</span><button type="button" onClick={() => { setText(''); setError(''); }} className="min-h-11 px-2 text-sm text-violet-700">Clear input</button></div>
      </div>
      {isRemover && <fieldset className="space-y-3"><legend className="mb-2 text-sm font-semibold">Choose changes (all off by default)</legend>{removalOptions.map((option) => <label key={option.id} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <input type="checkbox" checked={enabled.includes(option.id)} onChange={(event) => setEnabled(event.target.checked ? [...enabled, option.id] : enabled.filter((value) => value !== option.id))} className="mt-1 h-4 w-4 shrink-0 accent-violet-700" />
        <span><span className="block text-sm font-medium">{option.label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{option.detail}</span></span>
      </label>)}</fieldset>}
      {!isRemover && !isInspector && <fieldset className="space-y-2"><legend className="mb-2 text-sm font-semibold">Optional changes</legend>
        <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={smallCaps} onChange={(event) => setSmallCaps(event.target.checked)} />Restore supported small caps as lowercase</label>
        <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={overlays} onChange={(event) => setOverlays(event.target.checked)} />Remove combining underline and overlay marks</label>
        <p className="text-xs leading-6 text-slate-500">Unsupported characters stay unchanged. Small caps lose case information; accents, emoji and line endings are preserved.</p>
      </fieldset>}
    </div>}>
    <section className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50 p-4">
      <h2 className="text-lg font-semibold">{isInspector ? 'Character report' : isRemover ? 'Cleaned text' : 'Normal text'}</h2>
      <p data-testid="unicode-counts" className="text-xs leading-6 text-slate-600">{inspected.rows.length} code points · {inspected.graphemes.length} grapheme clusters · {inspected.units} UTF-16 units</p>
      {!isInspector && <CopyButton text={output} label="Copy result" tool={id} className="border border-violet-200 bg-white p-4 hover:bg-violet-50">
        <span data-testid="unicode-result" dir="auto" className="block whitespace-pre-wrap break-words text-xl leading-9" style={{ overflowWrap: 'anywhere' }}>{output || (text ? 'The result is empty.' : 'Enter text to see a result.')}</span><span className="mt-3 block text-xs text-violet-700">Tap the result to copy</span>
      </CopyButton>}
      {isInspector && <CopyButton text={report} label="Copy character report" tool={id} className="bg-violet-700 text-white" />}
      {isRemover && <div data-testid="unicode-changes" className="text-sm leading-6 text-slate-600">{cleaned.changes.length ? <ul>{cleaned.changes.map((change) => <li key={change.label}>{change.label}: {change.count} {change.replacement ? 'replaced' : 'removed'}</li>)}</ul> : 'No changes. Choose a matching character type to remove or replace.'}</div>}
      {!isInspector && !isRemover && <p className="text-sm text-slate-600">{normalized.converted} supported code points changed.</p>}
      {!isInspector && <details><summary className="cursor-pointer py-2 text-sm font-medium text-violet-700">Compare before and after code points</summary><div className="mt-2 space-y-3 text-xs"><p className="max-h-40 overflow-auto break-words"><strong>Before: </strong>{codePoints(text) || '(empty)'}</p><p className="max-h-40 overflow-auto break-words"><strong>After: </strong>{codePoints(output) || '(empty)'}</p></div></details>}
    </section>
    {isInspector && <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold">Code points</h2><p className="my-2 text-xs leading-6 text-slate-500">Positions start at 1; UTF-16 offsets start at 0. A dot represents a control, separator or blank-looking character.</p>
      {inspected.rows.length ? <ol aria-label="Inspected code points" className="space-y-2">{inspected.rows.slice(0, limit).map((row) => <li key={row.index} className="rounded-xl bg-slate-50 p-3">
        <div className="flex items-center gap-3"><span className="flex h-10 min-w-10 items-center justify-center rounded-lg border bg-white text-xl">{row.display}</span><div className="min-w-0"><span className="font-mono text-sm font-semibold">{row.code}</span><span className="ml-2 text-xs text-slate-500">#{row.index + 1} · {row.category}</span><p className="text-xs leading-5 text-slate-600">{row.name}</p></div></div>
        <p className="mt-2 break-all font-mono text-xs leading-6 text-slate-500">Offset {row.offset} · {row.escaped} · UTF-8 {row.utf8}</p>
      </li>)}</ol> : <p className="py-4 text-sm text-slate-600">Enter text to inspect its characters.</p>}
      {inspected.rows.length > limit && <button type="button" onClick={() => setLimit(limit + 80)} className="mt-3 min-h-11 rounded-xl border border-violet-200 px-4 text-sm text-violet-700">Show next 80 code points</button>}
      <p className="mt-3 text-xs text-slate-500">The copied report always includes every code point in the input.</p>
    </section>}
  </TextToolLayout></div>;
}
