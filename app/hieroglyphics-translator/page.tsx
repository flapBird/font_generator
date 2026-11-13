import HieroglyphicsTool from '@/components/HieroglyphicsTool';
import { LibraryPageShell, libraryMetadata } from '@/components/text-library/LibraryPage';

const id = 'hieroglyphics-translator';
export const metadata = libraryMetadata(id);

export default function HieroglyphicsTranslatorPage() {
  return (
    <LibraryPageShell id={id}>
      <HieroglyphicsTool />
    </LibraryPageShell>
  );
}
