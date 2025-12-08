import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - Font Generators',
  description: 'Learn about Font Generators and our mission to provide free AI-powered typography tools for designers and creators.',
  openGraph: {
    title: 'About Us - Font Generators',
    description: 'Learn about Font Generators and our mission to provide free AI-powered typography tools.',
    url: 'https://font-generators.org/about',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
