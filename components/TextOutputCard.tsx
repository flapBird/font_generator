'use client';

import { useEffect, useRef, useState } from 'react';

export default function TextOutputCard({ title, text, description, spacious = false, onPreview, selected = false, formattedPreview }: {
  title: string;
  text: string;
  description?: string;
  spacious?: boolean;
  onPreview?: () => void;
  selected?: boolean;
  formattedPreview?: { text: string; className: string };
}) {
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const [notice, setNotice] = useState<{ text: string; kind: 'copied' | 'error' } | null>(null);
  const currentNotice = notice?.text === text ? notice : null;
  const copied = currentNotice?.kind === 'copied';
  const failed = currentNotice?.kind === 'error';

  useEffect(() => {
    if (notice?.kind !== 'copied') return;
    const timer = setTimeout(() => setNotice(null), 2000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (failed) {
      outputRef.current?.focus();
      outputRef.current?.select();
    }
  }, [failed, notice]);

  async function copy() {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setNotice({ text, kind: 'copied' });
    } catch {
      setNotice({ text, kind: 'error' });
    }
  }

  return (
    <article className="min-w-0">
      <button type="button" disabled={!text.trim()} aria-label={`Copy ${title}`} onFocus={onPreview} onClick={(event) => {
        // Keep drag-selection available; keyboard activation always copies.
        if (event.detail && window.getSelection()?.toString()) return;
        onPreview?.();
        void copy();
      }} className={`group block w-full min-w-0 rounded-2xl border bg-white p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-default dark:bg-slate-950 dark:focus-visible:ring-offset-slate-950 ${copied ? 'border-emerald-400 ring-2 ring-emerald-500/10 dark:border-emerald-600' : selected ? 'border-violet-400 ring-2 ring-violet-500/10 dark:border-violet-600' : 'border-slate-200 enabled:hover:border-violet-400 enabled:hover:shadow-sm dark:border-slate-800 dark:enabled:hover:border-violet-500'}`}>
        <span className="flex items-center justify-between gap-3">
          <span className="font-medium text-slate-900 dark:text-white">{title}</span>
          <span className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${copied ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-violet-50 text-violet-700 group-disabled:text-slate-400 dark:bg-violet-950/50 dark:text-violet-300'}`}>{copied ? 'Copied!' : 'Copy'}</span>
        </span>
        {formattedPreview && <span className="mt-4 block rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
          <span className="block text-xs text-slate-500 dark:text-slate-400">Formatting preview</span>
          <span aria-label={`${title} formatting preview`} className={`mt-2 block whitespace-pre-wrap break-words text-xl text-slate-950 [overflow-wrap:anywhere] dark:text-white ${formattedPreview.className}`}>{formattedPreview.text || 'Enter text to preview'}</span>
        </span>}
        {formattedPreview && <span className="mt-4 block text-xs text-slate-500 dark:text-slate-400">Markdown source · copied as shown below</span>}
        <span aria-label={`${title} output`} className={`block select-text whitespace-pre-wrap break-words text-xl text-slate-950 [overflow-wrap:anywhere] dark:text-white sm:text-2xl ${spacious ? 'my-4 max-h-96 overflow-auto px-2 py-10 leading-[3]' : 'mt-4 min-h-8 leading-8'}`}>{text || <span className="text-base italic text-slate-400">Type above to see this style</span>}</span>
        {description && <span className="mt-2 block text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</span>}
        <span className={`mt-4 block border-t border-slate-100 pt-3 text-xs dark:border-slate-800 ${copied ? 'font-semibold text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>{copied ? 'Copied to clipboard' : text.trim() ? 'Tap anywhere to copy' : 'Enter text to copy'}</span>
      </button>
      <p role="status" className={failed ? 'mt-2 text-sm text-amber-800 dark:text-amber-300' : 'sr-only'}>{copied ? 'Copied to clipboard.' : failed ? 'Copy unavailable. Text selected; use your device’s Copy command.' : ''}</p>
      {failed && <textarea ref={outputRef} aria-label={`${title} manual copy`} readOnly value={text} rows={3} className="mt-2 block w-full rounded-xl border border-violet-400 bg-white p-3 text-slate-950 focus:outline-violet-500 dark:bg-slate-950 dark:text-white" />}
    </article>
  );
}
