import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageTemplate from '@/components/PageTemplate';
import { buildMetaDescription, buildMetaTitle, fandomPages, getPageBySlug, stylePages } from '@/lib/data';
import { getContentUpdatedAt } from '@/lib/content-updates';
import { getGeneratorPageConfig, getStyleDefinition } from '@/lib/generator';
import { generatorRegistry, getGeneratorDefinition, isFontStyleGenerator } from '@/lib/generator-registry';
import { getSpecializedDescription, getSpecializedFeatureList } from '@/lib/visual-generator';

const generatorPages = [...stylePages, ...fandomPages];

export function generateStaticParams() {
  return generatorRegistry.map((generator) => ({ slug: generator.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getPageBySlug(slug, generatorPages);
  if (!page) return {};
  const canonicalUrl = `https://font-generators.org/${page.slug}`;
  const description = getSpecializedDescription(page.slug) ?? buildMetaDescription(page);

  return {
    title: buildMetaTitle(page),
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: buildMetaTitle(page),
      description,
      url: canonicalUrl,
      type: 'website',
      images: ['/og-font-generators.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: buildMetaTitle(page),
      description,
      images: ['/og-font-generators.png'],
    },
  };
}

export default async function GeneratorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getPageBySlug(slug, generatorPages);
  const definition = getGeneratorDefinition(slug);
  if (!page || !definition) notFound();

  const config = getGeneratorPageConfig(page.slug, page.title, page.defaultStyleIds);
  const featureList = getSpecializedFeatureList(page.slug) ?? config.styleIds
    .map((styleId) => getStyleDefinition(styleId)?.name)
    .filter((name): name is string => Boolean(name));
  const isFontStyle = isFontStyleGenerator(definition);
  const categoryPath = isFontStyle ? '/styles' : '/visual-art';
  const categoryName = isFontStyle ? 'Font Styles' : 'Visual & Art';
  const canonicalUrl = `https://font-generators.org/${page.slug}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebApplication',
                name: page.title,
                url: canonicalUrl,
                description: getSpecializedDescription(page.slug) ?? buildMetaDescription(page),
                dateModified: getContentUpdatedAt(`/${page.slug}`),
                applicationCategory: 'DesignApplication',
                operatingSystem: 'Any',
                isAccessibleForFree: true,
                browserRequirements: 'Requires a modern web browser',
                featureList,
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Font Generators', item: 'https://font-generators.org/' },
                  { '@type': 'ListItem', position: 2, name: categoryName, item: `https://font-generators.org${categoryPath}` },
                  { '@type': 'ListItem', position: 3, name: page.title, item: canonicalUrl },
                ],
              },
            ],
          }),
        }}
      />
      <PageTemplate page={page} categoryPath={categoryPath} categoryName={categoryName} />
    </>
  );
}
