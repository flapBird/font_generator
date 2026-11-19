'use client';

import { useCallback, useState } from 'react';
import { drawFandomBrushArtwork, loadFandomBrushFont } from '@/lib/fandom-brush-artwork';
import { fandomBrushConfigs, type FandomBrushSlug } from '@/lib/fandom-brush-catalog';
import type { TitleArtworkPreset, TitleArtworkSettings } from '@/lib/title-artwork';
import TitleArtworkTool from './TitleArtworkTool';

export default function FandomBrushArtworkTool({ slug }: { slug: FandomBrushSlug }) {
  const { name, sample, presets, effect } = fandomBrushConfigs[slug];
  const [decorated, setDecorated] = useState(true);
  const loadFont = useCallback(() => loadFandomBrushFont(slug), [slug]);
  const drawArtwork = useCallback((canvas: HTMLCanvasElement, text: string, _preset: TitleArtworkPreset, settings: TitleArtworkSettings) => {
    drawFandomBrushArtwork(canvas, text, slug, settings, decorated);
  }, [slug, decorated]);

  return (
    <div data-clarity-mask="true">
      <TitleArtworkTool id={slug.replace('-font-generator', '')} name={name} sample={sample} presets={presets} loadFont={loadFont} drawArtwork={drawArtwork}>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={decorated} onChange={(event) => setDecorated(event.target.checked)} className="h-4 w-4 accent-violet-600" />
          {effect === 'motion' ? 'Motion trails' : 'Dry brush texture'}
        </label>
      </TitleArtworkTool>
    </div>
  );
}
