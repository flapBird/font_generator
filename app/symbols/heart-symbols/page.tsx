import LibraryPage, { libraryMetadata } from '@/components/text-library/LibraryPage';

export const metadata = libraryMetadata('hearts');

export default function Page() {
  return <LibraryPage id="hearts" />;
}
