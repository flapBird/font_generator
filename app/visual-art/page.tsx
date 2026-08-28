import Link from 'next/link';
import type { Metadata } from 'next';
import VisualArtDirectory, { type VisualArtDirectoryItem, type VisualArtGroup } from '@/components/VisualArtDirectory';
import { getVisualArtGenerators, type GeneratorDefinition } from '@/lib/generator-registry';

export const metadata: Metadata = {
  title: 'Visual & Art Generators',
  description: 'Browse visual font generators, rendered text artwork, ASCII banners, gaming text, and fandom-inspired title tools.',
  alternates: { canonical: 'https://font-generators.org/visual-art' },
  openGraph: {
    title: 'Visual & Art Generators',
    description: 'Create rendered text artwork, ASCII banners, gaming text, and themed title graphics.',
    url: 'https://font-generators.org/visual-art',
    type: 'website',
  },
};

const getGroup = (generator: GeneratorDefinition): VisualArtGroup => {
  if (generator.kind === 'ascii') return 'ascii';
  if (generator.kind === 'font-preview') return 'font-preview';
  if (generator.kind === 'game-text') return 'gaming';
  if (generator.category === 'fandom') return 'fandom';
  return 'artwork';
};

export default function VisualArtPage() {
  const generators = getVisualArtGenerators();
  const items: VisualArtDirectoryItem[] = generators.map((generator) => ({
    id: generator.id,
    title: generator.title,
    href: generator.canonicalPath,
    icon: generator.icon,
    description: generator.intent.primary,
    group: getGroup(generator),
    outputs: generator.intent.expectedOutputs.map((output) => output.toUpperCase()),
    searchText: `${generator.slug} ${generator.kind} ${generator.tags.join(' ')} ${generator.intent.secondary.join(' ')}`,
  }));

  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/" className="font-medium hover:text-violet-700">Font Generators</Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-900 dark:text-white">Visual &amp; Art</span>
        </nav>

        <header className="mx-auto mb-10 max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">Beyond copy &amp; paste</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl dark:text-white">Visual &amp; Art Generators</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">Create rendered title artwork, preview recognizable typefaces, build ASCII banners, and design game or fandom-inspired text.</p>
        </header>

        <VisualArtDirectory items={items} />
      </div>
    </div>
  );
}
