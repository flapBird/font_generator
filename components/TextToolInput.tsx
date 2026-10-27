'use client';

import { useRef } from 'react';

export default function TextToolInput({ id, text, onChange, limit, label = 'Your text' }: {
  id: string; text: string; onChange: (value: string) => void; limit?: number; label?: string;
}) {
  const input = useRef<HTMLTextAreaElement>(null);
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-950 dark:text-white">{label}</label>
      <button type="button" onClick={() => { onChange(''); input.current?.focus(); }} className="min-h-11 rounded-lg px-2 text-sm font-medium text-violet-700 hover:bg-violet-100 focus-visible:outline-violet-500 dark:text-violet-300 dark:hover:bg-violet-950">Clear text</button>
    </div>
    <textarea ref={input} id={id} value={text} onChange={(event) => onChange(event.target.value)} maxLength={limit} rows={2} placeholder="Type your text…" className="block w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-lg text-slate-950 focus:outline-violet-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
    <div className="mt-2 flex justify-between gap-2 text-xs text-slate-500 dark:text-slate-400"><span>Results update as you type</span>{limit && <span>{text.length} / {limit}</span>}</div>
  </div>;
}
