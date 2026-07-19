 'use client';
 
 import { useState, useMemo } from 'react';
 import { motion } from 'framer-motion';
 import Link from 'next/link';
 import { generateAllFancyVariants, fancyTextStyles } from '@/lib/fonts';
 import { PageDefinition, buildMetaTitle, buildMetaDescription } from '@/lib/data';
 
 interface PageTemplateProps {
   page: PageDefinition;
   categoryPath: string;
   categoryName: string;
 }
 
 export default function PageTemplate({ page, categoryPath, categoryName }: PageTemplateProps) {
   const [inputText, setInputText] = useState('Hello World');
   const [copiedId, setCopiedId] = useState<string | null>(null);
 
  const allVariants = useMemo(() => {
    return generateAllFancyVariants(inputText || 'Hello World');
  }, [inputText]);
 
   const variants = useMemo(() => {
     if (page.defaultStyleIds && page.defaultStyleIds.length > 0) {
       return allVariants.filter(v => page.defaultStyleIds!.includes(v.id));
     }
     return allVariants;
   }, [allVariants, page.defaultStyleIds]);
   
   const totalCount = allVariants.length;
   const styleCount = variants.length;
 
   const handleCopy = async (text: string, id: string) => {
     await navigator.clipboard.writeText(text);
     setCopiedId(id);
     setTimeout(() => setCopiedId(null), 2000);
   };
 
   return (
     <div className="min-h-screen pt-20 pb-16">
       <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
         {/* Breadcrumb */}
         <nav className="mb-6 text-sm text-muted-foreground">
           <Link href="/" className="hover:text-primary transition-colors">Font Generators</Link>
           <span className="mx-2">/</span>
           <Link href={categoryPath} className="hover:text-primary transition-colors">{categoryName}</Link>
           <span className="mx-2">/</span>
           <span className="text-foreground">{page.title}</span>
         </nav>
 
         {/* Header */}
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
           <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
             <span className="gradient-text">{page.title}</span>
           </h1>
           <p className="text-lg text-muted-foreground max-w-3xl">
             {page.description}
           </p>
         </motion.div>
 
         {/* Tool Area */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="mt-8 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-lg border border-white/60 dark:border-slate-800/60"
         >
           <label className="block text-sm font-semibold mb-3 text-foreground">Enter Your Text</label>
           <textarea
             value={inputText}
             onChange={(e) => setInputText(e.target.value)}
             placeholder="Type something..."
             rows={4}
             className="w-full px-5 py-4 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white dark:focus:bg-slate-800 resize-none text-lg transition-all duration-300 placeholder:text-slate-400"
             autoFocus
           />
 

          {styleCount < totalCount ? (
            <p className="mt-3 text-sm text-muted-foreground">Showing <strong>{styleCount}</strong> {page.title.replace(' Generator', '').replace(' Font', '')} styles. Type your text to transform.</p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">All {totalCount} Unicode styles below. Type your text to transform.</p>
          )}
           <div className="mt-6 space-y-3 max-h-[500px] overflow-y-auto pr-1">
             {variants.map((variant, index) => (
               <motion.div
                 key={variant.id}
                 initial={{ opacity: 0, y: 8 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: index * 0.02 }}
                 className="group bg-gradient-to-r from-slate-50/80 to-white/80 dark:from-slate-800/40 dark:to-slate-800/20 hover:from-indigo-50/40 hover:to-purple-50/40 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 border border-slate-100 dark:border-slate-700/50 hover:border-indigo-200/50 dark:hover:border-indigo-700/30 rounded-2xl p-4 transition-all duration-300 hover:shadow-md"
               >
                 <div className="flex items-center justify-between">
                   <div className="flex-1 min-w-0 mr-4">
                     <p className="text-xs font-medium text-muted-foreground mb-1">{variant.name}</p>
                     <p className="text-lg truncate">{variant.text}</p>
                   </div>
                   <button
                     onClick={() => handleCopy(variant.text, variant.id)}
                     className="shrink-0 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 text-sm font-medium"
                   >
                     {copiedId === variant.id ? (
                       <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied!</>
                     ) : (
                       <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                     )}
                   </button>
                 </div>
               </motion.div>
             ))}
           </div>
         </motion.div>
 
         {/* About this Style */}
         <motion.section
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="mt-12"
         >
           <h2 className="text-2xl font-bold mb-4">About This Style</h2>
           <div className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed">
             {page.content.split('\n\n').map((paragraph, i) => {
               if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                 return <p key={i} className="font-semibold mt-4 mb-2">{paragraph.replace(/\*\*/g, '')}</p>;
               }
               return <p key={i}>{paragraph}</p>;
             })}
           </div>
         </motion.section>
 
         {/* How to Use */}
         {page.howToUse && (
           <motion.section
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.25 }}
             className="mt-10"
           >
             <h2 className="text-2xl font-bold mb-4">How to Use</h2>
             <div className="prose prose-neutral dark:prose-invert max-w-none">
               <p>{page.howToUse}</p>
             </div>
           </motion.section>
         )}
 
         {/* Examples */}
         <motion.section
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="mt-10"
         >
          <h2 className="text-2xl font-bold mb-4">Examples</h2>
           <p className="text-sm text-muted-foreground mb-6">See how {page.title.replace(' Generator', '').replace(' Font', '')} text looks with different words and phrases.</p>
           <div className="space-y-4">
             {page.examples.slice(0, 4).map((ex, i) => (
               <div key={i} className="bg-muted/30 rounded-2xl p-5 border border-border/50">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                     <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Before</p>
                     <p className="text-lg">{ex.before}</p>
                   </div>
                   <div>
                     <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">After</p>
                     <p className="text-lg font-medium">{ex.after}</p>
                   </div>
                 </div>
                 {ex.note && <p className="mt-2 text-sm text-muted-foreground italic">{ex.note}</p>}
               </div>
             ))}
           </div>
         </motion.section>
 
         {/* FAQ */}
         <motion.section
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.35 }}
           className="mt-10"
         >
           <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
           <div className="space-y-4">
             {page.faq.map((item, i) => (
               <details key={i} className="group bg-muted/20 rounded-2xl border border-border/50 overflow-hidden">
                 <summary className="flex justify-between items-center cursor-pointer p-5 font-medium hover:bg-muted/30 transition-colors">
                   {item.q}
                   <svg className="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                   </svg>
                 </summary>
                 <div className="px-5 pb-5 text-muted-foreground leading-relaxed">
                   {item.a}
                 </div>
               </details>
             ))}
           </div>
         </motion.section>
 
         {/* Related Generators */}
         <motion.section
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4 }}
           className="mt-10 mb-12"
         >
           <h2 className="text-2xl font-bold mb-4">Related Generators</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {page.relatedSlugs.slice(0, 3).map((slug) => {
               const href = categoryPath + '/' + slug;
               const label = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
               return (
                 <Link
                   key={slug}
                   href={href}
                   className="group flex items-center gap-3 p-4 bg-muted/20 rounded-2xl border border-border/50 hover:bg-muted/40 hover:border-primary/30 transition-all duration-300"
                 >
                   <span className="text-lg font-medium group-hover:text-primary transition-colors">{label}</span>
                   <svg className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                   </svg>
                 </Link>
               );
             })}
           </div>
         </motion.section>
 
         {/* Disclaimer / Brand Notes */}
         {page.disclaimer && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.45 }}
             className="mt-8 p-5 bg-amber-50/80 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-700/30 rounded-2xl text-sm text-amber-800 dark:text-amber-200 leading-relaxed"
           >
             {page.disclaimer}
           </motion.div>
         )}
 
         {page.fontNote && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.45 }}
             className="mt-4 p-5 bg-blue-50/80 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-700/30 rounded-2xl text-sm text-blue-800 dark:text-blue-200 leading-relaxed"
           >
             {page.fontNote}
           </motion.div>
         )}
 
         {/* Back to Home */}
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.5 }}
           className="mt-12 text-center"
         >
           <Link
             href="/"
             className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
             </svg>
             Back to Fancy Text Generator
           </Link>
         </motion.div>
       </div>
     </div>
   );
 }
