import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn how Font Generators creates browser-based Unicode text, rendered typography, ASCII art, and downloadable text graphics.',
  openGraph: {
    title: 'About Us - Font Generators',
    description: 'Learn how our browser-based text generators work, how input is handled, and what compatibility limits to expect.',
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
