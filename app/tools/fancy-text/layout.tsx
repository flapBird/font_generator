import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: 'https://font-generators.org/',
  },  title: 'Fancy Text Generator - Unicode Text Converter',
  description: 'Transform your text into 20+ fancy Unicode styles. Create stylish text for Instagram, Twitter, Discord, and more. Free fancy text generator.',
  openGraph: {
    title: 'Fancy Text Generator - Unicode Text Converter',
    description: 'Transform your text into 20+ fancy Unicode styles for social media.',
    url: 'https://font-generators.org/',
  },
};

export default function FancyTextLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
