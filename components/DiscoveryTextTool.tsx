'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { GeneratorPageConfig } from '@/lib/generator';
import { getStyleDefinition } from '@/lib/generator';
import { useGeneratorText } from '@/lib/use-generator-text';
import { discoverySamples } from '@/lib/discovery-catalog';
import { discoveryFrames, discoveryTextResults, messageResults, type DiscoveryFrame, type MessageMode } from '@/lib/discovery-text';
import { segmentGraphemes } from '@/lib/unicode';
import type { GeneratorSearchItem } from './GeneratorTool';
import TextToolLayout from './TextToolLayout';
import TextToolInput from './TextToolInput';
import TextOutputCard from './TextOutputCard';

const notes: Record<string, string> = {
  'old-english-font-generator': 'These copyable blackletter characters style Latin letters, not the Old English language. Numbers and unsupported scripts remain unchanged. Real typefaces and font files are separate products.',
  'whatsapp-font-generator': 'Fancy text is Unicode for supported display fields. Message formatting uses WhatsApp delimiters and only belongs in messages. Existing delimiter conflicts are shown without deleting your input. Preview formatting is illustrative; check the final message in WhatsApp.',
  'square-text-generator': 'Square alphabets use uppercase Latin letters. Digits, punctuation, other scripts and existing emoji stay unchanged. Filled squares may appear as colored emoji depending on the device.',
  'snapchat-font-generator': 'Use a short display name, chat or caption. Display names allow up to 30 characters, but this visible-character estimate is not a platform validator. Your @username has separate restrictions. Paste and check before saving.',
  'sad-font-generator': 'Choose a readable alphabet and an optional mood frame. Crossed-out and broken strokes use combining marks. These do not create fading colors or an image effect. Emoji and other scripts retain their original spelling.',
  'reddit-font-generator': 'Use Unicode only for short optional accents. Desktop Markdown source belongs in the Markdown editor on reddit.com or old.reddit.com. The mobile app is moving to rich text controls and may display Markdown literally. Community rules and flair permissions vary.',
  'keyboard-font-generator': 'Type using your normal phone keyboard, then tap a result to copy it. This browser tool does not install a keyboard, change your system font or type into other apps. Paste the text into a supported field and check how it appears.',
};
const official: Record<string, [string, string]> = {
  'whatsapp-font-generator': ['WhatsApp formatting help', 'https://faq.whatsapp.com/539178204879377/'],
  'reddit-font-generator': ['Reddit editor help', 'https://support.reddithelp.com/hc/en-us/articles/205191185-How-do-I-format-my-comment-or-post'],
  'snapchat-font-generator': ['Snapchat display names', 'https://help.snapchat.com/hc/en-us/articles/7012316571540-What-is-a-Display-Name-on-Snapchat-How-do-I-change-it'],
};
const optionClass = (active: boolean) => `min-h-11 rounded-xl border px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${active ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'}`;

