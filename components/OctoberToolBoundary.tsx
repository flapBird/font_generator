'use client';

import dynamic from 'next/dynamic';
import type { GeneratorPageConfig } from '@/lib/generator';
import type { GeneratorSearchItem } from './GeneratorTool';

// Keep dynamic imports behind a client boundary. Server-component dynamic
// imports otherwise preload both new workspaces on older PageTemplate routes.
const Artwork = dynamic(() => import('./OctoberArtworkTool'));
const Text = dynamic(() => import('./OctoberTextGeneratorTool'));

export default function OctoberToolBoundary({ artwork, slug, pageTitle, config, navigationItems }: {
  artwork: boolean; slug: string; pageTitle: string; config: GeneratorPageConfig; navigationItems: GeneratorSearchItem[];
}) {
  return artwork ? <Artwork slug={slug} pageTitle={pageTitle} textConfig={config} />
    : <Text slug={slug} pageTitle={pageTitle} config={config} navigationItems={navigationItems} />;
}
