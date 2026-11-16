'use client';

import { useState } from 'react';

export default function ScriptPngButton({ text, family, fontSample, filename }: {
  text: string;
  family: string;
  fontSample: string;
  filename: string;
}) {
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState<string>();

  async function download() {
    setWorking(true);
    setFailed(undefined);
    try {
      const { exportScriptPng } = await import('@/lib/script-png');
      await exportScriptPng(text, family, fontSample, filename);
    } catch {
      setFailed(text);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <button type="button" disabled={working || !text.trim()} onClick={() => void download()}
        className="min-h-11 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-50">
        {working ? 'Creating PNG…' : 'Download PNG'}
      </button>
      <span className="text-xs text-slate-500 dark:text-slate-400">Transparent background</span>
      {failed === text && <p role="status" className="w-full text-sm text-amber-800 dark:text-amber-300">PNG download failed. Try again or reload the page to retry the font.</p>}
    </div>
  );
}
