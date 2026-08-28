'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore, type FocusEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface HeaderLink {
  href: string;
  label: string;
  icon: string;
}

interface HeaderProps {
  fontStyleLinks: HeaderLink[];
  visualArtLinks: HeaderLink[];
}

type MenuKey = 'styles' | 'art';

const primaryLinks = [
  { href: '/', label: 'Home' },
  { href: '/guides', label: 'Guides' },
];

const desktopLinkClass =
  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-muted hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-slate-200 dark:hover:text-white';

const compactGeneratorLabel = (label: string) =>
  label.replace(/\s+Generator$/i, '');

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

const themeChangeEvent = 'font-generators-theme-change';
const themeStorageKey = 'font-generators-theme-v2';

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
}

function subscribeToTheme(onStoreChange: () => void) {
  const handleThemeChange = () => onStoreChange();

  window.addEventListener(themeChangeEvent, handleThemeChange);

  return () => {
    window.removeEventListener(themeChangeEvent, handleThemeChange);
  };
}

function getThemeSnapshot() {
  return document.documentElement.classList.contains('dark');
}

function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => false);

  const toggleTheme = () => {
    const nextThemeIsDark = !getThemeSnapshot();
    applyTheme(nextThemeIsDark);
    try {
      window.localStorage.setItem(themeStorageKey, nextThemeIsDark ? 'dark' : 'light');
    } catch {}
    window.dispatchEvent(new Event(themeChangeEvent));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-muted hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-slate-200 dark:hover:text-white"
    >
      {isDark ? (
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.72 5.28l-1.42 1.42M6.7 17.3l-1.42 1.42M18.72 18.72l-1.42-1.42M6.7 6.7 5.28 5.28" />
        </svg>
      ) : (
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.4 15.2A8.5 8.5 0 0 1 8.8 3.6 8.5 8.5 0 1 0 20.4 15.2Z" />
        </svg>
      )}
    </button>
  );
}

export default function Header({ fontStyleLinks, visualArtLinks }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileSection, setOpenMobileSection] = useState<MenuKey | null>(null);
  const [desktopMenu, setDesktopMenu] = useState<MenuKey | null>(null);
  const [closingDesktopMenu, setClosingDesktopMenu] = useState<MenuKey | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const openDropdown = (menu: MenuKey, delayed = false) => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setClosingDesktopMenu(null);

    if (!delayed || desktopMenu === menu) {
      setDesktopMenu(menu);
      return;
    }

    const openDelayMs =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--dropdown-open-delay')
      ) || 220;

    openTimerRef.current = setTimeout(() => {
      setDesktopMenu(menu);
      openTimerRef.current = null;
    }, openDelayMs);
  };

  const closeDropdown = (menu: MenuKey) => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    if (desktopMenu !== menu) return;

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
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
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
        <div id={panelId} className="t-acc-panel" aria-hidden={!isOpen} inert={!isOpen}>
          <div className="t-acc-panel-inner">
            <div className="mx-3 mb-2 rounded-2xl border border-border/70 bg-muted/45 p-2">
              <Link
                href={indexHref}
                className="mb-1 flex min-h-11 items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-background"
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
                      className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-background hover:text-slate-950 dark:text-slate-200 dark:hover:text-white"
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

  const featuredStyleLinks = fontStyleLinks.slice(0, 10);
  const featuredVisualArtLinks = visualArtLinks.slice(0, 7);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Primary navigation">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={closeAllMenus}
          >
            <span className="brand-gradient-text text-xl font-black tracking-[-0.025em] sm:text-2xl">Font Generators</span>
          </Link>

          <div className="flex h-full items-center gap-1">
          <div className="hidden h-full items-center gap-1 md:flex">
            <Link href={primaryLinks[0].href} className={desktopLinkClass}>
              {primaryLinks[0].label}
            </Link>

            <div
              className="relative flex h-full items-center"
              onMouseEnter={() => openDropdown('styles', true)}
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
                Font Styles
                <ChevronIcon
                  className={`transition-transform ${
                    desktopMenu === 'styles' ? 'rotate-180' : ''
                  }`}
                />
              </Link>

              <div className="pointer-events-none absolute left-1/2 top-full w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2">
                <div
                  className={dropdownClass('styles')}
                  data-origin="top-center"
                >
                  <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-[0_28px_80px_-20px_rgba(15,23,42,0.45)] ring-1 ring-slate-950/5 dark:border-slate-700 dark:bg-slate-950 dark:ring-white/10">
                    <ul className="mx-auto grid w-[13rem] max-w-full grid-cols-1 gap-1.5">
                      {featuredStyleLinks.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-2.5 rounded-lg px-2 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-muted hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-slate-200 dark:hover:text-white"
                            onClick={closeAllMenus}
                          >
                            <span aria-hidden="true" className="w-5 shrink-0 text-center">
                              {item.icon}
                            </span>
                            <span className="truncate" title={item.label}>{compactGeneratorLabel(item.label)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 flex justify-center border-t border-border/70 px-2.5 pt-2.5">
                      <Link
                        href="/styles"
                        className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-violet-800 dark:hover:text-violet-300"
                        onClick={closeAllMenus}
                      >
                        <span>View all</span>
                        <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="relative flex h-full items-center"
              onMouseEnter={() => openDropdown('art', true)}
              onMouseLeave={(event) => {
                if (!event.currentTarget.contains(document.activeElement)) closeDropdown('art');
              }}
              onFocus={() => openDropdown('art')}
              onBlur={(event) => handleDesktopBlur(event, 'art')}
            >
              <Link
                href="/visual-art"
                className={desktopLinkClass}
                aria-expanded={desktopMenu === 'art'}
                aria-haspopup="true"
              >
                Visual &amp; Art
                <ChevronIcon
                  className={`transition-transform ${
                    desktopMenu === 'art' ? 'rotate-180' : ''
                  }`}
                />
              </Link>

              <div className="pointer-events-none absolute left-1/2 top-full w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2">
                <div
                  className={dropdownClass('art')}
                  data-origin="top-right"
                >
                  <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-[0_28px_80px_-20px_rgba(15,23,42,0.45)] ring-1 ring-slate-950/5 dark:border-slate-700 dark:bg-slate-950 dark:ring-white/10">
                    <ul className="mx-auto grid w-[13rem] max-w-full grid-cols-1 gap-1.5">
                      {featuredVisualArtLinks.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-2.5 rounded-lg px-2 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-muted hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-slate-200 dark:hover:text-white"
                            onClick={closeAllMenus}
                          >
                            <span aria-hidden="true" className="w-5 shrink-0 text-center">
                              {item.icon}
                            </span>
                            <span className="truncate" title={item.label}>{compactGeneratorLabel(item.label)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 flex justify-center border-t border-border/70 px-2.5 pt-2.5">
                      <Link
                        href="/visual-art"
                        className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-violet-800 dark:hover:text-violet-300"
                        onClick={closeAllMenus}
                      >
                        <span>View all</span>
                        <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
                      </Link>
                    </div>
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

          <ThemeToggle />

          <button
            className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
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
                {renderMobileSection('styles', 'Font Styles', '/styles', featuredStyleLinks)}
                {renderMobileSection('art', 'Visual & Art', '/visual-art', featuredVisualArtLinks)}
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
