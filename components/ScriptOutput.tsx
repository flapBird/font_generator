'use client';

import ScriptPngButton from './ScriptPngButton';

export type ScriptOutputMode = 'text' | 'image';

export function ScriptOutputPicker({ value, onChange }: {
  value: ScriptOutputMode;
  onChange: (value: ScriptOutputMode) => void;
}) {
  return <fieldset className="space-y-2">
    <legend className="text-sm font-semibold text-slate-700 dark:text-slate-200">Output format</legend>
    <div className="flex flex-wrap gap-2">
      {(['text', 'image'] as const).map((mode) => <label key={mode}
        className={`relative inline-flex min-h-11 cursor-pointer items-center rounded-xl border px-4 text-sm font-semibold focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-violet-500 ${value === mode ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'}`}>
        <input type="radio" name="script-output-format" value={mode} checked={value === mode} onChange={() => onChange(mode)} className="sr-only" />
        {mode === 'text' ? 'Copyable text' : 'PNG image'}
      </label>)}
    </div>
  </fieldset>;
}

function ScriptSpecimen({ text, textClassName, accessibleText, image }: {
  text: string; textClassName?: string; accessibleText?: string; image: boolean;
}) {
  return <div className={`flex min-h-36 items-center justify-center rounded-xl border border-slate-200 p-4 ${image ? 'bg-white text-slate-950' : 'bg-slate-50 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'}`}>
    {text.trim() ? <p aria-label={accessibleText} className={`max-h-64 w-full overflow-y-auto whitespace-pre-wrap text-center text-3xl leading-relaxed [overflow-wrap:anywhere] ${textClassName ?? ''}`}>
      <span aria-hidden={accessibleText ? true : undefined}>{text}</span>
    </p> : <p className="text-center text-sm text-slate-500">Enter text to preview.</p>}
  </div>;
}

export function ScriptImageOutput({ title, text, textClassName, accessibleText, description, family, fontSample, filename }: {
  title: string; text: string; textClassName: string; accessibleText?: string; description: string;
  family: string; fontSample: string; filename: string;
}) {
  return <section aria-label={`${title} PNG`} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
    <h3 className="font-semibold">{title} · PNG image</h3>
    <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
    <ScriptSpecimen text={text} textClassName={textClassName} accessibleText={accessibleText} image />
    <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">White is shown for preview only. The download has a transparent background.</p>
    <ScriptPngButton text={text} family={family} fontSample={fontSample} filename={filename} />
  </section>;
}
