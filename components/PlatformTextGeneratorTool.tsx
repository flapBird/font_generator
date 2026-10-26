'use client';

import { useMemo, useState } from 'react';
import { getStyleDefinition, type GeneratorPageConfig } from '@/lib/generator';
import { framePetName, petFrames, platformTextConfigs, styleSocialText, xPostLength, type PetFrame } from '@/lib/social-text';
import { useGeneratorText } from '@/lib/use-generator-text';
import TextOutputCard from './TextOutputCard';

export default function PlatformTextGeneratorTool({ slug, config, pageTitle }: { slug: string; config: GeneratorPageConfig; pageTitle: string }) {
  const platform = platformTextConfigs[slug];
  const [text, setText] = useGeneratorText(pageTitle);
  const [destination, setDestination] = useState(platform.destinations[0].id);
  const [frame, setFrame] = useState<PetFrame>('none');
  const isX = slug === 'twitter-font-generator';
  const isPet = slug === 'adopt-me-font-generator';
  const preserveEntities = isX || slug === 'twitch-font-generator';
  const results = useMemo(() => config.styleIds.map((id) => {
    const style = getStyleDefinition(id)!;
    const styled = preserveEntities ? styleSocialText(text, style.transform) : style.transform(text);
    const output = isPet ? framePetName(styled, frame) : styled;
    return { id, title: style.name, text: output, length: isX ? xPostLength(output) : 0 };
  }), [config.styleIds, frame, isPet, isX, preserveEntities, text]);

  return (
    <section aria-label={`${platform.label} text workspace`} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-4 leading-7 text-slate-600 dark:text-slate-300">{platform.intro}</p>
      <div role="group" aria-label="Text destination" className="mb-4 flex flex-wrap gap-2">
        {platform.destinations.map((item) => <button key={item.id} type="button" aria-pressed={destination === item.id} onClick={() => setDestination(item.id)} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${destination === item.id ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'}`}>{item.label}</button>)}
      </div>
      <p className="mb-5 rounded-xl bg-violet-50 p-4 text-sm leading-6 text-violet-950 dark:bg-violet-950/40 dark:text-violet-200">{platform.destinations.find((item) => item.id === destination)?.note}</p>
      {slug === 'twitch-font-generator' && <p className="mb-4 text-sm leading-6 text-slate-600 dark:text-slate-300">Twitch display names generally change username capitalization; localized-name options are separate. This tool cannot turn your account name into a decorative Unicode font.</p>}
      <label htmlFor="platform-input" className="font-bold text-slate-950 dark:text-white">{isPet ? 'Pet name or label' : 'Your text'}</label>
      <textarea id="platform-input" rows={3} maxLength={1000} value={text} onChange={(event) => setText(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white p-4 text-lg text-slate-950 focus:outline-violet-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
      <div className="mb-5 mt-2 flex items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400"><span>{text.length} / 1,000 input characters</span><button type="button" onClick={() => setText('')} className="px-3 py-2 font-semibold text-violet-700 dark:text-violet-300">Clear text</button></div>
      {preserveEntities && <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">Detected links, @mentions, #hashtags, and $cashtags stay unchanged so styling does not break them.</p>}
      {isPet && <div className="mb-5"><label htmlFor="pet-frame" className="font-semibold text-slate-950 dark:text-white">Name decoration</label><select id="pet-frame" value={frame} onChange={(event) => setFrame(event.target.value as PetFrame)} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white">{Object.entries(petFrames).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></div>}
      <div className="grid gap-4 md:grid-cols-2">
        <TextOutputCard title="Original text" text={text} description="Unchanged input, without added styling or frames." />
        {results.map((result) => <TextOutputCard key={result.id} title={result.title} text={result.text} description={isX && destination === 'post' ? `${result.length} / 280 — standard post estimate${result.length > 280 ? ' · Over limit; shorten your text' : ''}` : undefined} />)}
      </div>
      <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-400">Free, unofficial, and processed in your browser. No platform login, font installation, or name-availability check. Always preview the copied result in its destination.</p>
      <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-violet-700 dark:text-violet-300">{platform.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</div>
    </section>
  );
}
