import type { ReactNode } from 'react';

// Dedicated utility layout. It does not load the font generator's sidebar or preview.
export default function UnicodeToolWorkspace({ id, label, controls, children, stickyControls = false }: {
  id: string; label: string; controls: ReactNode; children: ReactNode; stickyControls?: boolean;
}) {
  return <section id={id} aria-label={label} data-clarity-mask="true" className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:gap-6">
    <div className={`min-w-0 ${stickyControls ? 'lg:sticky lg:top-24' : ''}`}>{controls}</div>
    <div className={`min-w-0 space-y-5 ${!stickyControls ? 'lg:sticky lg:top-24' : ''}`}>{children}</div>
  </section>;
}
