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
  return <button type="button" aria-pressed={dark} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} title={`Switch to ${dark ? 'light' : 'dark'} mode`} onClick={() => {
    const next = !isDark();
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.style.colorScheme = next ? 'dark' : 'light';
    try { localStorage.setItem(themeStorageKey, next ? 'dark' : 'light'); } catch { /* Keep the control working when storage is blocked. */ }
  }} className="group flex h-11 w-14 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2">
    <span aria-hidden="true" className="relative flex h-7 w-[52px] items-center rounded-full bg-slate-300 transition-colors group-hover:bg-slate-400/70 dark:bg-slate-500 dark:group-hover:bg-slate-400">
      <svg className="absolute right-1.5 h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M20.8 14.1A8.6 8.6 0 0 1 9.9 3.2 9 9 0 1 0 20.8 14.1Z" /></svg>
      <span className={`absolute left-1 flex h-5 w-5 items-center justify-center rounded-full shadow-sm transition-transform motion-reduce:transition-none ${dark ? 'translate-x-6 bg-slate-100' : 'translate-x-0 bg-gradient-to-br from-cyan-400 via-violet-400 to-pink-400'}`}>
        {dark && <svg className="h-4 w-4 text-slate-700" viewBox="0 0 24 24" fill="currentColor"><path d="M20.8 14.1A8.6 8.6 0 0 1 9.9 3.2 9 9 0 1 0 20.8 14.1Z" /></svg>}
      </span>
    </span>
  </button>;
}
