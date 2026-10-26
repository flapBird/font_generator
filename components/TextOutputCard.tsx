'use client';

import { useRef, useState } from 'react';

export default function TextOutputCard({ title, text, description, spacious = false }: {
  title: string;
  text: string;
  description?: string;
  spacious?: boolean;
}) {
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const [notice, setNotice] = useState({ text: '', message: '' });
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setNotice({ text, message: 'Copied to clipboard.' });
    } catch {
      outputRef.current?.focus();
      outputRef.current?.select();
      setNotice({ text, message: 'Copy unavailable. Text selected; use your device’s Copy command.' });
    }
  }
  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-slate-950 dark:text-white">{title}</h3>
        <button type="button" disabled={!text.trim()} onClick={copy} aria-label={`Copy ${title}`} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-40">Copy</button>
      </div>
      {description && <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>}
      <textarea ref={outputRef} aria-label={`${title} output`} readOnly value={text} rows={spacious ? 6 : 3} spellCheck={false} className={`mt-3 block w-full resize-y rounded-xl bg-slate-50 px-4 text-xl text-slate-950 focus:outline-violet-500 dark:bg-slate-900 dark:text-white ${spacious ? 'py-12 leading-[3]' : 'py-3 leading-8'}`} />
      <p role="status" className="mt-2 min-h-5 text-xs text-slate-600 dark:text-slate-400">{notice.text === text ? notice.message : ''}</p>
    </article>
  );
}
