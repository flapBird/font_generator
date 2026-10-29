import type { LibraryId } from './catalog';
import { symbolItems } from './symbols';
import { emojiComboItems, kaomojiItems } from './combinations';

export function getLibraryItems(id: LibraryId) {
  if (id === 'kaomoji') return kaomojiItems;
  if (id === 'emoji-combos') return emojiComboItems;
  if (id === 'symbols') return symbolItems;
  return symbolItems.filter((item) => item.family === id);
}
