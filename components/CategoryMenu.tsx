'use client';

import { useEffect, useRef } from 'react';
import Link from './IntentLink';
import { categoryShortcuts, type toolCategories } from '@/lib/tool-navigation';

type Category = typeof toolCategories[number];
export default function CategoryMenu({ category, mobile = false, open, activePath, onOpen, onToggle, onClose, onNavigate }: {
  category: Category; mobile?: boolean; open: boolean; activePath: string;
  onOpen?: () => void; onToggle: () => void; onClose: () => void; onNavigate: () => void;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function clearHover() { if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; } }
  useEffect(() => () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }, []);
  function navigate() { clearHover(); onNavigate(); }
  const id = `${mobile ? 'mobile' : 'desktop'}-${category.id}-shortcuts`;
  const active = activePath === category.href || activePath.startsWith(category.href + '/') || categoryShortcuts[category.id].some((item) => item.href === activePath);
  const viewAll = <Link href={category.href} onClick={navigate} className="flex min-h-11 items-center justify-between rounded-lg px-3 text-sm font-semibold text-violet-700 hover:bg-violet-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-violet-300 dark:hover:bg-violet-500/10">View all {category.title.toLowerCase()}<span aria-hidden="true">→</span></Link>;
  return <div data-category-menu className={mobile ? 'w-full' : 'relative shrink-0'}
    onPointerEnter={(event) => {
      if (mobile || event.pointerType !== 'mouse' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      clearHover(); if (!open) hoverTimer.current = setTimeout(() => { hoverTimer.current = null; onOpen?.(); }, 160);
    }}
    onPointerLeave={(event) => {
      if (mobile || event.pointerType !== 'mouse') return;
      clearHover();
      if (event.currentTarget.contains(document.activeElement) && document.activeElement?.matches(':focus-visible')) return;
      hoverTimer.current = setTimeout(() => { hoverTimer.current = null; onClose(); }, 180);
    }}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { clearHover(); onClose(); } }} onKeyDown={(event) => {
      if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); clearHover(); onClose(); trigger.current?.focus(); }
    }}>
    <div className={`flex items-center rounded-xl transition-colors ${active || open ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}>
      <Link href={category.href} onClick={navigate} aria-current={activePath === category.href ? 'page' : undefined} className={`flex min-h-11 items-center rounded-xl text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${mobile ? 'flex-1 px-3' : 'pl-3 pr-1 text-xs xl:text-sm'}`}>{category.title}</Link>
      <button ref={trigger} type="button" aria-label={`Show ${category.title} tools`} aria-expanded={open} aria-controls={id} onClick={() => { clearHover(); onToggle(); }} onKeyDown={(event) => {
        if (event.key === 'ArrowDown') { event.preventDefault(); clearHover(); if (!open) onToggle(); requestAnimationFrame(() => panel.current?.querySelector('a')?.focus()); }
      }} className={`flex min-h-11 shrink-0 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${mobile ? 'w-11' : 'w-7 xl:w-8'}`}>
        <svg aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 16 16"><path d="M4 6.5L8 10.5L12 6.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
      </button>
    </div>
    <div ref={panel} id={id} hidden={!open} className={mobile ? 'mb-2 ml-3 border-l border-border pl-2' : 'absolute left-1/2 top-full z-50 w-80 max-w-[calc(100vw-2rem)] -translate-x-1/2 pt-2'}>
      <div className={mobile ? '' : 'max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain rounded-2xl border border-violet-100 bg-white shadow-[0_20px_60px_-16px_rgba(37,20,70,0.25)] dark:border-slate-700 dark:bg-slate-950'}>
        {!mobile && <div className="flex items-center gap-3 border-b border-border/70 bg-gradient-to-br from-violet-50 to-white px-4 py-4 dark:from-violet-500/10 dark:to-slate-950">
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-200/60 bg-white font-serif text-lg text-violet-600 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300">{category.sample}</span>
          <div><p className="text-sm font-semibold text-foreground">{category.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{category.description}</p></div>
        </div>}
        {mobile && viewAll}
        <div className={mobile ? '' : 'p-2'}>{categoryShortcuts[category.id].map((item) => <Link key={item.href} href={item.href} onClick={navigate} aria-current={activePath === item.href ? 'page' : undefined} className="group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 aria-[current=page]:bg-muted dark:hover:bg-violet-500/10 dark:hover:text-violet-300">
          {!mobile && <span aria-hidden="true" className="flex h-7 w-8 shrink-0 items-center justify-center rounded-md bg-muted/70 font-serif text-sm text-muted-foreground group-hover:bg-white group-hover:text-violet-700 dark:group-hover:bg-violet-500/10 dark:group-hover:text-violet-300">{item.sample ?? (category.id === 'symbols' ? '✧' : 'U+')}</span>}
          <span className="flex-1">{item.label}</span><span aria-hidden="true" className="text-violet-500 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">↗</span>
        </Link>)}</div>
        {!mobile && <div className="border-t border-border/70 bg-violet-50/50 p-2 dark:bg-violet-500/5">{viewAll}</div>}
      </div>
    </div>
  </div>;
}
