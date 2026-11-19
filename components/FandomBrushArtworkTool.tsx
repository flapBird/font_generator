'use client';

import { useCallback, useState } from 'react';
import { drawFandomBrushArtwork, loadFandomBrushFont } from '@/lib/fandom-brush-artwork';
import { fandomBrushConfigs, type FandomBrushPreset, type FandomBrushSlug } from '@/lib/fandom-brush-catalog';
import type { TitleArtworkSettings } from '@/lib/title-artwork';
import TitleArtworkTool from './TitleArtworkTool';

export default function FandomBrushArtworkTool({ slug }: { slug: FandomBrushSlug }) {
  const { name, sample, presets, effect } = fandomBrushConfigs[slug];
  const [decorated, setDecorated] = useState(true);
  const loadFont = useCallback(() => loadFandomBrushFont(slug), [slug]);
  const drawArtwork = useCallback((canvas: HTMLCanvasElement, text: string, preset: FandomBrushPreset, settings: TitleArtworkSettings) => {
    drawFandomBrushArtwork(canvas, text, slug, preset, settings, decorated);
  }, [slug, decorated]);

  return (
    <div data-clarity-mask="true">
      <TitleArtworkTool id={slug.replace('-font-generator', '')} name={name} sample={sample} presets={presets} loadFont={loadFont} drawArtwork={drawArtwork} videoFormats>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={decorated} onChange={(event) => setDecorated(event.target.checked)} className="h-4 w-4 accent-violet-600" />
          {effect === 'motion' ? 'Motion effects' : 'Ink effects'}
        </label>
      </TitleArtworkTool>
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{effect === 'motion'
        ? 'Ember Dash uses speed lines, Dusk Trail adds brush afterimages, and Vermilion Rush scatters ember flecks.'
        : 'Night Ink adds dry-brush texture, Pine Mist adds a flowing ink wave, and Crimson Paper adds a broad brush sweep.'}</p>
    </div>
  );
}
