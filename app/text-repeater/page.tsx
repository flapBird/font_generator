import KeywordToolPage from '@/components/KeywordToolPage';
import TextRepeaterTool from '@/components/TextRepeaterTool';
import { libraryMetadata } from '@/components/text-library/LibraryPage';
import { keywordTools } from '@/lib/keyword-tools';

const tool = keywordTools.find(({ id }) => id === 'text-repeater')!;

export const metadata = libraryMetadata(tool.id);

export default function TextRepeaterPage() {
  return (
    <KeywordToolPage id={tool.id}>
      <TextRepeaterTool sample={tool.sample} />
    </KeywordToolPage>
  );
}
