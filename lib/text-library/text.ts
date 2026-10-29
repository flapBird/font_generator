import type { LibraryItem } from './catalog';

export const COMBINATION_LIMIT = 1000;
export function codePoints(text: string) {
  return Array.from(text, (char) => `U+${char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`).join(' ');
}
export function filterLibraryItems(items: LibraryItem[], query: string, category: string) {
  const words = query.trim().toLocaleLowerCase('en').split(/\s+/u).filter(Boolean);
  return items.filter((item) => (category === 'All' || item.category === category) && words.every((word) =>
    `${item.name} ${item.text} ${item.tags.join(' ')} ${item.category} ${codePoints(item.text)}`.toLocaleLowerCase('en').includes(word)));
}
export function combineParts(parts: string[], separator: string) { return parts.join(separator); }

export type SavedLibrary = { favorites: string[]; recent: string[] };
export function parseSavedLibrary(raw: string): SavedLibrary {
  const empty = { favorites: [], recent: [] };
  try {
    if (raw.length > 50_000) return empty;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return empty;
    const ids = (list: unknown, limit: number) => Array.isArray(list)
      ? [...new Set(list.filter((id): id is string => typeof id === 'string' && /^[a-z0-9-]{1,100}$/.test(id)))].slice(0, limit) : [];
    const data = value as Record<string, unknown>;
    return { favorites: ids(data.favorites, 500), recent: ids(data.recent, 24) };
  } catch { return empty; }
}
