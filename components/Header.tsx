'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FocusEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface HeaderLink {
  href: string;
  label: string;
  icon: string;
}

interface HeaderProps {
  styleLinks: HeaderLink[];
  fandomLinks: HeaderLink[];
}

type MenuKey = 'styles' | 'fandom';

const primaryLinks = [
  { href: '/', label: 'Home' },
  { href: '/guides', label: 'Guides' },
  { href: '/about', label: 'About' },
];

const desktopLinkClass =
  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-3.5 w-3.5 ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 16 16"
    >
      <path d="M4 6.5L8 10.5L12 6.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

export default function Header({ styleLinks, fandomLinks }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileSection, setOpenMobileSection] = useState<MenuKey | null>(null);
  const [desktopMenu, setDesktopMenu] = useState<MenuKey | null>(null);
  const [closingDesktopMenu, setClosingDesktopMenu] = useState<MenuKey | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const openDropdown = (menu: MenuKey) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setClosingDesktopMenu(null);
    setDesktopMenu(menu);
  };

  const closeDropdown = (menu: MenuKey) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    setDesktopMenu((current) => (current === menu ? null : current));
    setClosingDesktopMenu(menu);

    const closeMs =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--dropdown-close-dur')
      ) || 150;

    closeTimerRef.current = setTimeout(() => {
      setClosingDesktopMenu((current) => (current === menu ? null : current));
    }, closeMs);
  };

  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setOpenMobileSection(null);
    setDesktopMenu(null);
    setClosingDesktopMenu(null);
  };

  const dropdownClass = (menu: MenuKey) =>
    `t-dropdown ${desktopMenu === menu ? 'is-open' : ''} ${
      closingDesktopMenu === menu ? 'is-closing' : ''
    }`;

  const handleDesktopBlur = (
    event: FocusEvent<HTMLDivElement>,
    menu: MenuKey
  ) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      closeDropdown(menu);
    }
  };

  const renderMobileSection = (
    menu: MenuKey,
    label: string,
    indexHref: string,
    links: HeaderLink[]
  ) => {
    const isOpen = openMobileSection === menu;
    const panelId = `mobile-${menu}-links`;

    return (
      <div className="t-acc" data-open={String(isOpen)}>
        <button
          type="button"
          className="t-acc-head flex w-full items-center justify-between rounded-xl px-4 py-3 text-left font-medium transition-colors hover:bg-muted"
          aria-controls={panelId}
          aria-expanded={isOpen}
          onClick={() => setOpenMobileSection(isOpen ? null : menu)}
        >
          <span>{label}</span>
          <span className="t-acc-chevron">
            <ChevronIcon />
          </span>
        </button>
        <div id={panelId} className="t-acc-panel">
          <div className="t-acc-panel-inner">
            <div className="mx-3 mb-2 rounded-2xl border border-border/70 bg-muted/45 p-2">
              <Link
                href={indexHref}
                className="mb-1 flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-background"
                onClick={closeAllMenus}
              >
                View all {label.toLowerCase()}
                <span aria-hidden="true">→</span>
              </Link>
              <ul className="space-y-0.5">
                {links.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                      onClick={closeAllMenus}
                    >
                      <span aria-hidden="true" className="w-5 text-center">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/88 backdrop-blur-xl">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Primary navigation">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={closeAllMenus}
          >
            <span className="gradient-text text-xl font-bold sm:text-2xl">Font Generators</span>
          </Link>

          <div className="hidden h-full items-center gap-1 md:flex">
            <Link href={primaryLinks[0].href} className={desktopLinkClass}>
              {primaryLinks[0].label}
            </Link>

            <div
              className="flex h-full items-center"
              onMouseEnter={() => openDropdown('styles')}
              onMouseLeave={(event) => {
                if (!event.currentTarget.contains(document.activeElement)) closeDropdown('styles');
              }}
              onFocus={() => openDropdown('styles')}
              onBlur={(event) => handleDesktopBlur(event, 'styles')}
            >
              <Link
                href="/styles"
                className={desktopLinkClass}
                aria-expanded={desktopMenu === 'styles'}
                aria-haspopup="true"
              >
                Text Styles
                <ChevronIcon
                  className={`transition-transform ${
                    desktopMenu === 'styles' ? 'rotate-180' : ''
                  }`}
                />
              </Link>

              <div className="pointer-events-none fixed left-1/2 top-16 w-[min(72rem,calc(100vw-2rem))] -translate-x-1/2">
                <div
                  className={`${dropdownClass('styles')} pt-2`}
                  data-origin="top-center"
                >
                  <div className="max-h-[calc(100vh-5rem)] overflow-y-auto overscroll-y-contain rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_28px_80px_-20px_rgba(15,23,42,0.45)] ring-1 ring-slate-950/5 lg:p-6 dark:border-slate-700 dark:bg-slate-950 dark:ring-white/10">
                    <div className="mb-4 flex items-end justify-between gap-6 border-b border-border/70 pb-4">
                      <div>
                        <p className="font-semibold text-foreground">Text Style Generators</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Choose a Unicode style and start creating copy-and-paste text.
                        </p>
                      </div>
                      <Link
                        href="/styles"
                        className="shrink-0 text-sm font-semibold text-primary hover:underline"
                        onClick={closeAllMenus}
                      >
                        View all styles →
                      </Link>
                    </div>
                    <ul className="grid grid-cols-2 gap-1 lg:grid-cols-3 xl:grid-cols-4">
                      {styleLinks.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={closeAllMenus}
                          >
                            <span aria-hidden="true" className="w-5 shrink-0 text-center">
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="relative flex h-full items-center"
              onMouseEnter={() => openDropdown('fandom')}
              onMouseLeave={(event) => {
                if (!event.currentTarget.contains(document.activeElement)) closeDropdown('fandom');
              }}
              onFocus={() => openDropdown('fandom')}
              onBlur={(event) => handleDesktopBlur(event, 'fandom')}
            >
              <Link
                href="/fandom"
                className={desktopLinkClass}
                aria-expanded={desktopMenu === 'fandom'}
                aria-haspopup="true"
              >
                Fandom
                <ChevronIcon
                  className={`transition-transform ${
                    desktopMenu === 'fandom' ? 'rotate-180' : ''
                  }`}
                />
              </Link>

              <div className="pointer-events-none absolute right-0 top-full w-80">
                <div
                  className={`${dropdownClass('fandom')} pt-2`}
                  data-origin="top-right"
                >
                  <div className="max-h-[calc(100vh-5rem)] overflow-y-auto overscroll-y-contain rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_24px_65px_-18px_rgba(15,23,42,0.45)] ring-1 ring-slate-950/5 dark:border-slate-700 dark:bg-slate-950 dark:ring-white/10">
                    <div className="mb-2 flex items-center justify-between px-2 py-1">
                      <p className="text-sm font-semibold text-foreground">Fandom Generators</p>
                      <Link
                        href="/fandom"
                        className="text-xs font-semibold text-primary hover:underline"
                        onClick={closeAllMenus}
                      >
                        View all →
                      </Link>
                    </div>
                    <ul className="space-y-1">
                      {fandomLinks.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={closeAllMenus}
                          >
                            <span aria-hidden="true" className="w-5 text-center">
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {primaryLinks.slice(1).map((item) => (
              <Link key={item.href} href={item.href} className={desktopLinkClass}>
                {item.label}
              </Link>
            ))}
          </div>

          <button
            className="rounded-lg p-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-controls="mobile-navigation"
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              id="mobile-navigation"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-slate-200 bg-white shadow-xl md:hidden dark:border-slate-700 dark:bg-slate-950"
            >
              <div className="max-h-[calc(100vh-4rem)] space-y-1 overflow-y-auto overscroll-y-contain py-3">
                <Link
                  href="/"
                  className="block rounded-xl px-4 py-3 font-medium transition-colors hover:bg-muted"
                  onClick={closeAllMenus}
                >
                  Home
                </Link>
                {renderMobileSection('styles', 'Text Styles', '/styles', styleLinks)}
                {renderMobileSection('fandom', 'Fandom', '/fandom', fandomLinks)}
                {primaryLinks.slice(1).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-xl px-4 py-3 font-medium transition-colors hover:bg-muted"
                    onClick={closeAllMenus}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
