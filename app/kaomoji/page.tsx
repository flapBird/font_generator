import LibraryPage, { libraryMetadata } from '@/components/text-library/LibraryPage';

export const metadata = libraryMetadata('kaomoji');

export default function Page() {
  return <LibraryPage id="kaomoji" />;
}
