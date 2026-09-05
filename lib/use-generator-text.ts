"use client";

import { useState, useSyncExternalStore } from 'react';
import { readSavedGeneratorText, resolveGeneratorText, type TextDraftSnapshot } from './generator-text-draft';

const key = 'font-generators-text-draft';
const initialSnapshot: TextDraftSnapshot = { text: null, revision: 0 };
let snapshot = initialSnapshot;
let loaded = false;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
const getSnapshot = () => {
  if (!loaded && typeof window !== 'undefined') {
    loaded = true;
    try {
      snapshot = { text: readSavedGeneratorText(window.sessionStorage.getItem(key)), revision: 0 };
    } catch {}
  }
  return snapshot;
};
const getServerSnapshot = () => initialSnapshot;
const setText = (text: string) => {
  snapshot = { text, revision: snapshot.revision + 1 };
  try {
    if (text.trim()) window.sessionStorage.setItem(key, text);
    else window.sessionStorage.removeItem(key);
  } catch {}
  listeners.forEach((listener) => listener());
};

/** Preserve real drafts across tools, but allow clearing the current input to type again. */
export function useGeneratorText(defaultText: string) {
  const [openedAtRevision] = useState(() => getSnapshot().revision);
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [resolveGeneratorText(current, openedAtRevision, defaultText), setText] as const;
}
