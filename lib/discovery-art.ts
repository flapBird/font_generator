export const discoveryFonts = {
  caveat: { label: 'Caveat', family: 'Discovery Caveat', license: 'SIL OFL 1.1' },
  oswald: { label: 'Oswald', family: 'Discovery Oswald', license: 'SIL OFL 1.1' },
  'bebas-neue': { label: 'Bebas Neue', family: 'Discovery Bebas', license: 'SIL OFL 1.1' },
  'luckiest-guy': { label: 'Luckiest Guy', family: 'Discovery Lucky', license: 'Apache 2.0' },
} as const;
export type DiscoveryFont = keyof typeof discoveryFonts;
export type DiscoveryEffect = 'tube' | 'glow' | 'signal' | 'terminal' | 'candy' | 'action' | 'marker' | 'space';
export interface DiscoveryArtPreset { id: string; name: string; font: DiscoveryFont; effect: DiscoveryEffect; color: string; accent: string; background: string; description: string }
export const discoveryArtPresets: Record<string, DiscoveryArtPreset[]> = {
  'neon-font-generator': [
    { id: 'pink-sign', name: 'Pink After Hours', font: 'caveat', effect: 'tube', color: '#ff65c8', accent: '#f72585', background: '#190d24', description: 'Handwritten tubes with a hot pink halo.' },
    { id: 'cyan-sign', name: 'Electric Avenue', font: 'bebas-neue', effect: 'tube', color: '#78fff1', accent: '#10d9ef', background: '#061b24', description: 'Tall cyan sign lettering on a quiet grid.' },
    { id: 'violet-glow', name: 'Ultraviolet', font: 'oswald', effect: 'glow', color: '#e1c9ff', accent: '#9d62ff', background: '#140d29', description: 'Solid display lettering with a violet aura.' },
    { id: 'gold-sign', name: 'Golden Hour', font: 'caveat', effect: 'tube', color: '#ffdf85', accent: '#ff9f24', background: '#241507', description: 'Warm script light for names and invitations.' },
  ],
  'cyberpunk-font-generator': [
    { id: 'night-signal', name: 'Night Signal', font: 'bebas-neue', effect: 'signal', color: '#fff132', accent: '#26ecf5', background: '#101317', description: 'Sliced yellow type with cyan channel displacement.' },
    { id: 'chromatic', name: 'Chromatic Drift', font: 'oswald', effect: 'signal', color: '#e6f8ff', accent: '#ff47bf', background: '#11102b', description: 'Cold white letters with magenta signal echoes.' },
    { id: 'terminal', name: 'Green Terminal', font: 'oswald', effect: 'terminal', color: '#8dffa1', accent: '#21d9a5', background: '#071812', description: 'A restrained green screen with scanline texture.' },
    { id: 'warning', name: 'Hazard Protocol', font: 'bebas-neue', effect: 'signal', color: '#ff9e35', accent: '#e84959', background: '#1e1115', description: 'Industrial orange with warm split channels.' },
  ],
  'anime-font-generator': [
    { id: 'dream-squad', name: 'Dream Squad', font: 'luckiest-guy', effect: 'candy', color: '#ff9ed4', accent: '#a56bff', background: '#fff2fa', description: 'Candy lettering, deep outlines and little stars.' },
    { id: 'power-up', name: 'Power Up', font: 'bebas-neue', effect: 'action', color: '#ffdc42', accent: '#ff5c36', background: '#172040', description: 'Dimensional action type over speed lines.' },
    { id: 'manga-notes', name: 'Manga Notes', font: 'caveat', effect: 'marker', color: '#ffffff', accent: '#8bc8ff', background: '#1c2c46', description: 'Loose pen lettering with an illustrated outline.' },
    { id: 'star-pilot', name: 'Star Pilot', font: 'oswald', effect: 'space', color: '#a6fcff', accent: '#7683ff', background: '#0f1637', description: 'Retro space lettering with a cool gradient.' },
  ],
};
export interface DiscoveryArtSettings {
  color: string; accent: string; background: string; transparent: boolean;
  size: number; strength: number; spacing: number; align: 'left' | 'center' | 'right'; format: 'banner' | 'square';
}
export const initialDiscoveryArtSettings = (preset: DiscoveryArtPreset): DiscoveryArtSettings => ({ color: preset.color, accent: preset.accent, background: preset.background, transparent: false, size: 140, strength: 6, spacing: 0, align: 'center', format: 'banner' });
