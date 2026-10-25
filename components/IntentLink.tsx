'use client';

import NextLink from 'next/link';
import { useState, type ComponentProps } from 'react';

// Large directories should not fetch every visible destination on page load.
// Restore Next's own prefetch/cache behavior when a visitor shows intent.
export default function IntentLink({ onMouseEnter, onFocus, prefetch, ...props }: ComponentProps<typeof NextLink>) {
  const [active, setActive] = useState(false);
  return <NextLink
    {...props}
    prefetch={prefetch ?? (active ? null : false)}
    onMouseEnter={event => { setActive(true); onMouseEnter?.(event); }}
    onFocus={event => { setActive(true); onFocus?.(event); }}
  />;
}
