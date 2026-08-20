'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { GeneratorPageConfig, GeneratorStyleCategory } from '@/lib/generator';
import {
  generateStyleVariants,
  generatorStyles,
} from '@/lib/generator';

interface GeneratorToolProps {
  config: GeneratorPageConfig;
  discoveryItems?: {
    icon: string;
    title: string;
    description: string;
    preview?: string;
    tone?: 'violet' | 'rose' | 'cyan' | 'amber' | 'emerald';
    href?: string;
    linkLabel?: string;
  }[];
  pageTitle: string;
  enableStyleSearch?: boolean;
  initialResultLimit?: number;
  recommendedLabel?: string;
  compactResults?: boolean;
  enablePopularFilters?: boolean;
  showSocialPreview?: boolean;
}

const categoryLabels: Record<GeneratorStyleCategory, string> = {
  classic: 'Classic',
  modern: 'Modern',
  decorative: 'Decorative',
  symbols: 'Symbols',
  effects: 'Effects',
};

type ActiveFilter = 'recommended' | GeneratorStyleCategory;

type PopularFilter = {
  id: string;
  label: string;
  styleIds: string[];
};

const popularFilters: PopularFilter[] = [
  { id: 'all', label: 'All', styleIds: [] },
  { id: 'cursive', label: 'Cursive', styleIds: ['script', 'boldScript', 'italic', 'boldItalic', 'sparkle'] },
  { id: 'bold', label: 'Bold', styleIds: ['bold', 'sansBold', 'boldItalic', 'sansBoldItalic', 'boldFraktur'] },
  { id: 'gothic', label: 'Gothic', styleIds: ['fraktur', 'boldFraktur', 'gothicFrame', 'cross'] },
  { id: 'cute', label: 'Cute', styleIds: ['hearts', 'sparkle', 'bubbleFrame', 'circled', 'dotted'] },
  { id: 'bubble', label: 'Bubble', styleIds: ['circled', 'darkCircled', 'bubbleFrame', 'parenthesized'] },
  { id: 'tiny', label: 'Tiny', styleIds: ['smallCaps', 'superscript', 'subscript', 'tinyWave'] },
  { id: 'aesthetic', label: 'Aesthetic', styleIds: ['fullwidth', 'wideSpaced', 'script', 'spaced', 'sparkle'] },
  { id: 'gaming', label: 'Gaming', styleIds: ['squared', 'darkCircled', 'pixelFrame', 'angleBrackets', 'fire'] },
  { id: 'instagram', label: 'Instagram', styleIds: ['boldScript', 'smallCaps', 'sansBold', 'hearts', 'sparkle'] },
  { id: 'tattoo', label: 'Tattoo', styleIds: ['boldScript', 'script', 'boldFraktur', 'fraktur', 'gothicFrame'] },
  { id: 'glitch', label: 'Glitch', styleIds: ['glitch', 'slash', 'strikethrough', 'dotted'] },
  { id: 'weird', label: 'Weird', styleIds: ['inverted', 'backwards', 'ransom', 'randomCase', 'wave'] },
  { id: 'symbols', label: 'Symbols', styleIds: ['hearts', 'stars', 'sparkle', 'brackets', 'arrows'] },
  { id: 'upside-down', label: 'Upside Down', styleIds: ['inverted', 'upsideFrame', 'backwards'] },
];

