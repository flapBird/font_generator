 'use client';
 
 import { motion } from 'framer-motion';
 import Link from 'next/link';
 import { PageDefinition } from '@/lib/data';
 
 interface GuideTemplateProps {
   page: PageDefinition;
   categoryPath: string;
   categoryName: string;
 }
 
 export default function GuideTemplate({ page, categoryPath, categoryName }: GuideTemplateProps) {
   const paragraphs = page.content.split('\n\n');
 
   return (
     <div className="min-h-screen pt-20 pb-16">
       <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
         {/* Breadcrumb */}
         <nav className="mb-8 text-sm text-muted-foreground">
           <Link href="/" className="hover:text-primary transition-colors">Font Generators</Link>
           <span className="mx-2">/</span>
           <Link href={categoryPath} className="hover:text-primary transition-colors">{categoryName}</Link>
           <span className="mx-2">/</span>
           <span className="text-foreground">{page.title}</span>
         </nav>
 
         {/* Header */}
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
           <h1 className="text-3xl sm:text-4xl font-bold mb-4">
             <span className="gradient-text">{page.title}</span>
           </h1>
           <p className="text-lg text-muted-foreground leading-relaxed">
             {page.description}
           </p>
         </motion.div>
 
         {/* Article Content */}
         <motion.article
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="mt-10 prose prose-neutral dark:prose-invert max-w-none leading-relaxed"
         >
           {paragraphs.map((p, i) => {
             if (p.startsWith('**') && p.endsWith('**')) {
               return <h3 key={i} className="text-xl font-bold mt-8 mb-3">{p.replace(/\*\*/g, '')}</h3>;
             }
             if (p.startsWith('- ')) {
               const lines = p.split('\n');
               return (
                 <ul key={i} className="list-disc pl-6 space-y-1 my-4">
                   {lines.map((line, j) => (
                     <li key={j}>{line.replace(/^- /, '').replace(/\\'/g, "'")}</li>
                   ))}
                 </ul>
               );
             }
             return <p key={i} className="my-4">{p.replace(/\\'/g, "'")}</p>;
           })}
         </motion.article>
 
         {/* How to Use */}
         {page.howToUse && (
           <motion.section
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.15 }}
             className="mt-12 p-6 bg-muted/30 rounded-2xl border border-border/50"
           >
             <h2 className="text-xl font-bold mb-3">How to Use</h2>
             <p className="text-muted-foreground leading-relaxed">{page.howToUse}</p>
           </motion.section>
         )}
 
         {/* Examples */}
         {page.examples.length > 0 && (
           <motion.section
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="mt-10"
           >
             <h2 className="text-xl font-bold mb-4">Examples</h2>
             <div className="space-y-3">
               {page.examples.slice(0, 3).map((ex, i) => (
                 <div key={i} className="bg-muted/20 rounded-xl p-4 border border-border/50">
                   <div className="flex flex-wrap items-center gap-3">
                     <code className="text-sm bg-background px-3 py-1.5 rounded-lg border">{ex.before}</code>
                     <span className="text-muted-foreground">→</span>
                     <code className="text-sm bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20 font-medium">{ex.after}</code>
                     {ex.note && <span className="text-xs text-muted-foreground italic ml-2">{ex.note}</span>}
                   </div>
                 </div>
               ))}
             </div>
           </motion.section>
         )}
 
         {/* FAQ */}
         <motion.section
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.25 }}
           className="mt-10"
         >
           <h2 className="text-xl font-bold mb-4">FAQ</h2>
           <div className="space-y-3">
             {page.faq.map((item, i) => (
               <details key={i} className="group bg-muted/20 rounded-xl border border-border/50 overflow-hidden">
                 <summary className="flex justify-between items-center cursor-pointer p-4 font-medium hover:bg-muted/30 transition-colors text-sm">
                   {item.q}
                   <svg className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                   </svg>
                 </summary>
                 <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                   {item.a}
                 </div>
               </details>
             ))}
           </div>
         </motion.section>
 
         {/* Bottom link */}
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.4 }}
           className="mt-12 pt-8 border-t border-border text-center"
         >
           <Link
             href="/"
             className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
             </svg>
             Try the Fancy Text Generator
           </Link>
         </motion.div>
       </div>
     </div>
   );
 }
