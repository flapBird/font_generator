'use client';

import { useRef, useState } from 'react';
import Link from './IntentLink';
import TextToolLayout, { type TextWorkspace } from './TextToolLayout';
import TextToolInput from './TextToolInput';
import TextOutputCard from './TextOutputCard';
import ScriptAlphabetChart from './ScriptAlphabetChart';
import ScriptPngButton from './ScriptPngButton';
import fonts from './ScriptFonts.module.css';
import { ALPHABET_DECODE_LIMIT, ALPHABET_INPUT_LIMIT, convertScriptText, galacticSpecimen, type ScriptAlphabet, type ScriptDirection } from '@/lib/script-alphabets';
import { useGeneratorText } from '@/lib/use-generator-text';
import { segmentGraphemes } from '@/lib/unicode';

const language = {
  galactic: { title: 'Galactic', sample: 'Minecraft', decodeSample: 'Hello', symbolLabel: 'Galactic Unicode lookalikes' },
  ender: { title: 'Ender', sample: 'See you in the End', decodeSample: 'Hello human', symbolLabel: 'Ender symbols' },
};
const previewClass = 'whitespace-pre-wrap [overflow-wrap:anywhere]';

export default function ScriptAlphabetTranslator({ alphabet, ...workspace }: Pick<TextWorkspace, 'config' | 'navigationItems' | 'pageTitle'> & {
  alphabet: ScriptAlphabet;
}) {
  const options = language[alphabet];
  const [direction, setDirection] = useState<ScriptDirection>('encode');
  const [plain, setPlain] = useGeneratorText(options.sample);
  const [encoded, setEncoded] = useGeneratorText(convertScriptText(options.decodeSample, alphabet, 'encode'));
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [atLimit, setAtLimit] = useState(false);
  const decoding = direction === 'decode';
  const galactic = alphabet === 'galactic';
  const input = decoding ? encoded : plain;
  const setInput = decoding ? setEncoded : setPlain;
  const converted = convertScriptText(input, alphabet, direction);
  const preview = galactic && !decoding ? galacticSpecimen(plain) : converted;
  const outputTitle = decoding ? 'English text' : options.symbolLabel;
  const previewTitle = galactic && !decoding ? 'Galactic lettering' : outputTitle;
  const limit = decoding ? ALPHABET_DECODE_LIMIT : ALPHABET_INPUT_LIMIT;
  const canDecodeResult = !decoding && Boolean(converted.trim()) && converted.length <= ALPHABET_DECODE_LIMIT;

  function insertSymbol(symbol: string) {
    const field = inputRef.current;
    if (!field) return;
    const { selectionStart, selectionEnd } = field;
    if (encoded.length - (selectionEnd - selectionStart) + symbol.length > ALPHABET_DECODE_LIMIT) {
      setAtLimit(true);
      return;
    }
    setAtLimit(false);
    setEncoded(encoded.slice(0, selectionStart) + symbol + encoded.slice(selectionEnd));
    requestAnimationFrame(() => {
      if (inputRef.current !== field) return;
      field.focus({ preventScroll: true });
      const caret = selectionStart + symbol.length;
      field.setSelectionRange(caret, caret);
    });
  }

  function decodeResult() {
    setEncoded(converted);
    setDirection('decode');
    setAtLimit(false);
  }

  return (
    <div data-clarity-mask="true">
      <TextToolLayout
        label={workspace.pageTitle}
        workspace={{
          ...workspace,
          preview: { id: direction, name: previewTitle, text: preview.trim() ? preview : '', category: 'symbols', characterCount: segmentGraphemes(preview).length },
          previewTextClassName: `${previewClass} ${decoding ? '' : fonts.galactic}`,
          outputLabel: galactic && !decoding ? 'Text and PNG' : 'Copyable text',
          mobileDirectoryAfterResults: true,
          compactWorkspace: true,
        }}
        controls={<>
          <div role="group" aria-label="Conversion direction" className="flex flex-wrap gap-2">
            {(['encode', 'decode'] as const).map((value) => (
              <button key={value} type="button" aria-pressed={direction === value} onClick={() => { setDirection(value); setAtLimit(false); }}
                className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus-visible:outline-violet-600 aria-pressed:border-violet-600 aria-pressed:bg-violet-600 aria-pressed:text-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:aria-pressed:border-violet-500 dark:aria-pressed:bg-violet-600">
                {value === 'encode' ? `English to ${options.title}` : `${options.title} to English`}
              </button>
            ))}
          </div>
          <TextToolInput id="script-input" inputRef={inputRef} label={decoding ? `${options.title} symbols` : 'English text'}
            text={input} onChange={(value) => { setInput(value); setAtLimit(false); }} limit={limit}
            textClassName={decoding ? fonts.galactic : undefined} />
        </>}
      >
        <TextOutputCard key={direction} title={outputTitle} text={converted}
          textClassName={decoding ? '' : fonts.galactic}
          description={decoding ? 'Recognized symbols become lowercase letters.' : galactic ? 'Use these Unicode lookalikes when you need to paste the result as text.' : 'Fan alphabet for in-character messages and puzzles.'}
          selected />
        {galactic && !decoding && (
          <section aria-label="Galactic lettering preview" className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold">Galactic lettering</h3>
            <p className={`max-h-56 overflow-y-auto text-3xl leading-relaxed text-violet-800 dark:text-violet-200 ${previewClass} ${fonts.galactic}`}
              aria-label={plain.trim() ? `Galactic preview of ${plain}` : undefined}>
              {plain.trim() ? <span aria-hidden="true">{preview}</span> : <span className="text-sm text-slate-500">Enter text for the image preview.</span>}
            </p>
            <ScriptPngButton text={preview} family="Site Galactic" fontSample={galacticSpecimen('A')} filename="enchanting-table.png" />
          </section>
        )}
        {(!decoding || galactic) && <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {!decoding && <button type="button" onClick={decodeResult} disabled={!canDecodeResult}
            className="min-h-11 font-semibold text-violet-700 focus-visible:outline-violet-600 disabled:opacity-50 dark:text-violet-300">
            Decode this result
          </button>}
          {galactic && <Link href="/standard-galactic-alphabet" className="inline-flex min-h-11 items-center font-semibold text-violet-700 hover:underline dark:text-violet-300">A–Z alphabet chart →</Link>}
        </div>}
        {(decoding || !galactic) && (
          <details key={direction} className="rounded-2xl border border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950">
            <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold focus-visible:outline-violet-600">
              {decoding ? `${options.title} symbol keyboard` : 'Ender alphabet chart'}
            </summary>
            <p className="mb-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {decoding ? 'Choose the letters that match your source to enter their symbols.' : 'Select a letter to copy its symbol.'}
            </p>
            <div className="pb-4"><ScriptAlphabetChart alphabet={alphabet} onInsert={decoding ? insertSymbol : undefined} /></div>
            {decoding && atLimit && <p role="status" className="pb-3 text-sm text-amber-800 dark:text-amber-300">Input is full. Remove text to insert another symbol.</p>}
          </details>
        )}
      </TextToolLayout>
    </div>
  );
}
