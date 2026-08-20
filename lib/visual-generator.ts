export interface VisualFontPreset {
  id: string;
  name: string;
  description: string;
  fontFamily: string;
  targetFont?: string;
  fontSource?: 'bundled' | 'device';
  sourceLabel: string;
  licenseNote: string;
  fontWeight?: number;
  fontStyle?: 'normal' | 'italic';
  uppercase?: boolean;
  textColor: string;
  backgroundColor: string;
  accentColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  letterSpacing?: number;
  gradient?: [string, string];
  multicolor?: boolean;
  fontAlternates?: string[];
  characterBackgrounds?: string[];
  characterTilt?: number;
  material?: VisualMaterial;
  decoration?: 'lines' | 'badge' | 'pixel' | 'sparkles' | 'flames' | 'ransom' | 'none';
}

export type VisualMaterial = 'grass' | 'stone' | 'diamond' | 'nether';

export type VisualCapability =
  | 'background-image'
  | 'meme-layout'
  | 'font-specimen'
  | 'game-codes'
  | 'copyable-name'
  | 'inline-format-codes'
  | 'material-textures'
  | 'extrusion-depth'
  | 'pixel-snap';

export interface VisualGeneratorConfig {
  engine: 'font-renderer' | 'theme-renderer' | 'minecraft-renderer';
  initialText: string;
  intentLabel: string;
  resultIntro: string;
  bestFor: string[];
  presets: VisualFontPreset[];
  compatibilityNote: string;
  capabilities?: VisualCapability[];
}

const system = (name: string) => `${JSON.stringify(name)}, serif`;
const sans = (name: string) => `${JSON.stringify(name)}, Arial, Helvetica, sans-serif`;

const preset = (
  id: string,
  name: string,
  description: string,
  fontFamily: string,
  overrides: Partial<VisualFontPreset> = {},
): VisualFontPreset => ({
  id,
  name,
  description,
  fontFamily,
  sourceLabel: 'Browser/system font stack',
  licenseNote: 'Previewed from fonts available on this device; no commercial font file is distributed.',
  fontWeight: 700,
  fontStyle: 'normal',
  textColor: '#ffffff',
  backgroundColor: '#111827',
  strokeColor: '#000000',
  strokeWidth: 0,
  shadowColor: '#000000',
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  letterSpacing: 0,
  decoration: 'none',
  ...overrides,
});

const bundledPreset = (
  id: string,
  name: string,
  description: string,
  targetFont: string,
  fallback: string,
  overrides: Partial<VisualFontPreset> = {},
): VisualFontPreset => {
  const license = targetFont === 'Luckiest Guy'
    ? 'Apache License 2.0'
    : 'SIL Open Font License 1.1';

  return preset(
    id,
    name,
    description,
    `${JSON.stringify(targetFont)}, ${fallback}`,
    {
      targetFont,
      fontSource: 'bundled',
      sourceLabel: `${targetFont} (bundled open-source alternative)`,
      licenseNote: `${targetFont} is bundled under the ${license}; no proprietary brand font is distributed.`,
      ...overrides,
    },
  );
};

