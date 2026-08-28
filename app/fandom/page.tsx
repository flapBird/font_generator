 import Link from 'next/link';
 import { fandomPages } from '@/lib/data';
 import type { Metadata } from 'next';
 import { generateStyleVariants, getGeneratorPageConfig } from '@/lib/generator';
 import { getSpecializedDescription, getVisualGeneratorConfig } from '@/lib/visual-generator';
 import { getGeneratorDefinition } from '@/lib/generator-registry';
 
 export const metadata: Metadata = {
   title: 'Fandom Font Generators',
   alternates: {
     canonical: 'https://font-generators.org/fandom',
   },
   description: 'Unicode text styles inspired by pop culture franchises. Create Disney, Mario, Stranger Things, and other fandom-inspired text for fan content.',
 };
 
 export default function FandomIndexPage() {
   return (
     <div className="min-h-screen pt-24 pb-16">
       <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="text-center mb-12">
           <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
             <span className="gradient-text">Fandom Font Generators</span>
           </h1>
           <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
             Unicode text styles inspired by your favorite franchises. Unofficial fan tools for creative expression.
           </p>
         </div>
 
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
           {fandomPages.map((page) => {
             const config = getGeneratorPageConfig(page.slug, page.title, page.defaultStyleIds);
             const visualConfig = getVisualGeneratorConfig(page.slug);
             const definition = getGeneratorDefinition(page.slug);
             const preview = generateStyleVariants(page.title.replace(' Font Generator', ''), config.styleIds.slice(0, 1))[0];
             return (
               <Link
                 key={page.slug}
                 href={`/${page.slug}`}
                 className="group flex min-h-56 flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.5)] transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-[0_24px_60px_-40px_rgba(109,40,217,0.45)] dark:border-slate-800 dark:bg-slate-950 dark:hover:border-violet-700"
               >
                 <div className="flex items-start justify-between gap-3">
                   <span className="text-2xl" aria-hidden="true">{page.icon}</span>
                   <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                     {visualConfig ? `${visualConfig.presets.length} presets` : definition?.kind === 'directory' ? 'Generator directory' : `${config.styleIds.length} styles`}
                   </span>
                 </div>
                 <h2 className="mt-4 text-lg font-black text-slate-950 transition group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">
                   {page.title}
                 </h2>
                 <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{getSpecializedDescription(page.slug) ?? page.description}</p>
                 <div className="mt-auto pt-5">
                   <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{visualConfig ? 'Rendered artwork + downloads' : preview?.name}</p>
                   <p className="mt-1 break-words text-lg text-slate-900 dark:text-slate-100">{visualConfig?.presets[0]?.name ?? preview?.text}</p>
                 </div>
               </Link>
             );
           })}
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
 
