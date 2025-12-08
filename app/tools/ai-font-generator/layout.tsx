import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Font Generator - Create Custom Fonts with AI',
  description: 'Generate unique font styles using AI. Enter a description and get multiple creative font variations instantly. Free online AI font generator tool.',
  keywords: ['AI font generator', 'custom fonts', 'font creator', 'AI typography', 'font design tool'],
  openGraph: {
    title: 'AI Font Generator - Create Custom Fonts with AI',
    description: 'Generate unique font styles using AI. Enter a description and get creative font variations.',
    url: 'https://font-generators.org/tools/ai-font-generator',
  },
};

export default function AIFontGeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
