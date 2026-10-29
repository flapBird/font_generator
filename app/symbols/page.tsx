import LibraryPage, { libraryMetadata } from '@/components/text-library/LibraryPage';

export const metadata = libraryMetadata('symbols');

export default function Page() {
  return <LibraryPage id="symbols" />;
}