export default function DiscoveryTextTool({ slug, pageTitle, config, navigationItems }: {
  slug: string; pageTitle: string; config: GeneratorPageConfig; navigationItems: GeneratorSearchItem[];
}) {
  const [text, setText] = useGeneratorText(discoverySamples[slug]);
  const [frame, setFrame] = useState<DiscoveryFrame>('none');
  const [mode, setMode] = useState<MessageMode>('text');
  const [selectedId, setSelectedId] = useState('');
  const [spaced, setSpaced] = useState(false);
  const [destination, setDestination] = useState('Display name');
  const platform = slug === 'whatsapp-font-generator' ? 'whatsapp' : slug === 'reddit-font-generator' ? 'reddit' : undefined;
  const overLimit = text.length > 1000;
  const results = platform && mode === 'format' ? messageResults(overLimit ? '' : text, platform) : discoveryTextResults(text, slug, frame, spaced);
  const selected = results.find((result) => result.id === selectedId) ?? results[0];
  // Explicit classes stay discoverable by Tailwind without changing global scans.
  const previewClasses: Record<string, string> = { bold: 'font-bold', italic: 'italic', strike: 'line-through', code: 'font-mono', monospace: 'font-mono' };
  const preview = { ...selected, category: 'classic' as const, ...(mode === 'format' ? { formattedText: { text: selected.previewText ?? '', className: previewClasses[selected.id] ?? '' } } : {}) };
  const frames: DiscoveryFrame[] = slug === 'sad-font-generator' ? ['none', 'broken', 'rain', 'rose'] : slug === 'old-english-font-generator' ? ['none', 'royal', 'brackets'] : [];

  return <TextToolLayout id="generator" label={`${pageTitle} workspace`} workspace={{ pageTitle, config, navigationItems, preview, mobileDirectoryAfterResults: true, outputLabel: mode === 'format' ? 'Formatting source' : 'Copyable text' }} controls={<>
    <TextToolInput id="generator-input" text={text} onChange={setText} limit={1000} />
    {overLimit && <p role="alert">Shorten your text to 1,000 characters to generate results. Your input has not been truncated.</p>}
    {platform && <fieldset><legend className="mb-2 text-sm font-semibold">Output type</legend><div className="flex flex-wrap gap-2">
      <button type="button" className={optionClass(mode === 'text')} aria-pressed={mode === 'text'} onClick={() => setMode('text')}>Fancy text</button>
      <button type="button" className={optionClass(mode === 'format')} aria-pressed={mode === 'format'} onClick={() => setMode('format')}>{platform === 'reddit' ? 'Desktop Markdown' : 'Message formatting'}</button>
    </div><p className="mt-2 text-xs leading-5 text-slate-500">{mode === 'format' ? platform === 'reddit' ? 'For desktop Markdown editors. On mobile, use Reddit’s rich text controls.' : 'Copy source into a message. Names and About fields do not render these shortcuts.' : 'Decorative characters, not an installed font. Detected links and references remain unchanged.'}</p></fieldset>}
    {!!frames.length && <fieldset><legend className="mb-2 text-sm font-semibold">Decoration</legend><div className="flex flex-wrap gap-2">{frames.map((value) => <button key={value} type="button" className={optionClass(frame === value)} aria-pressed={frame === value} onClick={() => setFrame(value)}>{discoveryFrames[value][1]}{discoveryFrames[value][0]}</button>)}</div></fieldset>}
    {slug === 'square-text-generator' && <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={spaced} onChange={(event) => setSpaced(event.target.checked)} />Add space between letters</label>}
    {slug === 'snapchat-font-generator' && <fieldset><legend className="mb-2 text-sm font-semibold">Text destination</legend><div className="flex flex-wrap gap-2">{['Display name', 'Chat', 'Caption'].map((value) => <button key={value} type="button" className={optionClass(destination === value)} aria-pressed={destination === value} onClick={() => setDestination(value)}>{value}</button>)}</div><p className="mt-2 text-xs leading-5 text-slate-500">{destination === 'Display name' ? 'Display names are separate from @usernames. Check the final field in Snapchat.' : 'Paste into your chat or caption. This does not change Snapchat’s built-in fonts.'}</p></fieldset>}
    {slug === 'keyboard-font-generator' && <p className="text-sm leading-6 text-slate-500">Use your phone keyboard here → tap a style → paste into your app. No keyboard installation needed.</p>}
  </>} footer={<>
    <details className="mt-5 border-t border-slate-200 pt-2 text-sm leading-6 text-slate-500 dark:border-slate-800"><summary className="min-h-11 cursor-pointer py-3 font-medium">Tips & compatibility</summary><p>{notes[slug]}</p><p className="mt-2">Free and processed in your browser. Unsupported characters are kept. Appearance and acceptance vary by app; keep essential information in ordinary text.</p>{official[slug] && <a className="mt-3 inline-block text-violet-700 underline dark:text-violet-300" href={official[slug][1]} target="_blank" rel="noreferrer">{official[slug][0]} ↗</a>}{slug === 'reddit-font-generator' && <Link className="ml-4 text-violet-700 underline dark:text-violet-300" href="/guides/reddit-fancy-text-guide">Reddit formatting guide</Link>}</details>
    {slug === 'old-english-font-generator' && <details className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800"><summary className="min-h-11 cursor-pointer py-2 font-semibold">Old English alphabet · uppercase & lowercase</summary><div className="mt-3 space-y-3">{['fraktur', 'boldFraktur'].flatMap((id) => ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'].map((alphabet, index) => <TextOutputCard key={`${id}-${index}`} title={`${getStyleDefinition(id)!.name} ${index ? 'lowercase' : 'uppercase'} alphabet`} text={getStyleDefinition(id)!.transform(alphabet)} />))}</div></details>}
  </>}>
    <div className="flex justify-between gap-2 text-sm text-slate-500"><h3>{mode === 'format' ? 'Copy formatting source' : 'Choose your text style'}</h3><span>Tap a card to copy</span></div>
    {mode === 'format' && <div className="rounded-xl bg-violet-50 p-4 dark:bg-violet-950/30"><p className="mb-2 text-xs font-medium text-violet-700 dark:text-violet-300">Illustrative formatting preview</p><p data-testid="message-preview" className={`whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${previewClasses[selected.id] ?? ''}`}>{selected.previewText || 'Enter text without conflicting delimiters to preview.'}</p></div>}
    {results.map((result) => <TextOutputCard key={result.id} title={result.name} text={result.text} selected={selected.id === result.id} onPreview={() => setSelectedId(result.id)} description={slug === 'snapchat-font-generator' && destination === 'Display name' ? `${segmentGraphemes(result.text).length} / 30 visible characters (estimate)${segmentGraphemes(result.text).length > 30 ? ' · Shorten this name' : ''}` : result.description} />)}
  </TextToolLayout>;
}
