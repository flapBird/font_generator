'use client';

import Link from '@/components/IntentLink';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AccountMenu from '@/components/AccountMenu';
import SiteSearch from './SiteSearch';
import ThemeToggle from './ThemeToggle';
import { usePathname } from 'next/navigation';
import { featuredToolCategories } from '@/lib/tool-navigation';

const primaryLinks = [
  { href: '/ai-font-generator', label: 'AI Font' },
  { href: '/guides', label: 'Guides' },
  { href: '/pricing', label: 'Pricing' },
];
const linkClass = 'flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500';

function Chevron({ open }: { open: boolean }) {
  return <svg aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 16 16"><path d="M4 6.5L8 10.5L12 6.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>;
}

export default function Header() {
  const pathname = usePathname();
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function clearTimer() { if (openTimer.current) { clearTimeout(openTimer.current); openTimer.current = null; } }
  function closeAll() { clearTimer(); setDesktopOpen(false); setMobileOpen(false); setMobileToolsOpen(false); }
  function closeDesktop() { clearTimer(); setDesktopOpen(false); }
  function openDesktop(delayed = false) {
    clearTimer();
    if (delayed) openTimer.current = setTimeout(() => setDesktopOpen(true), 180);
    else setDesktopOpen(true);
  }
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (!toolsRef.current?.contains(event.target as Node)) { if (openTimer.current) clearTimeout(openTimer.current); setDesktopOpen(false); }
      if (!headerRef.current?.contains(event.target as Node)) { setMobileOpen(false); setMobileToolsOpen(false); }
    }
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('pointerdown', outside); if (openTimer.current) clearTimeout(openTimer.current); };
  }, []);

  return <header ref={headerRef} className="relative z-50 h-12"
    onKeyDown={(event) => {
      if (event.key !== 'Escape' || (!desktopOpen && !mobileOpen)) return;
      event.preventDefault();
      if (mobileOpen) { closeAll(); document.getElementById('mobile-menu-trigger')?.focus(); }
      else { closeDesktop(); document.getElementById('tools-menu-trigger')?.focus(); }
    }}>
    <nav aria-label="Primary navigation">
      <div className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-5 sm:px-6 lg:px-8">
          <Link href="/" onClick={closeAll} className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><span className="brand-gradient-text whitespace-nowrap text-base font-bold tracking-[-0.04em] sm:text-2xl">Font Generators</span></Link>
          <div className="hidden w-full max-w-md lg:block"><SiteSearch key={pathname} id="site-search-desktop" onOpen={closeAll} /></div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
            <ThemeToggle />
            <AccountMenu />
            <button id="mobile-menu-trigger" type="button" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-controls="mobile-navigation" aria-expanded={mobileOpen} onClick={() => { setMobileOpen(!mobileOpen); setMobileToolsOpen(false); }} className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 lg:hidden">
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{mobileOpen ? <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}</svg>
            </button>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 top-16 border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="py-2 lg:hidden" inert={mobileOpen}><SiteSearch key={pathname} id="site-search-mobile" onOpen={closeAll} /></div>
          <div className="hidden h-12 items-center gap-1 lg:flex">
            <div ref={toolsRef} className="relative flex h-full items-center"
              onMouseEnter={() => openDesktop(true)} onMouseLeave={() => { if (!toolsRef.current?.contains(document.activeElement)) closeDesktop(); }}
              onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) closeDesktop(); }}>
              <button id="tools-menu-trigger" type="button" aria-expanded={desktopOpen} aria-controls="desktop-tool-links" className={linkClass}
                onClick={() => { clearTimer(); setDesktopOpen(!desktopOpen); }}
                onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); openDesktop(); requestAnimationFrame(() => document.querySelector<HTMLAnchorElement>('#desktop-tool-links a')?.focus()); } }}>
                Tools<Chevron open={desktopOpen} />
              </button>
              <div className="pointer-events-none absolute left-0 top-full w-[min(38rem,calc(100vw-3rem))]">
                <div className={`t-dropdown ${desktopOpen ? 'is-open' : ''}`} data-origin="top-left">
                  <nav id="desktop-tool-links" aria-label="Tool categories" aria-hidden={!desktopOpen} inert={!desktopOpen} className="overflow-hidden rounded-2xl border border-border bg-background shadow-[0_20px_60px_-16px_rgba(15,23,42,0.3)]">
                    <div className="grid grid-cols-2 gap-1 p-3">{featuredToolCategories.map((category) => <Link key={category.id} href={category.href} onClick={closeAll} onFocus={() => openDesktop()} className="rounded-xl p-4 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
                      <span className="block text-sm font-semibold text-foreground">{category.title}</span><span className="mt-2 block text-xs leading-5 text-muted-foreground">{category.description}</span>
                    </Link>)}</div>
                    <Link href="/tools" onClick={closeAll} className="flex min-h-12 items-center justify-between border-t border-border bg-muted px-6 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500">Browse all tools<span aria-hidden="true">→</span></Link>
                  </nav>
                </div>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-1 border-l border-border pl-2">{featuredToolCategories.map((category) => <Link key={category.id} href={category.href} onClick={closeAll} aria-current={pathname === category.href || pathname.startsWith(category.href + '/') ? 'page' : undefined} className={`${linkClass} text-xs xl:text-sm aria-[current=page]:bg-muted aria-[current=page]:text-violet-700 dark:aria-[current=page]:text-violet-300`}>{category.title}</Link>)}</div>
            <div className="ml-auto flex items-center">
            {primaryLinks.map((item) => <Link key={item.href} href={item.href} className={linkClass} onClick={closeAll}>{item.label}</Link>)}
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>{mobileOpen && <motion.div id="mobile-navigation" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="fixed inset-x-0 top-16 z-50 overflow-hidden border-b border-border bg-background px-3 shadow-lg lg:hidden">
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-y-contain py-3">
          <button type="button" aria-expanded={mobileToolsOpen} aria-controls="mobile-tool-links" onClick={() => setMobileToolsOpen(!mobileToolsOpen)} className="flex min-h-12 w-full items-center justify-between rounded-xl px-4 text-left font-medium hover:bg-muted">Tools<Chevron open={mobileToolsOpen} /></button>
          <nav id="mobile-tool-links" aria-label="Mobile tool categories" hidden={!mobileToolsOpen} className="mx-2 mb-2 rounded-xl border border-border bg-muted p-2">
            <Link href="/tools" onClick={closeAll} className="flex min-h-11 items-center justify-between rounded-lg px-3 text-sm font-semibold text-violet-700 dark:text-violet-300">Browse all tools<span aria-hidden="true">→</span></Link>
            {featuredToolCategories.map((category) => <Link key={category.id} href={category.href} onClick={closeAll} className="flex min-h-11 items-center rounded-lg px-3 text-sm text-foreground hover:bg-background">{category.title}</Link>)}
          </nav>
          {primaryLinks.map((item) => <Link key={item.href} href={item.href} onClick={closeAll} className="flex min-h-12 items-center rounded-xl px-4 font-medium text-foreground hover:bg-muted">{item.label}</Link>)}
        </div>
      </motion.div>}</AnimatePresence>
    </nav>
  </header>;
}
