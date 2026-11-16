'use client';

import { useMemo, useState } from 'react';
import { CUNEIFORM_INPUT_LIMIT, cuneiformExamples, cuneiformFontSample, cuneiformSignChart, spellInCuneiform } from '@/lib/cuneiform';
import { useGeneratorText } from '@/lib/use-generator-text';
import TextOutputCard from './TextOutputCard';
import TextToolInput from './TextToolInput';
import UnicodeToolWorkspace from './text-library/UnicodeToolWorkspace';
import CopyButton from './text-library/CopyButton';
import { ScriptImageOutput, ScriptOutputPicker, type ScriptOutputMode } from './ScriptOutput';
import fonts from './ScriptFonts.module.css';

export default function CuneiformTranslator() {
  const [text, setText] = useGeneratorText(cuneiformExamples[0]);
  const [query, setQuery] = useState('');
  const [outputMode, setOutputMode] = useState<ScriptOutputMode>('text');
  const result = useMemo(() => spellInCuneiform(text), [text]);
  const search = query.trim().toLowerCase();
  const signs = cuneiformSignChart.filter(({ reading, glyph, code }) =>
    reading.includes(search) || code.toLowerCase().includes(search) || glyph === search);

  return (
    <div data-clarity-mask="true">
      <UnicodeToolWorkspace id="generator" label="Cuneiform Translator" controls={<div className="space-y-4">
        <TextToolInput id="cuneiform-input" label="Name or short word" text={text} onChange={setText} limit={CUNEIFORM_INPUT_LIMIT} />
        <div className="flex flex-wrap items-center gap-x-3 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Try a name</span>
          {cuneiformExamples.map((name) => (
            <button key={name} type="button" aria-pressed={text === name} onClick={() => setText(name)}
              className="min-h-11 rounded-lg px-2 font-semibold text-violet-700 hover:bg-violet-50 focus-visible:outline-violet-600 aria-pressed:bg-violet-100 dark:text-violet-300 dark:hover:bg-violet-950 dark:aria-pressed:bg-violet-950">
              {name}
            </button>
          ))}
        </div>
      </div>}>
        <ScriptOutputPicker value={outputMode} onChange={setOutputMode} />
        {outputMode === 'text' ? <TextOutputCard title="Cuneiform signs" text={result.text} textClassName={fonts.cuneiform}
          description="Copy these Unicode signs into a message or document. Try typing the name as it sounds." selected />
          : <ScriptImageOutput title="Cuneiform signs" text={result.text} textClassName={fonts.cuneiform}
            description="Keep the sign shapes when sharing an image. PNG contains rendered lettering, not editable text."
            family="Site Cuneiform" fontSample={cuneiformFontSample} filename="cuneiform.png" />}
        {result.unmatchedLetters > 0 && (
          <p role="status" className="text-sm text-amber-800 dark:text-amber-300">The result keeps letters outside the supported spellings as entered.</p>
        )}
        {result.matches.length > 0 && (
          <details open className="rounded-2xl border border-slate-200 px-4 dark:border-slate-800">
            <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold focus-visible:outline-violet-600">Spelling breakdown</summary>
            <ol className="grid grid-cols-1 gap-2 pb-4 min-[380px]:grid-cols-2">
              {result.matches.map(({ input, offset, signs }) => (
                <li key={offset} className="min-w-0 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <span className="text-sm font-semibold">{input}</span>
                  {signs.map(({ glyph, reading, code }) => (
                    <div key={reading} className="flex flex-wrap items-center gap-x-2 text-xs text-slate-600 dark:text-slate-400">
                      <span aria-hidden="true" className={`${fonts.cuneiform} text-2xl text-violet-700 dark:text-violet-300`}>{glyph}</span>
                      <span>{reading} · {code}</span>
                    </div>
                  ))}
                </li>
              ))}
            </ol>
          </details>
        )}
        <details className="rounded-2xl border border-slate-200 px-4 dark:border-slate-800">
          <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold focus-visible:outline-violet-600">Cuneiform sign chart</summary>
          <p className="mb-3 text-sm leading-6 text-slate-600 dark:text-slate-400">Search a reading, sign or code point and tap a tile to copy the sign.</p>
          <input type="search" aria-label="Search cuneiform signs" placeholder="Search signs…" value={query} onChange={(event) => setQuery(event.target.value)}
            className="mb-3 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base focus:outline-violet-500 dark:border-slate-700 dark:bg-slate-950" />
          {signs.length ? (
            <ul className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto pb-3 sm:grid-cols-5">
              {signs.map(({ glyph, reading, code }) => (
                <li key={reading} className="min-w-0">
                  <CopyButton tool="cuneiform-translator" text={glyph} label={`Copy ${reading} sign (${code})`} feedback="badge"
                    className="h-full border border-slate-200 bg-slate-50 hover:border-violet-400 dark:border-slate-800 dark:bg-slate-900">
                    <span className="flex flex-col items-center gap-0.5 px-1 py-2 text-center">
                      <span aria-hidden="true" className={`${fonts.cuneiform} text-2xl leading-tight`}>{glyph}</span>
                      <span className="text-sm font-semibold">{reading}</span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400">{code}</span>
                    </span>
                  </CopyButton>
                </li>
              ))}
            </ul>
          ) : <p role="status" className="pb-4 text-sm text-slate-600 dark:text-slate-400">No signs match this search.</p>}
        </details>
      </UnicodeToolWorkspace>
    </div>
  );
}
