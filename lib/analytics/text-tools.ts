'use client';

import { analyticsAllowed, initializeAnalytics, safePageLocation } from './browser';
import type { LibraryId } from '../text-library/catalog';

type ToolEvent = 'tool_copy_success' | 'tool_copy_failure' | 'tool_combine' | 'tool_favorite' | 'tool_filter' | 'tool_directory_click' | 'tool_export_success';
/** Only fixed tool/item identifiers. Never pass user text, search terms or clipboard content. */
export function trackTextToolEvent(event: ToolEvent, tool: LibraryId, itemId?: string) {
  try {
    if (!analyticsAllowed()) return;
    initializeAnalytics();
    window.gtag?.('event', event, {
      tool_id: tool, page_location: safePageLocation(), transport_type: 'beacon',
      ...(itemId && /^[a-z0-9-]{1,100}$/.test(itemId) ? { item_id: itemId } : {}),
    });
  } catch { /* A blocked analytics request must never block the tool. */ }
}
