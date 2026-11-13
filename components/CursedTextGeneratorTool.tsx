'use client';

import { useMemo, useState } from 'react';
import { CURSED_CLEAN_LIMIT, CURSED_INPUT_LIMIT, cleanCursedText, cursedSamples, cursedTextResults } from '@/lib/cursed-text';
import { useGeneratorText } from '@/lib/use-generator-text';
import TextToolLayout, { type TextWorkspace } from './TextToolLayout';
import TextToolInput from './TextToolInput';
import TextOutputCard from './TextOutputCard';

export default function CursedTextGeneratorTool(workspace: Pick<TextWorkspace, 'config' | 'navigationItems' | 'pageTitle'>) {
  const [text, setText] = useGeneratorText(cursedSamples[0]);
  const [pasted, setPasted] = useGeneratorText('');
  const [mode, setMode] = useState<'create' | 'clean'>('create');
  const [intensity, setIntensity] = useState(2);
  const [seed, setSeed] = useState(42);
  const [selectedId, setSelectedId] = useState('haunted');
  const results = useMemo(() => cursedTextResults(text, intensity, seed), [text, intensity, seed]);
  const cleaned = useMemo(() => cleanCursedText(pasted), [pasted]);
  const selected = results.find(({ id }) => id === selectedId) ?? results[0];
  const creating = mode === 'create';
  const preview = creating ? selected : { id: 'clean', name: 'Cleaned text', text: cleaned.text, spacious: false };

  return (
    <TextToolLayout
      id="generator"
      label="Cursed text workspace"
      workspace={{
        ...workspace,
        preview: { id: preview.id, name: preview.name, text: preview.text, category: 'effects' },
        previewTextClassName: preview.spacious ? 'whitespace-pre-wrap !leading-[2.4] [overflow-wrap:anywhere]' : 'whitespace-pre-wrap [overflow-wrap:anywhere]',
        mobileDirectoryAfterResults: true,
      }}
      controls={<>
        <div role="group" aria-label="Cursed text mode" className="flex flex-wrap gap-2">
          {(['create', 'clean'] as const).map((value) => (
            <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)} className={`min-h-11 rounded-xl border px-4 text-sm font-semibold focus-visible:outline-violet-600 ${mode === value ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'}`}>
              {value === 'create' ? 'Create cursed text' : 'Clean text'}
            </button>
          ))}
        </div>
        {creating ? <>
          <TextToolInput id="cursed-input" text={text} onChange={setText} limit={CURSED_INPUT_LIMIT} />
          <div className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <label htmlFor="cursed-intensity" className="flex justify-between gap-2 text-sm font-semibold">
              Stack intensity <span className="font-normal text-slate-500 dark:text-slate-400">{intensity} / 7</span>
            </label>
            <input id="cursed-intensity" type="range" min={1} max={7} value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} className="h-7 w-full accent-violet-600" />
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Affects the four stacked styles.</p>
              <button type="button" onClick={() => setSeed((value) => value + 1)} className="min-h-11 rounded-lg px-2 text-sm font-semibold text-violet-700 focus-visible:outline-violet-600 dark:text-violet-300">Shuffle marks</button>
            </div>
          </div>
        </> : <TextToolInput id="cursed-clean-input" text={pasted} onChange={setPasted} limit={CURSED_CLEAN_LIMIT} label="Text to clean" />}
      </>}
    >
      {creating ? <>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Cursed styles</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {results.map((result) => <TextOutputCard key={result.id} title={result.name} text={result.text} compact spacious={result.spacious}
            description={result.description} selected={result.id === selectedId} onPreview={() => setSelectedId(result.id)} />)}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
          <span>Try a phrase</span>
          {cursedSamples.map((sample) => <button key={sample} type="button" onClick={() => setText(sample)} className="min-h-11 rounded-md px-1 font-medium text-violet-700 underline focus-visible:outline-violet-600 dark:text-violet-300">{sample}</button>)}
        </div>
      </> : <>
        <TextOutputCard title="Cleaned text" text={cleaned.text} selected />
        <p role="status" className="text-sm text-slate-600 dark:text-slate-400">{pasted.trim() && (cleaned.removed ? `Removed ${cleaned.removed} ${cleaned.removed === 1 ? 'mark' : 'marks'}.` : 'No supported marks found.')}</p>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">The cleaner targets this tool’s combining marks on Latin text. Review the result before copying. Intentional strike or slash marks can be removed too.</p>
      </>}
    </TextToolLayout>
  );
}
