'use client';

import { useLayoutEffect } from 'react';

export default function ResetPageScroll({ routeKey }: { routeKey: string }) {
  useLayoutEffect(() => {
    const resetScroll = () => window.scrollTo(0, 0);
    resetScroll();
    const frame = window.requestAnimationFrame(resetScroll);
    return () => window.cancelAnimationFrame(frame);
  }, [routeKey]);

  return null;
}
