import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - Font Generators',
  description: 'Learn how Font Generators creates free browser-based Unicode text tools for names, bios, captions, and creative projects.',
  openGraph: {
    title: 'About Us - Font Generators',
    description: 'Learn about our free browser-based Unicode text tools and the principles behind them.',
    url: 'https://font-generators.org/about',
  },
  alternates: {
    canonical: 'https://font-generators.org/about',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
