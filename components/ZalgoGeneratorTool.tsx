'use client';

import { useMemo, useState } from 'react';
import { generateZalgo, ZALGO_INPUT_LIMIT } from '@/lib/text-effects';
import { useGeneratorText } from '@/lib/use-generator-text';
import TextOutputCard from './TextOutputCard';
import TextToolInput from './TextToolInput';
import TextToolLayout from './TextToolLayout';
import type { GeneratorSearchItem } from './GeneratorTool';
import type { GeneratorPageConfig } from '@/lib/generator';

const strengths = [
  { name: 'None', intensity: 0 },
  { name: 'Mild', intensity: 1 },
  { name: 'Medium', intensity: 3 },
  { name: 'Strong', intensity: 6 },
  { name: 'Extreme', intensity: 10 },
] as const;

export default function ZalgoGeneratorTool({ config, navigationItems }: { config: GeneratorPageConfig; navigationItems: GeneratorSearchItem[] }) {
  const [text, setText] = useGeneratorText('Zalgo Text Generator');
  const [intensity, setIntensity] = useState(3);
  const [zones, setZones] = useState({ above: true, middle: true, below: true });
  const [seed, setSeed] = useState(42);
  const [selected, setSelected] = useState('Medium');
  const results = useMemo(() => strengths.map((strength) => ({
    ...strength,
    text: generateZalgo(text, { intensity: strength.intensity, ...zones, seed }),
  })), [text, zones, seed]);
  const customOutput = useMemo(() => generateZalgo(text, { intensity, ...zones, seed }), [text, intensity, zones, seed]);
  const previewText = selected === 'Custom' ? customOutput : results.find((result) => result.name === selected)!.text;
  const tooLong = text.length > ZALGO_INPUT_LIMIT;

  return <TextToolLayout workspace={{ pageTitle: 'Zalgo Text Generator', config, navigationItems, preview: { id: selected, name: `Zalgo — ${selected}`, text: previewText, category: 'effects' } }} label="Zalgo text workspace" controls={<>
    <TextToolInput id="zalgo-input" text={text} onChange={setText} limit={ZALGO_INPUT_LIMIT} />
    {tooLong && <p role="alert" className="text-sm text-red-600">This saved draft is too long. Shorten it to 1,000 characters to generate; your text has not been cut.</p>}
    <details onToggle={(event) => { if (!event.currentTarget.open && selected === 'Custom') setSelected('Medium'); }} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <summary className="cursor-pointer text-sm font-medium text-slate-950 dark:text-white">Advanced settings</summary>
      <div className="mt-4 space-y-4">
        <fieldset><legend className="mb-2 text-sm font-medium text-slate-950 dark:text-white">Mark directions</legend>
          <div className="grid grid-cols-3 gap-2">{(['above', 'middle', 'below'] as const).map((zone) => <label key={zone} className={`flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-2 text-sm ${zones[zone] ? 'border-violet-400 bg-violet-50 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200' : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300'}`}><input type="checkbox" aria-label={zone === 'middle' ? 'Through letters' : zone === 'above' ? 'Above letters' : 'Below letters'} checked={zones[zone]} onChange={(event) => setZones({ ...zones, [zone]: event.target.checked })} className="h-4 w-4 accent-violet-600" />{zone === 'middle' ? 'Through' : zone === 'above' ? 'Above' : 'Below'}</label>)}</div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Applies to every strength below and your custom result.</p>
        </fieldset>
        <div><label htmlFor="zalgo-intensity" className="text-sm font-medium text-slate-950 dark:text-white">Custom intensity: {intensity} / 10</label><input id="zalgo-intensity" type="range" min="0" max="10" value={intensity} onChange={(event) => { setIntensity(Number(event.target.value)); setSelected('Custom'); }} className="mt-2 block w-full accent-violet-600" /></div>
        <TextOutputCard title="Zalgo — Custom" text={customOutput} selected={selected === 'Custom'} onPreview={() => setSelected('Custom')} spacious />
      </div>
    </details>
  </>} footer={<details className="mt-5 border-t border-slate-200 pt-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:text-slate-400"><summary className="cursor-pointer py-2 font-medium">Zalgo tips & compatibility</summary><p className="mt-3">Heavy results can overlap or be rejected by the destination app; start mild for names and chat. Emoji and complex scripts stay unchanged. None or no directions returns your original input. It does not remove accents or clean previously pasted Zalgo text. Text is processed in your browser.</p></details>}>
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">5 strengths · Tap a result to copy</h3><button type="button" onClick={() => setSeed((value) => value + 1)} className="min-h-11 rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500">Randomize marks</button></div>
    {results.map((result) => <TextOutputCard key={result.name} title={`Zalgo — ${result.name}`} text={result.text}
      description={result.intensity === 0 ? 'Original text, without added marks.' : `Intensity ${result.intensity} / 10`}
      selected={selected === result.name} onPreview={() => setSelected(result.name)} spacious={result.intensity > 0} />)}
  </TextToolLayout>;
}
