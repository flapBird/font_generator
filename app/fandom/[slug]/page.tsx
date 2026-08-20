 import { fandomPages, getPageBySlug, buildMetaTitle, buildMetaDescription } from '@/lib/data';
 import PageTemplate from '@/components/PageTemplate';
 import type { Metadata } from 'next';
 import { notFound } from 'next/navigation';
 import { getGeneratorPageConfig, getStyleDefinition } from '@/lib/generator';
 import { getSpecializedDescription, getSpecializedFeatureList } from '@/lib/visual-generator';
 
 export async function generateStaticParams() {
   return fandomPages.map((page) => ({ slug: page.slug }));
 }
 
 export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
   const { slug } = await params;
   const page = getPageBySlug(slug, fandomPages);
   if (!page) return {};
   const description = getSpecializedDescription(page.slug) ?? buildMetaDescription(page);
   return {
     title: buildMetaTitle(page),
     description,
     alternates: {
       canonical: `https://font-generators.org/fandom/${page.slug}`,
     },
     openGraph: {
       title: buildMetaTitle(page),
       description,
       url: `https://font-generators.org/fandom/${page.slug}`,
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
 
 export default async function FandomPage({ params }: { params: Promise<{ slug: string }> }) {
   const { slug } = await params;
   const page = getPageBySlug(slug, fandomPages);
   if (!page) notFound();
   const config = getGeneratorPageConfig(page.slug, page.title, page.defaultStyleIds);
   const featureList = getSpecializedFeatureList(page.slug) ?? config.styleIds
     .map((styleId) => getStyleDefinition(styleId)?.name)
     .filter((name): name is string => Boolean(name));
 
   return (
     <>
       <script
         type="application/ld+json"
         dangerouslySetInnerHTML={{
           __html: JSON.stringify({
             "@context": "https://schema.org",
             "@graph": [
               {
                 "@type": "WebApplication",
                 "name": page.title,
                 "url": `https://font-generators.org/fandom/${page.slug}`,
                 "description": getSpecializedDescription(page.slug) ?? buildMetaDescription(page),
                 "applicationCategory": "DesignApplication",
                 "operatingSystem": "Any",
                 "isAccessibleForFree": true,
                 "browserRequirements": "Requires a modern web browser",
                 "featureList": featureList,
                 "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
               },
               {
                 "@type": "BreadcrumbList",
                 "itemListElement": [
                   {
                     "@type": "ListItem",
                     "position": 1,
                     "name": "Font Generators",
                     "item": "https://font-generators.org/"
                   },
                   {
                     "@type": "ListItem",
                     "position": 2,
                     "name": "Fandom Styles",
                     "item": "https://font-generators.org/fandom"
                   },
                   {
                     "@type": "ListItem",
                     "position": 3,
                     "name": page.title,
                     "item": `https://font-generators.org/fandom/${page.slug}`
                   }
                 ]
               }
             ]
           })
         }}
       />
       <PageTemplate page={page} categoryPath="/fandom" categoryName="Fandom Styles" />
     </>
   );
 }
