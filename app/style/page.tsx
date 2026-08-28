import { permanentRedirect } from 'next/navigation';

export default function LegacyStyleDirectoryPage() {
  permanentRedirect('/styles');
}
