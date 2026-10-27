'use client';

import { generateStyleVariants, type GeneratorPageConfig } from '@/lib/generator';
import { useGeneratorText } from '@/lib/use-generator-text';
import TextOutputCard from './TextOutputCard';
import TextToolInput from './TextToolInput';
import TextToolLayout from './TextToolLayout';
import { useState } from 'react';
import type { GeneratorSearchItem } from './GeneratorTool';

export default function FocusedTextGeneratorTool({ config, pageTitle, handwriting = false, navigationItems }: {
  config: GeneratorPageConfig; pageTitle: string; handwriting?: boolean; navigationItems?: GeneratorSearchItem[];
}) {
  const [text, setText] = useGeneratorText(pageTitle);
  const [selectedId, setSelectedId] = useState(config.styleIds[0]);
  const results = generateStyleVariants(text, config.styleIds);
  const preview = results.find((style) => style.id === selectedId) ?? results[0];
  return <TextToolLayout workspace={navigationItems && preview ? { pageTitle, config, navigationItems, preview } : undefined} id={handwriting ? 'copyable-styles' : 'generator'} label={`${pageTitle} workspace`} controls={<>
    {handwriting && <div><h2 className="font-medium text-slate-950 dark:text-white">Copyable script alternatives</h2><p className="mt-2 text-sm leading-6 text-slate-500">Unicode text for bios and messages. These characters do not reproduce the handwriting artwork above.</p></div>}
    <TextToolInput id="generator-input" text={text} onChange={setText} limit={240} />
    <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">{handwriting ? 'Tap a script result to copy it.' : 'Compare the styles, then tap any result to copy.'}</p>
  </>}>
    <div className="flex flex-wrap justify-between gap-2 text-sm"><h3 className="font-medium text-slate-700 dark:text-slate-200">{results.length} {text.trim() ? 'generated' : 'available'} {results.length === 1 ? 'style' : 'styles'}</h3><span className="text-violet-700 dark:text-violet-300">Tap a result to copy</span></div>
    {results.map((style) => <TextOutputCard key={style.id} title={style.name} text={style.text} selected={Boolean(navigationItems) && preview?.id === style.id} onPreview={() => setSelectedId(style.id)} />)}
  </TextToolLayout>;
}
