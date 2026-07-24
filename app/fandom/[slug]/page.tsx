 import { fandomPages, getPageBySlug, buildMetaTitle, buildMetaDescription } from '@/lib/data';
 import PageTemplate from '@/components/PageTemplate';
 import type { Metadata } from 'next';
 import { notFound } from 'next/navigation';
 
 export async function generateStaticParams() {
   return fandomPages.map((page) => ({ slug: page.slug }));
 }
 
 export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
   const { slug } = await params;
   const page = getPageBySlug(slug, fandomPages);
   if (!page) return {};
   return {
     title: buildMetaTitle(page),
     description: buildMetaDescription(page),
     alternates: {
       canonical: `https://font-generators.org/fandom/${page.slug}`,
     },
     openGraph: {
       title: buildMetaTitle(page),
       description: buildMetaDescription(page),
     },
   };
 }
 
 export default async function FandomPage({ params }: { params: Promise<{ slug: string }> }) {
   const { slug } = await params;
   const page = getPageBySlug(slug, fandomPages);
   if (!page) notFound();
 
   return (
     <>
       <script
         type="application/ld+json"
         dangerouslySetInnerHTML={{
           __html: JSON.stringify({
             "@context": "https://schema.org",
             "@type": "WebApplication",
             "name": page.title,
             "url": `https://font-generators.org/fandom/${page.slug}`,
             "description": page.metaDescription,
             "applicationCategory": "DesignApplication",
             "operatingSystem": "Any",
             "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
           })
         }}
       />
       <PageTemplate page={page} categoryPath="/fandom" categoryName="Fandom Styles" />
     </>
   );
 }
