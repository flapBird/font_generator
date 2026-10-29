import LibraryPage, { libraryMetadata } from '@/components/text-library/LibraryPage';

export const metadata = libraryMetadata('stars');

export default function Page() {
  return <LibraryPage id="stars" />;
}