const configs: Record<string, VisualGeneratorConfig> = {
  'times-new-roman-font-generator': {
    engine: 'font-renderer',
    initialText: 'The quick brown fox',
    intentLabel: 'Real typeface preview',
    resultIntro: 'Render text with Times New Roman when it is installed, or compare clearly labelled serif fallbacks. Download the rendered result as PNG or SVG.',
    bestFor: ['Formal headings', 'Document previews', 'Editorial graphics'],
    compatibilityNote: 'PNG preserves the current rendering. SVG keeps editable text and therefore needs the named font on the device where it is opened.',
    capabilities: ['font-specimen'],
    presets: [
      preset('tnr-regular', 'Times New Roman Regular', 'The installed Times New Roman face with a classic editorial treatment.', system('Times New Roman'), { targetFont: 'Times New Roman', fontWeight: 400, textColor: '#171717', backgroundColor: '#f8f4ea' }),
      preset('tnr-bold', 'Times New Roman Bold', 'A heavier system-font rendering for formal headlines.', system('Times New Roman'), { targetFont: 'Times New Roman', fontWeight: 700, textColor: '#111827', backgroundColor: '#ffffff' }),
      preset('tnr-italic', 'Times New Roman Italic', 'The true italic face when the system font is available.', system('Times New Roman'), { targetFont: 'Times New Roman', fontWeight: 400, fontStyle: 'italic', textColor: '#292524', backgroundColor: '#fafaf9' }),
      preset('georgia-alt', 'Georgia Alternative', 'A widely available screen serif, explicitly presented as an alternative.', system('Georgia'), { targetFont: 'Georgia', fontWeight: 400, textColor: '#1c1917', backgroundColor: '#f5f5f4' }),
    ],
  },
  'impact-font-generator': {
    engine: 'font-renderer',
    initialText: 'YOUR MEME HERE',
    intentLabel: 'Headline & meme renderer',
    resultIntro: 'Create heavy Impact-style headlines with real font rendering, editable outlines, shadows, colors, and downloadable artwork.',
    bestFor: ['Meme captions', 'Posters', 'Video thumbnails'],
    compatibilityNote: 'Impact is used when installed. The browser falls back to other heavy sans-serif faces when it is unavailable.',
    capabilities: ['background-image', 'meme-layout'],
    presets: [
      preset('impact-meme', 'Classic Meme', 'White uppercase Impact with a strong black outline.', sans('Impact'), { targetFont: 'Impact', uppercase: true, fontWeight: 900, strokeWidth: 5, backgroundColor: '#475569', letterSpacing: 1 }),
      preset('impact-yellow', 'Poster Yellow', 'A high-energy yellow headline with a deep offset shadow.', sans('Impact'), { targetFont: 'Impact', uppercase: true, fontWeight: 900, textColor: '#fde047', backgroundColor: '#18181b', strokeWidth: 2, shadowOffsetX: 8, shadowOffsetY: 8, letterSpacing: 2 }),
      preset('impact-red', 'Breaking Red', 'Compressed red display text for announcements and thumbnails.', sans('Impact'), { targetFont: 'Impact', uppercase: true, textColor: '#ef4444', backgroundColor: '#fff7ed', strokeColor: '#7f1d1d', strokeWidth: 2 }),
      preset('arial-heavy', 'Heavy Sans Alternative', 'A labelled heavy sans fallback for devices without Impact.', sans('Arial Black'), { targetFont: 'Arial Black', uppercase: true, fontWeight: 900, textColor: '#ffffff', backgroundColor: '#1e3a8a', strokeWidth: 2 }),
    ],
  },
  'papyrus-font-generator': {
    engine: 'font-renderer',
    initialText: 'Ancient Stories',
    intentLabel: 'Papyrus & ancient-style preview',
    resultIntro: 'Preview Papyrus when installed and compare rustic fantasy alternatives on parchment, dark, or transparent-ready backgrounds.',
    bestFor: ['Fantasy titles', 'Invitations', 'Ancient themes'],
    compatibilityNote: 'The original Papyrus face is only used from the visitor’s device. Alternatives are identified instead of being presented as Papyrus.',
    capabilities: ['font-specimen'],
    presets: [
      preset('papyrus-system', 'Papyrus', 'The system Papyrus face when available.', system('Papyrus'), { targetFont: 'Papyrus', fontWeight: 400, textColor: '#4a2c16', backgroundColor: '#ead8aa', shadowColor: '#8b5e34', shadowBlur: 2 }),
      preset('papyrus-dark', 'Papyrus Night', 'A dark fantasy treatment using the installed Papyrus face.', system('Papyrus'), { targetFont: 'Papyrus', fontWeight: 400, textColor: '#f4d06f', backgroundColor: '#1c1917', shadowColor: '#000000', shadowBlur: 8 }),
      preset('fantasy-serif', 'Fantasy Serif Alternative', 'A readable fantasy direction using a broadly available serif stack.', system('Georgia'), { targetFont: 'Georgia', fontStyle: 'italic', textColor: '#713f12', backgroundColor: '#fef3c7', letterSpacing: 2 }),
      preset('ancient-mono', 'Carved Alternative', 'Spaced capitals for a carved inscription direction.', 'Copperplate, "Copperplate Gothic Light", serif', { targetFont: 'Copperplate', uppercase: true, textColor: '#e7e5e4', backgroundColor: '#44403c', letterSpacing: 5 }),
    ],
  },
  'comic-sans-font-generator': {
    engine: 'font-renderer',
    initialText: 'Fun starts here!',
    intentLabel: 'Comic lettering preview',
    resultIntro: 'Render friendly comic lettering with Comic Sans MS when installed, plus clearly labelled casual alternatives and speech-bubble presets.',
    bestFor: ['Speech bubbles', 'Classroom cards', 'Casual graphics'],
    compatibilityNote: 'The exact Comic Sans MS face depends on system availability. PNG downloads preserve the browser’s rendered fallback.',
    capabilities: ['font-specimen'],
    presets: [
      preset('comic-system', 'Comic Sans MS', 'The installed Comic Sans MS face in its familiar friendly style.', sans('Comic Sans MS'), { targetFont: 'Comic Sans MS', fontWeight: 400, textColor: '#1d4ed8', backgroundColor: '#fef9c3' }),
      preset('comic-bold', 'Comic Sans Bold', 'A bold comic caption with a white outline.', sans('Comic Sans MS'), { targetFont: 'Comic Sans MS', fontWeight: 700, textColor: '#ef4444', backgroundColor: '#bfdbfe', strokeColor: '#ffffff', strokeWidth: 3, shadowOffsetX: 4, shadowOffsetY: 4 }),
      preset('speech-bubble', 'Speech Bubble', 'Dark comic lettering in a clean dialogue-card treatment.', sans('Comic Sans MS'), { targetFont: 'Comic Sans MS', fontWeight: 700, textColor: '#18181b', backgroundColor: '#ffffff', strokeWidth: 0, decoration: 'badge' }),
      preset('rounded-alt', 'Rounded Sans Alternative', 'A labelled rounded system-font alternative.', '"Arial Rounded MT Bold", Arial, sans-serif', { targetFont: 'Arial Rounded MT Bold', fontWeight: 700, textColor: '#7c3aed', backgroundColor: '#fae8ff' }),
    ],
  },
  'san-francisco-font-generator': {
    engine: 'font-renderer',
    initialText: 'Designed for clarity',
    intentLabel: 'Apple-style UI preview',
    resultIntro: 'Preview text through the Apple system UI font stack and test app-header, notification, and product-card typography.',
    bestFor: ['UI mockups', 'Product cards', 'App headings'],
    compatibilityNote: 'Apple platforms resolve -apple-system to San Francisco. Other platforms use their native UI sans; SF Pro files are not redistributed.',
    capabilities: ['font-specimen'],
    presets: [
      preset('sf-display', 'SF Display / System UI', 'A large Apple system heading when viewed on an Apple device.', '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', { targetFont: 'SF Pro Display', fontWeight: 700, textColor: '#111827', backgroundColor: '#f8fafc', letterSpacing: -2 }),
      preset('sf-text', 'SF Text / System UI', 'A medium-weight interface label optimized for clarity.', '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', { targetFont: 'SF Pro Text', fontWeight: 500, textColor: '#1f2937', backgroundColor: '#ffffff' }),
      preset('sf-notification', 'Notification', 'Compact white interface text on a translucent dark card.', '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', { targetFont: 'SF Pro Text', fontWeight: 600, textColor: '#ffffff', backgroundColor: '#334155', letterSpacing: -1, decoration: 'badge' }),
      preset('sf-product', 'Product Headline', 'A restrained product-marketing headline.', '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', { targetFont: 'SF Pro Display', fontWeight: 800, textColor: '#030712', backgroundColor: '#e5e7eb', letterSpacing: -3 }),
    ],
  },
  'minecraftia-font-generator': {
    engine: 'font-renderer',
    initialText: 'DIAMOND REALM',
    intentLabel: 'Pixel lettering renderer',
    resultIntro: 'Create crisp pixel-style titles at integer-like sizes with block shadows, game palettes, and downloadable artwork.',
    bestFor: ['Server names', 'Pixel signs', 'Achievement cards'],
    compatibilityNote: 'Minecraftia is used only if already installed. The fallback is a labelled monospace pixel direction, not the official game font.',
    capabilities: ['font-specimen', 'pixel-snap'],
    presets: [
      preset('minecraftia-system', 'Minecraftia (installed)', 'Uses Minecraftia from the device when available.', 'Minecraftia, "Courier New", monospace', { targetFont: 'Minecraftia', uppercase: true, fontWeight: 400, textColor: '#f8fafc', backgroundColor: '#334155', shadowColor: '#111827', shadowOffsetX: 6, shadowOffsetY: 6, letterSpacing: 2, decoration: 'pixel' }),
      preset('pixel-grass', 'Grass Block', 'Green pixel lettering with a dark block shadow.', 'Minecraftia, "Courier New", monospace', { targetFont: 'Minecraftia', uppercase: true, textColor: '#86efac', backgroundColor: '#3f3f2f', strokeColor: '#14532d', strokeWidth: 2, shadowOffsetX: 6, shadowOffsetY: 6, decoration: 'pixel' }),
      preset('pixel-diamond', 'Diamond', 'Cyan game lettering for realm and achievement titles.', 'Minecraftia, "Courier New", monospace', { targetFont: 'Minecraftia', uppercase: true, textColor: '#67e8f9', backgroundColor: '#164e63', strokeColor: '#083344', strokeWidth: 2, shadowOffsetX: 5, shadowOffsetY: 5, decoration: 'pixel' }),
      preset('pixel-mono', 'Pixel Mono Alternative', 'A labelled monospace fallback with hard-edged rendering.', '"Courier New", monospace', { targetFont: 'Courier New', uppercase: true, textColor: '#facc15', backgroundColor: '#1c1917', fontWeight: 700, letterSpacing: 3, decoration: 'pixel' }),
    ],
  },
  'metallica-font-generator': {
    engine: 'theme-renderer',
    initialText: 'HEAVY METAL',
    intentLabel: 'Unofficial metal title designer',
    resultIntro: 'Build original heavy-metal lettering with sharp blackletter, metallic gradients, outlines, and album-cover treatments—without copying the official logo.',
    bestFor: ['Band concepts', 'Album mockups', 'Metal posters'],
    compatibilityNote: 'These are generic, unofficial heavy-metal treatments. They do not reproduce the Metallica wordmark or imply endorsement.',
    presets: [
      preset('metal-silver', 'Silver Metal', 'Sharp blackletter with a cold metallic gradient.', system('Copperplate'), { uppercase: true, textColor: '#e5e7eb', backgroundColor: '#09090b', gradient: ['#ffffff', '#71717a'], strokeColor: '#18181b', strokeWidth: 2, shadowColor: '#ef4444', shadowBlur: 12, letterSpacing: 3 }),
      preset('metal-red', 'Thrash Red', 'Aggressive condensed lettering with red glow.', sans('Impact'), { targetFont: 'Impact', uppercase: true, textColor: '#ef4444', backgroundColor: '#09090b', strokeColor: '#7f1d1d', strokeWidth: 2, shadowColor: '#dc2626', shadowBlur: 18, letterSpacing: 4 }),
      preset('metal-gothic', 'Gothic Steel', 'Historic blackletter energy in a steel palette.', 'UnifrakturCook, "Old English Text MT", serif', { targetFont: 'Old English Text MT', textColor: '#d4d4d8', backgroundColor: '#18181b', strokeColor: '#000000', strokeWidth: 2, shadowOffsetX: 5, shadowOffsetY: 5 }),
      preset('metal-fire', 'Molten', 'A hot metal gradient for posters and cover concepts.', sans('Impact'), { targetFont: 'Impact', uppercase: true, gradient: ['#fef08a', '#dc2626'], textColor: '#f97316', backgroundColor: '#1c0a00', strokeColor: '#450a0a', strokeWidth: 3, shadowColor: '#f97316', shadowBlur: 16, letterSpacing: 2 }),
    ],
  },
  'brat-text-generator': {
    engine: 'theme-renderer',
    initialText: 'brat',
    intentLabel: 'Brat-style artwork and copyable text',
    resultIntro: 'Create a compressed lime-and-black title graphic, then use the copyable styles below when you need text rather than an image.',
    bestFor: ['Profile graphics', 'Party posts', 'Square cover art'],
    compatibilityNote: 'Anton is a bundled open-source condensed display face. This tool creates original brat-inspired artwork and does not distribute proprietary album assets.',
    presets: [
      bundledPreset('brat-lime', 'Lime Square', 'Compressed black lowercase lettering on the recognizable high-energy lime field.', 'Anton', 'Impact, sans-serif', { fontWeight: 400, textColor: '#111111', backgroundColor: '#8ace00', letterSpacing: -3 }),
      bundledPreset('brat-black', 'Night Club', 'Acid-lime condensed lettering on black.', 'Anton', 'Impact, sans-serif', { fontWeight: 400, textColor: '#a3ff12', backgroundColor: '#050505', letterSpacing: -2 }),
      bundledPreset('brat-white', 'Flash White', 'Minimal black condensed title on a hard white field.', 'Anton', 'Impact, sans-serif', { fontWeight: 400, textColor: '#111111', backgroundColor: '#ffffff', letterSpacing: -3 }),
      bundledPreset('brat-pink', 'After Party', 'Hot-pink club variation with a deep offset shadow.', 'Anton', 'Impact, sans-serif', { fontWeight: 400, textColor: '#111111', backgroundColor: '#f472b6', shadowOffsetX: 6, shadowOffsetY: 8, letterSpacing: -2 }),
    ],
  },
  'fire-font-generator': {
    engine: 'theme-renderer',
    initialText: 'BURN BRIGHT',
    intentLabel: 'Flame title artwork and copyable text',
    resultIntro: 'Create hot gradient title artwork with flame accents, outlines, glow, and transparent export.',
    bestFor: ['Gaming thumbnails', 'Event titles', 'Hot-sale graphics'],
    compatibilityNote: 'The artwork uses bundled open-source display fonts and original flame effects. Emoji rendering is not required in exported artwork.',
    presets: [
      bundledPreset('fire-inferno', 'Inferno', 'Yellow-to-red title lettering with glow and flame accents.', 'Anton', 'Impact, sans-serif', { uppercase: true, gradient: ['#fef08a', '#dc2626'], textColor: '#f97316', backgroundColor: '#180300', strokeColor: '#7f1d1d', strokeWidth: 3, shadowColor: '#fb923c', shadowBlur: 20, decoration: 'flames' }),
      bundledPreset('fire-blue', 'Blue Flame', 'White-hot cyan lettering on a deep navy field.', 'Anton', 'Impact, sans-serif', { uppercase: true, gradient: ['#ffffff', '#22d3ee'], textColor: '#22d3ee', backgroundColor: '#020617', strokeColor: '#075985', strokeWidth: 3, shadowColor: '#38bdf8', shadowBlur: 22, decoration: 'flames' }),
      bundledPreset('fire-ember', 'Ember', 'Glowing orange title with a heavy charcoal outline.', 'Anton', 'Impact, sans-serif', { uppercase: true, textColor: '#fb923c', backgroundColor: '#18181b', strokeColor: '#431407', strokeWidth: 4, shadowColor: '#f97316', shadowBlur: 16, decoration: 'flames' }),
    ],
  },
  'glitter-font-generator': {
    engine: 'theme-renderer',
    initialText: 'Shine On',
    intentLabel: 'Glitter artwork and copyable sparkle text',
    resultIntro: 'Create sparkling script artwork with gradients, glow, star highlights, and transparent downloads.',
    bestFor: ['Invitations', 'Profile graphics', 'Celebration posts'],
    compatibilityNote: 'Berkshire Swash is bundled under the SIL Open Font License. Sparkles are original vector decorations rather than a proprietary asset.',
    presets: [
      bundledPreset('glitter-pink', 'Pink Glitter', 'Pink-to-white script with a bright glow and scattered highlights.', 'Berkshire Swash', 'Georgia, cursive', { fontWeight: 400, gradient: ['#ffffff', '#ec4899'], textColor: '#f9a8d4', backgroundColor: '#4a044e', strokeColor: '#831843', strokeWidth: 2, shadowColor: '#f0abfc', shadowBlur: 20, decoration: 'sparkles' }),
      bundledPreset('glitter-gold', 'Gold Glitter', 'Warm gold script for celebrations and invitations.', 'Berkshire Swash', 'Georgia, cursive', { fontWeight: 400, gradient: ['#fff7ae', '#d97706'], textColor: '#fbbf24', backgroundColor: '#422006', strokeColor: '#92400e', strokeWidth: 1, shadowColor: '#fde68a', shadowBlur: 16, decoration: 'sparkles' }),
      bundledPreset('glitter-silver', 'Silver Glitter', 'Cool silver lettering on a midnight field.', 'Berkshire Swash', 'Georgia, cursive', { fontWeight: 400, gradient: ['#ffffff', '#94a3b8'], textColor: '#e2e8f0', backgroundColor: '#0f172a', shadowColor: '#cbd5e1', shadowBlur: 18, decoration: 'sparkles' }),
    ],
  },
  'ransom-note-font-generator': {
    engine: 'theme-renderer',
    initialText: 'SECRET MESSAGE',
    intentLabel: 'Cutout artwork and copyable mixed text',
    resultIntro: 'Create deliberately mismatched cutout-style lettering with alternating typefaces, paper tiles, colors, and rotation.',
    bestFor: ['Escape rooms', 'Halloween props', 'Party graphics'],
    compatibilityNote: 'This is a fictional craft effect for creative projects. It uses system and bundled open-source fonts; no magazine artwork is distributed.',
    presets: [
      preset('ransom-paper', 'Magazine Cutouts', 'Alternating letterforms on mismatched paper tiles.', 'Arial Black, sans-serif', { uppercase: true, textColor: '#111827', backgroundColor: '#d6d3d1', strokeWidth: 0, letterSpacing: 7, decoration: 'ransom', fontAlternates: ['Arial Black, sans-serif', 'Georgia, serif', 'Courier New, monospace', 'Impact, sans-serif'], characterBackgrounds: ['#fef3c7', '#ffffff', '#fecdd3', '#bfdbfe', '#dcfce7'], characterTilt: 5 }),
      preset('ransom-noir', 'Noir Cutouts', 'Black, white, and red paper fragments on charcoal.', 'Arial Black, sans-serif', { uppercase: true, textColor: '#ffffff', backgroundColor: '#18181b', letterSpacing: 8, decoration: 'ransom', fontAlternates: ['Impact, sans-serif', 'Georgia, serif', 'Courier New, monospace'], characterBackgrounds: ['#ffffff', '#111111', '#dc2626'], characterTilt: 7 }),
      preset('ransom-party', 'Party Cutouts', 'Bright playful cutouts for fictional clues and party props.', 'Arial Black, sans-serif', { uppercase: true, textColor: '#111827', backgroundColor: '#f5f5f4', letterSpacing: 7, decoration: 'ransom', fontAlternates: ['Arial Black, sans-serif', 'Georgia, serif', 'Courier New, monospace'], characterBackgrounds: ['#fde047', '#f9a8d4', '#67e8f9', '#86efac', '#c4b5fd'], characterTilt: 6 }),
    ],
  },
  'disney-font-generator': {
    engine: 'theme-renderer',
    initialText: 'Once Upon a Time',
    intentLabel: 'Unofficial magical title designer',
    resultIntro: 'Create storybook, royal, cartoon, and magical-script artwork with colors, sparkles, and downloadable PNG or SVG.',
    bestFor: ['Invitations', 'Story titles', 'Party graphics'],
    compatibilityNote: 'The bundled Berkshire Swash face is an open-source storybook alternative, not Waltograph or an official Disney font or logo.',
    presets: [
      bundledPreset('magic-script', 'Magical Swash', 'A flowing storybook display face with a soft violet glow and sparkles.', 'Berkshire Swash', 'Georgia, cursive', { fontWeight: 400, textColor: '#f5d0fe', backgroundColor: '#312e81', shadowColor: '#c084fc', shadowBlur: 14, decoration: 'sparkles' }),
      bundledPreset('royal-story', 'Royal Storybook', 'Gold swash lettering with a restrained royal frame.', 'Berkshire Swash', 'Georgia, cursive', { fontWeight: 400, textColor: '#fde68a', backgroundColor: '#172554', strokeColor: '#92400e', strokeWidth: 1, letterSpacing: 2, decoration: 'lines' }),
      bundledPreset('fairy-pink', 'Fairy Tale', 'Playful pink storybook lettering for invitations and party graphics.', 'Berkshire Swash', 'Georgia, cursive', { fontWeight: 400, textColor: '#ffffff', backgroundColor: '#db2777', strokeColor: '#831843', strokeWidth: 2, shadowColor: '#fbcfe8', shadowBlur: 10, decoration: 'sparkles' }),
      bundledPreset('storybook', 'Classic Storybook', 'Warm illustrated-book typography with gentle contrast.', 'Berkshire Swash', 'Georgia, cursive', { fontWeight: 400, textColor: '#78350f', backgroundColor: '#fef3c7', letterSpacing: 1 }),
    ],
  },
  'mario-font-generator': {
    engine: 'theme-renderer',
    initialText: 'SUPER PARTY',
    intentLabel: 'Unofficial colorful game text',
    resultIntro: 'Design rounded, colorful game titles with per-letter color, strong outlines, and playful dimensional shadows.',
    bestFor: ['Party banners', 'Game thumbnails', 'Fan graphics'],
    compatibilityNote: 'The bundled Luckiest Guy face is an open-source cartoon-display alternative. No Nintendo logo, Super Mario 256 file, character art, or official font asset is included.',
    presets: [
      bundledPreset('mario-rainbow', 'Rainbow Game Title', 'Chunky cartoon letters receive rotating arcade colors, a white outline, and a dimensional shadow.', 'Luckiest Guy', 'Arial Black, sans-serif', { uppercase: true, fontWeight: 400, textColor: '#ef4444', backgroundColor: '#7dd3fc', strokeColor: '#ffffff', strokeWidth: 5, shadowColor: '#1e3a8a', shadowOffsetX: 7, shadowOffsetY: 8, multicolor: true }),
      bundledPreset('mario-red', 'Red Hero', 'Bright red cartoon-display lettering with a dimensional navy shadow.', 'Luckiest Guy', 'Arial Black, sans-serif', { uppercase: true, fontWeight: 400, textColor: '#ef4444', backgroundColor: '#fef3c7', strokeColor: '#ffffff', strokeWidth: 4, shadowColor: '#1e3a8a', shadowOffsetX: 7, shadowOffsetY: 7 }),
      bundledPreset('mario-green', 'Green World', 'Green chunky game lettering on a sunny sky background.', 'Luckiest Guy', 'Arial Black, sans-serif', { uppercase: true, fontWeight: 400, textColor: '#22c55e', backgroundColor: '#bae6fd', strokeColor: '#ffffff', strokeWidth: 4, shadowColor: '#166534', shadowOffsetX: 6, shadowOffsetY: 6 }),
      bundledPreset('mario-coin', 'Coin Rush', 'Gold cartoon-display lettering with a warm orange outline.', 'Luckiest Guy', 'Arial Black, sans-serif', { uppercase: true, fontWeight: 400, gradient: ['#fef08a', '#eab308'], textColor: '#facc15', backgroundColor: '#0c4a6e', strokeColor: '#a16207', strokeWidth: 3, shadowOffsetX: 5, shadowOffsetY: 5 }),
    ],
  },
  'stranger-things-font-generator': {
    engine: 'theme-renderer',
    initialText: 'THE OTHER SIDE',
    intentLabel: 'Unofficial 80s horror title',
    resultIntro: 'Create high-contrast 80s horror titles with red outlines, wide tracking, glow, and cinematic line decoration.',
    bestFor: ['Horror posters', '80s parties', 'Fan titles'],
    compatibilityNote: 'The bundled EB Garamond face is an open-source high-contrast serif alternative to the commercial ITC Benguiat family, not the official title artwork or font.',
    presets: [
      bundledPreset('st-classic', 'Red Outline Horror', 'High-contrast serif capitals with red outline, glow, tracking, and title lines.', 'EB Garamond', 'Georgia, serif', { uppercase: true, fontWeight: 700, textColor: '#09090b', backgroundColor: '#020617', strokeColor: '#ef4444', strokeWidth: 3, shadowColor: '#dc2626', shadowBlur: 18, letterSpacing: 8, decoration: 'lines' }),
      bundledPreset('st-solid', 'Solid Crimson', 'Solid crimson high-contrast serif lettering for legibility.', 'EB Garamond', 'Georgia, serif', { uppercase: true, fontWeight: 700, textColor: '#dc2626', backgroundColor: '#09090b', shadowColor: '#991b1b', shadowBlur: 12, letterSpacing: 6, decoration: 'lines' }),
      bundledPreset('st-neon', 'Neon 1984', 'A brighter neon-red variation for event graphics.', 'EB Garamond', 'Georgia, serif', { uppercase: true, fontWeight: 700, textColor: '#fecaca', backgroundColor: '#170407', strokeColor: '#ef4444', strokeWidth: 2, shadowColor: '#ef4444', shadowBlur: 22, letterSpacing: 9, decoration: 'lines' }),
      bundledPreset('st-paper', 'Paperback Horror', 'Dark red 1980s paperback-style typography on aged cream.', 'EB Garamond', 'Georgia, serif', { uppercase: true, fontWeight: 700, textColor: '#7f1d1d', backgroundColor: '#fef3c7', letterSpacing: 5, decoration: 'lines' }),
    ],
  },
  'minecraft-font-generator': {
    engine: 'minecraft-renderer',
    initialText: 'CREEPER CLUB',
    intentLabel: 'Unofficial block game title designer',
    resultIntro: 'Create crisp pixel Game Text with 16 selectable colors and inline § or & formatting codes, or build a textured Block Logo with adjustable outline and 3D depth.',
    bestFor: ['Signs and MOTDs', 'Server banners', 'Fan thumbnails'],
    compatibilityNote: 'Game Text uses an original bitmap alphabet; Block Logo uses the bundled Pixelify Sans face and procedural textures. No Minecraft font sheet, logo, block texture, or official game asset is included.',
    capabilities: ['game-codes', 'inline-format-codes', 'material-textures', 'extrusion-depth', 'pixel-snap'],
    presets: [
      bundledPreset('mc-grass', 'Grass & Dirt', 'Grass and dirt pixels are clipped inside every glyph, with a deep earthy extrusion.', 'Pixelify Sans', 'monospace', { material: 'grass', uppercase: true, fontWeight: 700, textColor: '#84cc16', backgroundColor: '#713f12', strokeColor: '#1a2e05', strokeWidth: 7, decoration: 'pixel' }),
      bundledPreset('mc-stone', 'Stone & Cobble', 'Mottled stone pixels and crack lines fill the letters instead of changing only the background.', 'Pixelify Sans', 'monospace', { material: 'stone', uppercase: true, fontWeight: 700, textColor: '#a8a29e', backgroundColor: '#292524', strokeColor: '#1c1917', strokeWidth: 7, decoration: 'pixel' }),
      bundledPreset('mc-diamond', 'Diamond Block', 'Cyan facets and mineral highlights are rendered inside the glyph mask.', 'Pixelify Sans', 'monospace', { material: 'diamond', uppercase: true, fontWeight: 700, textColor: '#22d3ee', backgroundColor: '#083344', strokeColor: '#083344', strokeWidth: 7, decoration: 'pixel' }),
      bundledPreset('mc-nether', 'Nether & Lava', 'Dark netherrack pixels and glowing lava seams create a distinct internal material.', 'Pixelify Sans', 'monospace', { material: 'nether', uppercase: true, fontWeight: 700, textColor: '#ef4444', backgroundColor: '#1c0707', strokeColor: '#1c0707', strokeWidth: 7, decoration: 'pixel' }),
    ],
  },
  'fortnite-font-generator': {
    engine: 'theme-renderer',
    initialText: 'VICTORY SQUAD',
    intentLabel: 'Unofficial battle-game title designer',
    resultIntro: 'Create bold, condensed-feeling squad names, stream titles, and party graphics with outlines and high-energy color presets.',
    bestFor: ['Squad names', 'Stream thumbnails', 'Party invites'],
    compatibilityNote: 'The bundled Anton face is an open-source condensed-display alternative to the commercial Burbank family. It does not contain Epic Games branding or official assets.',
    capabilities: ['copyable-name'],
    presets: [
      bundledPreset('fn-victory', 'Victory Royale', 'White condensed capitals with a navy outline on victory blue.', 'Anton', 'Impact, sans-serif', { uppercase: true, fontWeight: 400, textColor: '#ffffff', backgroundColor: '#2563eb', strokeColor: '#172554', strokeWidth: 5, shadowColor: '#0f172a', shadowOffsetX: 8, shadowOffsetY: 8, letterSpacing: 2 }),
      bundledPreset('fn-yellow', 'Battle Yellow', 'Yellow condensed title on a purple action background.', 'Anton', 'Impact, sans-serif', { uppercase: true, fontWeight: 400, textColor: '#fde047', backgroundColor: '#6d28d9', strokeColor: '#312e81', strokeWidth: 4, shadowOffsetX: 7, shadowOffsetY: 7, letterSpacing: 2 }),
      bundledPreset('fn-neon', 'Neon Squad', 'Electric condensed cyan and pink artwork for stream overlays.', 'Anton', 'Impact, sans-serif', { uppercase: true, fontWeight: 400, gradient: ['#67e8f9', '#f472b6'], textColor: '#67e8f9', backgroundColor: '#18181b', strokeColor: '#ffffff', strokeWidth: 2, shadowColor: '#ec4899', shadowBlur: 18 }),
      bundledPreset('fn-stealth', 'Stealth', 'Compact white squad lettering on tactical charcoal.', 'Anton', 'Impact, sans-serif', { uppercase: true, fontWeight: 400, textColor: '#f8fafc', backgroundColor: '#27272a', strokeColor: '#000000', strokeWidth: 3, letterSpacing: 4 }),
    ],
  },
  'pop-culture-font-generators': {
    engine: 'theme-renderer',
    initialText: 'FAN FAVORITE',
    intentLabel: 'Multi-theme title studio',
    resultIntro: 'Compare one phrase across storybook, arcade, block game, 80s horror, superhero, and sci-fi title directions.',
    bestFor: ['Theme comparison', 'Fan graphics', 'Event concepts'],
    compatibilityNote: 'The storybook, arcade, pixel, horror, and condensed-display directions use bundled open-source fonts. Referenced genres and brands remain the property of their owners.',
    presets: [
      bundledPreset('pop-story', 'Storybook Magic', 'A sparkling storybook swash direction.', 'Berkshire Swash', 'Georgia, cursive', { fontWeight: 400, textColor: '#f5d0fe', backgroundColor: '#312e81', shadowColor: '#c084fc', shadowBlur: 14, decoration: 'sparkles' }),
      bundledPreset('pop-arcade', 'Color Arcade', 'Bright per-letter cartoon arcade title styling.', 'Luckiest Guy', 'Arial Black, sans-serif', { uppercase: true, fontWeight: 400, multicolor: true, textColor: '#ef4444', backgroundColor: '#0c4a6e', strokeColor: '#ffffff', strokeWidth: 4, shadowOffsetX: 6, shadowOffsetY: 6 }),
      bundledPreset('pop-block', 'Block Builder', 'Pixel lettering for sandbox-game themes.', 'Pixelify Sans', 'monospace', { uppercase: true, fontWeight: 700, textColor: '#84cc16', backgroundColor: '#713f12', strokeColor: '#365314', strokeWidth: 3, shadowOffsetX: 7, shadowOffsetY: 7, decoration: 'pixel' }),
      bundledPreset('pop-horror', '80s Horror', 'Red glowing high-contrast serif capitals with cinematic lines.', 'EB Garamond', 'Georgia, serif', { uppercase: true, fontWeight: 700, textColor: '#09090b', backgroundColor: '#020617', strokeColor: '#ef4444', strokeWidth: 3, shadowColor: '#dc2626', shadowBlur: 18, letterSpacing: 7, decoration: 'lines' }),
      bundledPreset('pop-hero', 'Superhero', 'Bold condensed yellow text with a dramatic red shadow.', 'Anton', 'Impact, sans-serif', { uppercase: true, fontWeight: 400, textColor: '#fde047', backgroundColor: '#1e3a8a', strokeColor: '#dc2626', strokeWidth: 4, shadowOffsetX: 8, shadowOffsetY: 8 }),
      bundledPreset('pop-scifi', 'Sci-Fi Signal', 'Wide cyan condensed lettering with a neon glow.', 'Anton', 'Arial Narrow, sans-serif', { uppercase: true, fontWeight: 400, textColor: '#67e8f9', backgroundColor: '#082f49', shadowColor: '#22d3ee', shadowBlur: 16, letterSpacing: 8, decoration: 'lines' }),
    ],
  },
};

