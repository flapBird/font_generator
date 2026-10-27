'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { GeneratorPageConfig } from '@/lib/generator';
import { useGeneratorText } from '@/lib/use-generator-text';
import { octoberTextResults, textFrames, type OctoberFrame } from '@/lib/october-text';
import { convertWingdings, wingdingsEntries } from '@/lib/wingdings';
import type { GeneratorSearchItem } from './GeneratorTool';
import TextToolLayout from './TextToolLayout';
import TextToolInput from './TextToolInput';
import TextOutputCard from './TextOutputCard';

const buttonClass = 'min-h-11 rounded-lg border px-3 py-2 text-sm font-medium focus-visible:outline-violet-500';
export default function OctoberTextGeneratorTool({ slug, pageTitle, config, navigationItems, embedded = false }: {
  slug: string; pageTitle: string; config: GeneratorPageConfig; navigationItems?: GeneratorSearchItem[]; embedded?: boolean;
}) {
  const [text, setText] = useGeneratorText(pageTitle);
  const [frame, setFrame] = useState<OctoberFrame>('none');
  const [selectedId, setSelectedId] = useState('original');
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode');
  const [gaster, setGaster] = useState(false);
  const [search, setSearch] = useState('');
  const isWingdings = slug === 'wingdings-font-generator';
  const overLimit = text.length > 1000;
  const results = isWingdings ? [{ id: 'wingdings', name: direction === 'encode' ? 'Wingdings symbols' : 'Decoded letters', text: overLimit ? '' : convertWingdings(text, direction, gaster), category: 'symbols' as const, description: 'Portable Unicode approximations; punctuation and unmapped characters remain unchanged.' }]
    : octoberTextResults(overLimit ? '' : text, slug, frame);
  const preview = results.find((item) => item.id === selectedId) ?? results[0];
  const frames: OctoberFrame[] = slug === 'halloween-font-generator' ? ['none', 'pumpkins', 'ghosts'] : slug === 'gaming-font-generator' ? ['none', 'clan', 'stars'] : ['none', 'hearts', 'stars', 'bows'];
  return <TextToolLayout id={embedded ? 'copyable-styles' : 'generator'} label={`${pageTitle} workspace`}
    workspace={!embedded && navigationItems ? { pageTitle, config, navigationItems, preview } : undefined}
    controls={<>
      {embedded && <h2 className="text-xl font-bold">Copyable Halloween text</h2>}
      <TextToolInput id={embedded ? 'halloween-text-input' : 'generator-input'} text={text} onChange={setText} limit={1000} />
      {overLimit && <p role="alert" className="text-sm text-red-700">Your saved draft exceeds 1,000 characters. Shorten it to generate results; your text has not been truncated.</p>}
      {isWingdings ? <>
        <fieldset><legend className="mb-2 text-sm font-semibold">Conversion direction</legend><div className="flex flex-wrap gap-2">
          {(['encode', 'decode'] as const).map((value) => <button key={value} type="button" aria-pressed={direction === value} className={`${buttonClass} ${direction === value ? 'border-violet-500 bg-violet-50 text-violet-900' : 'border-slate-300'}`} onClick={() => setDirection(value)}>{value === 'encode' ? 'Letters → Symbols' : 'Symbols → Letters'}</button>)}
        </div></fieldset>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={gaster} disabled={direction === 'decode'} onChange={(event) => setGaster(event.target.checked)} />Gaster mode — uppercase Latin input</label>
        <p className="text-sm leading-6 text-slate-500">Maps A–Z, a–z and 0–9 separately. This is a Unicode symbol converter, not the original Microsoft font or an official Undertale tool. Decoding assumes the symbols came from this mapping.</p>
      </> : <>
        <fieldset><legend className="mb-2 text-sm font-semibold">Decoration</legend><div className="flex flex-wrap gap-2">{frames.map((value) => <button key={value} type="button" aria-pressed={frame === value} onClick={() => setFrame(value)} className={`${buttonClass} ${frame === value ? 'border-violet-500 bg-violet-50 text-violet-900' : 'border-slate-300'}`}>{textFrames[value][0]}</button>)}</div></fieldset>
        <p className="text-sm leading-6 text-slate-500">{slug === 'k-pop-font-generator' ? 'Style a nickname or a multiline fan bio. Hangul, detected links and mentions stay intact. These are fan-made text styles, not official group logos.' : slug === 'gaming-font-generator' ? 'For display-name ideas and clan labels. Games and account fields may reject styled characters; keep the original fallback and test in the exact field.' : slug === 'emoji-font-generator' ? 'Emoji codes substitute letters for fun; they do not translate sentences. Existing emoji stay intact. Emoji appearance varies by device.' : embedded ? 'These are Unicode text alternatives. Copying them does not copy the horror typefaces in the artwork above.' : 'Use a short name or bio line. Copyable Unicode and decorations may look different across apps.'}</p>
      </>}
    </>}
    footer={slug === 'gaming-font-generator' ? <div className="mt-5 rounded-xl bg-violet-50 p-4 dark:bg-violet-950/30"><h3 className="font-semibold">Choose a game or destination</h3><div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">{[['roblox-font-generator', 'Roblox text'], ['minecraft-font-generator', 'Minecraft artwork & codes'], ['discord-font-generator', 'Discord text'], ['twitch-font-generator', 'Twitch text'], ['fortnite-font-generator', 'Fortnite artwork']].map(([href, label]) => <Link key={href} href={`/${href}`} className="py-2 text-sm text-violet-700 underline dark:text-violet-300">{label}</Link>)}</div></div> : undefined}>
      <div className="flex justify-between gap-2 text-sm text-slate-500"><h3>{isWingdings ? 'Conversion result' : 'Choose your text style'}</h3><span>Tap a result to copy</span></div>
      {results.map((result) => <TextOutputCard key={result.id} title={result.name} text={result.text} description={result.description} selected={preview.id === result.id} onPreview={() => setSelectedId(result.id)} />)}
      {isWingdings && <details className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><summary className="cursor-pointer py-2 font-semibold">Wingdings character chart · 62 characters</summary>
        <label className="mt-4 block text-sm">Find a letter or symbol<input value={search} onChange={(event) => setSearch(event.target.value)} className="mt-2 block w-full rounded-lg border border-slate-300 bg-transparent p-3" type="search" /></label>
        <p className="my-3 text-xs text-slate-500">Each card copies the symbol. Approximate counterparts can differ in shape from Wingdings.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{wingdingsEntries.filter(({ key, symbol }) => !search || key.includes(search) || symbol.includes(search)).map(({ key, symbol }) => <TextOutputCard key={key} title={`Letter ${key}`} text={symbol} description={`U+${symbol.codePointAt(0)!.toString(16).toUpperCase()}`} />)}</div>
        {!wingdingsEntries.some(({ key, symbol }) => !search || key.includes(search) || symbol.includes(search)) && <p className="mt-3">No matching letters or symbols.</p>}
      </details>}
    </TextToolLayout>;
}
