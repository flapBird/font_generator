import Link from '@/components/IntentLink';
import ScriptAlphabetChart from '@/components/ScriptAlphabetChart';
import ScriptToolPage from '@/components/ScriptToolPage';
import { libraryMetadata } from '@/components/text-library/LibraryPage';

const id = 'standard-galactic-alphabet';
export const metadata = libraryMetadata(id);

export default function StandardGalacticAlphabetPage() {
  return (
    <ScriptToolPage id={id}>
      <section aria-labelledby="alphabet-heading" className="max-w-4xl rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-950">
        <h2 id="alphabet-heading" className="mb-4 text-lg font-semibold">Galactic letters A–Z</h2>
        <ScriptAlphabetChart alphabet="galactic" />
        <Link href="/enchanting-table-translator" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-violet-700 hover:underline dark:text-violet-300">Open the Enchanting Table Translator →</Link>
      </section>
    </ScriptToolPage>
  );
}
