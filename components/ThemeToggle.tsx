'use client';
import { useSyncExternalStore } from 'react';
export const themeStorageKey = 'font-generators-theme-v3';
function isDark() { return document.documentElement.classList.contains('dark'); }
function subscribe(notify: () => void) {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  function sync(event: StorageEvent) {
    if (event.key !== themeStorageKey && event.key !== null) return;
    const next = event.newValue === 'dark';
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.style.colorScheme = next ? 'dark' : 'light';
  }
  window.addEventListener('storage', sync);
  return () => { observer.disconnect(); window.removeEventListener('storage', sync); };
}
export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  return <button type="button" aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} title={`Switch to ${dark ? 'light' : 'dark'} mode`} onClick={() => {
    const next = !isDark();
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.style.colorScheme = next ? 'dark' : 'light';
    try { localStorage.setItem(themeStorageKey, next ? 'dark' : 'light'); } catch { /* Keep the control working when storage is blocked. */ }
  }} className="flex h-11 min-w-11 items-center justify-center rounded-full border border-border bg-muted px-2 text-xs font-semibold text-foreground transition hover:border-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"><span aria-hidden="true">{dark ? 'Light' : 'Dark'}</span></button>;
}