const styleSearchAliases: Record<string, string[]> = {
  bold: ['strong', 'headline', 'serif'],
  italic: ['slanted', 'serif'],
  boldItalic: ['slanted', 'strong'],
  script: ['cursive', 'calligraphy', 'handwriting', 'signature', 'tattoo'],
  boldScript: ['cursive', 'calligraphy', 'handwriting', 'signature', 'tattoo'],
  fraktur: ['gothic', 'blackletter', 'old english', 'medieval', 'tattoo'],
  boldFraktur: ['gothic', 'blackletter', 'old english', 'medieval', 'metal', 'tattoo'],
  monospace: ['typewriter', 'terminal', 'code', 'hacker'],
  doubleStruck: ['outline', 'fancy'],
  circled: ['bubble', 'round', 'enclosed'],
  darkCircled: ['bubble', 'badge', 'enclosed'],
  squared: ['box', 'block', 'gaming', 'minecraft'],
  fullwidth: ['wide', 'vaporwave', 'aesthetic', 'retro'],
  smallCaps: ['tiny', 'small', 'instagram', 'bio'],
  superscript: ['tiny', 'small', 'raised'],
  subscript: ['tiny', 'small', 'lowered'],
  sans: ['clean', 'minimal', 'modern', 'instagram', 'bio'],
  sansBold: ['clean', 'modern', 'headline', 'gaming'],
  sansItalic: ['clean', 'modern', 'slanted'],
  sansBoldItalic: ['modern', 'slanted', 'social'],
  inverted: ['upside down', 'flipped', 'reverse'],
  backwards: ['reverse', 'mirror'],
  glitch: ['zalgo', 'corrupt', 'creepy', 'weird', 'horror'],
  ransom: ['mixed', 'weird', 'punk'],
  sparkle: ['cute', 'aesthetic', 'instagram', 'bio'],
  hearts: ['love', 'cute', 'romantic', 'instagram', 'bio'],
  gothicFrame: ['gothic', 'blackletter', 'old english', 'medieval', 'tattoo'],
  pixelFrame: ['pixel', 'gaming', 'minecraft'],
  angleBrackets: ['tech', 'gaming', 'hacker'],
  bubbleFrame: ['bubble', 'cute', 'round'],
  fire: ['gaming', 'hot'],
};

const normalizeSearchText = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const discoveryToneClasses = {
  violet: 'from-violet-100 to-fuchsia-50 text-violet-800 dark:from-violet-950/70 dark:to-fuchsia-950/30 dark:text-violet-200',
  rose: 'from-rose-100 to-orange-50 text-rose-800 dark:from-rose-950/60 dark:to-orange-950/30 dark:text-rose-200',
  cyan: 'from-cyan-100 to-sky-50 text-cyan-900 dark:from-cyan-950/60 dark:to-sky-950/30 dark:text-cyan-200',
  amber: 'from-amber-100 to-yellow-50 text-amber-900 dark:from-amber-950/60 dark:to-yellow-950/30 dark:text-amber-200',
  emerald: 'from-emerald-100 to-teal-50 text-emerald-900 dark:from-emerald-950/60 dark:to-teal-950/30 dark:text-emerald-200',
};