export const validateVisualGeneratorConfigs = (definitions: Record<string, VisualGeneratorConfig> = configs) => {
  const issues: string[] = [];
  Object.entries(definitions).forEach(([slug, config]) => {
    if (!config.presets.length) issues.push(`${slug} has no visual presets.`);
    const presetIds = new Set<string>();
    config.presets.forEach((item) => {
      if (presetIds.has(item.id)) issues.push(`${slug} has duplicate preset id ${item.id}.`);
      presetIds.add(item.id);
    });
    const capabilities = config.capabilities ?? [];
    if (new Set(capabilities).size !== capabilities.length) issues.push(`${slug} has duplicate capabilities.`);
  });
  return issues;
};

const visualConfigIssues = validateVisualGeneratorConfigs();
if (visualConfigIssues.length) {
  throw new Error(`Invalid visual generator configuration:\n${visualConfigIssues.join('\n')}`);
}

export const getVisualGeneratorConfig = (slug: string) => configs[slug];

export const isVisualGeneratorSlug = (slug: string) => Boolean(configs[slug]);

export const getSpecializedDescription = (slug: string): string | null => {
  if (slug === 'big-font-generator') {
    return 'Generate genuinely large multi-line ASCII art in six banner styles, then copy it or download TXT, PNG, and SVG files.';
  }
  return configs[slug]?.resultIntro ?? null;
};

