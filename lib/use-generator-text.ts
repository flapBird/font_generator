"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';

/** Inputs belong to the current generator; navigation starts its own example. */
export function useGeneratorText(defaultText: string) {
  const pathname = usePathname();
  const [draft, setDraft] = useState({ pathname, text: defaultText });
  if (draft.pathname !== pathname) setDraft({ pathname, text: defaultText });
  const text = draft.pathname === pathname ? draft.text : defaultText;
  return [text, (value: string) => setDraft({ pathname, text: value })] as const;
}
