import { discoveryFonts, type DiscoveryFont } from './discovery-art';

export type LetteringVariant = 'varsity' | 'wavy';
export type LetteringFont = 'graduate' | DiscoveryFont;
type ArtworkFormat = 'banner' | 'square';

export const letteringTextLimit = 60;
export const letteringSizes = {
  banner: [2000, 1000],
  square: [1600, 1600],
} as const;

export interface LetteringStyle {
  fill: string;
  outline: string;
  background: string;
  curve: number;
  outlineWidth: number;
  waves: number;
}

interface LetteringPreset extends LetteringStyle {
  name: string;
  font: LetteringFont;
}

export interface LetteringSettings extends LetteringStyle {
  transparent: boolean;
  format: ArtworkFormat;
}

export const letteringFonts = {
  ...discoveryFonts,
  graduate: { label: 'Graduate', family: 'Lettering Graduate', license: 'SIL OFL 1.1' },
} as const;

export const letteringConfigurations: Record<LetteringVariant, {
  sample: string;
  placeholder: string;
  intro: string;
  curveLabel: string;
  fileName: string;
  presets: LetteringPreset[];
}> = {
  varsity: {
    sample: 'WESTFIELD',
    placeholder: 'Type a team name or number',
    intro: 'Set a team name or jersey number in collegiate block lettering. Shape the arch, pick your colors, and download the artwork.',
    curveLabel: 'Arch height',
    fileName: 'varsity-lettering',
    presets: [
      { name: 'Letterman', font: 'graduate', fill: '#fbe8b4', outline: '#c54933', background: '#202940', curve: 52, outlineWidth: 54, waves: 1 },
      { name: 'Home team', font: 'graduate', fill: '#f6f9ff', outline: '#294ea0', background: '#182857', curve: 28, outlineWidth: 68, waves: 1 },
      { name: 'Jersey numbers', font: 'graduate', fill: '#174633', outline: '#db9836', background: '#f6e7c7', curve: 0, outlineWidth: 68, waves: 1 },
    ],
  },
  wavy: {
    sample: 'GOOD VIBRATIONS',
    placeholder: 'Type a word or short title',
    intro: 'Bend a word or short title into a smooth wave. Adjust the height and number of waves, then export a PNG.',
    curveLabel: 'Wave height',
    fileName: 'wavy-text',
    presets: [
      { name: 'Retro wave', font: 'luckiest-guy', fill: '#ffe7a4', outline: '#f27854', background: '#462351', curve: 56, outlineWidth: 38, waves: 1 },
      { name: 'High tide', font: 'bebas-neue', fill: '#b9ffea', outline: '#326eb6', background: '#0d243d', curve: 68, outlineWidth: 42, waves: 2 },
      { name: 'Soft ripple', font: 'caveat', fill: '#683c66', outline: '#d993ac', background: '#fbe9ee', curve: 36, outlineWidth: 28, waves: 1 },
    ],
  },
};

export function getLetteringSettings(preset: LetteringPreset): LetteringSettings {
  return {
    fill: preset.fill,
    outline: preset.outline,
    background: preset.background,
    curve: preset.curve,
    outlineWidth: preset.outlineWidth,
    waves: preset.waves,
    format: 'banner',
    transparent: false,
  };
}
