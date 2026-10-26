'use client';

import { useMemo, useState } from 'react';
import { generateZalgo, ZALGO_INPUT_LIMIT } from '@/lib/text-effects';
import { useGeneratorText } from '@/lib/use-generator-text';
import TextOutputCard from './TextOutputCard';

export default function ZalgoGeneratorTool() {
  const [text, setText] = useGeneratorText('Zalgo Text Generator');
  const [intensity, setIntensity] = useState(3);
  const [zones, setZones] = useState({ above: true, middle: true, below: true });
  const [seed, setSeed] = useState(42);
  const output = useMemo(() => generateZalgo(text, { intensity, ...zones, seed }), [text, intensity, zones, seed]);
  const tooLong = text.length > ZALGO_INPUT_LIMIT;
  return (
    <section aria-label="Zalgo text workspace" className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-5 leading-7 text-slate-600 dark:text-slate-300">Stack marks above, through, and below your letters. Adjust the amount, then copy the actual Unicode text.</p>
      <label htmlFor="zalgo-input" className="font-bold text-slate-950 dark:text-white">Your text</label>
      <textarea id="zalgo-input" value={text} onChange={(event) => setText(event.target.value)} maxLength={ZALGO_INPUT_LIMIT} rows={3} aria-describedby="zalgo-input-help" className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-4 text-lg text-slate-950 focus:outline-violet-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
      <p id="zalgo-input-help" className="mt-1 text-sm text-slate-600 dark:text-slate-400">{text.length} / {ZALGO_INPUT_LIMIT} input characters. Emoji and complex scripts stay unchanged.</p>
      {tooLong && <p role="alert" className="mt-2 text-sm text-red-600">This saved draft is too long. Shorten it to 1,000 characters to generate; your text has not been cut.</p>}
      <div className="my-5 flex flex-wrap gap-2">
        {([['None', 0], ['Mild', 1], ['Medium', 3], ['Strong', 6], ['Extreme', 10]] as const).map(([name, amount]) => <button key={name} type="button" aria-pressed={intensity === amount} onClick={() => setIntensity(amount)} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${intensity === amount ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'}`}>{name}</button>)}
      </div>
      <label htmlFor="zalgo-intensity" className="block font-semibold text-slate-950 dark:text-white">Intensity: {intensity} / 10</label>
      <input id="zalgo-intensity" type="range" min="0" max="10" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} className="my-3 w-full accent-violet-600" />
      <fieldset className="mb-5 flex flex-wrap gap-5 text-slate-700 dark:text-slate-200">
        <legend className="mb-2 font-semibold">Mark directions</legend>
        {(['above', 'middle', 'below'] as const).map((zone) => <label key={zone} className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={zones[zone]} onChange={(event) => setZones({ ...zones, [zone]: event.target.checked })} className="h-4 w-4 accent-violet-600" />{zone === 'middle' ? 'Through letters' : zone === 'above' ? 'Above letters' : 'Below letters'}</label>)}
      </fieldset>
      <div className="mb-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => setSeed((value) => value + 1)} className="rounded-lg bg-violet-600 px-4 py-3 font-semibold text-white">Randomize marks</button>
        <button type="button" onClick={() => setText('')} className="rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Clear text</button>
      </div>
      <TextOutputCard title="Zalgo text" text={output} spacious description="More intensity adds more marks. Heavy results can overlap or be rejected by the destination app; start mild for names and chat." />
      <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">None or no directions returns your original input. It does not remove accents or clean previously pasted Zalgo text. Text is processed in your browser.</p>
    </section>
  );
}
