import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fancy Text Generator - Unicode Text Converter',
  description: 'Transform your text into 50+ fancy Unicode styles. Create stylish text for Instagram, Twitter, Discord, and more. Free fancy text generator.',
  keywords: ['fancy text', 'unicode text', 'stylish text', 'instagram fonts', 'text converter', 'cool text'],
  openGraph: {
    title: 'Fancy Text Generator - Unicode Text Converter',
    description: 'Transform your text into 50+ fancy Unicode styles for social media.',
    url: 'https://font-generators.org/tools/fancy-text',
  },
};

export default function FancyTextLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
