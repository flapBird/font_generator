'use client';

import { useRef } from 'react';
import Link from './IntentLink';
import { categoryShortcuts, type toolCategories } from '@/lib/tool-navigation';

type Category = typeof toolCategories[number];
export default function CategoryMenu({ category, mobile = false, open, activePath, onToggle, onClose, onNavigate }: {
  category: Category; mobile?: boolean; open: boolean; activePath: string;
  onToggle: () => void; onClose: () => void; onNavigate: () => void;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = `${mobile ? 'mobile' : 'desktop'}-${category.id}-shortcuts`;
  const active = activePath === category.href || activePath.startsWith(category.href + '/') || categoryShortcuts[category.id].some((item) => item.href === activePath);
  return <div data-category-menu className={mobile ? 'w-full' : 'relative shrink-0'} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onClose(); }} onKeyDown={(event) => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); onClose(); trigger.current?.focus(); }
  }}>
    <div className={`flex items-center rounded-lg ${active ? 'bg-muted text-violet-700 dark:text-violet-300' : 'text-muted-foreground'}`}>
      <Link href={category.href} onClick={onNavigate} aria-current={activePath === category.href ? 'page' : undefined} className={`flex min-h-11 items-center rounded-lg px-2 text-sm font-medium hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${mobile ? 'flex-1 px-3' : 'text-xs xl:text-sm'}`}>{category.title}</Link>
      <button ref={trigger} type="button" aria-label={`Show ${category.title} tools`} aria-expanded={open} aria-controls={id} onClick={onToggle} onKeyDown={(event) => {
        if (event.key === 'ArrowDown') { event.preventDefault(); if (!open) onToggle(); requestAnimationFrame(() => panel.current?.querySelector('a')?.focus()); }
      }} className={`flex min-h-11 shrink-0 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${mobile ? 'w-11' : 'w-7 xl:w-8'}`}>
        <svg aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 16 16"><path d="M4 6.5L8 10.5L12 6.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
      </button>
    </div>
    <div ref={panel} id={id} hidden={!open} className={mobile ? 'mb-2 ml-3 border-l border-border pl-2' : 'absolute left-0 top-full z-50 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-background p-2 shadow-xl'}>
      <Link href={category.href} onClick={onNavigate} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-violet-700 hover:bg-muted dark:text-violet-300">View all {category.title.toLowerCase()} →</Link>
      {categoryShortcuts[category.id].map((item) => <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={activePath === item.href ? 'page' : undefined} className="flex min-h-11 items-center rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 aria-[current=page]:bg-muted">{item.label}</Link>)}
    </div>
  </div>;
}
