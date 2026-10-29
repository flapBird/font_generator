import { LibraryPageShell, libraryMetadata } from '@/components/text-library/LibraryPage';
import UnicodeUtilityTool from '@/components/text-library/UnicodeUtilityTool';
import { getLibraryPage } from '@/lib/text-library/catalog';
import { utilityNavigation } from '@/lib/text-library/navigation';

const id = 'unicode-character-inspector' as const;
export const metadata = libraryMetadata(id);

export default function Page() {
  return <LibraryPageShell id={id}><UnicodeUtilityTool key={id} id={id} title={getLibraryPage(id).title} navigationItems={utilityNavigation(id)} /></LibraryPageShell>;
}
