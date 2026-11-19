'use client';

import dynamic from 'next/dynamic';
import { isFandomBrushSlug } from '@/lib/fandom-brush-catalog';
import { stencilLetterSlug, type NovemberArtworkSlug } from '@/lib/november-artwork-catalog';

const FandomBrushArtworkTool = dynamic(() => import('./FandomBrushArtworkTool'));
const WavyTextArtworkTool = dynamic(() => import('./WavyTextArtworkTool'));
const LetteringArtworkTool = dynamic(() => import('./LetteringArtworkTool'));
const StencilLetterTool = dynamic(() => import('./StencilLetterTool'));

export default function NovemberArtworkBoundary({ slug, pageTitle }: { slug: NovemberArtworkSlug; pageTitle: string }) {
  if (isFandomBrushSlug(slug)) return <FandomBrushArtworkTool slug={slug} />;
  if (slug === stencilLetterSlug) return <StencilLetterTool pageTitle={pageTitle} />;
  if (slug === 'wavy-text-generator') return <WavyTextArtworkTool />;
  return <LetteringArtworkTool />;
}
