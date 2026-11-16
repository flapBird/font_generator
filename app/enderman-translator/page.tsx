import ScriptAlphabetTranslator from '@/components/ScriptAlphabetTranslator';
import ScriptToolPage, { scriptWorkspace } from '@/components/ScriptToolPage';
import { libraryMetadata } from '@/components/text-library/LibraryPage';

const id = 'enderman-translator';
export const metadata = libraryMetadata(id);

export default function EndermanTranslatorPage() {
  return <ScriptToolPage id={id}><ScriptAlphabetTranslator alphabet="ender" {...scriptWorkspace(id)} /></ScriptToolPage>;
}
