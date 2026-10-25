import type { Metadata } from 'next';
import AiFontStudio from '@/components/ai-font/AiFontStudio';
import { availability } from '@/lib/ai-font/config';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'My Fonts & Purchases', robots: { index: false, follow: false }, referrer: 'same-origin' };

export default function MyFontsPage() {
  return <AiFontStudio services={availability()} libraryOnly />;
}
