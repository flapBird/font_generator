import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: 'https://font-generators.org/tools/ai-font-generator',
  },
  title: 'AI Font Generator - Feature Status',
  description: 'Current availability and development status of the AI font generator.',
};

export default function AIFontGeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
