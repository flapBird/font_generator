 import { MetadataRoute } from 'next';
 import { stylePages, fandomPages, guidePages } from '@/lib/data';
 
 export default function sitemap(): MetadataRoute.Sitemap {
   const baseUrl = 'https://font-generators.org';
   
   const staticPages = [
     { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1 },
     { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
     { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
     { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
     { url: `${baseUrl}/styles`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
     { url: `${baseUrl}/fandom`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
     { url: `${baseUrl}/guides`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.6 },
   ];
   
   const styleUrls = stylePages.map(page => ({
     url: `${baseUrl}/styles/${page.slug}`,
     lastModified: new Date(),
     changeFrequency: 'monthly' as const,
     priority: 0.7,
   }));
   
   const fandomUrls = fandomPages.map(page => ({
     url: `${baseUrl}/fandom/${page.slug}`,
     lastModified: new Date(),
     changeFrequency: 'monthly' as const,
     priority: 0.6,
   }));
   
   const guideUrls = guidePages.map(page => ({
     url: `${baseUrl}/guides/${page.slug}`,
     lastModified: new Date(),
     changeFrequency: 'monthly' as const,
     priority: 0.5,
   }));
   
   return [
     ...staticPages,
     ...styleUrls,
     ...fandomUrls,
     ...guideUrls,
   ];
 }
