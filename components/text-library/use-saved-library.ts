'use client';

import { useSyncExternalStore } from 'react';
import { parseSavedLibrary, type SavedLibrary } from '@/lib/text-library/text';

const KEY = 'font-generators:text-library:v1';
const CHANGED = 'font-generators:library-changed';
let sessionFallback: string | null = null;
function snapshot() {
  if (sessionFallback !== null) return sessionFallback;
  try { return window.localStorage.getItem(KEY) ?? ''; } catch { return ''; }
}
function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === KEY || event.key === null) listener(); };
  window.addEventListener('storage', onStorage);
  window.addEventListener(CHANGED, listener);
  return () => { window.removeEventListener('storage', onStorage); window.removeEventListener(CHANGED, listener); };
}
export function useSavedLibrary() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => '');
  const saved = parseSavedLibrary(raw);
  function update(change: (previous: SavedLibrary) => SavedLibrary) {
    const next = JSON.stringify(change(parseSavedLibrary(snapshot())));
    try { window.localStorage.setItem(KEY, next); sessionFallback = null; }
    catch { sessionFallback = next; } // Still usable for this session if storage is disabled/full.
    window.dispatchEvent(new Event(CHANGED));
  }
  return {
    saved,
    toggleFavorite: (id: string) => update((current) => ({ ...current, favorites: current.favorites.includes(id)
      ? current.favorites.filter((value) => value !== id) : [id, ...current.favorites].slice(0, 500) })),
    remember: (id: string) => update((current) => ({ ...current, recent: [id, ...current.recent.filter((value) => value !== id)].slice(0, 24) })),
    clear: () => update(() => ({ favorites: [], recent: [] })),
  };
}
