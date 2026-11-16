import CuneiformTranslator from '@/components/CuneiformTranslator';
import ScriptToolPage from '@/components/ScriptToolPage';
import { libraryMetadata } from '@/components/text-library/LibraryPage';

const id = 'cuneiform-translator';
export const metadata = libraryMetadata(id);

export default function CuneiformTranslatorPage() {
  return <ScriptToolPage id={id}><CuneiformTranslator /></ScriptToolPage>;
}
