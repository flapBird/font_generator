'use client';

import { galacticSpecimen, scriptAlphabets, type ScriptAlphabet } from '@/lib/script-alphabets';
import CopyButton from './text-library/CopyButton';
import fonts from './ScriptFonts.module.css';

const tileClass = 'rounded-xl border border-slate-200 bg-slate-50 hover:border-violet-400 hover:bg-violet-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-violet-500 dark:hover:bg-violet-950';

export default function ScriptAlphabetChart({ alphabet, onInsert }: {
  alphabet: ScriptAlphabet;
  onInsert?: (symbol: string) => void;
}) {
  return (
    <ul className={`grid grid-cols-4 gap-2 sm:grid-cols-7 ${onInsert ? '' : 'lg:grid-cols-9'}`}>
      {scriptAlphabets[alphabet].map(({ letter, symbol }) => {
        const glyph = alphabet === 'galactic' ? galacticSpecimen(letter) : symbol;
        const contents = (
          <span aria-hidden="true" className="flex min-h-12 flex-col items-center justify-center px-1 py-2">
            <span className={`${fonts.galactic} text-2xl leading-none text-violet-700 dark:text-violet-300`}>{glyph}</span>
            <span className="mt-1 text-xs font-semibold">{letter}</span>
            {!onInsert && alphabet === 'galactic' && <span className={`${fonts.galactic} mt-1 text-base leading-6 text-slate-600 dark:text-slate-300`}>{symbol}</span>}
          </span>
        );
        return (
          <li key={letter} className="min-w-0">
            {onInsert ? (
              <button type="button" aria-label={`Insert symbol for ${letter}`} onClick={() => onInsert(symbol)}
                className={`w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 ${tileClass}`}>
                {contents}
              </button>
            ) : (
              <CopyButton tool={alphabet === 'galactic' ? 'standard-galactic-alphabet' : 'enderman-translator'} itemId={letter.toLowerCase()}
                text={symbol} label={`Copy symbol for ${letter}`} feedback="badge" className={tileClass}>
                {contents}
              </CopyButton>
            )}
          </li>
        );
      })}
    </ul>
  );
}
