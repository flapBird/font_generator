import { LibraryPageShell, libraryMetadata } from '@/components/text-library/LibraryPage';
import UnicodeToolDirectory from '@/components/text-library/UnicodeToolDirectory';
import Link from '@/components/IntentLink';
import { getLibraryPage } from '@/lib/text-library/catalog';
import { unicodeTools } from '@/lib/unicode-tool-catalog';

export const metadata = libraryMetadata('unicode-tools');
export default function UnicodeToolsPage() {
  const items = unicodeTools.map((tool) => ({ ...tool, title: getLibraryPage(tool.id).title, description: getLibraryPage(tool.id).description }));
  return <LibraryPageShell id="unicode-tools" centeredHeading>
    <UnicodeToolDirectory items={items} />
    <nav aria-label="Related collections" className="mt-5 flex flex-wrap gap-x-5 text-sm font-semibold text-violet-700">
      <Link href="/symbols" className="inline-flex min-h-11 items-center">Symbols &amp; Emoji →</Link>
      <Link href="/styles" className="inline-flex min-h-11 items-center">Font Styles →</Link>
      <Link href="/tools" className="inline-flex min-h-11 items-center">All tools →</Link>
    </nav>
  </LibraryPageShell>;
}
