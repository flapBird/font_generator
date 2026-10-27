'use client';

import { useState } from 'react';
import { generateStyleVariants, type GeneratorPageConfig } from '@/lib/generator';
import { discordFormats, formatDiscordMessage, type DiscordFormat } from '@/lib/text-effects';
import { useGeneratorText } from '@/lib/use-generator-text';
import TextOutputCard from './TextOutputCard';
import TextToolInput from './TextToolInput';
import TextToolLayout from './TextToolLayout';
import type { GeneratorSearchItem } from './GeneratorTool';

export default function DiscordGeneratorTool({ config, navigationItems }: { config: GeneratorPageConfig; navigationItems: GeneratorSearchItem[] }) {
  const [text, setText] = useGeneratorText('Discord Font Generator');
  const [mode, setMode] = useState<'unicode' | 'message'>('unicode');
  const [format, setFormat] = useState<DiscordFormat>('bold');
  const [selectedId, setSelectedId] = useState(config.styleIds[0]);
  const results = generateStyleVariants(text, config.styleIds);
  const selectedFormat = discordFormats.find((item) => item.id === format)!;
  // Tailwind scans components, not lib/text-effects.ts; keep the unique strike utility discoverable.
  const previewClassName = format === 'strike' ? 'line-through' : selectedFormat.className;
  const preview = mode === 'message' ? { id: 'markdown', name: `${selectedFormat.name} (Markdown)`, text: formatDiscordMessage(text, format), category: 'classic' as const, formattedText: { text, className: previewClassName } } : (results.find((style) => style.id === selectedId) ?? results[0]);
  const messageResults = discordFormats.map((item) => ({ ...item, title: `${item.name} (Markdown)`, text: formatDiscordMessage(text, item.id) }));
  const optionClass = (active: boolean) => `min-h-11 rounded-xl border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${active ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-violet-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'}`;
  return <TextToolLayout workspace={{ pageTitle: 'Discord Font Generator', config, navigationItems, preview, outputLabel: mode === 'message' ? 'Markdown source' : 'Copyable text' }} label="Discord text workspace" controls={<>
    <TextToolInput id="discord-input" text={text} onChange={setText} />
    <fieldset><legend className="mb-2 text-sm font-medium text-slate-950 dark:text-white">Use text for</legend>
      <div role="group" aria-label="Text destination" className="grid gap-2 lg:grid-cols-2">
        {([['unicode', 'Names & bios (Unicode)'], ['message', 'Messages (Markdown)']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)} className={optionClass(mode === value)}>{label}</button>)}
      </div>
    </fieldset>
    <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{mode === 'unicode' ? 'For display names and bios. These are not valid for your unique @username.' : 'Compare all six formats below. Copy the Markdown source into a message, not a display name.'}</p>
  </>} footer={<details className="mt-5 border-t border-slate-200 pt-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:text-slate-400">
    <summary className="cursor-pointer py-2 font-medium">Discord tips & compatibility</summary>
    <p className="mt-3">Display names allow special characters and have a 32-character limit. Unique usernames use a–z, 0–9, underscores, and periods. Unicode rendering and server rules can vary. This independent tool does not change Discord’s interface font.</p>
    <p className="mt-3">Message mode wraps each nonempty line and escapes existing formatting symbols. Copy the source into a message outside a code block. The preview is illustrative; check the final message in Discord.</p>
    <div className="mt-3 flex flex-wrap gap-4 text-violet-700 dark:text-violet-300"><a href="https://support.discord.com/hc/en-us/articles/210298617" target="_blank" rel="noreferrer">Discord formatting reference ↗</a><a href="https://support.discord.com/hc/en-us/articles/12620128861463" target="_blank" rel="noreferrer">Discord name rules ↗</a></div>
  </details>}>
    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">{mode === 'unicode' ? `${config.styleIds.length} styles · Tap a result to copy` : '6 message formats · Tap a result to copy'}</h3>
    {mode === 'unicode' ? results.map((style) => <TextOutputCard key={style.id} title={style.name} text={style.text} selected={preview.id === style.id} onPreview={() => setSelectedId(style.id)} />) : messageResults.map((item) => (
      <TextOutputCard key={item.id} title={item.title} text={item.text}
        selected={format === item.id} onPreview={() => setFormat(item.id)} />
    ))}
  </TextToolLayout>;
}
