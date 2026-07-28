 import { guidePages, getPageBySlug, buildMetaTitle, buildMetaDescription } from '@/lib/data';
 import GuideTemplate from '@/components/GuideTemplate';
 import type { Metadata } from 'next';
 import { notFound } from 'next/navigation';
 
 export async function generateStaticParams() {
   return guidePages.map((page) => ({ slug: page.slug }));
 }
 
 export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
   const { slug } = await params;
   const page = getPageBySlug(slug, guidePages);
   if (!page) return {};
   return {
     title: buildMetaTitle(page),
     description: buildMetaDescription(page),
     alternates: {
       canonical: `https://font-generators.org/guides/${page.slug}`,
     },
     openGraph: {
       title: buildMetaTitle(page),
       description: buildMetaDescription(page),
       url: `https://font-generators.org/guides/${page.slug}`,
       type: 'article',
       images: ['/og-font-generators.png'],
     },
     twitter: {
       card: 'summary_large_image',
       title: buildMetaTitle(page),
       description: buildMetaDescription(page),
       images: ['/og-font-generators.png'],
     },
   };
 }
 
 export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
   const { slug } = await params;
   const page = getPageBySlug(slug, guidePages);
   if (!page) notFound();
 
   return (
     <>
       <script
         type="application/ld+json"
         dangerouslySetInnerHTML={{
           __html: JSON.stringify({
             "@context": "https://schema.org",
             "@type": "Article",
             "headline": page.title,
             "url": `https://font-generators.org/guides/${page.slug}`,
             "description": page.metaDescription,
             "dateModified": "2026-07-28",
             "author": {
               "@type": "Organization",
               "name": "Font Generators",
               "url": "https://font-generators.org/about"
             },
             "publisher": {
               "@type": "Organization",
               "name": "Font Generators",
               "url": "https://font-generators.org"
             },
             "image": "https://font-generators.org/og-font-generators.png",
             "mainEntityOfPage": `https://font-generators.org/guides/${page.slug}`
           })
         }}
       />
       <GuideTemplate page={page} categoryPath="/guides" categoryName="Guides" />
     </>
   );
 }
