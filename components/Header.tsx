'use client';

import Link from '@/components/IntentLink';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AccountMenu from '@/components/AccountMenu';
import SiteSearch from './SiteSearch';
import ThemeToggle from './ThemeToggle';
import { usePathname } from 'next/navigation';
import CategoryMenu from './CategoryMenu';
import { featuredToolCategories, type ToolCategoryId } from '@/lib/tool-navigation';

const primaryLinks = [
  { href: '/ai-font-generator', label: 'AI Font' },
  { href: '/guides', label: 'Guides' },
  { href: '/pricing', label: 'Pricing' },
];
const linkClass = 'flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500';

export default function Header() {
  const pathname = usePathname();
  const [categoryOpen, setCategoryOpen] = useState<ToolCategoryId | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  function closeAll() { setCategoryOpen(null); setMobileOpen(false); }
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (!(event.target instanceof Element) || !event.target.closest('[data-category-menu]')) setCategoryOpen(null);
      if (!headerRef.current?.contains(event.target as Node)) { setMobileOpen(false); }
    }
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);

  return <header ref={headerRef} className="relative z-50 h-12"
    onKeyDown={(event) => {
      if (event.key !== 'Escape' || !mobileOpen) return;
      event.preventDefault();
      closeAll(); document.getElementById('mobile-menu-trigger')?.focus();
    }}>
    <nav aria-label="Primary navigation">
      <div className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-5 sm:px-6 lg:grid lg:grid-cols-[1fr_minmax(0,30rem)_1fr] lg:px-8 xl:grid-cols-[1fr_minmax(0,32rem)_1fr]">
          <Link href="/" onClick={closeAll} className="shrink-0 justify-self-start rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><span className="brand-gradient-text whitespace-nowrap text-base font-bold tracking-[-0.04em] sm:text-2xl">Font Generators</span></Link>
          <div className="hidden w-full min-w-0 lg:block"><SiteSearch key={pathname} id="site-search-desktop" onOpen={closeAll} /></div>
          <div className="ml-auto flex shrink-0 items-center justify-self-end gap-1.5 sm:gap-3">
            <ThemeToggle />
            <AccountMenu />
            <button id="mobile-menu-trigger" type="button" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-controls="mobile-navigation" aria-expanded={mobileOpen} onClick={() => { setMobileOpen(!mobileOpen); setCategoryOpen(null); }} className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 lg:hidden">
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{mobileOpen ? <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}</svg>
            </button>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 top-16 border-b border-border bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="py-2 lg:hidden" inert={mobileOpen}><SiteSearch key={pathname} id="site-search-mobile" onOpen={closeAll} /></div>
          <div className="hidden h-12 items-center gap-2 lg:grid lg:grid-cols-[1fr_auto_1fr]">
            <div aria-hidden="true" className="hidden lg:block" />
            <div className="flex min-w-0 items-center gap-1 xl:gap-3">{featuredToolCategories.map((category) => <CategoryMenu key={category.id} category={category} activePath={pathname} open={categoryOpen === category.id} onOpen={() => { setCategoryOpen(category.id); }} onToggle={() => { setCategoryOpen(categoryOpen === category.id ? null : category.id); }} onClose={() => setCategoryOpen((value) => value === category.id ? null : value)} onNavigate={closeAll} />)}</div>
            <div className="ml-auto flex items-center justify-self-end xl:ml-0">
            {primaryLinks.map((item) => <Link key={item.href} href={item.href} className={linkClass} onClick={closeAll}>{item.label}</Link>)}
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>{mobileOpen && <motion.div id="mobile-navigation" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="fixed inset-x-0 top-16 z-50 overflow-hidden border-b border-border bg-background px-3 shadow-lg lg:hidden">
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-y-contain py-3">
          <nav id="mobile-tool-links" aria-label="Mobile tool categories" className="mb-2 space-y-1 border-b border-border pb-3">
            {featuredToolCategories.map((category) => <CategoryMenu key={category.id} category={category} mobile activePath={pathname} open={categoryOpen === category.id} onToggle={() => setCategoryOpen(categoryOpen === category.id ? null : category.id)} onClose={() => setCategoryOpen((value) => value === category.id ? null : value)} onNavigate={closeAll} />)}
          </nav>
          {primaryLinks.map((item) => <Link key={item.href} href={item.href} onClick={closeAll} className="flex min-h-12 items-center rounded-xl px-4 font-medium text-foreground hover:bg-muted">{item.label}</Link>)}
        </div>
      </motion.div>}</AnimatePresence>
    </nav>
  </header>;
}
