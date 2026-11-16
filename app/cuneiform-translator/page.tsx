import CuneiformTranslator from '@/components/CuneiformTranslator';
import ScriptToolPage, { scriptWorkspace } from '@/components/ScriptToolPage';
import { libraryMetadata } from '@/components/text-library/LibraryPage';

const id = 'cuneiform-translator';
export const metadata = libraryMetadata(id);

export default function CuneiformTranslatorPage() {
  return <ScriptToolPage id={id}><CuneiformTranslator {...scriptWorkspace(id)} /></ScriptToolPage>;
}
