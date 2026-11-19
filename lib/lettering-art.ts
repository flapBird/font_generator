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
}

interface LetteringPreset extends LetteringStyle {
  name: string;
}

export interface LetteringSettings extends LetteringStyle {
  transparent: boolean;
  format: ArtworkFormat;
}

export const graduateFontFamily = 'Lettering Graduate';

export const varsityConfiguration = {
  sample: 'WESTFIELD',
  presets: [
    { name: 'Letterman', fill: '#fbe8b4', outline: '#c54933', background: '#202940', curve: 52, outlineWidth: 54 },
    { name: 'Home team', fill: '#f6f9ff', outline: '#294ea0', background: '#182857', curve: 28, outlineWidth: 68 },
    { name: 'Jersey numbers', fill: '#174633', outline: '#db9836', background: '#f6e7c7', curve: 0, outlineWidth: 68 },
  ] satisfies LetteringPreset[],
};

export function getLetteringSettings(preset: LetteringPreset): LetteringSettings {
  return {
    fill: preset.fill,
    outline: preset.outline,
    background: preset.background,
    curve: preset.curve,
    outlineWidth: preset.outlineWidth,
    format: 'banner',
    transparent: false,
  };
}
