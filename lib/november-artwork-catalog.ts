import { fandomBrushSlugs } from './fandom-brush-catalog';

export const letteringArtworkSlugs = ['varsity-font-generator', 'wavy-text-generator'] as const;
export const stencilLetterSlug = 'stencil-letter-generator';
export const novemberStyleArtworkSlugs = [...letteringArtworkSlugs, stencilLetterSlug] as const;
export const novemberArtworkSlugs = [...novemberStyleArtworkSlugs, ...fandomBrushSlugs] as const;
export type NovemberArtworkSlug = typeof novemberArtworkSlugs[number];
export const isNovemberArtworkSlug = (slug: string): slug is NovemberArtworkSlug => novemberArtworkSlugs.some((value) => value === slug);

export const novemberArtworkRelatedLinks: Record<string, string[]> = {
  'big-font-generator': ['varsity-font-generator', 'stencil-letter-generator'],
  'neon-font-generator': ['wavy-text-generator'],
  'graffiti-font-generator': ['stencil-letter-generator', 'naruto-font-generator'],
  'anime-font-generator': fandomBrushSlugs,
};
