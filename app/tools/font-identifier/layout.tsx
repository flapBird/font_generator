import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: 'https://font-generators.org/tools/font-identifier',
  },
  title: 'Font Identifier - Feature Status',
  description: 'Current availability and development status of the image-based font identifier.',
};

export default function FontIdentifierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
