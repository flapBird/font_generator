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
     openGraph: {
       title: buildMetaTitle(page),
       description: buildMetaDescription(page),
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
             "name": page.title,
             "url": `https://font-generators.org/guides/${page.slug}`,
             "description": page.metaDescription,
           })
         }}
       />
       <GuideTemplate page={page} categoryPath="/guides" categoryName="Guides" />
     </>
   );
 }
