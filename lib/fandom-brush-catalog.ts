import type { TitleArtworkPreset } from './title-artwork';

export const fandomBrushConfigs = {
  'naruto-font-generator': {
    name: 'Naruto',
    sample: 'RISING WIND',
    font: 'permanent-marker',
    fontName: 'Permanent Marker',
    effect: 'motion',
    presets: [
      { name: 'Ember Dash', fill: '#ffc447', outline: '#30213c', scene: '#fff2d7', slant: 15 },
      { name: 'Dusk Trail', fill: '#8eacf7', outline: '#23264e', scene: '#e7e9fb', slant: 11 },
      { name: 'Vermilion Rush', fill: '#ff784d', outline: '#3b1828', scene: '#fff1e8', slant: 19 },
    ],
  },
  'demon-slayer-font-generator': {
    name: 'Demon Slayer',
    sample: 'MOON OVER PINES',
    font: 'sedgwick-ave-display',
    fontName: 'Sedgwick Ave Display',
    effect: 'ink',
    presets: [
      { name: 'Night Ink', fill: '#201c33', outline: '#784b59', scene: '#f5ebdb', slant: 0 },
      { name: 'Pine Mist', fill: '#1c4b45', outline: '#688d72', scene: '#e8eee4', slant: 4 },
      { name: 'Crimson Paper', fill: '#8f2338', outline: '#c47664', scene: '#fbe9da', slant: 2 },
    ],
  },
} as const satisfies Record<string, {
  name: string;
  sample: string;
  font: string;
  fontName: string;
  effect: 'motion' | 'ink';
  presets: readonly [TitleArtworkPreset, ...TitleArtworkPreset[]];
}>;

export type FandomBrushSlug = keyof typeof fandomBrushConfigs;
export const fandomBrushSlugs = Object.keys(fandomBrushConfigs) as FandomBrushSlug[];
export const isFandomBrushSlug = (slug: string): slug is FandomBrushSlug => Object.hasOwn(fandomBrushConfigs, slug);