export const getSpecializedAbout = (slug: string, pageTitle: string): string[] | null => {
  if (slug === 'big-font-generator') {
    return [
      'This Big Font Generator turns ordinary letters into genuinely oversized, multi-line ASCII art. Each output is built from text characters arranged into a seven-row banner, so the result can be copied into terminals, code blocks, forum posts, chat messages, and plain-text files.',
      'Six rendering modes cover solid blocks, outlined hash marks, bracket banners, dot matrix letters, shadows, and slanted text. The downloadable PNG and SVG versions preserve the layout for places where a large plain-text banner would wrap or lose its monospace alignment.',
      'This page also keeps text and background color controls, alignment, transparent export, and TXT download together in one workflow. It is a real large-text generator rather than a normal-size Unicode alphabet described as “big.”',
    ];
  }
  if (slug === 'minecraft-font-generator') {
    return [
      'The Minecraft Font Generator separates two different jobs that are often mixed together. Game Text creates compact pixel UI lettering for signs, server MOTDs, chat-style graphics, and overlays. Block Logo creates larger textured title artwork for thumbnails and banners. Switching modes changes the renderer, not just the background color.',
      'Game Text draws an original variable-width 5×7 bitmap alphabet directly onto the output pixel grid, so there is no browser font-smoothing step. Every input line stays on one line and scales down to fit the preview; only a manual line break adds another output line.',
      'The labelled palette below the preview contains all 16 standard Minecraft color values. Clicking a card changes the base color, while inline § or & codes can override that base color for individual words and can also apply bold, italic, underline, strikethrough, obfuscated, or reset formatting. Code support varies by edition, server, plugin, command, and input field, so test copied code text in its final destination.',
      'Block Logo clips procedural grass and dirt, mottled stone, diamond facets, or nether-and-lava patterns inside the letter shapes. Every manual line break is preserved, while outline width and extrusion depth remain independent. PNG and faithful SVG preserve the finished canvas; the SVG embeds the exact rendering rather than editable text. Pixelify Sans is a bundled open-source alternative, and no official font sheet, logo, block texture, or other Mojang/Microsoft asset is distributed.',
    ];
  }
  const config = configs[slug];
  if (!config) return null;
  const presetNames = config.presets.map((item) => item.name).join(', ');
  const bundledFonts = Array.from(new Set(
    config.presets
      .filter((item) => item.fontSource === 'bundled' && item.targetFont)
      .map((item) => item.targetFont),
  )).join(', ');
  const fontAvailabilityCopy = bundledFonts
    ? `The primary faces (${bundledFonts}) are bundled open-source alternatives, so the same lettering loads for every visitor instead of silently falling back to Arial, Times New Roman, or Courier New. Proprietary brand fonts and logo assets are not distributed.`
    : 'When a named commercial or system font is already installed on the visitor’s device, the preview can use it without distributing the font software. When it is not available, the generator reports that state and renders a clearly labelled fallback direction instead of claiming the fallback is the original typeface.';
  const workflowDetails = [
    config.capabilities?.includes('background-image') ? 'You can add a local image and place the first and final text lines in the familiar top-and-bottom meme layout.' : '',
    config.capabilities?.includes('game-codes') ? 'A separate Minecraft formatting-code result is provided for compatible game fields; the canvas artwork itself is an image and cannot be pasted into the game as formatted text.' : '',
    config.capabilities?.includes('copyable-name') ? 'A separate Unicode player-name alternative is available to copy, with a compatibility warning because game name rules vary.' : '',
    ['brat-text-generator', 'fire-font-generator', 'glitter-font-generator', 'ransom-note-font-generator'].includes(slug) ? 'The page also retains a clearly labelled copyable Unicode section for destinations that accept text but not images.' : '',
  ].filter(Boolean).join(' ');
  return [
    `The ${pageTitle} now renders ordinary text as visual artwork instead of substituting unrelated Unicode symbols. Its presets—${presetNames}—use real browser font rendering, page-specific colors, outlines, shadows, spacing, and decoration.`,
    fontAvailabilityCopy,
    `You can adjust font size, letter spacing, outline, shadow, colors, canvas format, and transparency. PNG export fixes the browser-rendered appearance into pixels; editable SVG preserves selectable text, while faithful SVG embeds the exact canvas. ${workflowDetails} ${config.compatibilityNote}`,
  ];
};

