'use client';

import { useState } from 'react';
import { generateStyleVariants, type GeneratorPageConfig } from '@/lib/generator';
import { discordFormats, formatDiscordMessage, type DiscordFormat } from '@/lib/text-effects';
import { useGeneratorText } from '@/lib/use-generator-text';
import TextOutputCard from './TextOutputCard';

export default function DiscordGeneratorTool({ config }: { config: GeneratorPageConfig }) {
  const [text, setText] = useGeneratorText('Discord Font Generator');
  const [mode, setMode] = useState<'unicode' | 'message'>('unicode');
  const [format, setFormat] = useState<DiscordFormat>('bold');
  const selected = discordFormats.find((item) => item.id === format)!;
  return (
    <section aria-label="Discord text workspace" className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
      <div role="group" aria-label="Text destination" className="mb-5 flex flex-wrap gap-2">
        {([['unicode', 'Names & bios (Unicode)'], ['message', 'Messages (Markdown)']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)} className={`rounded-xl border px-4 py-3 font-semibold ${mode === value ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'}`}>{label}</button>)}
      </div>
      <p className="mb-5 leading-7 text-slate-600 dark:text-slate-300">{mode === 'unicode' ? 'Copy decorative characters for a display name, server nickname, or bio. These are not valid for your unique @username. Test the exact field before saving.' : 'Copy native Discord message formatting. Markdown markers format chat messages; they do not style display names. This tool wraps each nonempty line and escapes existing formatting symbols.'}</p>
      <label htmlFor="discord-input" className="font-bold text-slate-950 dark:text-white">Your text</label>
      <textarea id="discord-input" rows={3} value={text} onChange={(event) => setText(event.target.value)} className="mb-5 mt-2 w-full rounded-xl border border-slate-300 bg-white p-4 text-lg text-slate-950 focus:outline-violet-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
      {mode === 'unicode' ? <div className="grid gap-4 md:grid-cols-2">{generateStyleVariants(text, config.styleIds).map((style) => <TextOutputCard key={style.id} title={style.name} text={style.text} />)}</div> : <>
        <fieldset className="mb-5">
          <legend className="mb-2 text-sm font-medium text-slate-950 dark:text-white">Message format</legend>
          <div className="flex flex-wrap gap-2">
            {discordFormats.map((item) => <button key={item.id} type="button" aria-pressed={format === item.id} onClick={() => setFormat(item.id)} className={`min-h-11 rounded-xl border px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${item.className} ${format === item.id ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-violet-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'}`}>{item.name}</button>)}
          </div>
        </fieldset>
        <div className="mb-5 rounded-2xl bg-white p-5 dark:bg-slate-950">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Formatting preview</h3>
          <p className={`mt-3 whitespace-pre-wrap break-words text-xl text-slate-950 dark:text-white ${selected.className}`}>{text || 'Enter text to preview'}</p>
          <p className="mt-3 text-xs text-slate-500">Illustrative preview; check the final message in Discord.</p>
        </div>
        <TextOutputCard title="Discord Markdown" text={formatDiscordMessage(text, format)} description="Copy this source into a Discord message, outside a code block." />
      </>}
      <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-400">Display names allow special characters and have a 32-character limit. Unique usernames use a–z, 0–9, underscores, and periods. Unicode rendering and server rules can vary. This independent tool does not change Discord’s interface font.</p>
      <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-violet-700 dark:text-violet-300">
        <a href="https://support.discord.com/hc/en-us/articles/210298617" target="_blank" rel="noreferrer">Discord formatting reference ↗</a>
        <a href="https://support.discord.com/hc/en-us/articles/12620128861463" target="_blank" rel="noreferrer">Discord name rules ↗</a>
      </div>
    </section>
  );
}
