import { LibraryPageShell, libraryMetadata } from '@/components/text-library/LibraryPage';
import LibraryLink from '@/components/text-library/LibraryLink';
import Link from '@/components/IntentLink';
import { getLibraryPage, type UnicodeUtilityId } from '@/lib/text-library/catalog';

export const metadata = libraryMetadata('unicode-tools');

export default function UnicodeToolsPage() {
  return <LibraryPageShell id="unicode-tools">
    <section aria-labelledby="available-unicode-tools" className="grid gap-4 sm:grid-cols-2">
      <h2 id="available-unicode-tools" className="sr-only">Available Unicode tools</h2>
      {(['unicode-character-inspector', 'invisible-character-remover', 'fancy-text-to-normal-text'] as UnicodeUtilityId[]).map((id) => {
        const tool = getLibraryPage(id);
        return <LibraryLink key={id} href={tool.path} tool="unicode-tools" targetId={id} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-violet-500">
          <span aria-hidden="true" className="text-3xl text-violet-700">{tool.icon}</span><h3 className="mt-3 text-xl font-semibold">{tool.title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{tool.description}</p><span className="mt-4 inline-block text-sm font-semibold text-violet-700">Open tool →</span>
        </LibraryLink>;
      })}
      <LibraryLink href="/invisible-character" tool="unicode-tools" targetId="invisible-character" className="rounded-2xl border border-violet-200 bg-violet-50 p-6 transition hover:border-violet-500">
        <span aria-hidden="true" className="text-3xl text-violet-700">␣</span><h3 className="mt-3 text-xl font-semibold">Invisible Character</h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">Choose from eight blank character types, repeat one up to 100 times, copy the exact text and inspect what you paste back.</p>
        <span className="mt-4 inline-block text-sm font-semibold text-violet-700">Copy and inspect →</span>
      </LibraryLink>
      <LibraryLink href="/symbols" tool="unicode-tools" targetId="symbols" className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-violet-500">
        <span aria-hidden="true" className="text-3xl text-violet-700">✦</span><h3 className="mt-3 text-xl font-semibold">Symbols &amp; Emoji</h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">Browse visible symbols by name and code point. Find hearts, stars, arrows, kaomoji and themed emoji combinations.</p>
        <span className="mt-4 inline-block text-sm font-semibold text-violet-700">Browse the library →</span>
      </LibraryLink>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:col-span-2"><h3 className="font-semibold">Looking for letter styles?</h3><p className="mt-2 text-sm leading-7 text-slate-600">The existing font tools convert supported letters into copyable Unicode styles, with separate controls for each generator.</p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-violet-700"><Link href="/styles" className="py-2">All font styles →</Link><Link href="/small-text-generator" className="py-2">Small text →</Link><Link href="/cursive-font-generator" className="py-2">Cursive text →</Link></div>
      </div>
    </section>
  </LibraryPageShell>;
}
