'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getLetterStyles, latinAlphabet } from '@/lib/letter-styles';
import { getStyleDefinition } from '@/lib/generator';
import TextToolLayout, { type TextWorkspace } from './TextToolLayout';
import TextOutputCard from './TextOutputCard';

const defaultStyle = 'bold';

export default function LetterStylesTool(workspace: Pick<TextWorkspace, 'config' | 'navigationItems' | 'pageTitle'>) {
  const [letter, setLetter] = useState('A');
  const [lowercase, setLowercase] = useState(false);
  const [styleId, setStyleId] = useState(defaultStyle);
  const character = lowercase ? letter.toLowerCase() : letter;
  const variants = getLetterStyles(character);
  const current = variants.find((item) => item.id === styleId) ?? variants[0];
  const alphabet = Array.from(lowercase ? latinAlphabet.toLowerCase() : latinAlphabet).join(' ');
  const styledAlphabet = getStyleDefinition(current.id)?.transform(alphabet) ?? alphabet;

  return (
    <TextToolLayout
      id="generator"
      label="Letter styles workspace"
      workspace={{ ...workspace, preview: current, outputLabel: 'Copyable Unicode', mobileDirectoryAfterResults: true }}
      controls={<div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="letter-picker" className="text-sm font-semibold">Choose a letter</label>
          <select id="letter-picker" value={letter} onChange={(event) => setLetter(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 font-semibold dark:border-slate-700 dark:bg-slate-950">
            {Array.from(latinAlphabet, (value) => <option key={value} value={value}>{lowercase ? value.toLowerCase() : value}</option>)}
          </select>
        </div>
        <div role="group" aria-label="Letter case" className="flex flex-wrap gap-2">
          {['Uppercase', 'Lowercase'].map((label, index) => <button key={label} type="button" aria-pressed={lowercase === Boolean(index)} onClick={() => setLowercase(Boolean(index))} className={`min-h-11 rounded-lg border px-3 text-sm font-semibold focus-visible:outline-violet-600 ${lowercase === Boolean(index) ? 'border-violet-500 bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950'}`}>{label}</button>)}
        </div>
      </div>}
    >
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{character} in different fonts</h3>
      <div className="grid gap-2 min-[375px]:grid-cols-2">
        {variants.map((variant) => <TextOutputCard key={variant.id} title={variant.name} text={variant.text} compact
          selected={current.id === variant.id} onPreview={() => setStyleId(variant.id)} />)}
      </div>
      <div className="space-y-3 rounded-2xl border border-slate-200 p-3 sm:p-4 dark:border-slate-800">
        <label htmlFor="alphabet-style" className="block text-sm font-semibold">Alphabet style</label>
        <select id="alphabet-style" value={current.id} onChange={(event) => setStyleId(event.target.value)} className="min-h-11 max-w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
          {variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name}</option>)}
        </select>
        <TextOutputCard title="Full alphabet" text={styledAlphabet} compact description="Letters without a matching character keep their ordinary form." />
      </div>
      <Link href="/" className="inline-flex min-h-11 items-center text-sm font-semibold text-violet-700 underline dark:text-violet-300">Style a whole name or phrase →</Link>
    </TextToolLayout>
  );
}
