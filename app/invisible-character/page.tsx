import { LibraryPageShell, libraryMetadata } from '@/components/text-library/LibraryPage';
import InvisibleCharacterTool from '@/components/text-library/InvisibleCharacterTool';

export const metadata = libraryMetadata('invisible-character');

export default function InvisibleCharacterPage() {
  return <LibraryPageShell id="invisible-character"><InvisibleCharacterTool /></LibraryPageShell>;
}
