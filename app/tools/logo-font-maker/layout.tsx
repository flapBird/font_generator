import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: 'https://font-generators.org/tools/logo-font-maker',
  },
  title: 'Logo Font Maker - Preview 12 Typography Styles',
  description: 'Preview a brand name in 12 browser-based typography styles and download a simple editable SVG concept.',
  keywords: ['logo font', 'logo maker', 'logo typography', 'brand font', 'logo design', 'font for logo'],
  openGraph: {
    title: 'Logo Font Maker - Preview 12 Typography Styles',
    description: 'Compare 12 browser-based typography directions for a brand name.',
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
