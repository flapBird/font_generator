import HieroglyphicsTool from '@/components/HieroglyphicsTool';
import { LibraryPageShell, libraryMetadata } from '@/components/text-library/LibraryPage';
import { hieroglyphSources } from '@/lib/hieroglyphics';

const id = 'hieroglyphics-translator';
export const metadata = libraryMetadata(id);

export default function HieroglyphicsTranslatorPage() {
  return (
    <LibraryPageShell id={id}>
      <HieroglyphicsTool />
      <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm leading-6">
        <a className="text-violet-700 underline dark:text-violet-300" href={hieroglyphSources.museum}>Royal Ontario Museum spelling activity</a>
        <a className="text-violet-700 underline dark:text-violet-300" href={hieroglyphSources.unicode}>Unicode sign chart</a>
        <a className="text-violet-700 underline dark:text-violet-300" href="/fonts/hieroglyphics/OFL.txt">Noto font license</a>
      </p>
    </LibraryPageShell>
  );
}
