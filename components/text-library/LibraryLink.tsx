'use client';

import Link from '@/components/IntentLink';
import { trackTextToolEvent } from '@/lib/analytics/text-tools';
import type { LibraryId } from '@/lib/text-library/catalog';
import type { ReactNode } from 'react';

export default function LibraryLink({ href, tool, targetId, children, className, current }: {
  href: string; tool: LibraryId; targetId: LibraryId; children: ReactNode; className?: string; current?: boolean;
}) {
  return <Link href={href} aria-current={current ? 'page' : undefined} className={className} onClick={() => trackTextToolEvent('tool_directory_click', tool, targetId)}>{children}</Link>;
}