export const getSpecializedFaq = (slug: string, pageTitle: string) => {
  if (slug === 'big-font-generator') {
    return [
      { q: 'Is the generated big text really larger than normal text?', a: 'Yes. The copied result is multi-line ASCII art built from block characters, rather than normal-size letters swapped for bold Unicode symbols.' },
      { q: 'Why can ASCII art lose its shape after pasting?', a: 'ASCII banners need a monospace font and preserved spaces. Use a code block or download PNG/SVG when the destination collapses spaces or uses proportional fonts.' },
      { q: 'Which download should I choose?', a: 'TXT is best for reusable plain text, PNG for consistent sharing, and SVG for scalable graphics and further editing.' },
    ];
  }
  if (slug === 'minecraft-font-generator') {
    return [
      { q: 'What is the difference between Game Text and Block Logo?', a: 'Game Text is for compact pixel interface lettering, 16 selectable colors, inline formatting codes, signs, MOTDs, and transparent overlays. Block Logo is decorative artwork with procedural material inside each glyph, an adjustable outline, and 3D extrusion.' },
      { q: 'How do the color cards and inline codes work together?', a: 'A color card sets the base color for text without an inline color code. Add a § or & code before a word to override that base color from that point onward, and use §r or &r to reset subsequent text to the selected base color.' },
      { q: 'Does Game Text use Minecraft’s official bitmap font sheet?', a: 'No. It uses an original 5×7 bitmap alphabet drawn directly as solid pixel cells. This keeps the result sharp without redistributing a proprietary game asset.' },
      { q: 'Why do Grass, Stone, Diamond, and Nether now look different?', a: 'Each material is procedurally rendered and clipped by the text mask. Grass has a green cap and dirt pixels, Stone adds mottling and cracks, Diamond uses cyan facets, and Nether uses dark rock with lava seams.' },
      { q: 'Will formatting codes work everywhere in Minecraft?', a: 'Not necessarily. Java, Bedrock, servers, plugins, MOTDs, signs, commands, and chat fields can apply different rules. The preview parses common § and & codes, but you should test the copied result in the exact target field.' },
    ];
  }
  const config = configs[slug];
  if (!config) return null;
  const isTypeface = config.engine === 'font-renderer';
  const usesBundledFonts = config.presets.some((item) => item.fontSource === 'bundled');
  const faq = [
    {
      q: `Does this ${pageTitle} use a real rendered font?`,
      a: isTypeface
        ? 'Yes. It uses the named font when that font is installed on your device and reports when a labelled fallback is being rendered. It does not replace letters with mathematical Unicode alphabets.'
        : usesBundledFonts
          ? 'Yes. It renders ordinary text with bundled open-source display fonts and applies original theme effects on a canvas. It does not claim to reproduce an official brand logo or proprietary typeface.'
          : 'Yes. It renders ordinary text through real browser font stacks and applies original theme effects on a canvas. It does not claim to reproduce an official brand logo or proprietary artwork.',
    },
    { q: 'Why might the font look different on another device?', a: usesBundledFonts ? 'The live preview and PNG use the bundled font consistently. Editable SVG text may still fall back unless the same open-source font is installed in the app or device that opens it.' : 'Commercial and system fonts are not installed everywhere. PNG preserves what this browser rendered; editable SVG text can fall back to a different font on another device.' },
    { q: 'Can I use the downloaded design commercially?', a: 'The generator does not grant rights to trademarks or commercial fonts. Check the chosen font and brand usage rights for the final project, particularly for merchandise, advertising, and logos.' },
  ];
  if (config.capabilities?.includes('background-image')) {
    faq.splice(1, 0, { q: 'Is my uploaded meme image sent to a server?', a: 'No. The browser reads the selected file locally and composites it on the canvas without uploading it through this generator.' });
  }
  if (config.capabilities?.includes('game-codes')) {
    faq.splice(1, 0, { q: 'Can I paste the rendered artwork into Minecraft?', a: 'No. PNG and SVG are image outputs. Use the separately labelled formatting-code result only in Minecraft editions, servers, commands, or fields that support those section-sign codes.' });
  }
  if (config.capabilities?.includes('copyable-name')) {
    faq.splice(1, 0, { q: 'Will the copyable alternative work as a Fortnite display name?', a: 'It is a Unicode lookalike, not a Fortnite font or guaranteed name format. Epic’s allowed-character rules can change, so test the result and keep a plain-text fallback.' });
  }
  return faq;
};

