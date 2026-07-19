 import Link from 'next/link';
 import { stylePages } from '@/lib/data';
 import type { Metadata } from 'next';
 
 export const metadata: Metadata = {
   title: 'Text Style Generators',
   description: 'Browse all our Unicode text style generators. Small text, cursive, fraktur, bold, italic, bubble letters, and more — all free and copy-paste ready.',
 };
 
 export default function StylesIndexPage() {
   return (
     <div className="min-h-screen pt-24 pb-16">
       <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="text-center mb-12">
           <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
             <span className="gradient-text">Text Style Generators</span>
           </h1>
           <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
             Browse all our Unicode text style generators. Each page lets you transform plain text into a different decorative look.
           </p>
         </div>
 
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
           {stylePages.map((page) => (
             <Link
               key={page.slug}
               href={`/styles/${page.slug}`}
               className="group p-5 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm rounded-2xl border border-white/60 dark:border-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/40 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-300"
             >
               <div className="flex items-center gap-3 mb-2">
                 <span className="text-2xl">{page.icon}</span>
                 <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">{page.title}</h2>
               </div>
               <p className="text-sm text-muted-foreground line-clamp-2">{page.description}</p>
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
