import surface from '@/components/ToolSurface.module.css';
import type { Metadata } from 'next';
import Link from '@/components/IntentLink';
import ToolDirectory from '@/components/ToolDirectory';
import { toolDirectoryGroups } from '@/lib/tool-directory';

const description = 'Find font generators, text artwork, symbols, emoji and Unicode utilities. Search the complete directory by name or task, or browse a category.';
export const metadata: Metadata = {
  title: 'All Font & Text Tools', description,
  alternates: { canonical: 'https://font-generators.org/tools' },
  openGraph: { title: 'All Font & Text Tools', description, url: 'https://font-generators.org/tools', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'All Font & Text Tools', description },
};

export default function ToolsPage() {
  return <div className={`${surface.surface} min-h-screen bg-white pb-16 pt-24 text-slate-950`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'All Font & Text Tools', description, url: 'https://font-generators.org/tools',
      mainEntity: { '@type': 'ItemList', itemListElement: toolDirectoryGroups.flatMap((group) => group.entries).map((entry, index) => ({ '@type': 'ListItem', position: index + 1, name: entry.title, url: `https://font-generators.org${entry.href}` })) },
    }).replace(/</g, '\\u003c') }} />
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-5 flex gap-2 text-xs text-slate-500"><Link href="/" className="hover:text-violet-700">Font Generators</Link><span aria-hidden="true">/</span><span aria-current="page">All tools</span></nav>
      <header className="mb-8 max-w-3xl"><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">All font &amp; text tools</h1><p className="mt-3 text-base leading-7 text-slate-500">Find a tool for your next message, design or character check. Search by name or task, or choose a category below.</p></header>
      <ToolDirectory groups={toolDirectoryGroups} />
      <section className="mt-10 flex flex-col justify-between gap-4 rounded-2xl border border-violet-200 bg-violet-50/50 p-6 sm:flex-row sm:items-center"><div><h2 className="text-xl font-semibold">Need an installable font?</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">AI Font has a separate studio for custom font files. Custom generation requires sign-in, available service configuration and sufficient credits; reference previews remain free.</p></div><Link href="/ai-font-generator" className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-violet-700">Explore AI Font →</Link></section>
    </div>
  </div>;
}
