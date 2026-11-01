'use client';

import { useEffect, useRef, useState } from 'react';
import { boundedCrop, MAX_IMAGE_PIXELS, validateImage, type Crop, type FontMatch } from '@/lib/font-identifier/image';
import styles from './FontIdentifier.module.css';

type Stage = 'upload' | 'crop' | 'matching' | 'results';
type PreviewState = 'loading' | 'ready' | 'error';
const defaultText = 'The quick brown fox';
const fontKey = (match: FontMatch) => [match.family, match.style, match.weight].join(':');
const fontStyle = (match: FontMatch) => ({ fontFamily: '"' + match.family.replace(/["\\]/g, '') + '", sans-serif', fontWeight: match.weight, fontStyle: match.style });

function UploadIcon() {
  return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function FontIdentifier() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const comparison = useRef<HTMLCanvasElement>(null);
  const selectedBlock = useRef<HTMLDivElement>(null);
  const original = useRef<HTMLCanvasElement | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const worker = useRef<Worker | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const previewGeneration = useRef(0);
  const previewLinks = useRef(new Map<string, HTMLLinkElement>());
  const previewTasks = useRef(new Map<string, Promise<void>>());
  const previousStage = useRef<Stage>('upload');
  const [stage, setStage] = useState<Stage>('upload');
  const [opening, setOpening] = useState(false);
  const [imageName, setImageName] = useState('');
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0, width: 1, height: 1 });
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<'loading' | 'matching'>('loading');
  const [message, setMessage] = useState('Choose an image or paste a screenshot here.');
  const [error, setError] = useState('');
  const [matches, setMatches] = useState<FontMatch[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [sample, setSample] = useState(defaultText);
  const [previewSize, setPreviewSize] = useState(40);
  const [selected, setSelected] = useState<FontMatch | null>(null);
  const [previews, setPreviews] = useState<Record<string, PreviewState>>({});

  function stop() {
    worker.current?.terminate(); worker.current = null;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }

  function invalidate() {
    stop(); start.current = null; setBusy(false); setMatches([]); setExpanded(false);
    previewGeneration.current++;
    previewLinks.current.forEach(link => link.remove()); previewLinks.current.clear(); previewTasks.current.clear();
    setSelected(null); setPreviews({});
  }

  useEffect(() => () => {
    generation.current++; previewGeneration.current++;
    worker.current?.terminate();
    if (timer.current) clearTimeout(timer.current);
    previewLinks.current.forEach(link => link.remove());
  }, []);

  useEffect(() => {
    if (previousStage.current !== stage) {
      previousStage.current = stage;
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: 'start' });
    }
    const image = original.current;
    if (!image) return;
    const element = canvas.current;
    if (element) {
      element.width = size.width; element.height = size.height;
      const ctx = element.getContext('2d')!;
      ctx.drawImage(image, 0, 0);
      ctx.fillStyle = 'rgba(30,20,50,.35)'; ctx.fillRect(0, 0, size.width, size.height);
      ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, crop.x, crop.y, crop.width, crop.height);
      ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = Math.max(2, size.width / 350); ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);
    }
    const preview = comparison.current;
    if (preview) {
      preview.width = crop.width; preview.height = crop.height;
      preview.getContext('2d')!.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
    }
  }, [stage, size, crop]);

  async function load(file: File, example = false, id = ++generation.current) {
    invalidate(); setError(''); setOpening(true); setStage('upload'); setMessage('Opening image locally…');
    original.current = null; setSize({ width: 0, height: 0 });
    try {
      validateImage(file);
      const image = await createImageBitmap(file);
      if (id !== generation.current) { image.close(); return; }
      if (image.width * image.height > MAX_IMAGE_PIXELS) { image.close(); throw new Error('Choose an image with at most 20 million pixels.'); }
      const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
      const source = document.createElement('canvas');
      source.width = Math.max(1, Math.round(image.width * scale)); source.height = Math.max(1, Math.round(image.height * scale));
      const ctx = source.getContext('2d')!;
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, source.width, source.height);
      ctx.drawImage(image, 0, 0, source.width, source.height); image.close();
      original.current = source; setImageName(file.name); setSize({ width: source.width, height: source.height });
      setCrop({ x: 0, y: 0, width: source.width, height: source.height });
      if (example) setSample('A little more human.');
      setMessage('Drag around one clear line, or adjust the crop fields.'); setStage('crop');
    } catch (cause) {
      if (id === generation.current) { setError(cause instanceof Error ? cause.message : 'This image could not be opened.'); setMessage('Choose another image.'); }
    } finally { if (id === generation.current) setOpening(false); }
  }

  async function loadExample() {
    const id = ++generation.current;
    invalidate(); setError(''); setOpening(true); setMessage('Opening the sample image…');
    try {
      const response = await fetch('/font-identifier/sample.png');
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      if (id === generation.current) await load(new File([blob], 'example.png', { type: 'image/png' }), true, id);
    } catch {
      if (id === generation.current) { setError('The example could not load. Choose your own image or try again.'); setOpening(false); }
    }
  }

  function clear() {
    generation.current++; invalidate(); original.current = null; setOpening(false); setSize({ width: 0, height: 0 });
    setImageName(''); setError(''); setStage('upload'); setMessage('Image cleared.');
  }

  function changeCrop(next: Crop) {
    // Keep the active pointer while clearing stale results and font requests.
    const pointer = start.current; invalidate(); start.current = pointer;
    setError(''); setCrop(boundedCrop(next, size.width, size.height));
    setMessage('Crop updated. Identify this selection when ready.');
  }

  function editCrop() { invalidate(); setError(''); setStage('crop'); setMessage('Drag around one clear line, or adjust the crop fields.'); }

  function identify() {
    if (!original.current || crop.width < 16 || crop.height < 16) { setError('Select a crop at least 16 × 16 pixels.'); return; }
    invalidate(); setError(''); setBusy(true); setPhase('loading'); setStage('matching'); setMessage('Starting local matcher…');
    try {
      const instance = new Worker('/font-identifier-worker.js', { type: 'module' }); worker.current = instance;
      const fail = (text: string) => {
        if (worker.current !== instance) return;
        stop(); setBusy(false); setError(text); setMessage('Ready to retry.');
      };
      instance.onerror = () => fail('The local matcher could not load. Check your connection and retry.');
      instance.onmessage = ({ data }) => {
        if (worker.current !== instance) return;
        if (data.type === 'status') { setMessage(data.message); setPhase(data.message.startsWith('Comparing') ? 'matching' : 'loading'); }
        if (data.type === 'error') fail(data.message);
        if (data.type === 'results') {
          const candidates: FontMatch[] = data.matches.slice(0, 10);
          setMatches(candidates); setSelected(candidates[0] ?? null); setBusy(false);
          setMessage(candidates.length ? 'Closest Google Fonts matches — compare visually before choosing.' : 'No usable text found. Try a tighter, clearer crop.');
          if (candidates.length) setStage('results');
          stop();
        }
      };
      timer.current = setTimeout(() => fail('Matching took too long on this device. Try a smaller crop and retry.'), 60000);
      const image = original.current.getContext('2d')!.getImageData(crop.x, crop.y, crop.width, crop.height);
      instance.postMessage({ image }, [image.data.buffer]);
    } catch { stop(); setBusy(false); setError('Local matching is unavailable in this browser. Try an updated browser.'); }
  }

  function loadPreview(match: FontMatch): Promise<void> {
    const key = fontKey(match), existing = previewTasks.current.get(key);
    if (existing) return existing;
    const id = previewGeneration.current;
    setPreviews(current => ({ ...current, [key]: 'loading' }));
    const link = document.createElement('link'); link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(match.family) + ':ital,wght@' + (match.style === 'italic' ? 1 : 0) + ',' + match.weight + '&display=swap';
    previewLinks.current.set(key, link);
    const task = (async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error()), 12000);
          link.onload = () => { clearTimeout(timeout); resolve(); };
          link.onerror = () => { clearTimeout(timeout); reject(new Error()); };
          document.head.appendChild(link);
        });
        if (id !== previewGeneration.current) return;
        let timeout: ReturnType<typeof setTimeout> | undefined;
        const fonts = await Promise.race([
          document.fonts.load(match.style + ' ' + match.weight + ' 32px "' + match.family.replace(/["\\]/g, '') + '"'),
          new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error()), 12000); }),
        ]).finally(() => clearTimeout(timeout));
        if (!fonts.length) throw new Error();
        if (id === previewGeneration.current) setPreviews(current => ({ ...current, [key]: 'ready' }));
      } catch {
        if (id === previewGeneration.current) {
          link.remove(); previewLinks.current.delete(key); previewTasks.current.delete(key);
          setPreviews(current => ({ ...current, [key]: 'error' }));
        }
      }
    })();
    previewTasks.current.set(key, task);
    return task;
  }

  function preview(match: FontMatch) {
    setSelected(match); void loadPreview(match);
    if (window.matchMedia('(max-width: 800px)').matches) selectedBlock.current?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  const visibleMatches = expanded ? matches : matches.slice(0, 3);
  const selectedPreview = selected ? previews[fontKey(selected)] : undefined;
  const resultStage = stage === 'results';
  const title = stage === 'upload' ? 'Find the font in your image.' : stage === 'crop' ? 'Choose one clear line.' : resultStage ? 'Find your closest match.' : busy ? 'A closer look at your letters.' : error ? "The matcher couldn't finish." : 'We need a clearer text line.';
  const sourceImage = <canvas ref={comparison} aria-label="Your selected image" className={styles.sourceImage} />;
  const chooseImage = () => fileInput.current?.click();

  return <section tabIndex={0} aria-label="Font identifier workspace" className={styles.workspace} onPaste={event => {
    const file = [...event.clipboardData.files].find(f => f.type.startsWith('image/'));
    if (file) { event.preventDefault(); void load(file); }
  }}>
    <input ref={fileInput} tabIndex={-1} className="sr-only" type="file" aria-label="Image · PNG, JPEG or WebP" accept="image/png,image/jpeg,image/webp" onChange={event => {
      const file = event.target.files?.[0]; if (file) void load(file); event.target.value = '';
    }} />
    <header className={[styles.heading, stage === 'upload' ? styles.uploadHeading : ''].join(' ')}>
      <div>
        <p className={stage === 'upload' ? styles.badge : styles.eyebrow}>{stage === 'upload' ? 'Free · Local image matching' : stage === 'crop' ? 'STEP 02 / 03 · FONT IDENTIFIER' : resultStage ? 'YOUR FONT MATCHES' : 'STEP 03 / 03 · FONT IDENTIFIER'}</p>
        <h1 ref={heading} tabIndex={-1}>{title}</h1>
        <p className={styles.subtitle}>{stage === 'upload' ? 'Choose a clear line of text. Compare similar Google Fonts, right beside your image.' : stage === 'crop' ? 'Keep the letters. Leave out the noise.' : resultStage ? 'Compare the letterforms. These are suggestions, not an exact identification.' : 'Your selected image stays on this device.'}</p>
      </div>
      {stage !== 'upload' && <button className={styles.secondary} onClick={chooseImage}>{resultStage ? 'Try another image' : 'Change image'}</button>}
    </header>
    <p role="status" className="sr-only">{message}</p>
    {stage !== 'matching' && error && <p role="alert" className={styles.error}>{error}</p>}

    {stage === 'upload' && <div className={styles.columns}>
      <div className={styles.uploadCard}>
        <div className={styles.dropzone}>
          <UploadIcon /><h2>Start with an image</h2>
          <p>Choose a screenshot, photo or saved text sample.</p>
          <button className={styles.primary} onClick={chooseImage} disabled={opening}>{opening ? 'Opening image…' : 'Choose an image'}</button>
          <span>PNG, JPG or WebP · up to 10 MB / 20 megapixels</span>
          <span>Or paste a screenshot into this workspace.</span>
        </div>
        <p className={styles.privacy}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></svg>Your image stays on your device. No account required.</p>
        <p className={styles.smallPrint}>Large images are resized to 1,600 pixels on the longest edge.</p>
      </div>
      <aside className={styles.side}>
        <button className={styles.example} onClick={() => void loadExample()} disabled={opening}>
          <span className={styles.exampleTop}><span>TRY AN EXAMPLE</span><span>01</span></span>
          {/* This raster specimen is the input; candidates still come from the real matcher. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/font-identifier/sample.png" alt="Sample text: A little more human." width={1100} height={300} />
          <strong>Identify this sample <span aria-hidden="true">→</span></strong>
        </button>
        <div className={styles.tips}><h2>A better crop. A closer match.</h2><p>Use one font on one line. Keep letters sharp and leave a little space around them.</p><p className={styles.smallPrint}>Experimental · Google Fonts catalog only. A similar result may not be the original typeface.</p></div>
      </aside>
    </div>}

    {stage === 'crop' && <div className={styles.columns}>
      <section className={styles.panel} aria-label="Crop image">
        <div className={styles.panelBar}><strong>Your image</strong><span className={styles.fileName}>{imageName} · {size.width} × {size.height}</span></div>
        <div className={styles.cropSurface}><canvas ref={canvas} aria-label="Image crop preview. Use the crop fields below as a keyboard alternative." className={styles.cropImage} onPointerDown={event => {
          const box = event.currentTarget.getBoundingClientRect();
          start.current = { x: (event.clientX - box.left) * size.width / box.width, y: (event.clientY - box.top) * size.height / box.height };
          event.currentTarget.setPointerCapture(event.pointerId);
        }} onPointerMove={event => {
          if (!start.current) return;
          const box = event.currentTarget.getBoundingClientRect();
          const x = (event.clientX - box.left) * size.width / box.width, y = (event.clientY - box.top) * size.height / box.height;
          changeCrop({ x: Math.min(x, start.current.x), y: Math.min(y, start.current.y), width: Math.abs(x - start.current.x), height: Math.abs(y - start.current.y) });
        }} onPointerUp={() => { start.current = null; }} onPointerCancel={() => { start.current = null; }} onLostPointerCapture={() => { start.current = null; }} /></div>
        <div className={styles.cropToolbar}><p>Drag to select one text line.</p><button className={styles.secondary} onClick={() => changeCrop({ x: 0, y: 0, ...size })}>Use whole image</button></div>
        <details className={styles.coordinates}><summary>Adjust crop coordinates</summary>
          <fieldset className={styles.cropFields}><legend>Crop in resized image pixels</legend>{(['x', 'y', 'width', 'height'] as const).map(key => <label key={key}>{key}<input aria-label={'Crop ' + key} type="number" min={key === 'x' || key === 'y' ? 0 : 1} max={key === 'x' || key === 'width' ? size.width : size.height} value={crop[key]} onChange={event => changeCrop({ ...crop, [key]: Number(event.target.value) })} /></label>)}</fieldset>
        </details>
      </section>
      <aside className={[styles.panel, styles.cropAdvice].join(' ')}>
        <p className={styles.eyebrow}>READY TO MATCH</p><h2>One typeface at a time.</h2>
        <p>A straight line of clear letters gives the matcher more useful detail.</p>
        <ul><li>Keep the full height of the letters.</li><li>Avoid mixing different fonts.</li><li>Use the sharpest image you have.</li></ul>
        <button className={styles.primary} onClick={identify} aria-label="Identify font locally">Find similar fonts <span aria-hidden="true">→</span></button>
        <p className={styles.smallPrint}>Matching runs in your browser. Your image stays on this device.</p>
        <button className={styles.textButton} onClick={clear}>Clear image</button>
      </aside>
    </div>}

    {stage === 'matching' && <div className={styles.matchingColumns}>
      <section className={[styles.panel, styles.selectionPanel].join(' ')}><p className={styles.eyebrow}>YOUR SELECTION</p>{sourceImage}<button className={styles.textButton} onClick={editCrop}>← Adjust selection</button><p className={styles.smallPrint}>Your image stays in this browser.</p></section>
      <section className={[styles.panel, styles.matchingPanel].join(' ')} aria-busy={busy} aria-label="Local matching">
        {busy ? <>
          <div className={styles.spinner} aria-hidden="true" /><h2>{phase === 'loading' ? 'Preparing the matcher…' : 'Looking for similar fonts…'}</h2>
          <p>{phase === 'loading' ? 'The first run may take a little longer while the matching engine loads.' : 'Keep this tab open while the matcher compares your selected letters.'}</p>
          <ol className={styles.progress}><li><span aria-hidden="true">✓</span>Image selected</li><li aria-current="step"><span aria-hidden="true">2</span>{phase === 'loading' ? 'Loading the matching engine' : 'Comparing letterforms'}</li><li><span aria-hidden="true">3</span>Compare the closest candidates</li></ol>
          <button className={styles.secondary} onClick={() => { stop(); setBusy(false); setStage('crop'); setMessage('Cancelled. Your image is still available.'); }}>Cancel</button>
        </> : <>
          <h2>{error ? "Let's try that again." : 'Try a sharper image or a tighter crop.'}</h2>
          {error ? <p role="alert" className={styles.error}>{error}</p> : <p>No usable text found. Small, blurred, curved or heavily decorated letters can be difficult to match.</p>}
          <div className={styles.actions}><button className={styles.primary} onClick={editCrop}>Adjust selection</button><button className={styles.secondary} onClick={identify} aria-label="Identify font locally">Try matching again</button></div>
        </>}
      </section>
    </div>}

    {resultStage && selected && <>
      <div className={styles.resultColumns}>
        <section className={styles.panel} aria-label="Image and font comparison">
          <div className={styles.originalBlock}><div className={styles.comparisonLabel}><span>YOUR IMAGE</span><button className={styles.textButton} onClick={editCrop}>Adjust crop</button></div>{sourceImage}</div>
          <div ref={selectedBlock} className={styles.selectedBlock}><div className={styles.comparisonLabel}><span>SELECTED FONT</span><strong>{selected.family} · {selected.styleName}</strong></div>
            {selectedPreview === 'ready' ? <p data-testid="font-match-preview" className={styles.fontPreview} style={{ ...fontStyle(selected), fontSize: previewSize }}>{sample || 'Enter comparison text'}</p> : <div className={styles.previewPlaceholder}>
              <p role="status">{selectedPreview === 'loading' ? 'Loading the selected Google Font…' : selectedPreview === 'error' ? 'Preview font could not load. Retry the candidate or open its Google Fonts page.' : 'Load this font to compare its letters with your image.'}</p>
              {selectedPreview !== 'loading' && <button className={styles.secondary} onClick={() => preview(selected)}>{selectedPreview === 'error' ? 'Retry font preview' : 'Load selected font'}</button>}
            </div>}
          </div>
          <div className={styles.comparisonControls}><label htmlFor="font-comparison">Comparison text</label><input id="font-comparison" aria-label="Text to compare" maxLength={120} value={sample} onChange={event => setSample(event.target.value)} />
            <div className={styles.sizeControl}><label htmlFor="font-preview-size">Size</label><input id="font-preview-size" type="range" min={20} max={76} value={previewSize} onChange={event => setPreviewSize(Number(event.target.value))} /><span>{previewSize} px</span><button className={styles.textButton} onClick={() => { setSample(defaultText); setPreviewSize(40); }}>Reset</button></div>
          </div>
        </section>
        <aside className={styles.candidates} aria-label="Font candidates"><div className={styles.candidatesHeading}><h2>Closest candidates</h2><span>Google Fonts</span></div>
          <p className={styles.smallPrint}>Preview downloads fonts from Google Fonts. Your image and comparison text are not sent.</p>
          <button className={[styles.secondary, styles.loadPreviews].join(' ')} disabled={visibleMatches.every(match => previews[fontKey(match)] === 'loading' || previews[fontKey(match)] === 'ready')} onClick={() => { visibleMatches.forEach(match => void loadPreview(match)); }}>Load candidate previews</button>
          <ol className={[styles.candidateList, expanded ? styles.expandedList : ''].join(' ')}>{visibleMatches.map((match, index) => {
            const state = previews[fontKey(match)], active = selected === match;
            return <li key={fontKey(match) + '-' + index}><button className={[styles.candidate, active ? styles.activeCandidate : ''].join(' ')} onClick={() => preview(match)} aria-label={'Preview ' + match.family + ' ' + match.styleName} aria-pressed={active}>
              <span className={styles.candidateName}><span>{String(index + 1).padStart(2, '0')}</span><strong>{match.family}</strong><span className={styles.candidateAction}>{active ? 'Selected' : 'Compare'}</span></span>
              <span className={styles.candidateStyle}>{match.styleName}</span>
              {state === 'ready' ? <><span className={styles.candidateSample} style={fontStyle(match)}>{sample || 'Enter comparison text'}</span><span className={styles.candidateGlyph} style={fontStyle(match)} aria-hidden="true">Aa</span></> : <span className={styles.candidateHint}>{state === 'loading' ? 'Loading font…' : state === 'error' ? 'Preview unavailable · tap to retry' : 'Tap to load font preview'}</span>}
            </button></li>;
          })}</ol>
          {!expanded && matches.length > 3 && <button className={[styles.secondary, styles.showAll].join(' ')} onClick={() => setExpanded(true)}>Show all {matches.length} candidates</button>}
          <a className={styles.primary} href={'https://fonts.google.com/specimen/' + encodeURIComponent(selected.family)} target="_blank" rel="noreferrer">Open {selected.family} <span aria-hidden="true">↗</span></a>
          <p className={styles.smallPrint}>View the font source, available styles and license on Google Fonts.</p>
        </aside>
      </div>
      <div className={styles.resultFooter}><p>Compare the shapes of “a” and “g”, stroke contrast and the ends of each letter. The original font may be outside the supported collection.</p><div className={styles.actions}><button className={styles.secondary} onClick={identify} aria-label="Identify font locally">Match again</button><button className={styles.textButton} onClick={clear}>Clear image</button></div></div>
    </>}
  </section>;
}
