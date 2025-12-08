import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Logo Font Maker - Create Logo Typography',
  description: 'Create stunning logo typography. Enter your brand name and explore dozens of professional font styles. Free logo font generator.',
  keywords: ['logo font', 'logo maker', 'logo typography', 'brand font', 'logo design', 'font for logo'],
  openGraph: {
    title: 'Logo Font Maker - Create Logo Typography',
    description: 'Create stunning logo typography. Explore dozens of professional font styles for your brand.',
    url: 'https://font-generators.org/tools/logo-font-maker',
  },
};

export default function LogoFontMakerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
