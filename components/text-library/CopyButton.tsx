'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { trackTextToolEvent } from '@/lib/analytics/text-tools';
import type { LibraryId } from '@/lib/text-library/catalog';

export default function CopyButton({ text, label, tool, itemId, onCopied, children, className = '' }: {
  text: string; label: string; tool: LibraryId; itemId?: string; onCopied?: () => void;
  children?: ReactNode; className?: string;
}) {
  const [notice, setNotice] = useState<{ text: string; kind: 'success' | 'failure' } | null>(null);
  const fallback = useRef<HTMLTextAreaElement>(null);
  const current = notice?.text === text ? notice.kind : null;
  useEffect(() => {
    if (notice?.kind !== 'success') return;
    const timer = setTimeout(() => setNotice(null), 2200);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (current === 'failure') { fallback.current?.focus(); fallback.current?.select(); }
  }, [current, notice]);

  async function copy() {
    if (text.length === 0) return; // Spaces and zero-width characters are valid output.
    try {
      await navigator.clipboard.writeText(text);
      setNotice({ text, kind: 'success' });
      trackTextToolEvent('tool_copy_success', tool, itemId);
      onCopied?.();
    } catch {
      setNotice({ text, kind: 'failure' });
      trackTextToolEvent('tool_copy_failure', tool, itemId);
    }
  }
  return <div className="min-w-0">
    <button type="button" aria-label={label} disabled={text.length === 0} onClick={() => void copy()}
      className={`min-h-11 w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>
      {children ?? <span className="block px-4 py-3 text-center font-semibold">{label}</span>}
    </button>
    <p role="status" className={current ? 'mt-2 text-xs leading-5 text-violet-800' : 'sr-only'}>
      {current === 'success' ? 'Copied to clipboard.' : current === 'failure' ? 'Copy unavailable. Select the text below and use your device’s Copy command.' : ''}
    </p>
    {current === 'failure' && <textarea ref={fallback} aria-label={`Manual copy: ${label}`} readOnly value={text} rows={2}
      className="mt-2 w-full rounded-lg border border-violet-300 bg-white p-2 text-sm" onFocus={(event) => event.currentTarget.select()} />}
  </div>;
}
