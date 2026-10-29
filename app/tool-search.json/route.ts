import { toolDirectoryGroups } from '@/lib/tool-directory';
export const dynamic = 'force-static';
export function GET() {
  return Response.json(toolDirectoryGroups.flatMap((group) => group.entries.map(({ title, href, searchText }) => ({ title, href, searchText, category: group.title }))), {
    headers: { 'Cache-Control': 'public, max-age=3600', 'X-Robots-Tag': 'noindex' },
  });
}
