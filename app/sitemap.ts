 import { MetadataRoute } from 'next';
 import { stylePages, fandomPages, guidePages } from '@/lib/data';
 import { getContentLastModified, validateContentUpdateCoverage } from '@/lib/content-updates';
 
 export default function sitemap(): MetadataRoute.Sitemap {
   const baseUrl = 'https://font-generators.org';
   
   const staticPages = [
     { path: '/', url: baseUrl, changeFrequency: 'weekly' as const, priority: 1 },
     { path: '/about', url: `${baseUrl}/about`, changeFrequency: 'monthly' as const, priority: 0.5 },
     { path: '/contact', url: `${baseUrl}/contact`, changeFrequency: 'monthly' as const, priority: 0.4 },
     { path: '/privacy', url: `${baseUrl}/privacy`, changeFrequency: 'monthly' as const, priority: 0.3 },
     { path: '/terms', url: `${baseUrl}/terms`, changeFrequency: 'monthly' as const, priority: 0.3 },
     { path: '/styles', url: `${baseUrl}/styles`, changeFrequency: 'weekly' as const, priority: 0.8 },
     { path: '/visual-art', url: `${baseUrl}/visual-art`, changeFrequency: 'weekly' as const, priority: 0.8 },
     { path: '/fandom', url: `${baseUrl}/fandom`, changeFrequency: 'weekly' as const, priority: 0.7 },
     { path: '/guides', url: `${baseUrl}/guides`, changeFrequency: 'weekly' as const, priority: 0.6 },
   ];
   
   const styleUrls = stylePages.map(page => ({
     path: `/${page.slug}`,
     url: `${baseUrl}/${page.slug}`,
     changeFrequency: 'monthly' as const,
     priority: 0.7,
   }));
   
   const fandomUrls = fandomPages.map(page => ({
     path: `/${page.slug}`,
     url: `${baseUrl}/${page.slug}`,
     changeFrequency: 'monthly' as const,
     priority: 0.6,
   }));
   
   const guideUrls = guidePages.map(page => ({
     path: `/guides/${page.slug}`,
     url: `${baseUrl}/guides/${page.slug}`,
     changeFrequency: 'monthly' as const,
     priority: 0.5,
   }));
   
   const entries = [
     ...staticPages,
     ...styleUrls,
     ...fandomUrls,
     ...guideUrls,
   ];

   validateContentUpdateCoverage(entries.map((entry) => entry.path));

   return entries.map(({ path, ...entry }) => ({
     ...entry,
     lastModified: getContentLastModified(path),
   }));
 }
