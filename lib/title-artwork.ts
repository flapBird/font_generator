import { segmentGraphemes } from './unicode';

export const TITLE_ARTWORK_INPUT_LIMIT = 120;
export const titleArtworkFormats = { banner: [2000, 1000], square: [1600, 1600] } as const;
export type TitleArtworkFormat = keyof typeof titleArtworkFormats;
export type TitleArtworkSlug = 'sonic-font-generator' | 'spiderman-font-generator';

export function isTitleArtworkSlug(slug: string): slug is TitleArtworkSlug {
  return slug === 'sonic-font-generator' || slug === 'spiderman-font-generator';
}

export type TitleArtworkSettings = {
  fill: string;
  outline: string;
  scene: string;
  slant: number;
  transparent: boolean;
  format: TitleArtworkFormat;
};

export type TitleArtworkPreset = Pick<TitleArtworkSettings, 'fill' | 'outline' | 'scene' | 'slant'> & { name: string };

// Wrap at word boundaries when possible. Keep manual line breaks and graphemes.
export function wrapArtworkLines(text: string) {
  return text.replace(/\r\n?/g, '\n').split('\n').flatMap((line) => {
    const parts = segmentGraphemes(line);
    const wrapped: string[] = [];
    while (parts.length > 24) {
      const space = parts.slice(0, 25).lastIndexOf(' ');
      const split = space > 0 ? space : 24;
      wrapped.push(parts.splice(0, split).join(''));
      if (parts[0] === ' ') parts.shift();
    }
    return [...wrapped, parts.join('')];
  });
}
