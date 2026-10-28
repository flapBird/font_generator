'use client';

import dynamic from 'next/dynamic';
import type { GeneratorPageConfig } from '@/lib/generator';
import type { GeneratorSearchItem } from './GeneratorTool';

const Text = dynamic(() => import('./DiscoveryTextTool'));
const Artwork = dynamic(() => import('./DiscoveryArtworkTool'));
// Neither workspace belongs in the shared generator bundle or homepage resources.
export default function DiscoveryToolBoundary(props: { artwork: boolean; slug: string; pageTitle: string; config: GeneratorPageConfig; navigationItems: GeneratorSearchItem[] }) {
  return props.artwork ? <Artwork slug={props.slug} pageTitle={props.pageTitle} /> : <Text {...props} />;
}
