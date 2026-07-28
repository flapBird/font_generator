'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

interface AdvertisingScriptsProps {
  clientId: string;
  allowedPaths: string[];
}

export default function AdvertisingScripts({
  clientId,
  allowedPaths,
}: AdvertisingScriptsProps) {
  const pathname = usePathname();

  if (!allowedPaths.includes(pathname)) {
    return null;
  }

  return (
    <Script
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}
