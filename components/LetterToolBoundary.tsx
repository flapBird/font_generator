'use client';

import dynamic from 'next/dynamic';
import type { TextWorkspace } from './TextToolLayout';

const CursedTextGeneratorTool = dynamic(() => import('./CursedTextGeneratorTool'));
const LetterStylesTool = dynamic(() => import('./LetterStylesTool'));
const SonicArtworkTool = dynamic(() => import('./SonicArtworkTool'));

export default function LetterToolBoundary({ slug, ...workspace }: Pick<TextWorkspace, 'config' | 'navigationItems' | 'pageTitle'> & {
  slug: 'cursed-text-generator' | 'letters-in-different-fonts' | 'sonic-font-generator';
}) {
  if (slug === 'sonic-font-generator') return <SonicArtworkTool />;
  if (slug === 'letters-in-different-fonts') return <LetterStylesTool {...workspace} />;
  return <CursedTextGeneratorTool {...workspace} />;
}
