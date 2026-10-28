import type { Metadata } from 'next';
import { discoverySlugs } from '@/lib/discovery-catalog';
import { isOctoberArt, isOctoberText } from '@/lib/october-catalog';
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
    title: { absolute: buildMetaTitle(page) },
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
  const textFeatures: Record<string, string[]> = {
    'zalgo-text-generator': ['Adjustable intensity', 'Above, through, and below mark controls', 'Randomize marks', 'Copy Unicode text'],
    'discord-font-generator': ['Unicode display-name styles', 'Native Discord Markdown', 'Message formatting preview', 'Copy text'],
    'twitter-font-generator': ['Unicode text styles', 'Detected links and mentions preserved', 'Weighted standard-post length estimate', 'Original text fallback'],
    'roblox-font-generator': ['Unicode labels and profile text', 'Field-specific compatibility guidance', 'Original text fallback'],
    'twitch-font-generator': ['Unicode title, bio, and chat accents', 'Detected links and mentions preserved', 'Account-name limitations explained'],
    'adopt-me-font-generator': ['Pet-name Unicode styles', 'Optional heart, star, and bracket frames', 'Original text fallback'],
  };
  const featureList = isOctoberArt(page.slug) || isOctoberText(page.slug) || discoverySlugs.some((slug) => slug === page.slug)
    ? [definition.intent.primary, ...definition.intent.secondary]
    : textFeatures[page.slug] ?? getSpecializedFeatureList(page.slug) ?? config.styleIds
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