export const getSpecializedHowTo = (slug: string): string | null => {
  if (slug === 'big-font-generator') {
    return 'Enter one to three short lines, choose an ASCII banner style, and set the alignment and colors. Copy the plain-text result for monospace destinations, or download TXT, PNG, or SVG for a portable layout.';
  }
  if (slug === 'minecraft-font-generator') {
    return 'Choose Game Text for compact pixel lettering, select one of the 16 base colors, and add § or & codes when individual words need different colors or formatting. Adjust scale, shadow, spacing, and alignment, then copy the formatting-code text for a compatible field or export the exact artwork as PNG or faithful SVG. Switch to Block Logo for grass, stone, diamond, or nether material with adjustable outline and 3D depth.';
  }
  const config = configs[slug];
  if (!config) return null;
  if (config.capabilities?.includes('background-image')) {
    return 'Enter the top caption on the first line and the bottom caption on the final line. Add an image from your device, select a high-contrast preset, adjust the outline, and download PNG or faithful SVG to preserve the exact meme layout.';
  }
  if (config.capabilities?.includes('game-codes')) {
    return 'Enter a server or build title, choose a pixel-art preset, and export the image for banners or thumbnails. Use the separate color and bold controls only when you need a copyable Minecraft formatting code for a compatible field.';
  }
  if (config.capabilities?.includes('copyable-name')) {
    return 'Enter a squad or stream title and customize the rendered artwork for download. If you need text rather than an image, copy the separately labelled Unicode player-name alternative and test whether the target field accepts it.';
  }
  if (['brat-text-generator', 'fire-font-generator', 'glitter-font-generator', 'ransom-note-font-generator'].includes(slug)) {
    return 'Create the page-specific artwork first, then download PNG, editable SVG, or faithful SVG. Use the copyable-text section below the canvas only when the destination accepts Unicode text instead of an image.';
  }
  return 'Enter a short title, choose a page-specific preset, and adjust font size, spacing, outline, shadow, colors, canvas format, and transparency. Download PNG to preserve the exact rendered appearance or SVG when you need editable text.';
};

