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
  decoration?: 'lines' | 'badge' | 'pixel' | 'sparkles' | 'none';
}

export interface VisualGeneratorConfig {
  engine: 'font-renderer' | 'theme-renderer';
  initialText: string;
  intentLabel: string;
  resultIntro: string;
  bestFor: string[];
  presets: VisualFontPreset[];
  compatibilityNote: string;
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
    engine: 'theme-renderer',
    initialText: 'CREEPER CLUB',
    intentLabel: 'Unofficial block game title designer',
    resultIntro: 'Build block, grass, stone, diamond, and nether-style titles for servers, realms, achievements, and fan thumbnails.',
    bestFor: ['Server banners', 'Realm titles', 'Fan thumbnails'],
    compatibilityNote: 'The bundled Pixelify Sans face is an open-source pixel alternative. It does not contain Mojangles, Minecraftia, Mojang textures, logos, or official font files.',
    presets: [
      bundledPreset('mc-grass', 'Grass Block', 'Green pixel text with an earthy block shadow.', 'Pixelify Sans', 'monospace', { uppercase: true, fontWeight: 700, textColor: '#84cc16', backgroundColor: '#713f12', strokeColor: '#365314', strokeWidth: 3, shadowColor: '#292524', shadowOffsetX: 8, shadowOffsetY: 9, decoration: 'pixel' }),
      bundledPreset('mc-stone', 'Stone', 'Gray pixel lettering for builds and server labels.', 'Pixelify Sans', 'monospace', { uppercase: true, fontWeight: 700, gradient: ['#e7e5e4', '#78716c'], textColor: '#a8a29e', backgroundColor: '#1c1917', strokeColor: '#44403c', strokeWidth: 3, shadowOffsetX: 7, shadowOffsetY: 8, decoration: 'pixel' }),
      bundledPreset('mc-diamond', 'Diamond', 'Cyan pixel lettering with a deep blue outline.', 'Pixelify Sans', 'monospace', { uppercase: true, fontWeight: 700, gradient: ['#cffafe', '#06b6d4'], textColor: '#22d3ee', backgroundColor: '#083344', strokeColor: '#155e75', strokeWidth: 3, shadowOffsetX: 7, shadowOffsetY: 7, decoration: 'pixel' }),
      bundledPreset('mc-nether', 'Nether', 'Hot red pixel text for darker game themes.', 'Pixelify Sans', 'monospace', { uppercase: true, fontWeight: 700, gradient: ['#fb7185', '#991b1b'], textColor: '#ef4444', backgroundColor: '#1c0707', strokeColor: '#450a0a', strokeWidth: 3, shadowColor: '#f97316', shadowBlur: 10, decoration: 'pixel' }),
    ],
  },
  'fortnite-font-generator': {
    engine: 'theme-renderer',
    initialText: 'VICTORY SQUAD',
    intentLabel: 'Unofficial battle-game title designer',
    resultIntro: 'Create bold, condensed-feeling squad names, stream titles, and party graphics with outlines and high-energy color presets.',
    bestFor: ['Squad names', 'Stream thumbnails', 'Party invites'],
    compatibilityNote: 'The bundled Anton face is an open-source condensed-display alternative to the commercial Burbank family. It does not contain Epic Games branding or official assets.',
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
  return [
    `The ${pageTitle} now renders ordinary text as visual artwork instead of substituting unrelated Unicode symbols. Its presets—${presetNames}—use real browser font rendering, page-specific colors, outlines, shadows, spacing, and decoration.`,
    fontAvailabilityCopy,
    `You can adjust font size, letter spacing, outline, shadow, colors, canvas format, and transparency. PNG export fixes the browser-rendered appearance into pixels; SVG export keeps editable text and may therefore require the same font on the device where it is opened. ${config.compatibilityNote}`,
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
  const config = configs[slug];
  if (!config) return null;
  const isTypeface = config.engine === 'font-renderer';
  const usesBundledFonts = config.presets.some((item) => item.fontSource === 'bundled');
  return [
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
};

export const getSpecializedHowTo = (slug: string): string | null => {
  if (slug === 'big-font-generator') {
    return 'Enter one to three short lines, choose an ASCII banner style, and set the alignment and colors. Copy the plain-text result for monospace destinations, or download TXT, PNG, or SVG for a portable layout.';
  }
  const config = configs[slug];
  if (!config) return null;
  return 'Enter a short title, choose a page-specific preset, and adjust font size, spacing, outline, shadow, colors, canvas format, and transparency. Download PNG to preserve the exact rendered appearance or SVG when you need editable text.';
};

export const getSpecializedFeatureList = (slug: string): string[] | null => {
  if (slug === 'big-font-generator') {
    return ['ASCII art generation', 'Multiple banner styles', 'Copy text', 'TXT download', 'PNG download', 'SVG download'];
  }
  const config = configs[slug];
  if (!config) return null;
  return [
    `${config.presets.length} rendered presets`,
    'Font size and letter spacing controls',
    'Text and background colors',
    'Outline and shadow controls',
    'Transparent PNG download',
    'Editable SVG download',
  ];
};
