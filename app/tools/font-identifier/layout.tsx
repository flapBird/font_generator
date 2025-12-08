import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Font Identifier - AI Font Recognition Tool',
  description: 'Upload an image and let AI identify the font. Get font name, similar alternatives, and download links instantly. Free font finder tool.',
  keywords: ['font identifier', 'font finder', 'what font is this', 'font recognition', 'identify font', 'font detector'],
  openGraph: {
    title: 'Font Identifier - AI Font Recognition Tool',
    description: 'Upload an image and let AI identify the font. Get font name and similar alternatives.',
    url: 'https://font-generators.org/tools/font-identifier',
  },
};

export default function FontIdentifierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
