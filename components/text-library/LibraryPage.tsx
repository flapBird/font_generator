import surface from '@/components/ToolSurface.module.css';
import type { Metadata } from 'next';
import Link from '@/components/IntentLink';
import { getLibraryPage, type LibraryId } from '@/lib/text-library/catalog';
import { getLibraryItems } from '@/lib/text-library/collections';
import { getContentUpdatedAt } from '@/lib/content-updates';
import SymbolBrowser from './SymbolBrowser';
import LibraryLink from './LibraryLink';
import CollectionContent from './CollectionContent';
import { getCollectionGuide } from '@/lib/text-library/guides';
import UnicodeToolNavigation from './UnicodeToolNavigation';

export function libraryMetadata(id: LibraryId): Metadata {
  const page = getLibraryPage(id);
  return {
    title: page.title, description: page.description,
    alternates: { canonical: `https://font-generators.org${page.path}` },
    openGraph: { title: page.title, description: page.description, url: `https://font-generators.org${page.path}`, type: 'website' },
    twitter: { card: 'summary_large_image', title: page.title, description: page.description },
  };
}

export function LibraryPageShell({ id, children }: { id: LibraryId; children: React.ReactNode }) {
  const page = getLibraryPage(id);
  const isUnicode = ['unicode-tools', 'invisible-character', 'unicode-character-inspector', 'invisible-character-remover', 'fancy-text-to-normal-text'].includes(id);
  const parent = id === 'signature-generator' ? { id: 'visual-art', title: 'Visual & Art', path: '/visual-art' } : getLibraryPage(isUnicode ? 'unicode-tools' : 'symbols');
  const crumbs = [
    { '@type': 'ListItem', position: 1, name: 'Font Generators', item: 'https://font-generators.org/' },
    ...(parent.id !== id ? [{ '@type': 'ListItem', position: 2, name: parent.title, item: `https://font-generators.org${parent.path}` }] : []),
    { '@type': 'ListItem', position: parent.id === id ? 2 : 3, name: page.title, item: `https://font-generators.org${page.path}` },
  ];
  return <div className={`${surface.surface} min-h-screen bg-white pb-16 pt-20 text-slate-950`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      '@context': 'https://schema.org', '@graph': [
        { '@type': id === 'unicode-tools' ? 'CollectionPage' : 'WebApplication', name: page.title, description: page.description, url: `https://font-generators.org${page.path}`,
          dateModified: getContentUpdatedAt(page.path), isAccessibleForFree: true,
          ...(id !== 'unicode-tools' ? { applicationCategory: id === 'signature-generator' ? 'DesignApplication' : 'UtilitiesApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } } : {}) },
        { '@type': 'BreadcrumbList', itemListElement: crumbs },
      ],
    }).replace(/</g, '\\u003c') }} />
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="py-2 hover:text-violet-700">Font Generators</Link><span aria-hidden="true">/</span>
        {parent.id !== id && <><Link href={parent.path} className="py-2 hover:text-violet-700">{id === 'signature-generator' ? 'Visual & Art' : isUnicode ? 'Unicode Tools' : 'Symbols & Emoji'}</Link><span aria-hidden="true">/</span></>}
        <span aria-current="page">{page.title}</span>
      </nav>
      <header className="mb-6 max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{page.title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">{page.intro}</p>
      </header>
      {isUnicode && <UnicodeToolNavigation current={id} />}
      {children}
      <CollectionContent page={page} />
      <section aria-labelledby="library-related-heading" className="mt-10 border-t border-slate-200 pt-8">
        <h2 id="library-related-heading" className="text-xl font-semibold">Keep exploring</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{page.related.map((relatedId) => {
          const related = getLibraryPage(relatedId);
          return <LibraryLink key={relatedId} href={related.path} tool={id} targetId={relatedId} className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
            <span className="mr-2 text-violet-700" aria-hidden="true">{related.icon}</span><span className="text-sm font-semibold">{related.title}</span><p className="mt-2 text-xs leading-5 text-slate-500">{related.description}</p>
          </LibraryLink>;
        })}</div>
        <div aria-label="More font and text tools" className="mt-8 grid gap-4 md:grid-cols-2">
          <Link href="/styles" className="group flex flex-col justify-between rounded-2xl border border-violet-200 bg-violet-50/60 p-6 transition-colors hover:border-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-4"><span aria-hidden="true" className="text-4xl tracking-tight text-violet-700">Aa <span className="font-serif italic">Aa</span> 𝔄𝔞</span><span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-violet-700">Copy &amp; paste text</span></div>
            <div><h3 className="text-2xl font-semibold tracking-tight text-slate-950">Font Styles</h3><p className="mt-2 max-w-md text-sm leading-6 text-slate-600">Turn your words into bold, cursive, bubble and other Unicode styles for bios and messages.</p></div>
            <span className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-violet-700">Browse font styles <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span></span>
          </Link>
          <Link href="/visual-art" className="group flex flex-col justify-between rounded-2xl border border-slate-700 bg-slate-900 p-6 transition-colors hover:border-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-4"><span aria-hidden="true" className="text-4xl font-bold tracking-tight text-white">Aa<span className="ml-2 font-serif italic text-violet-300">Aa</span></span><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-violet-200">Images &amp; artwork</span></div>
            <div><h3 className="text-2xl font-semibold tracking-tight text-white">Visual &amp; Art</h3><p className="mt-2 max-w-md text-sm leading-6 text-slate-300">Create text artwork with 3D, fire, glitter and more, then export it from the matching tool.</p></div>
            <span className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-violet-200">Explore text artwork <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span></span>
          </Link>
        </div>
      </section>
      {!getCollectionGuide(id) && <div className="mt-10 grid gap-6 lg:grid-cols-3">{page.sections.map((section) => <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold">{section.title}</h2><p className="mt-3 text-sm leading-7 text-slate-600">{section.text}</p>
      </section>)}</div>}
    </div>
  </div>;
}

export default function LibraryPage({ id }: { id: LibraryId }) {
  return <LibraryPageShell id={id}>
    <nav aria-label="Symbol collections" className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
      {(['symbols', 'hearts', 'stars', 'arrows', 'kaomoji', 'emoji-combos'] as const).map((target) => {
        const page = getLibraryPage(target);
        const label = { symbols: 'All symbols', hearts: 'Hearts', stars: 'Stars', arrows: 'Arrows', kaomoji: 'Kaomoji', 'emoji-combos': 'Emoji combos' }[target];
        return <LibraryLink key={target} href={page.path} tool={id} targetId={target} current={id === target} className={`inline-flex min-h-12 shrink-0 items-center border-b-2 px-4 text-sm transition-colors ${id === target ? 'border-violet-600 font-semibold text-violet-700' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-950'}`}>{label}</LibraryLink>;
      })}
    </nav>
    <SymbolBrowser key={id} items={getLibraryItems(id)} tool={id} />
  </LibraryPageShell>;
}
