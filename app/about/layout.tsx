import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about our free text and artwork tools, optional paid AI Font Generator, and how each service handles your input.',
  openGraph: {
    title: 'About Us - Font Generators',
    description: 'Learn how our free tools and optional paid AI fonts work, how input is handled, and what compatibility limits to expect.',
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
