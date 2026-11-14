'use client';

import { useCallback, useState } from 'react';
import { SPIDERMAN_SAMPLE, drawSpidermanArtwork, loadSpidermanFont, spidermanPresets } from '@/lib/spiderman-artwork';
import type { TitleArtworkSettings } from '@/lib/title-artwork';
import TitleArtworkTool from './TitleArtworkTool';

export default function SpidermanArtworkTool() {
  const [webTexture, setWebTexture] = useState(true);
  const drawArtwork = useCallback((canvas: HTMLCanvasElement, text: string, preset: typeof spidermanPresets[number], settings: TitleArtworkSettings) => {
    drawSpidermanArtwork(canvas, text, preset, settings, webTexture);
  }, [webTexture]);

  return (
    <TitleArtworkTool id="spiderman" name="Spider-Man" sample={SPIDERMAN_SAMPLE} presets={spidermanPresets} loadFont={loadSpidermanFont} drawArtwork={drawArtwork}>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" checked={webTexture} onChange={(event) => setWebTexture(event.target.checked)} className="h-4 w-4 accent-violet-600" />Web texture on letters
      </label>
    </TitleArtworkTool>
  );
}
