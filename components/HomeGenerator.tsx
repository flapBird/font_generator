'use client';

import Link from '@/components/IntentLink';
import { GeneratorDirectoryContent, type GeneratorSearchItem } from '@/components/GeneratorTool';
import { generateStyleVariants, generatorStyles, type GeneratorPageConfig, type GeneratorStyleCategory } from '@/lib/generator';
import { isVisibleInGeneratorNavigation } from '@/lib/generator-navigation';
import { useGeneratorText } from '@/lib/use-generator-text';
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './HomeGenerator.module.css';

const categories: Record<GeneratorStyleCategory, string> = { classic: 'Classic', modern: 'Modern', decorative: 'Decorative', symbols: 'Symbols', effects: 'Effects' };
const aliases: Record<string, string> = {
  script: 'cursive calligraphy handwriting signature tattoo', boldScript: 'cursive calligraphy handwriting signature tattoo',
  fraktur: 'gothic blackletter old english medieval tattoo', boldFraktur: 'gothic blackletter old english medieval metal',
  monospace: 'typewriter terminal code hacker', doubleStruck: 'outline fancy', circled: 'bubble round enclosed',
  darkCircled: 'bubble badge enclosed', squared: 'box block gaming minecraft', fullwidth: 'wide vaporwave aesthetic retro',
  smallCaps: 'tiny small instagram bio', superscript: 'tiny small raised', subscript: 'tiny small lowered',
  sans: 'clean minimal modern instagram bio', sansBold: 'clean modern headline gaming', sansItalic: 'clean modern slanted',
  sansBoldItalic: 'modern slanted social', inverted: 'upside down flipped reverse', backwards: 'reverse mirror',
  glitch: 'zalgo corrupt creepy weird horror', ransom: 'mixed weird punk', sparkle: 'cute aesthetic instagram bio',
  hearts: 'love cute romantic instagram bio', gothicFrame: 'gothic blackletter old english medieval tattoo',
  pixelFrame: 'pixel gaming minecraft', angleBrackets: 'tech gaming hacker', bubbleFrame: 'bubble cute round', fire: 'gaming hot',
};
const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const fontName = (text: string) => /\bfont$/i.test(text) ? text : text + ' Font';
const batchSize = 8;

