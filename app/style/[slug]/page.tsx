import { notFound, permanentRedirect } from 'next/navigation';
import { generatorRegistry, getGeneratorDefinition } from '@/lib/generator-registry';

export function generateStaticParams() {
  return generatorRegistry.map((generator) => ({ slug: generator.slug }));
}

export default async function LegacySingularStylePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const generator = getGeneratorDefinition(slug);
  if (!generator) notFound();
  permanentRedirect(generator.canonicalPath);
}
