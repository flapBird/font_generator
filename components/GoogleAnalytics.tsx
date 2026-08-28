'use client';

import Script from 'next/script';
import { useSyncExternalStore } from 'react';

interface GoogleAnalyticsProps {
  measurementId: string;
}

const productionHostnames = new Set([
  'font-generators.org',
  'www.font-generators.org',
]);

function subscribe() {
  return () => {};
}

function isProductionHostname() {
  return productionHostnames.has(window.location.hostname);
}

export default function GoogleAnalytics({
  measurementId,
}: GoogleAnalyticsProps) {
  const isProductionSite = useSyncExternalStore(
    subscribe,
    isProductionHostname,
    () => false,
  );

  if (!isProductionSite) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}
