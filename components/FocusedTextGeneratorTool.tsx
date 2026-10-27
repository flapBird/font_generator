'use client';

import { generateStyleVariants, type GeneratorPageConfig } from '@/lib/generator';
import { useGeneratorText } from '@/lib/use-generator-text';
import TextOutputCard from './TextOutputCard';
import TextToolInput from './TextToolInput';
import TextToolLayout from './TextToolLayout';

export default function FocusedTextGeneratorTool({ config, pageTitle, handwriting = false }: {
  config: GeneratorPageConfig; pageTitle: string; handwriting?: boolean;
}) {
  const [text, setText] = useGeneratorText(pageTitle);
  const results = generateStyleVariants(text, config.styleIds);
  return <TextToolLayout id={handwriting ? 'copyable-styles' : 'generator'} label={`${pageTitle} workspace`} controls={<>
    {handwriting && <div><h2 className="font-medium text-slate-950 dark:text-white">Copyable script alternatives</h2><p className="mt-2 text-sm leading-6 text-slate-500">Unicode text for bios and messages. These characters do not reproduce the handwriting artwork above.</p></div>}
    <TextToolInput id="generator-input" text={text} onChange={setText} limit={240} />
    <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">{handwriting ? 'Tap a script result to copy it.' : 'Compare the styles, then tap any result to copy.'}</p>
  </>}>
    <div className="flex flex-wrap justify-between gap-2 text-sm"><h3 className="font-medium text-slate-700 dark:text-slate-200">{results.length} {text.trim() ? 'generated' : 'available'} {results.length === 1 ? 'style' : 'styles'}</h3><span className="text-violet-700 dark:text-violet-300">Tap a result to copy</span></div>
    {results.map((style) => <TextOutputCard key={style.id} title={style.name} text={style.text} />)}
  </TextToolLayout>;
}
