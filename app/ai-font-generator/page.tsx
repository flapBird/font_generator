import type { Metadata } from 'next';
import AiFontStudio from '@/components/ai-font/AiFontStudio';
import { availability } from '@/lib/ai-font/config';

// Do not freeze service availability using the build environment.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI Font Generator — Create Your Own English Font',
  description: 'Explore free font style references and create custom, installable English TTF fonts with a one-time generation pack.',
  alternates: { canonical: '/ai-font-generator' },
  robots: { index: false, follow: true },
  referrer: 'same-origin',
};

export default function AiFontPage() {
  return <AiFontStudio services={availability()} />;
}
