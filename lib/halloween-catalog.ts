// Used only by the Halloween workspace. Do not register these as global styles.
export const halloweenFonts = [
  { id: 'creepster', family: 'Creepster' }, { id: 'nosifer', family: 'Nosifer' },
  { id: 'eater', family: 'Eater' }, { id: 'butcherman', family: 'Butcherman' },
  { id: 'metal-mania', family: 'Metal Mania' }, { id: 'new-rocker', family: 'New Rocker' },
  { id: 'pirata-one', family: 'Pirata One' }, { id: 'frijole', family: 'Frijole' },
  { id: 'rubik-wet-paint', family: 'Rubik Wet Paint' }, { id: 'lacquer', family: 'Lacquer' },
  { id: 'trade-winds', family: 'Trade Winds' }, { id: 'unifrakturmaguntia', family: 'UnifrakturMaguntia' },
] as const;
export type HalloweenFont = typeof halloweenFonts[number];
export type HalloweenCategory = 'Horror' | 'Playful' | 'Gothic' | 'Neon' | 'Posters';
export type HalloweenEffect = 'solid' | 'extrude' | 'glow' | 'neon' | 'candy' | 'glitch' | 'stitch' | 'scratch';
export type HalloweenScene = 'plain' | 'pumpkins' | 'moon' | 'web' | 'graveyard' | 'paper' | 'lightning' | 'stars';
export interface HalloweenPreset {
  id: string; name: string; font: HalloweenFont; category: HalloweenCategory;
  color: string; accent: string; background: string; ink: string;
  effect: HalloweenEffect; scene: HalloweenScene; arch?: boolean; outline: number;
}
const preset = (id: string, name: string, fontId: HalloweenFont['id'], category: HalloweenCategory, color: string, accent: string, background: string, effect: HalloweenEffect, scene: HalloweenScene = 'plain', outline = 4, arch = false): HalloweenPreset => ({ id, name, font: halloweenFonts.find((font) => font.id === fontId)!, category, color, accent, background, effect, scene, outline, arch, ink: '#1b1028' });
export const halloweenPresets: HalloweenPreset[] = [
  preset('pumpkin-pop', 'Pumpkin Pop', 'creepster', 'Playful', '#ffad28', '#ff581f', '#341348', 'extrude', 'pumpkins', 7, true),
  preset('blood-drip', 'Blood Drip', 'nosifer', 'Horror', '#ff343f', '#830718', '#140e18', 'solid', 'plain', 2),
  preset('midnight-gothic', 'Midnight Gothic', 'unifrakturmaguntia', 'Gothic', '#f1deba', '#b69363', '#171c2b', 'solid', 'stars', 1),
  preset('toxic-slime', 'Toxic Slime', 'rubik-wet-paint', 'Horror', '#bdff36', '#2ba42a', '#12271e', 'glow', 'plain', 4),
  preset('haunted-moon', 'Haunted Moon', 'eater', 'Posters', '#fff1bd', '#dfb171', '#251c47', 'extrude', 'moon', 4),
  preset('candy-corn', 'Candy Corn', 'creepster', 'Playful', '#fff5dc', '#ff7a1a', '#fff0db', 'candy', 'plain', 5),
  preset('neon-haunt', 'Neon Haunt', 'metal-mania', 'Neon', '#ff64df', '#bd31ff', '#160d2c', 'neon', 'plain', 2),
  preset('witching-hour', 'Witching Hour', 'trade-winds', 'Gothic', '#d9fca4', '#6eaf87', '#103832', 'solid', 'stars', 2, true),
  preset('graveyard-shift', 'Graveyard Shift', 'frijole', 'Posters', '#ffd593', '#ed7537', '#50233b', 'solid', 'graveyard', 4),
  preset('stitched-monster', 'Stitched Monster', 'butcherman', 'Horror', '#b9df76', '#599957', '#1e2b26', 'stitch', 'plain', 3),
  preset('purple-potion', 'Purple Potion', 'new-rocker', 'Playful', '#efa2ff', '#a852ed', '#3e1c65', 'extrude', 'stars', 6),
  preset('spider-silk', 'Spider Silk', 'pirata-one', 'Gothic', '#eee5fd', '#ba9ae5', '#241634', 'solid', 'web', 1),
  preset('ghost-light', 'Ghost Light', 'lacquer', 'Neon', '#c5fff9', '#54dcf4', '#092537', 'glow', 'stars', 0),
  preset('haunted-manuscript', 'Haunted Manuscript', 'unifrakturmaguntia', 'Posters', '#38231f', '#806044', '#e4c9a0', 'solid', 'paper', 0),
  preset('scream-signal', 'Scream Signal', 'eater', 'Neon', '#ffffff', '#ff3e91', '#0e1224', 'glitch', 'plain', 0),
  preset('monster-mash', 'Monster Mash', 'butcherman', 'Horror', '#ffcf6c', '#e86939', '#352938', 'extrude', 'plain', 4),
  preset('vampire-ball', 'Vampire Ball', 'pirata-one', 'Gothic', '#e9c185', '#b66e45', '#3b1023', 'solid', 'web', 2),
  preset('pumpkin-patch', 'Pumpkin Patch', 'creepster', 'Posters', '#ffe7a4', '#ff9a3b', '#4e2918', 'extrude', 'pumpkins', 5),
  preset('candy-shop', 'Candy Shop', 'frijole', 'Playful', '#ff9be1', '#ff5aad', '#fff1f8', 'extrude', 'stars', 4, true),
  preset('eerie-scratch', 'Eerie Scratch', 'lacquer', 'Horror', '#f4e4cb', '#bf9f88', '#24201d', 'scratch', 'plain', 0),
  preset('electric-curse', 'Electric Curse', 'metal-mania', 'Neon', '#a3c9ff', '#7862ff', '#121634', 'neon', 'lightning', 2),
  preset('wicked-rock', 'Wicked Rock', 'new-rocker', 'Gothic', '#dfdaf1', '#867797', '#211727', 'extrude', 'plain', 3),
  preset('stormy-night', 'Stormy Night', 'trade-winds', 'Posters', '#e6f5ff', '#8ebde5', '#15283f', 'solid', 'lightning', 3),
  preset('classic-horror', 'Classic Horror', 'nosifer', 'Horror', '#ff942b', '#ef581f', '#241320', 'solid', 'plain', 0),
];
export const halloweenCategories = ['All', 'Horror', 'Playful', 'Gothic', 'Neon', 'Posters'] as const;
