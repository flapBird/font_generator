 import { MetadataRoute } from 'next';
 import { stylePages, fandomPages, guidePages } from '@/lib/data';
 
 export default function sitemap(): MetadataRoute.Sitemap {
   const baseUrl = 'https://font-generators.org';
   const contentLastModified = new Date('2026-07-28T00:00:00.000Z');
   const newContentLastModified = new Date('2026-08-03T00:00:00.000Z');
   const newPageSlugs = new Set([
     'instagram-font-generator',
     'tattoo-font-generator',
     'name-font-generator',
     'aesthetic-font-generator',
     'creepy-scary-font-generator',
     'goth-font-generator',
     'medieval-font-generator',
     'metal-font-generator',
     'glitch-font-generator',
     'typewriter-font-generator',
     'japanese-font-generator',
     'minecraft-font-generator',
     'fortnite-font-generator',
   ]);
   
   const staticPages = [
     { url: baseUrl, lastModified: contentLastModified, changeFrequency: 'weekly' as const, priority: 1 },
     { url: `${baseUrl}/about`, lastModified: contentLastModified, changeFrequency: 'monthly' as const, priority: 0.5 },
     { url: `${baseUrl}/contact`, lastModified: contentLastModified, changeFrequency: 'monthly' as const, priority: 0.4 },
     { url: `${baseUrl}/privacy`, lastModified: contentLastModified, changeFrequency: 'monthly' as const, priority: 0.3 },
     { url: `${baseUrl}/terms`, lastModified: contentLastModified, changeFrequency: 'monthly' as const, priority: 0.3 },
     { url: `${baseUrl}/styles`, lastModified: contentLastModified, changeFrequency: 'weekly' as const, priority: 0.8 },
     { url: `${baseUrl}/fandom`, lastModified: contentLastModified, changeFrequency: 'weekly' as const, priority: 0.7 },
     { url: `${baseUrl}/guides`, lastModified: contentLastModified, changeFrequency: 'weekly' as const, priority: 0.6 },
   ];
   
   const styleUrls = stylePages.map(page => ({
     url: `${baseUrl}/styles/${page.slug}`,
     lastModified: newPageSlugs.has(page.slug) ? newContentLastModified : contentLastModified,
     changeFrequency: 'monthly' as const,
     priority: 0.7,
   }));
   
   const fandomUrls = fandomPages.map(page => ({
     url: `${baseUrl}/fandom/${page.slug}`,
     lastModified: newPageSlugs.has(page.slug) ? newContentLastModified : contentLastModified,
     changeFrequency: 'monthly' as const,
     priority: 0.6,
   }));
   
   const guideUrls = guidePages.map(page => ({
     url: `${baseUrl}/guides/${page.slug}`,
     lastModified: contentLastModified,
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
