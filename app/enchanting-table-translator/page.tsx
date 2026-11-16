import ScriptAlphabetTranslator from '@/components/ScriptAlphabetTranslator';
import ScriptToolPage from '@/components/ScriptToolPage';
import { libraryMetadata } from '@/components/text-library/LibraryPage';

const id = 'enchanting-table-translator';
export const metadata = libraryMetadata(id);

export default function EnchantingTableTranslatorPage() {
  return <ScriptToolPage id={id}><ScriptAlphabetTranslator alphabet="galactic" /></ScriptToolPage>;
}
