'use client';

import { useMemo, useRef, useState } from 'react';
import { getStyleDefinition, type GeneratorPageConfig } from '@/lib/generator';
import { framePetName, petFrames, platformTextConfigs, styleSocialText, xPostLength, type PetFrame } from '@/lib/social-text';
import { useGeneratorText } from '@/lib/use-generator-text';
import TextOutputCard from './TextOutputCard';

const destinationHints: Record<string, Record<string, string>> = {
  'twitter-font-generator': { post: 'Post length is estimated below; check the final X composer.', bio: 'Bios have a 160-character limit. Check the final profile field in X.', name: 'Display names allow up to 50 characters. Your @handle stays plain text.' },
  'roblox-font-generator': { experience: 'Try the result in your experience; filtering varies by field.', profile: 'Preview your description in Roblox before saving.', name: 'These styles are not verified as valid account names. Keep a plain-text fallback.' },
  'twitch-font-generator': { title: 'Keep game names and important search terms in plain text.', bio: 'Use short accents in editable text fields.', chat: 'Channel rules and moderation bots may restrict unusual characters.' },
  'adopt-me-font-generator': { pet: 'Test your pet name in-game; some characters may be filtered.', profile: 'Preview your label in the game before saving.' },
};

export default function PlatformTextGeneratorTool({ slug, config, pageTitle }: { slug: string; config: GeneratorPageConfig; pageTitle: string }) {
  const platform = platformTextConfigs[slug];
  const [text, setText] = useGeneratorText(pageTitle);
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
  const optionClass = (selected: boolean) => `min-h-11 rounded-xl border px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${selected ? 'border-violet-600 bg-violet-600 text-white shadow-sm' : 'border-slate-300 bg-white text-slate-700 hover:border-violet-400 hover:bg-violet-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-violet-950/40'}`;

  return (
    <section aria-label={`${platform.label} text workspace`} className="rounded-3xl border border-slate-200 bg-white p-3 sm:p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-5 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="platform-input" className="text-sm font-medium text-slate-950 dark:text-white">{isPet ? 'Pet name or label' : 'Your text'}</label>
              <button type="button" onClick={() => { setText(''); inputRef.current?.focus(); }} className="min-h-11 rounded-lg px-2 text-sm font-medium text-violet-700 hover:bg-violet-100 focus-visible:outline-violet-500 dark:text-violet-300 dark:hover:bg-violet-950">Clear text</button>
            </div>
            <textarea ref={inputRef} id="platform-input" rows={2} maxLength={1000} value={text} onChange={(event) => setText(event.target.value)} placeholder={isPet ? 'Type a pet name…' : 'Type your text…'} className="block w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-lg text-slate-950 focus:outline-violet-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            <div className="mt-2 flex justify-between gap-2 text-xs text-slate-500 dark:text-slate-400"><span>Styles update as you type</span><span>{text.length} / 1,000</span></div>
          </div>
          {isPet && <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-950 dark:text-white">Name decoration</legend>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(petFrames).map(([id, item]) => <button key={id} type="button" aria-label={item.label} aria-pressed={frame === id} onClick={() => setFrame(id as PetFrame)} className={optionClass(frame === id)}>
                <span aria-hidden="true" className="block text-lg">{framePetName('ɴᴀᴍᴇ', id as PetFrame)}</span>
                <span className="mt-1 block text-xs">{item.label}</span>
              </button>)}
            </div>
          </fieldset>}
          {isX ? <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-950 dark:text-white">Use text for</legend>
            <div role="group" aria-label="Text destination" className="flex flex-wrap gap-2">
              {platform.destinations.map((item) => <button key={item.id} type="button" aria-pressed={destination === item.id} onClick={() => setDestination(item.id)} className={optionClass(destination === item.id)}>{item.label}</button>)}
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{destinationHints[slug][destination]}</p>
          </fieldset> : <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{destinationHints[slug][destination]}</p>}
        </div>
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <h3 className="font-medium text-slate-700 dark:text-slate-200">{results.length} {text.trim() ? 'generated' : 'available'} styles</h3>
            <span className="text-violet-700 dark:text-violet-300">Tap a result to copy</span>
          </div>
          <div className="grid gap-3">
            {results.map((result) => <TextOutputCard key={result.id} title={result.title} text={result.text} description={isX && destination === 'post' ? `${result.length} / 280 — standard post estimate${result.length > 280 ? ' · Over limit; shorten your text' : ''}` : undefined} />)}
            <TextOutputCard title="Original text" text={text} description="Unchanged input, without styling or frames." />
          </div>
        </div>
      </div>
      <details className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
        <summary className="cursor-pointer rounded-lg py-2 font-medium text-slate-700 focus-visible:outline-violet-500 dark:text-slate-200">Platform tips & compatibility</summary>
        <div className="mt-3 space-y-3 leading-6">
          <p>{platform.intro}</p>
          {isX ? <p>{platform.destinations.find((item) => item.id === destination)?.note}</p> : platform.destinations.map((item) => <p key={item.id}><strong className="font-medium text-slate-800 dark:text-slate-200">{item.label}: </strong>{item.note}</p>)}
          {slug === 'twitch-font-generator' && <p>Twitch display names generally change username capitalization; localized-name options are separate. This tool cannot turn your account name into a decorative Unicode font.</p>}
          {preserveEntities && <p>Detected links, @mentions, #hashtags, and $cashtags stay unchanged so styling does not break them.</p>}
          <p>Free, unofficial, and processed in your browser. No platform login, font installation, or name-availability check. Always preview the copied result in its destination.</p>
          <div className="flex flex-wrap gap-4 font-medium text-violet-700 dark:text-violet-300">{platform.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</div>
        </div>
      </details>
    </section>
  );
}
