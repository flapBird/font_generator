'use client';

import { useMemo, useState } from 'react';
import type { GeneratorPageConfig, GeneratorStyleCategory } from '@/lib/generator';
import {
  generateStyleVariants,
  generatorStyles,
} from '@/lib/generator';

interface GeneratorToolProps {
  config: GeneratorPageConfig;
  examples: string[];
  pageTitle: string;
}

const categoryLabels: Record<GeneratorStyleCategory, string> = {
  classic: 'Classic',
  modern: 'Modern',
  decorative: 'Decorative',
  symbols: 'Symbols',
  effects: 'Effects',
};

type ActiveFilter = 'recommended' | GeneratorStyleCategory;

export default function GeneratorTool({
  config,
  examples,
  pageTitle,
}: GeneratorToolProps) {
  const [inputText, setInputText] = useState(config.initialText);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('recommended');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const fallbackText = inputText || config.initialText;

  const visibleStyleIds = useMemo(() => {
    if (activeFilter === 'recommended') return config.styleIds;
    return generatorStyles
      .filter((style) => style.category === activeFilter)
      .map((style) => style.id);
  }, [activeFilter, config.styleIds]);

  const variants = useMemo(
    () => generateStyleVariants(fallbackText, visibleStyleIds),
    [fallbackText, visibleStyleIds],
  );

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setStatusMessage(`${id === 'all' ? 'All visible styles' : 'Style'} copied.`);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setStatusMessage('Copy was blocked by the browser. Select the text and copy it manually.');
    }
  };

  const copyAll = () => {
    const combined = variants
      .map((variant) => `${variant.name}\n${variant.text}`)
      .join('\n\n');
    void copyText(combined, 'all');
  };

  const cycleExample = () => {
    const candidates = [config.initialText, ...examples].filter(Boolean);
    const currentIndex = candidates.indexOf(inputText);
    setInputText(candidates[(currentIndex + 1) % candidates.length] ?? config.initialText);
  };

  const filters: { id: ActiveFilter; label: string }[] = [
    { id: 'recommended', label: `Best for this page (${config.styleIds.length})` },
    ...Object.entries(categoryLabels).map(([id, label]) => ({
      id: id as GeneratorStyleCategory,
      label,
    })),
  ];

  return (
    <section
      id="generator"
      aria-labelledby="generator-heading"
      className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="border-b border-slate-200/80 bg-slate-950 px-5 py-6 text-white sm:px-8 sm:py-7 dark:border-slate-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
              {config.intentLabel}
            </p>
            <h2 id="generator-heading" className="mt-2 text-2xl font-bold sm:text-3xl">
              Generate {pageTitle.replace(/\s+Generator$/i, '')}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
              {config.resultIntro}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-300">
            <span className="rounded-full border border-white/15 px-3 py-1.5">Instant preview</span>
            <span className="rounded-full border border-white/15 px-3 py-1.5">No sign-up</span>
            <span className="rounded-full border border-white/15 px-3 py-1.5">Copy &amp; paste</span>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <label htmlFor="generator-input" className="text-sm font-semibold text-slate-900 dark:text-white">
              Enter your text
            </label>
            <textarea
              id="generator-input"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              rows={3}
              maxLength={240}
              placeholder="Type or paste text here"
              className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-lg leading-7 text-slate-950 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-violet-400"
              autoComplete="off"
            />
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>Results update while you type.</span>
              <span>{inputText.length}/240</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Quick actions
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
              <button
                type="button"
                onClick={cycleExample}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-violet-400 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                Try another example
              </button>
              <button
                type="button"
                onClick={() => setInputText('')}
                disabled={!inputText}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-violet-400 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                Clear input
              </button>
              <button
                type="button"
                onClick={copyAll}
                className="col-span-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 lg:col-span-1"
              >
                {copiedId === 'all' ? 'Copied all styles' : 'Copy visible styles'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-7 border-t border-slate-200 pt-6 dark:border-slate-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                {variants.length} generated styles
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Start with the page-specific recommendations or explore another style family.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const results = document.getElementById('generated-results');
                results?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="self-start text-sm font-semibold text-violet-700 hover:text-violet-900 dark:text-violet-300"
            >
              Jump to results ↓
            </button>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2" aria-label="Style filters">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                aria-pressed={activeFilter === filter.id}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeFilter === filter.id
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                    : 'border border-slate-300 bg-white text-slate-600 hover:border-violet-400 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div id="generated-results" className="mt-4 grid gap-3 scroll-mt-24">
          {variants.map((variant) => (
            <article
              key={variant.id}
              className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-violet-300 hover:shadow-[0_16px_40px_-32px_rgba(109,40,217,0.8)] sm:p-5 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-violet-700"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-slate-900 dark:text-white">{variant.name}</h4>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                      {categoryLabels[variant.category]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {variant.description}
                  </p>
                  <p className="mt-3 break-words text-xl leading-8 text-slate-950 sm:text-2xl dark:text-white">
                    {variant.text}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void copyText(variant.text, variant.id)}
                  aria-label={`Copy ${variant.name} result`}
                  className="shrink-0 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-600 sm:self-center dark:bg-white dark:text-slate-950 dark:hover:bg-violet-300"
                >
                  {copiedId === variant.id ? 'Copied' : 'Copy'}
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-3 border-t border-slate-200 pt-6 sm:grid-cols-3 dark:border-slate-800">
          {config.bestFor.map((item) => (
            <div key={item} className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Works well for</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{item}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {config.compatibilityNote}
        </p>
        <p className="sr-only" aria-live="polite">{statusMessage}</p>
      </div>
    </section>
  );
}
