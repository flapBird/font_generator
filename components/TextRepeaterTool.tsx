'use client';

import { useState } from 'react';
import { useGeneratorText } from '@/lib/use-generator-text';
import TextToolInput from './TextToolInput';
import CopyButton from './text-library/CopyButton';

const inputLimit = 10_000;
const copiesLimit = 10_000;
const outputLimit = 100_000;
const separatorOptions = { none: '', space: ' ', newline: '\n' } as const;
type Separator = keyof typeof separatorOptions | 'custom';
const fieldClass = 'block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-950 focus:outline-violet-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const panelClass = 'min-w-0 space-y-4 rounded-2xl border border-slate-200 p-5 dark:border-slate-700 sm:p-6';

export default function TextRepeaterTool({ sample }: { sample: string }) {
  const [text, setText] = useGeneratorText(sample);
  const [copiesInput, setCopiesInput] = useState('3');
  const [scope, setScope] = useState<'block' | 'lines'>('block');
  const [separatorType, setSeparatorType] = useState<Separator>('newline');
  const [customSeparator, setCustomSeparator] = useState('');

  const copies = Number(copiesInput);
  const validCopies = /^[0-9]+$/.test(copiesInput) && copies >= 1 && copies <= copiesLimit;
  const separator = separatorType === 'custom' ? customSeparator : separatorOptions[separatorType];
  const parts = scope === 'lines' ? text.split('\n') : [text];
  const length = validCopies ? parts.reduce((size, part) =>
    size + (part ? part.length * copies + separator.length * (copies - 1) : 0), parts.length - 1) : 0;
  const tooLong = length > outputLimit;
  const result = length > 0 && !tooLong
    ? parts.map((part) => part ? part + (separator + part).repeat(copies - 1) : '').join('\n')
    : '';

  function download() {
    const url = URL.createObjectURL(new Blob([result], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'repeated-text.txt';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section id="generator" aria-label="Text Repeater" data-clarity-mask="true"
      className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-6">
      <div className={`${panelClass} bg-white dark:bg-slate-950`}>
        <h2 className="text-lg font-semibold">Set up repetitions</h2>
        <TextToolInput id="repeater-source" text={text} onChange={setText} limit={inputLimit} label="Text to repeat" />
        <fieldset className="flex flex-wrap gap-x-5 gap-y-1">
          <legend className="text-sm font-medium">Repeat</legend>
          <label className="inline-flex min-h-11 items-center gap-2 text-sm">
            <input type="radio" name="repeater-scope" checked={scope === 'block'} onChange={() => setScope('block')} className="accent-violet-600" />
            Whole block
          </label>
          <label className="inline-flex min-h-11 items-center gap-2 text-sm">
            <input type="radio" name="repeater-scope" checked={scope === 'lines'} onChange={() => setScope('lines')} className="accent-violet-600" />
            Each line
          </label>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="repeater-count" className="text-sm font-medium">Number of copies</label>
            <input id="repeater-count" className={fieldClass} value={copiesInput} onChange={(event) => setCopiesInput(event.target.value)}
              inputMode="numeric" aria-invalid={!validCopies} aria-describedby="repeater-count-hint" />
          </div>
          <div className="space-y-2">
            <label htmlFor="repeater-separator" className="text-sm font-medium">Separator</label>
            <select id="repeater-separator" className={fieldClass} value={separatorType} onChange={(event) => setSeparatorType(event.target.value as Separator)}>
              <option value="none">No separator</option>
              <option value="space">Space</option>
              <option value="newline">New line</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
        <p id="repeater-count-hint" className={`text-xs ${validCopies ? 'text-slate-500 dark:text-slate-400' : 'text-rose-700 dark:text-rose-300'}`}>
          Enter a whole number from 1 to {copiesLimit.toLocaleString('en-US')}.
        </p>
        <div className="flex flex-wrap gap-2" aria-label="Quick copy counts">
          {[10, 100, 1000].map((count) => <button key={count} type="button" aria-label={`Set ${count} copies`}
            onClick={() => setCopiesInput(String(count))} className="min-h-11 rounded-lg border border-slate-300 px-3 text-xs font-semibold hover:border-violet-500 dark:border-slate-700">
            {count.toLocaleString('en-US')}×
          </button>)}
        </div>
        {separatorType === 'custom' && (
          <label className="block space-y-2 text-sm font-medium">
            <span>Custom separator</span>
            <textarea className={`${fieldClass} py-2`} value={customSeparator} maxLength={100} rows={2}
              placeholder="Enter up to 100 UTF-16 units" onChange={(event) => setCustomSeparator(event.target.value)} />
          </label>
        )}
      </div>
      <div className={`${panelClass} bg-slate-50/60 dark:bg-slate-900/30`}>
        <h2 className="text-lg font-semibold"><label htmlFor="repeater-result">Repeated text</label></h2>
        <textarea id="repeater-result" className={`${fieldClass} resize-y py-3 font-mono`} dir="auto" rows={7}
          value={result} readOnly placeholder="Your repeated text will appear here." aria-describedby="repeater-size" />
        <p id="repeater-size" className="text-xs text-slate-500 dark:text-slate-400">
          {length.toLocaleString('en-US')} / {outputLimit.toLocaleString('en-US')} UTF-16 units
        </p>
        {tooLong && (
          <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
            This result is too long. Use fewer copies, a shorter separator, or less source text.
          </p>
        )}
        <div className="grid items-start gap-3 sm:grid-cols-2">
          <CopyButton text={result} label="Copy repeated text" tool="text-repeater"
            className="bg-violet-700 text-sm text-white hover:bg-violet-800" />
          <button type="button" onClick={download} disabled={!result}
            className="min-h-11 rounded-xl border border-violet-300 px-4 text-sm font-semibold text-violet-800 hover:bg-violet-50 focus-visible:outline-violet-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-950">
            Download TXT
          </button>
        </div>
      </div>
    </section>
  );
}
