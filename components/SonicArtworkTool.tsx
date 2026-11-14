'use client';

import { loadDiscoveryFont } from '@/lib/discovery-renderer';
import { SONIC_SAMPLE, drawSonicArtwork, sonicPresets } from '@/lib/sonic-artwork';
import TitleArtworkTool from './TitleArtworkTool';

const loadSonicFont = () => loadDiscoveryFont('luckiest-guy');

export default function SonicArtworkTool() {
  return <TitleArtworkTool id="sonic" name="Sonic" sample={SONIC_SAMPLE} presets={sonicPresets} loadFont={loadSonicFont} drawArtwork={drawSonicArtwork} />;
}