export default function HomeGenerator({ config, generatorSearchItems }: { config: GeneratorPageConfig; generatorSearchItems: GeneratorSearchItem[] }) {
  const [text, setText] = useGeneratorText(config.initialText);
  const [filter, setFilter] = useState<'all' | GeneratorStyleCategory>('all');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [directoryQuery, setDirectoryQuery] = useState('');
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [limit, setLimit] = useState(batchSize);
  const [artLimit, setArtLimit] = useState(4);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState(40);
  const [copiedId, setCopiedId] = useState('');
  const [notice, setNotice] = useState('');
  const [manual, setManual] = useState<{ text: string } | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const directoryButton = useRef<HTMLButtonElement>(null);
  const directory = useRef<HTMLElement>(null);
  const previewButton = useRef<HTMLButtonElement | null>(null);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const manualInput = useRef<HTMLTextAreaElement>(null);
  const copyRequest = useRef(0);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { copyRequest.current++; if (copiedTimer.current) clearTimeout(copiedTimer.current); }, []);
  useEffect(() => { if (searchOpen) search.current?.focus(); }, [searchOpen]);
  useEffect(() => { if (selectedId) previewHeading.current?.focus(); }, [selectedId]);
  useEffect(() => { if (manual) { manualInput.current?.focus(); manualInput.current?.select(); } }, [manual]);
  useEffect(() => {
    if (directoryOpen && window.matchMedia('(max-width: 1023px)').matches) {
      document.getElementById('home-generator-search')?.focus({ preventScroll: true });
      directory.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }, [directoryOpen]);

  const availableStyles = useMemo(() => {
    const ids = new Set(config.styleIds);
    return generatorStyles.filter(style => ids.has(style.id));
  }, [config.styleIds]);
  const filteredStyles = useMemo(() => {
    const tokens = normalize(query).split(/\s+/).filter(Boolean);
    return availableStyles.filter(style => (filter === 'all' || style.category === filter) &&
      tokens.every(token => normalize([style.id, style.name, style.category, style.description, aliases[style.id] ?? ''].join(' ')).includes(token)));
  }, [availableStyles, filter, query]);
  const variants = useMemo(() => generateStyleVariants(text, filteredStyles.map(style => style.id)), [text, filteredStyles]);
  const selected = useMemo(() => selectedId ? generateStyleVariants(text, [selectedId])[0] : undefined, [text, selectedId]);
  const visualItems = useMemo(() => generatorSearchItems.filter(item => item.collection === 'visual-art' && item.kind !== 'directory'), [generatorSearchItems]);
  const directoryItems = useMemo(() => {
    const tokens = normalize(directoryQuery).split(/\s+/).filter(Boolean);
    const visible = generatorSearchItems.filter(item => item.kind !== 'directory' && isVisibleInGeneratorNavigation(item.href));
    const matches = visible.filter(item => tokens.every(token => normalize(item.title + ' ' + item.kind + ' ' + item.description + ' ' + item.searchText).includes(token)));
    return { total: visible.length, text: matches.filter(item => item.collection === 'font-style'), art: matches.filter(item => item.collection === 'visual-art') };
  }, [generatorSearchItems, directoryQuery]);

  function clearFeedback() {
    copyRequest.current++;
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    setCopiedId(''); setNotice(''); setManual(null);
  }
  function editText(value: string) { clearFeedback(); setText(value); }
  function clearText() { editText(''); setSelectedId(null); input.current?.focus(); }
  function resetFilters() { setFilter('all'); setQuery(''); setLimit(batchSize); }
  function selectFilter(value: typeof filter) { setFilter(value); setLimit(batchSize); setSelectedId(null); clearFeedback(); }
  function editQuery(value: string) { setQuery(value); setLimit(batchSize); setSelectedId(null); clearFeedback(); }
  async function copy(output: string, id: string) {
    if (!text) return;
    const request = ++copyRequest.current;
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    setManual(null); setNotice(''); setCopiedId('');
    try {
      await navigator.clipboard.writeText(output);
      if (request !== copyRequest.current) return;
      setCopiedId(id); setNotice('Copied. Ready to paste.');
      copiedTimer.current = setTimeout(() => setCopiedId(''), 1800);
    } catch {
      if (request !== copyRequest.current) return;
      setNotice('Automatic copying was blocked. Select the text below and copy it manually.');
      setManual({ text: output });
    }
  }
  function openPreview(id: string, button: HTMLButtonElement) { previewButton.current = button; setSelectedId(id); }
  function closePreview() { setSelectedId(null); if (previewButton.current?.isConnected) previewButton.current.focus(); }
  function closeDirectory() { setDirectoryOpen(false); directoryButton.current?.focus(); }

  return <section id="generator" className={styles.workspace} aria-labelledby="generator-heading">
    <h2 id="generator-heading" className="sr-only">Generate Free Font</h2>
    <aside ref={directory} id="home-generator-directory" aria-label="Generator directory" className={[styles.directory, directoryOpen ? styles.directoryOpen : ''].join(' ')} data-generator-directory-scroll onKeyDown={event => { if (event.key === 'Escape' && directoryOpen) { event.preventDefault(); closeDirectory(); } }}>
      <div className={styles.directoryHeading}><h3>Generators <span>{directoryItems.total}</span></h3><button className={styles.textButton} onClick={closeDirectory}>Back to results</button></div>
      <GeneratorDirectoryContent searchId="home-generator-search" query={directoryQuery} onQueryChange={setDirectoryQuery} fontItems={directoryItems.text} visualItems={directoryItems.art} currentPageTitle="free font generator" />
    </aside>
    <div className={styles.main}>
      <div className={styles.inputPanel}>
        <div className={styles.inputLabel}><label htmlFor="generator-input">Your text</label><span>{text.length}/240</span></div>
        <div className={styles.inputRow}><textarea ref={input} id="generator-input" value={text} onChange={event => editText(event.target.value)} onKeyDown={event => { if (event.key === 'Escape' && text) clearText(); }} maxLength={240} rows={2} placeholder="Type something here…" autoComplete="off" />
          <button className={styles.clear} onClick={clearText} disabled={!text} aria-label="Clear input">×</button>
        </div>
        <p>Results update instantly. Tap a sample to copy.</p>
      </div>

      <div className={styles.filterBar}><div role="group" aria-label="Style categories" className={styles.filters}>
        <button className={filter === 'all' ? styles.activeFilter : ''} onClick={() => selectFilter('all')} aria-pressed={filter === 'all'}>All styles</button>
        {Object.entries(categories).filter(([category]) => availableStyles.some(style => style.category === category)).map(([category, name]) => <button key={category} className={filter === category ? styles.activeFilter : ''} onClick={() => selectFilter(category as GeneratorStyleCategory)} aria-pressed={filter === category}>{name}</button>)}
      </div><button className={[styles.textButton, styles.desktopStyleSearch].join(' ')} onClick={() => setSearchOpen(value => !value)} aria-expanded={searchOpen} aria-controls="home-style-search">Find a style</button></div>

      {searchOpen && <div id="home-style-search" className={styles.styleSearch}><label htmlFor="home-style-query">Search styles</label><input ref={search} id="home-style-query" type="search" value={query} onChange={event => editQuery(event.target.value)} placeholder="Try cursive, small caps or upside down" onKeyDown={event => { if (event.key === 'Escape') { setSearchOpen(false); } }} /></div>}
      <div className={styles.resultsHeading}><h3>{filteredStyles.length} styles <span>· Copy &amp; paste</span></h3><button className={[styles.textButton, styles.mobileStyleSearch].join(' ')} onClick={() => setSearchOpen(value => !value)} aria-expanded={searchOpen} aria-controls="home-style-search">Find a style</button><button ref={directoryButton} onClick={() => setDirectoryOpen(value => !value)} className={[styles.textButton, styles.directoryToggle].join(' ')} aria-expanded={directoryOpen} aria-controls="home-generator-directory">Generators <span aria-hidden="true">↗</span></button><p>Click a sample to copy</p></div>

      {selected && text && <section aria-label="Selected font preview" className={styles.preview} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); closePreview(); } }}>
        <div className={styles.previewHeading}><h3 ref={previewHeading} tabIndex={-1}>{selected.name}</h3><button className={styles.textButton} onClick={closePreview}>Close preview</button></div>
        <p className={styles.previewSample} style={{ fontSize: previewSize }}>{selected.text}</p>
        <div className={styles.previewControls}><label htmlFor="home-preview-size">Size</label><input type="range" id="home-preview-size" min={24} max={64} value={previewSize} onChange={event => setPreviewSize(Number(event.target.value))} /><span>{previewSize} px</span><button className={styles.primary} onClick={() => void copy(selected.text, selected.id)}>Copy preview</button></div>
      </section>}

      <p role="status" className={styles.notice}>{notice}</p>
      {manual && <section className={styles.manual} aria-label="Manual copy"><div className={styles.previewHeading}><label htmlFor="home-manual-copy">Copy this text manually</label><button className={styles.textButton} onClick={() => setManual(null)}>Close manual copy</button></div><textarea ref={manualInput} id="home-manual-copy" value={manual.text} readOnly rows={3} onFocus={event => event.currentTarget.select()} /></section>}

      {!text && <div className={styles.empty}><h3>Start with a few words.</h3><p>Type above to see all the different styles.</p><button className={styles.primary} onClick={() => editText(config.initialText)}>Use sample text</button></div>}
      {!!text && !variants.length && <div className={styles.empty}><h3>No styles found.</h3><p>Try another name or clear your filters.</p><button className={styles.primary} onClick={resetFilters}>Show all styles</button></div>}

      {!!text && <div id="generated-results" className={styles.results}>{variants.slice(0, limit).map(variant => <article key={variant.id} className={copiedId === variant.id ? styles.copiedCard : ''}>
        <button className={styles.sampleButton} onClick={event => { if (!window.getSelection()?.toString() || event.detail === 0) void copy(variant.text, variant.id); }} aria-label={'Copy ' + fontName(variant.name) + ' result'}>
          <span className={styles.sampleHeading}><strong>{variant.name}</strong><span>{categories[variant.category]}</span></span>
          <p>{variant.text}</p>
        </button>
        <div className={styles.sampleFooter}><span>{copiedId === variant.id ? 'Copied' : 'Tap to copy'}</span><button className={styles.textButton} onClick={event => openPreview(variant.id, event.currentTarget)} aria-label={'Preview ' + fontName(variant.name)}>Preview <span aria-hidden="true">↗</span></button></div>
      </article>)}</div>}
      {!!text && variants.length > limit && <div className={styles.more}><button className={styles.secondary} onClick={() => setLimit(value => value + batchSize)}>Show more styles · {variants.length - limit} remaining</button></div>}

      {!!visualItems.length && <nav className={styles.artwork} aria-label="Visual & Art Generators"><div className={styles.artworkHeading}><div><h3>Visual &amp; Art Generators</h3><p>Need an image instead? Explore separate artwork tools.</p></div><Link href="/visual-art">View all →</Link></div><div className={styles.artworkList}>{visualItems.slice(0, artLimit).map(item => <Link key={item.id} href={item.href}><strong>{item.title}</strong><span>{item.description}</span><span>Open generator →</span></Link>)}</div>{(artLimit < visualItems.length || artLimit > 4) && <div className={styles.more}>{artLimit < visualItems.length && <button className={styles.secondary} onClick={() => setArtLimit(value => value + 4)}>Load more generators ({visualItems.length - artLimit} remaining)</button>}{artLimit > 4 && <button className={styles.textButton} onClick={() => setArtLimit(4)}>Collapse to 4</button>}</div>}</nav>}
    </div>
  </section>;
}
