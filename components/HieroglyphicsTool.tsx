'use client';

import { useMemo } from 'react';
import { HIEROGLYPH_INPUT_LIMIT, hieroglyphSamples, spellInHieroglyphs } from '@/lib/hieroglyphics';
import { useGeneratorText } from '@/lib/use-generator-text';
import TextOutputCard from './TextOutputCard';
import TextToolInput from './TextToolInput';
import styles from './HieroglyphicsTool.module.css';

export default function HieroglyphicsTool() {
  const [text, setText] = useGeneratorText(hieroglyphSamples[0]);
  const result = useMemo(() => spellInHieroglyphs(text), [text]);

  return (
    <section id="generator" aria-label="Hieroglyphics translator workspace" className="grid items-start gap-4 rounded-3xl border border-slate-200 bg-white p-3 sm:p-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] dark:border-slate-800 dark:bg-slate-950">
      <div className="min-w-0 space-y-2">
        <TextToolInput id="hieroglyph-input" label="Name or short word" text={text} onChange={setText} limit={HIEROGLYPH_INPUT_LIMIT} />
        <div className="flex flex-wrap items-center gap-x-2 text-sm text-slate-600 dark:text-slate-400">
          <span>Try a name</span>
          {hieroglyphSamples.map((name) => <button key={name} type="button" onClick={() => setText(name)} className="min-h-11 rounded-lg px-2 font-semibold text-violet-700 underline focus-visible:outline-violet-600 dark:text-violet-300">{name}</button>)}
        </div>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">Sound out unfamiliar names and try typing their pronunciation if the first spelling looks wrong.</p>
      </div>
      <div className="min-w-0 space-y-4">
        <TextOutputCard title="Hieroglyphs" text={result.text} textClassName={styles.glyphs} />
        {result.unmatchedLetters > 0 && <p role="status" className="text-sm text-amber-800 dark:text-amber-300">Letters outside the supported Latin mapping are shown as entered.</p>}
        {result.matches.length > 0 && (
          <details className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800" open>
            <summary className="min-h-11 cursor-pointer py-2 font-semibold focus-visible:outline-violet-600">How this name was spelled</summary>
            <ol className="mt-2 grid gap-2 sm:grid-cols-2">
              {result.matches.map(({ offset, input, signs }) => (
                <li key={offset} className="min-w-0 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="mb-1 text-sm font-semibold">{input}</div>
                  {signs.map(([gardiner, codePoint, name]) => <div key={gardiner} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span aria-hidden="true" className={`${styles.glyphs} text-3xl`}>{String.fromCodePoint(codePoint)}</span>
                    <div><p className="text-sm font-medium">{name}</p><p className="break-words text-xs text-slate-600 dark:text-slate-400">{gardiner} · U+{codePoint.toString(16).toUpperCase()}</p></div>
                  </div>)}
                </li>
              ))}
            </ol>
          </details>
        )}
      </div>
    </section>
  );
}
