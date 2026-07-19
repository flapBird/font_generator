 import Link from 'next/link';
 import { guidePages } from '@/lib/data';
 import type { Metadata } from 'next';
 
 export const metadata: Metadata = {
   title: 'Guides',
   description: 'Learn how fancy text generators work, why Reddit recommends certain tools, and the Unicode technology behind decorative text styles.',
 };
 
 export default function GuidesIndexPage() {
   return (
     <div className="min-h-screen pt-24 pb-16">
       <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="text-center mb-12">
           <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
             <span className="gradient-text">Guides</span>
           </h1>
           <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
             Learn how fancy text and Unicode generators work, plus community-curated recommendations.
           </p>
         </div>
 
         <div className="space-y-4">
           {guidePages.map((page) => (
             <Link
               key={page.slug}
               href={`/guides/${page.slug}`}
               className="block p-6 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm rounded-2xl border border-white/60 dark:border-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/40 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-300"
             >
               <div className="flex items-center gap-3 mb-2">
                 <span className="text-2xl">{page.icon}</span>
                 <h2 className="text-xl font-semibold">{page.title}</h2>
               </div>
               <p className="text-sm text-muted-foreground">{page.description}</p>
             </Link>
           ))}
         </div>
 
         <div className="mt-12 text-center">
           <Link
             href="/"
             className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
             </svg>
             Back to Fancy Text Generator
           </Link>
         </div>
       </div>
     </div>
   );
 }
 