export const getSpecializedFeatureList = (slug: string): string[] | null => {
  if (slug === 'big-font-generator') {
    return ['ASCII art generation', 'Multiple banner styles', 'Copy text', 'TXT download', 'PNG download', 'SVG download'];
  }
  if (slug === 'minecraft-font-generator') {
    return ['Game Text and Block Logo modes', 'Variable measured glyph widths', '16 labelled Minecraft color codes', 'Inline § and & color and style formatting', 'Nearest-neighbor pixel scaling', 'Procedural material inside glyphs', 'Adjustable outline and 3D extrusion', 'Transparent PNG download', 'Faithful SVG download'];
  }
  const config = configs[slug];
  if (!config) return null;
  const features = [
    `${config.presets.length} rendered presets`,
    'Font size and letter spacing controls',
    'Text and background colors',
    'Outline and shadow controls',
    'Transparent PNG download',
    'Editable SVG download',
    'Faithful SVG download',
  ];
  if (config.capabilities?.includes('background-image')) features.splice(1, 0, 'Local background image upload', 'Top-and-bottom meme layout');
  if (config.capabilities?.includes('font-specimen')) features.splice(1, 0, 'Typeface availability and specimen');
  if (config.capabilities?.includes('game-codes')) features.splice(1, 0, 'Copyable Minecraft formatting code');
  if (config.capabilities?.includes('copyable-name')) features.splice(1, 0, 'Copyable Unicode player-name alternative');
  if (['brat-text-generator', 'fire-font-generator', 'glitter-font-generator', 'ransom-note-font-generator'].includes(slug)) features.splice(1, 0, 'Copyable Unicode alternatives');
  return features;
};
