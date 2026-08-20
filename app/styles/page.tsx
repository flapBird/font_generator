 import Link from 'next/link';
 import { stylePages } from '@/lib/data';
 import type { Metadata } from 'next';
 import { generateStyleVariants, getGeneratorPageConfig } from '@/lib/generator';
 import { getSpecializedDescription, getVisualGeneratorConfig } from '@/lib/visual-generator';
 import StyleDirectory, { type StyleDirectoryCard, type StyleDirectoryKind } from '@/components/StyleDirectory';
 import { getGeneratorDefinition } from '@/lib/generator-registry';
 
 export const metadata: Metadata = {
   title: 'Text Style Generators',
   alternates: {
     canonical: 'https://font-generators.org/styles',
   },
   description: 'Browse copy-and-paste Unicode styles, rendered text artwork, and ASCII generators. Search cursive, gothic, pixel, social, and other text tools.',
 };
 
 export default function StylesIndexPage() {
   const cards: StyleDirectoryCard[] = stylePages.map((page) => {
     const config = getGeneratorPageConfig(page.slug, page.title, page.defaultStyleIds);
     const visualConfig = getVisualGeneratorConfig(page.slug);
     const definition = getGeneratorDefinition(page.slug);
     const preview = generateStyleVariants('Your Text', config.styleIds.slice(0, 1))[0];
     const isAscii = page.slug === 'big-font-generator';
     const kind: StyleDirectoryKind = isAscii ? 'ascii' : definition?.kind === 'unicode' ? 'unicode' : visualConfig ? 'artwork' : 'unicode';
     const description = getSpecializedDescription(page.slug) ?? page.description;

     return {
       slug: page.slug,
       title: page.title,
       icon: page.icon,
       description,
       kind,
       badge: isAscii ? '6 ASCII styles' : visualConfig ? `${visualConfig.presets.length} presets` : `${config.styleIds.length} styles`,
       metaLabel: isAscii ? 'ASCII + downloads' : visualConfig ? 'Rendered artwork + downloads' : preview?.name ?? 'Copy & paste',
       previewText: visualConfig?.presets[0]?.name ?? (isAscii ? 'Block · Outline · Shadow' : preview?.text ?? 'Your Text'),
       searchText: [
         page.title,
         page.slug,
         description,
         kind,
         kind === 'unicode' ? 'copy paste unicode font text' : kind === 'artwork' ? 'rendered artwork image png svg design' : 'ascii banner text download',
         config.styleIds.join(' '),
         visualConfig?.presets.flatMap((preset) => [preset.name, preset.description]).join(' '),
       ].filter(Boolean).join(' '),
     };
   });

   return (
     <div className="min-h-screen pt-24 pb-16">
       <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="text-center mb-12">
           <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
             <span className="gradient-text">Text Style Generators</span>
           </h1>
           <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
             Browse copy-and-paste Unicode styles, rendered text artwork, and ASCII generators, then choose the output that fits your project.
           </p>
         </div>
 
         <StyleDirectory cards={cards} />
 
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
