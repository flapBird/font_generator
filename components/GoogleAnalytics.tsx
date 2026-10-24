'use client';

import Script from 'next/script';
import { useEffect, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { ANALYTICS_HOSTS, GA4_MEASUREMENT_ID } from '@/lib/analytics/shared';
import { initializeAnalytics, trackEvent } from '@/lib/analytics/browser';

function subscribe() { return () => {}; }
function isProductionHostname() { return ANALYTICS_HOSTS.includes(window.location.hostname); }

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const production = useSyncExternalStore(subscribe, isProductionHostname, () => false);
  useEffect(() => {
    if (!production) return;
    initializeAnalytics();
    trackEvent('page_view');
    if (pathname === '/ai-font-generator') trackEvent('ai_font_view');
  }, [pathname, production]);
  if (!production) return null;
  return <Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`} />;
}
