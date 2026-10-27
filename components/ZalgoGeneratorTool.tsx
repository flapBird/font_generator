'use client';

import { useMemo, useState } from 'react';
import { generateZalgo, ZALGO_INPUT_LIMIT } from '@/lib/text-effects';
import { useGeneratorText } from '@/lib/use-generator-text';
import TextOutputCard from './TextOutputCard';
import TextToolInput from './TextToolInput';
import TextToolLayout from './TextToolLayout';

export default function ZalgoGeneratorTool() {
  const [text, setText] = useGeneratorText('Zalgo Text Generator');
  const [intensity, setIntensity] = useState(3);
  const [zones, setZones] = useState({ above: true, middle: true, below: true });
  const [seed, setSeed] = useState(42);
  const output = useMemo(() => generateZalgo(text, { intensity, ...zones, seed }), [text, intensity, zones, seed]);
  const tooLong = text.length > ZALGO_INPUT_LIMIT;
  return <TextToolLayout label="Zalgo text workspace" controls={<>
    <TextToolInput id="zalgo-input" text={text} onChange={setText} limit={ZALGO_INPUT_LIMIT} />
    {tooLong && <p role="alert" className="text-sm text-red-600">This saved draft is too long. Shorten it to 1,000 characters to generate; your text has not been cut.</p>}
    <fieldset><legend className="mb-2 text-sm font-medium text-slate-950 dark:text-white">Effect strength</legend>
      <div className="grid grid-cols-3 gap-2">
        {([['None', 0], ['Mild', 1], ['Medium', 3], ['Strong', 6], ['Extreme', 10]] as const).map(([name, amount]) => <button key={name} type="button" aria-pressed={intensity === amount} onClick={() => setIntensity(amount)} className={`min-h-11 rounded-xl border px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${intensity === amount ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-violet-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'}`}>{name}</button>)}
      </div>
    </fieldset>
  </>} footer={<details className="mt-5 border-t border-slate-200 pt-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:text-slate-400"><summary className="cursor-pointer py-2 font-medium">Zalgo tips & compatibility</summary><p className="mt-3">Heavy results can overlap or be rejected by the destination app; start mild for names and chat. Emoji and complex scripts stay unchanged. None or no directions returns your original input. It does not remove accents or clean previously pasted Zalgo text. Text is processed in your browser.</p></details>}>
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">Live result · Tap to copy</h3><button type="button" onClick={() => setSeed((value) => value + 1)} className="min-h-11 rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500">Randomize marks</button></div>
    <TextOutputCard title="Zalgo text" text={output} spacious />
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
    <div><label htmlFor="zalgo-intensity" className="text-sm font-medium text-slate-950 dark:text-white">Intensity: {intensity} / 10</label><input id="zalgo-intensity" type="range" min="0" max="10" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} className="mt-2 block w-full accent-violet-600" /></div>
    <fieldset><legend className="mb-2 text-sm font-medium text-slate-950 dark:text-white">Mark directions</legend>
      <div className="grid grid-cols-3 gap-2">{(['above', 'middle', 'below'] as const).map((zone) => <label key={zone} className={`flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-2 text-sm ${zones[zone] ? 'border-violet-400 bg-violet-50 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200' : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300'}`}><input type="checkbox" aria-label={zone === 'middle' ? 'Through letters' : zone === 'above' ? 'Above letters' : 'Below letters'} checked={zones[zone]} onChange={(event) => setZones({ ...zones, [zone]: event.target.checked })} className="h-4 w-4 accent-violet-600" />{zone === 'middle' ? 'Through' : zone === 'above' ? 'Above' : 'Below'}</label>)}</div>
    </fieldset>
    </div>
  </TextToolLayout>;
}
