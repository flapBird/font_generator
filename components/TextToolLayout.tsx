import Link from 'next/link';
import type { ReactNode } from 'react';

/** Layout for the new text tools only; older generator workspaces opt in separately. */
export default function TextToolLayout({ label, controls, children, footer, id }: {
  label: string; controls: ReactNode; children: ReactNode; footer?: ReactNode; id?: string;
}) {
  return <section id={id} aria-label={label} className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-3 sm:p-5 dark:border-slate-800 dark:bg-slate-950">
    <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="min-w-0 space-y-4 lg:sticky lg:top-24">{controls}</div>
      <div className="min-w-0 space-y-3">{children}</div>
    </div>
    {footer}
    <div className="mt-5 border-t border-slate-200 pt-3 text-sm dark:border-slate-800"><Link href="/styles" className="inline-flex min-h-11 items-center font-medium text-violet-700 dark:text-violet-300">View all text generators →</Link></div>
  </section>;
}