export default function GeneratorTool({
  config,
  discoveryItems,
  pageTitle,
  enableStyleSearch = false,
  initialResultLimit = 100,
  recommendedLabel,
  compactResults = false,
  enablePopularFilters = false,
  showSocialPreview = false,
}: GeneratorToolProps) {
  const [inputText, setInputText] = useState(config.initialText);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('recommended');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [styleQuery, setStyleQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(initialResultLimit);
  const [popularFilterId, setPopularFilterId] = useState('all');
  const [previewStyleId, setPreviewStyleId] = useState<string | null>(null);

  const filteredStyleIds = useMemo(() => {
    const categoryStyleIds = activeFilter === 'recommended'
      ? config.styleIds
      : generatorStyles
          .filter((style) => style.category === activeFilter)
          .map((style) => style.id);

    if (!enablePopularFilters || popularFilterId === 'all') return categoryStyleIds;

    const collection = popularFilters.find((filter) => filter.id === popularFilterId);
    const collectionIds = new Set(collection?.styleIds ?? []);

    return categoryStyleIds.filter((styleId) => collectionIds.has(styleId));
  }, [activeFilter, config.styleIds, enablePopularFilters, popularFilterId]);

  const searchedStyleIds = useMemo(() => {
    const query = normalizeSearchText(styleQuery);
    if (!enableStyleSearch || !query) return filteredStyleIds;

    const tokens = query.split(/\s+/).filter(Boolean);
    const allowedIds = new Set(filteredStyleIds);

    return generatorStyles
      .filter((style) => allowedIds.has(style.id))
      .filter((style) => {
        const haystack = normalizeSearchText([
          style.id,
          style.name,
          style.category,
          style.description,
          ...(styleSearchAliases[style.id] ?? []),
        ].join(' '));
        return tokens.every((token) => haystack.includes(token));
      })
      .map((style) => style.id);
  }, [enableStyleSearch, filteredStyleIds, styleQuery]);

  const allVariants = useMemo(
    () => inputText ? generateStyleVariants(inputText, searchedStyleIds) : [],
    [inputText, searchedStyleIds],
  );

  const variants = useMemo(
    () => allVariants.slice(0, visibleLimit),
    [allVariants, visibleLimit],
  );

  const previewVariant = useMemo(
    () => previewStyleId ? allVariants.find((variant) => variant.id === previewStyleId) : undefined,
    [allVariants, previewStyleId],
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

  const filters: { id: ActiveFilter; label: string }[] = [
    { id: 'recommended', label: `${recommendedLabel ?? 'Best for this page'} (${config.styleIds.length})` },
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
      <div className="border-b border-slate-200/80 bg-slate-950 px-5 py-4 text-white sm:px-8 sm:py-5 dark:border-slate-800">
        <h2 id="generator-heading" className="text-xl font-bold sm:text-2xl">
          Generate {pageTitle.replace(/\s+Generator$/i, '')}
        </h2>
        <p className="mt-1.5 max-w-4xl text-sm leading-5 text-slate-300 sm:leading-6">
          {config.resultIntro}
        </p>
      </div>

      <div className="p-5 sm:p-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <label htmlFor="generator-input" className="block text-sm font-semibold text-slate-900 dark:text-white">
              Enter your text
            </label>
            <textarea
              id="generator-input"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              rows={3}
              maxLength={240}
              placeholder="Type or paste text here"
              className="mt-2 h-28 min-h-28 w-full resize-y rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-lg leading-7 text-slate-950 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-violet-400"
              autoComplete="off"
            />
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>Results update while you type.</span>
              <span>{inputText.length}/240</span>
            </div>
          </div>

          <div className="self-start">
            <h3 className="text-center text-sm font-semibold text-slate-900 dark:text-white">
              Quick actions
            </h3>
            <div className="mt-2 grid h-28 grid-rows-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setInputText('')}
                disabled={!inputText}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-violet-400 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                Clear input
              </button>
              <button
                type="button"
                onClick={copyAll}
                className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
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
                {searchedStyleIds.length} {styleQuery ? 'matching' : 'generated'} styles
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {recommendedLabel
                  ? 'Search the full library or narrow the results with a style family.'
                  : 'Start with the page-specific recommendations or explore another style family.'}
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

          {enablePopularFilters && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2" aria-label="Popular font styles">
              {popularFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => {
                    setPopularFilterId(filter.id);
                    setActiveFilter('recommended');
                    setVisibleLimit(initialResultLimit);
                  }}
                  aria-pressed={popularFilterId === filter.id}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    popularFilterId === filter.id
                      ? 'bg-violet-600 text-white'
                      : 'border border-violet-200 bg-violet-50/70 text-violet-800 hover:border-violet-400 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2" aria-label="Style filters">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => {
                  setActiveFilter(filter.id);
                  setPopularFilterId('all');
                  setVisibleLimit(initialResultLimit);
                }}
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

          {enableStyleSearch && (
            <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70">
              <summary className="cursor-pointer text-sm font-semibold text-slate-700 marker:text-violet-500 hover:text-violet-700 dark:text-slate-200 dark:hover:text-violet-300">
                Can’t find a style? Search the library
              </summary>
              <div className="mt-3 flex gap-2">
                <label htmlFor="style-search" className="sr-only">Search font styles</label>
                <input
                  id="style-search"
                  type="search"
                  value={styleQuery}
                  onChange={(event) => {
                    setStyleQuery(event.target.value);
                    setVisibleLimit(initialResultLimit);
                  }}
                  placeholder="Try cursive, tattoo, gothic, bubble, gaming…"
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  autoComplete="off"
                />
                {styleQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setStyleQuery('');
                      setVisibleLimit(initialResultLimit);
                    }}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-violet-400 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                  >
                    Clear
                  </button>
                )}
              </div>
            </details>
          )}
        </div>

        {!inputText && (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Enter text above to generate results.
          </div>
        )}
        {inputText && searchedStyleIds.length === 0 && (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="font-semibold text-slate-800 dark:text-slate-100">No matching font styles</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Try a broader term such as cursive, bold, gothic, cute, or gaming.
            </p>
            <button
              type="button"
              onClick={() => {
                setStyleQuery('');
                setVisibleLimit(initialResultLimit);
              }}
              className="mt-4 text-sm font-bold text-violet-700 hover:text-violet-900 dark:text-violet-300"
            >
              Show all styles
            </button>
          </div>
        )}
        <div id="generated-results" className="mt-4 grid gap-3 scroll-mt-24">
          {variants.map((variant) => (
            <div key={variant.id} className="grid gap-3">
              <article
                className={`group rounded-2xl border border-slate-200 bg-white transition hover:border-violet-300 hover:shadow-[0_16px_40px_-32px_rgba(109,40,217,0.8)] dark:border-slate-800 dark:bg-slate-950 dark:hover:border-violet-700 ${compactResults ? 'p-4' : 'p-4 sm:p-5'}`}
              >
                <div className={compactResults ? 'grid gap-3 sm:grid-cols-[250px_minmax(0,1fr)_auto] sm:items-center' : 'flex flex-col gap-4 sm:flex-row sm:items-center'}>
                  <div className={compactResults ? 'min-w-0' : 'min-w-0 flex-1'}>
                    <div className={`flex items-center gap-2 ${compactResults ? 'flex-wrap sm:flex-nowrap' : 'flex-wrap'}`}>
                      <h4 className={`font-semibold text-slate-900 dark:text-white ${compactResults ? 'sm:whitespace-nowrap' : ''}`}>{variant.name}</h4>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                        {categoryLabels[variant.category]}
                      </span>
                    </div>
                    {compactResults ? (
                      <div className="group/description relative mt-1 min-w-0">
                        <p
                          tabIndex={0}
                          aria-describedby={`description-${variant.id}`}
                          className="truncate text-xs leading-5 text-slate-500 outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-violet-400 dark:text-slate-400"
                        >
                          {variant.description}
                        </p>
                        <span
                          id={`description-${variant.id}`}
                          role="tooltip"
                          className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-max max-w-72 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700 shadow-[0_12px_30px_-16px_rgba(15,23,42,0.35)] group-hover/description:block group-focus-within/description:block dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          {variant.description}
                        </span>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {variant.description}
                      </p>
                    )}
                    {!compactResults && <p className="mt-3 break-words text-xl leading-8 text-slate-950 sm:text-2xl dark:text-white">
                      {variant.text}
                    </p>}
                  </div>
                  {compactResults && <p className="min-w-0 break-words text-xl leading-8 text-slate-950 sm:justify-self-center sm:px-6 sm:text-2xl dark:text-white">{variant.text}</p>}
                  <div className="flex shrink-0 gap-2 sm:justify-end">
                    {showSocialPreview && (
                      <button
                        type="button"
                        onClick={() => setPreviewStyleId((current) => current === variant.id ? null : variant.id)}
                        aria-expanded={previewVariant?.id === variant.id}
                        aria-controls={`social-preview-${variant.id}`}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                          previewVariant?.id === variant.id
                            ? 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
                            : 'border-slate-300 text-slate-600 hover:border-violet-400 hover:text-violet-700 dark:border-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {previewVariant?.id === variant.id ? 'Hide preview' : 'Preview'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void copyText(variant.text, variant.id)}
                      aria-label={`Copy ${variant.name} result`}
                      className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-600 dark:bg-white dark:text-slate-950 dark:hover:bg-violet-300"
                    >
                      {copiedId === variant.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </article>

              {showSocialPreview && previewVariant?.id === variant.id && (
                <section
                  id={`social-preview-${variant.id}`}
                  className="rounded-3xl border border-violet-200 bg-violet-50/40 p-4 sm:p-5 dark:border-violet-900/70 dark:bg-violet-950/20"
                  aria-label={`${variant.name} social profile previews`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">Real-world preview</p>
                      <h5 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{variant.name} in social profiles</h5>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyText(variant.text, variant.id)}
                      className="self-start rounded-xl border border-violet-300 px-4 py-2 text-sm font-bold text-violet-700 hover:bg-white dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-950/40"
                    >
                      Copy preview text
                    </button>
                  </div>

                  <div className="mt-4 flex snap-x gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible">
                    <article className="min-w-[280px] snap-start rounded-2xl border border-slate-200 bg-gradient-to-b from-fuchsia-50 to-white p-5 dark:border-slate-800 dark:from-fuchsia-950/30 dark:to-slate-950">
                      <p className="text-xs font-bold uppercase tracking-wide text-fuchsia-700 dark:text-fuchsia-300">Photo profile</p>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-orange-400 font-black text-white">FG</div>
                        <div><p className="font-bold text-slate-950 dark:text-white">creative.type</p><p className="text-xs text-slate-500">Designing one word at a time</p></div>
                      </div>
                      <p className="mt-4 break-words text-xl leading-8 text-slate-950 dark:text-white">{variant.text}</p>
                      <p className="mt-2 text-sm text-slate-500">New bio idea · copy, paste, create ✨</p>
                    </article>

                    <article className="min-w-[280px] snap-start rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white dark:border-slate-700">
                      <p className="text-xs font-bold uppercase tracking-wide text-cyan-300">Short-video profile</p>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white font-black text-slate-950">FG</div>
                        <div><p className="font-bold">@fontideas</p><p className="text-xs text-slate-400">23.4K followers</p></div>
                      </div>
                      <p className="mt-4 break-words text-xl leading-8">{variant.text}</p>
                      <p className="mt-2 text-sm text-slate-400">Fonts, names &amp; profile inspiration</p>
                    </article>

                    <article className="min-w-[280px] snap-start rounded-2xl border border-slate-200 bg-indigo-50 p-5 dark:border-slate-800 dark:bg-indigo-950/30">
                      <p className="text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Community profile</p>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 font-black text-white">FG</div>
                        <div><p className="font-bold text-slate-950 dark:text-white">Font Explorer</p><p className="text-xs text-slate-500">Online · Creative Club</p></div>
                      </div>
                      <p className="mt-4 break-words text-xl leading-8 text-slate-950 dark:text-white">{variant.text}</p>
                      <p className="mt-2 text-sm text-slate-500">Sharing a new style with the community.</p>
                    </article>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">Illustrative previews only; not affiliated with any social platform.</p>
                </section>
              )}
            </div>
          ))}
        </div>

        {inputText && variants.length < allVariants.length && (
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => setVisibleLimit((current) => current + initialResultLimit)}
              className="rounded-xl border border-violet-300 bg-white px-6 py-3 text-sm font-bold text-violet-700 transition hover:bg-violet-50 dark:border-violet-700 dark:bg-slate-950 dark:text-violet-300 dark:hover:bg-violet-950/30"
            >
              Load more styles ({allVariants.length - variants.length} remaining)
            </button>
          </div>
        )}

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

        {discoveryItems?.length ? (
          <nav
            aria-labelledby="generator-paths-heading"
            className="mt-7 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-violet-50/50 p-4 shadow-[0_24px_60px_-48px_rgba(76,29,149,0.75)] sm:p-6 dark:border-slate-800 dark:from-slate-900 dark:to-violet-950/20"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <div>
                <h3 id="generator-paths-heading" className="text-base font-bold text-slate-950 dark:text-white">
                  Need a different kind of output?
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Choose the output that fits your next task—copyable characters, graphics, plain-text banners, themed styles, or practical help.
                </p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                More tools
              </span>
            </div>
            <div className="mt-5 flex snap-x gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-5">
              {discoveryItems.map((item) => {
                const content = (
                  <>
                    <span className={`flex min-h-24 flex-col justify-between rounded-xl bg-gradient-to-br p-3 ${discoveryToneClasses[item.tone ?? 'violet']}`}>
                      <span aria-hidden="true" className="text-xl">{item.icon}</span>
                      <span className="whitespace-pre-line break-words text-sm font-bold leading-6">{item.preview ?? item.title}</span>
                    </span>
                    <span className="mt-4 block text-sm font-bold text-slate-950 dark:text-white">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</span>
                    <span className={`mt-4 flex items-center justify-between rounded-lg px-3 py-2 text-xs font-bold ${item.href ? 'bg-slate-950 text-white group-hover:bg-violet-600 dark:bg-white dark:text-slate-950 dark:group-hover:bg-violet-300' : 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300'}`}>
                      {item.linkLabel ?? 'Explore'} {item.href ? '→' : ''}
                    </span>
                  </>
                );

                return item.href ? (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group w-60 shrink-0 snap-start rounded-2xl border border-slate-200 bg-white p-3 transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg sm:w-auto dark:border-slate-700 dark:bg-slate-950 dark:hover:border-violet-700"
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    key={item.title}
                    aria-current="page"
                    className="w-60 shrink-0 snap-start rounded-2xl border border-violet-300 bg-white p-3 shadow-sm sm:w-auto dark:border-violet-800 dark:bg-slate-950"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          </nav>
        ) : null}
        <p className="sr-only" aria-live="polite">{statusMessage}</p>
      </div>
    </section>
  );
}
