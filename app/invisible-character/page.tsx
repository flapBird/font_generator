import { LibraryPageShell, libraryMetadata } from '@/components/text-library/LibraryPage';
import InvisibleCharacterTool from '@/components/text-library/InvisibleCharacterTool';
import { utilityNavigation } from '@/lib/text-library/navigation';

export const metadata = libraryMetadata('invisible-character');

export default function InvisibleCharacterPage() {
  return <LibraryPageShell id="invisible-character"><InvisibleCharacterTool navigationItems={utilityNavigation('invisible-character')} /></LibraryPageShell>;
}
