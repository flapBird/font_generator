import { convertToFancyText } from './fonts';

export type GeneratorStyleCategory =
  | 'classic'
  | 'modern'
  | 'decorative'
  | 'symbols'
  | 'effects';

export interface GeneratorStyleDefinition {
  id: string;
  name: string;
  category: GeneratorStyleCategory;
  description: string;
  transform: (text: string) => string;
}

export interface GeneratorPageConfig {
  styleIds: string[];
  initialText: string;
  intentLabel: string;
  resultIntro: string;
  bestFor: string[];
  compatibilityNote: string;
}

const alphaNumericTransform = (
  text: string,
  upperStart: number,
  lowerStart: number,
  digitStart?: number,
) =>
  Array.from(text)
    .map((char) => {
      const code = char.codePointAt(0) ?? 0;
      if (code >= 65 && code <= 90) {
        return String.fromCodePoint(upperStart + code - 65);
      }
      if (code >= 97 && code <= 122) {
        return String.fromCodePoint(lowerStart + code - 97);
      }
      if (digitStart !== undefined && code >= 48 && code <= 57) {
        return String.fromCodePoint(digitStart + code - 48);
      }
      return char;
    })
    .join('');

const decorateCharacters = (text: string, mark: string) =>
  Array.from(text)
    .map((char) => (/\s/u.test(char) ? char : `${char}${mark}`))
    .join('');

const alternateTransform = (text: string, first: string, second: string) =>
  Array.from(text)
    .map((char, index) =>
      convertToFancyText(char, index % 2 === 0 ? first : second),
    )
    .join('');

const inverseText = (text: string) =>
  convertToFancyText(text, 'inverted');

const boldScriptTransform = (text: string) =>
  alphaNumericTransform(text, 0x1d4d0, 0x1d4ea);

const boldFrakturTransform = (text: string) =>
  alphaNumericTransform(text, 0x1d56c, 0x1d586);

const baseStyle = (
  id: string,
  name: string,
  category: GeneratorStyleCategory,
  description: string,
): GeneratorStyleDefinition => ({
  id,
  name,
  category,
  description,
  transform: (text) => convertToFancyText(text, id),
});

export const generatorStyles: GeneratorStyleDefinition[] = [
  baseStyle('bold', 'Bold Serif', 'classic', 'Strong serif letters for headings and emphasis.'),
  baseStyle('italic', 'Italic Serif', 'classic', 'Slanted serif letters with a formal, editorial feel.'),
  baseStyle('boldItalic', 'Bold Italic', 'classic', 'Heavy slanted characters for energetic emphasis.'),
  baseStyle('script', 'Elegant Script', 'classic', 'Light handwritten characters for names and bios.'),
  baseStyle('fraktur', 'Classic Fraktur', 'classic', 'Traditional blackletter characters with historic detail.'),
  baseStyle('monospace', 'Monospace', 'modern', 'Even-width characters inspired by terminals and code.'),
  baseStyle('doubleStruck', 'Double Struck', 'classic', 'Outlined mathematical characters with a distinctive silhouette.'),
  baseStyle('circled', 'Circled Letters', 'decorative', 'Every supported character placed inside a circle.'),
  {
    id: 'squared',
    name: 'Squared Capitals',
    category: 'decorative',
    description: 'Block-like enclosed capitals for gaming and display text.',
    transform: (text) => convertToFancyText(text.toUpperCase(), 'squared'),
  },
  baseStyle('parenthesized', 'Parenthesized', 'decorative', 'Compact enclosed lowercase letters for labels.'),
  baseStyle('fullwidth', 'Fullwidth', 'modern', 'Wide characters with a retro digital appearance.'),
  baseStyle('smallCaps', 'Small Caps', 'classic', 'Compact capital-like letters that remain easy to scan.'),
  baseStyle('superscript', 'Superscript', 'decorative', 'Raised miniature characters for tiny text.'),
  baseStyle('subscript', 'Subscript', 'decorative', 'Lowered miniature characters with partial Unicode coverage.'),
  {
    id: 'inverted',
    name: 'Upside Down',
    category: 'effects',
    description: 'Reverses the text and rotates supported characters for a true upside-down result.',
    transform: inverseText,
  },
  baseStyle('strikethrough', 'Strikethrough', 'effects', 'A line runs through every visible character.'),
  {
    id: 'sans',
    name: 'Clean Sans',
    category: 'modern',
    description: 'Simple mathematical sans-serif characters for clean profiles.',
    transform: (text) => alphaNumericTransform(text, 0x1d5a0, 0x1d5ba, 0x1d7e2),
  },
  {
    id: 'sansBold',
    name: 'Bold Sans',
    category: 'modern',
    description: 'Heavy sans-serif Unicode for modern headlines and names.',
    transform: (text) => alphaNumericTransform(text, 0x1d5d4, 0x1d5ee, 0x1d7ec),
  },
  {
    id: 'sansItalic',
    name: 'Sans Italic',
    category: 'modern',
    description: 'Clean slanted characters without traditional serifs.',
    transform: (text) => alphaNumericTransform(text, 0x1d608, 0x1d622),
  },
  {
    id: 'sansBoldItalic',
    name: 'Bold Sans Italic',
    category: 'modern',
    description: 'A strong contemporary italic for social headlines.',
    transform: (text) => alphaNumericTransform(text, 0x1d63c, 0x1d656),
  },
  {
    id: 'boldScript',
    name: 'Bold Script',
    category: 'classic',
    description: 'Thicker handwritten characters for names and invitations.',
    transform: boldScriptTransform,
  },
  {
    id: 'boldFraktur',
    name: 'Bold Fraktur',
    category: 'classic',
    description: 'Dense blackletter characters suited to gothic display text.',
    transform: boldFrakturTransform,
  },
  {
    id: 'darkCircled',
    name: 'Dark Circled',
    category: 'decorative',
    description: 'High-contrast enclosed capitals for badges and labels.',
    transform: (text) =>
      Array.from(text.toUpperCase())
        .map((char) => {
          const code = char.charCodeAt(0);
          return code >= 65 && code <= 90
            ? String.fromCodePoint(0x1f150 + code - 65)
            : char;
        })
        .join(''),
  },
  {
    id: 'underline',
    name: 'Underline',
    category: 'effects',
    description: 'Copy-paste underline created with Unicode combining marks.',
    transform: (text) => decorateCharacters(text, '\u0332'),
  },
  {
    id: 'doubleUnderline',
    name: 'Double Underline',
    category: 'effects',
    description: 'A stronger double-line treatment beneath the text.',
    transform: (text) => decorateCharacters(text, '\u0333'),
  },
  {
    id: 'overline',
    name: 'Overline',
    category: 'effects',
    description: 'A fine line above each visible character.',
    transform: (text) => decorateCharacters(text, '\u0305'),
  },
  {
    id: 'slash',
    name: 'Slashed',
    category: 'effects',
    description: 'Diagonal combining strokes create an aggressive cut effect.',
    transform: (text) => decorateCharacters(text, '\u0338'),
  },
  {
    id: 'dotted',
    name: 'Dotted',
    category: 'effects',
    description: 'A subtle dot accent above every character.',
    transform: (text) => decorateCharacters(text, '\u0307'),
  },
  {
    id: 'spaced',
    name: 'Letter Spaced',
    category: 'modern',
    description: 'Adds breathing room between characters for clean display text.',
    transform: (text) => Array.from(text).join(' '),
  },
  {
    id: 'wideSpaced',
    name: 'Wide Spaced',
    category: 'modern',
    description: 'Combines fullwidth characters with generous spacing.',
    transform: (text) => Array.from(convertToFancyText(text, 'fullwidth')).join(' '),
  },
  {
    id: 'wave',
    name: 'Wave Text',
    category: 'effects',
    description: 'Alternates raised and lowered letters for a moving baseline.',
    transform: (text) => alternateTransform(text, 'superscript', 'subscript'),
  },
  {
    id: 'tinyWave',
    name: 'Tiny Wave',
    category: 'effects',
    description: 'Alternates small caps and superscript characters.',
    transform: (text) => alternateTransform(text, 'smallCaps', 'superscript'),
  },
  {
    id: 'glitch',
    name: 'Light Glitch',
    category: 'effects',
    description: 'Controlled combining marks create a readable glitch texture.',
    transform: (text) =>
      Array.from(text)
        .map((char, index) =>
          /\s/u.test(char) ? char : `${char}${index % 2 ? '\u0337\u0301' : '\u0336\u0308'}`,
        )
        .join(''),
  },
  {
    id: 'hearts',
    name: 'Heart Frame',
    category: 'symbols',
    description: 'Frames your message with lightweight heart symbols.',
    transform: (text) => `♡ ${text} ♡`,
  },
  {
    id: 'stars',
    name: 'Star Frame',
    category: 'symbols',
    description: 'Adds classic star symbols around your text.',
    transform: (text) => `★ ${text} ★`,
  },
  {
    id: 'sparkle',
    name: 'Sparkle Frame',
    category: 'symbols',
    description: 'A bright decorative frame for bios and captions.',
    transform: (text) => `✦ ${convertToFancyText(text, 'script')} ✦`,
  },
  {
    id: 'fire',
    name: 'Fire Frame',
    category: 'symbols',
    description: 'Pairs strong characters with flame symbols.',
    transform: (text) => `🔥 ${convertToFancyText(text, 'bold')} 🔥`,
  },
  {
    id: 'snow',
    name: 'Snow Frame',
    category: 'symbols',
    description: 'Winter symbols surround a crisp fullwidth result.',
    transform: (text) => `❄ ${convertToFancyText(text, 'fullwidth')} ❄`,
  },
  {
    id: 'christmas',
    name: 'Christmas Frame',
    category: 'symbols',
    description: 'Festive tree and star symbols for seasonal messages.',
    transform: (text) => `🎄 ✦ ${boldScriptTransform(text)} ✦ 🎄`,
  },
  {
    id: 'brackets',
    name: 'Soft Brackets',
    category: 'symbols',
    description: 'Compact ornamental brackets for usernames and labels.',
    transform: (text) => `【 ${text} 】`,
  },
  {
    id: 'angleBrackets',
    name: 'Tech Brackets',
    category: 'symbols',
    description: 'Angular framing for gaming and technology themes.',
    transform: (text) => `〈${convertToFancyText(text, 'monospace')}〉`,
  },
  {
    id: 'bubbleFrame',
    name: 'Bubble Frame',
    category: 'symbols',
    description: 'Rounded dot symbols reinforce a soft bubble aesthetic.',
    transform: (text) => `● ${convertToFancyText(text, 'circled')} ●`,
  },
  {
    id: 'gothicFrame',
    name: 'Gothic Frame',
    category: 'symbols',
    description: 'Blackletter text framed with ornamental crosses.',
    transform: (text) => `† ${boldFrakturTransform(text)} †`,
  },
  {
    id: 'pixelFrame',
    name: 'Pixel Frame',
    category: 'symbols',
    description: 'Square markers and block capitals evoke game interfaces.',
    transform: (text) => `▣ ${convertToFancyText(text.toUpperCase(), 'squared')} ▣`,
  },
  {
    id: 'arrows',
    name: 'Arrow Frame',
    category: 'symbols',
    description: 'Directional markers make short labels more noticeable.',
    transform: (text) => `➜ ${alphaNumericTransform(text, 0x1d5d4, 0x1d5ee, 0x1d7ec)} ←`,
  },
  {
    id: 'cross',
    name: 'Crossed Text',
    category: 'symbols',
    description: 'Cross symbols give short phrases a darker tone.',
    transform: (text) => `✞ ${convertToFancyText(text, 'fraktur')} ✞`,
  },
  {
    id: 'dotDivider',
    name: 'Dot Dividers',
    category: 'symbols',
    description: 'Centered dots separate letters for compact profile text.',
    transform: (text) => Array.from(text).join('·'),
  },
  {
    id: 'randomCase',
    name: 'Alternating Case',
    category: 'effects',
    description: 'Alternates letter case without changing the message.',
    transform: (text) =>
      Array.from(text)
        .map((char, index) => (index % 2 === 0 ? char.toUpperCase() : char.toLowerCase()))
        .join(''),
  },
  {
    id: 'ransom',
    name: 'Mixed Ransom',
    category: 'effects',
    description: 'Mixes several Unicode alphabets for a cut-and-paste look.',
    transform: (text) => {
      const styles = ['bold', 'script', 'fraktur', 'circled', 'doubleStruck'];
      return Array.from(text)
        .map((char, index) => convertToFancyText(char, styles[index % styles.length]))
        .join('');
    },
  },
  {
    id: 'backwards',
    name: 'Backwards',
    category: 'effects',
    description: 'Reverses the character order for playful mirrored messages.',
    transform: (text) => Array.from(text).reverse().join(''),
  },
  {
    id: 'upsideFrame',
    name: 'Framed Upside Down',
    category: 'effects',
    description: 'A framed, fully reversed upside-down transformation.',
    transform: (text) => `⌞ ${inverseText(text)} ⌝`,
  },
];

const styleMap = new Map(generatorStyles.map((style) => [style.id, style]));

export const generateStyleVariants = (text: string, styleIds: string[]) =>
  styleIds
    .map((id) => styleMap.get(id))
    .filter((style): style is GeneratorStyleDefinition => Boolean(style))
    .map((style) => ({
      id: style.id,
      name: style.name,
      category: style.category,
      description: style.description,
      text: style.transform(text),
    }));

const packs: Record<string, string[]> = {
  'small-text-generator': ['smallCaps', 'superscript', 'subscript', 'tinyWave', 'wave', 'dotDivider', 'brackets', 'dotted', 'spaced'],
  'weird-text-generator': ['inverted', 'backwards', 'glitch', 'slash', 'wave', 'ransom', 'randomCase', 'parenthesized', 'darkCircled', 'cross'],
  'upside-down-text-generator': ['inverted', 'upsideFrame', 'backwards', 'wave', 'glitch', 'parenthesized', 'slash', 'angleBrackets'],
  'brat-text-generator': ['sansBold', 'bold', 'fullwidth', 'darkCircled', 'squared', 'sansBoldItalic', 'stars', 'sparkle', 'hearts', 'wideSpaced'],
  'italics-font-generator': ['italic', 'boldItalic', 'sansItalic', 'sansBoldItalic', 'script', 'boldScript', 'underline', 'overline', 'spaced'],
  'serif-font-generator': ['bold', 'italic', 'boldItalic', 'doubleStruck', 'fraktur', 'boldFraktur', 'script', 'boldScript', 'underline'],
  'comic-font-generator': ['sansBold', 'boldScript', 'circled', 'darkCircled', 'bubbleFrame', 'stars', 'randomCase', 'ransom', 'arrows'],
  'retro-font-generator': ['fullwidth', 'monospace', 'squared', 'darkCircled', 'doubleStruck', 'smallCaps', 'wideSpaced', 'pixelFrame', 'stars'],
  'y2k-font-generator': ['fullwidth', 'sansBoldItalic', 'darkCircled', 'circled', 'monospace', 'sparkle', 'wideSpaced', 'angleBrackets', 'glitch'],
  'western-font-generator': ['boldFraktur', 'fraktur', 'doubleStruck', 'smallCaps', 'bold', 'gothicFrame', 'stars', 'wideSpaced', 'overline'],
  'horror-font-generator': ['boldFraktur', 'fraktur', 'glitch', 'slash', 'cross', 'gothicFrame', 'strikethrough', 'inverted', 'ransom', 'darkCircled'],
  'demon-font-generator': ['boldFraktur', 'fraktur', 'cross', 'gothicFrame', 'inverted', 'glitch', 'slash', 'fire', 'darkCircled'],
  'fire-font-generator': ['fire', 'bold', 'sansBold', 'boldItalic', 'slash', 'stars', 'darkCircled', 'fullwidth', 'arrows'],
  'whisper-font-generator': ['superscript', 'subscript', 'smallCaps', 'tinyWave', 'wave', 'spaced', 'dotted', 'brackets', 'italic'],
  'christmas-font-generator': ['christmas', 'snow', 'boldScript', 'script', 'stars', 'sparkle', 'circled', 'fullwidth', 'hearts'],
  'cursive-font-generator': ['script', 'boldScript', 'italic', 'boldItalic', 'sansItalic', 'sparkle', 'underline', 'hearts', 'spaced'],
  'cursive-tattoo-font-generator': ['boldScript', 'script', 'boldItalic', 'boldFraktur', 'gothicFrame', 'underline', 'cross', 'sparkle', 'wideSpaced'],
  'bubble-font-generator': ['circled', 'darkCircled', 'bubbleFrame', 'squared', 'parenthesized', 'boldScript', 'hearts', 'sparkle', 'dotDivider'],
  'glitter-font-generator': ['sparkle', 'stars', 'boldScript', 'script', 'hearts', 'circled', 'dotted', 'fullwidth', 'sansBoldItalic'],
  'heart-font-generator': ['hearts', 'boldScript', 'script', 'circled', 'sparkle', 'smallCaps', 'dotted', 'brackets', 'sansItalic'],
  'big-font-generator': ['sansBold', 'bold', 'squared', 'darkCircled', 'fullwidth', 'boldFraktur', 'wideSpaced', 'pixelFrame', 'doubleStruck'],
  'ransom-note-font-generator': ['ransom', 'randomCase', 'glitch', 'slash', 'boldFraktur', 'circled', 'squared', 'strikethrough', 'dotDivider'],
  'times-new-roman-font-generator': ['bold', 'italic', 'boldItalic', 'doubleStruck', 'script', 'fraktur', 'underline', 'overline', 'spaced'],
  'impact-font-generator': ['sansBold', 'bold', 'darkCircled', 'squared', 'fullwidth', 'wideSpaced', 'arrows', 'pixelFrame', 'slash'],
  'papyrus-font-generator': ['script', 'doubleStruck', 'fraktur', 'boldScript', 'dotted', 'gothicFrame', 'stars', 'overline', 'spaced'],
  'comic-sans-font-generator': ['boldScript', 'script', 'sans', 'smallCaps', 'circled', 'bubbleFrame', 'randomCase', 'stars', 'underline'],
  'san-francisco-font-generator': ['sans', 'sansBold', 'sansItalic', 'sansBoldItalic', 'monospace', 'fullwidth', 'spaced', 'wideSpaced', 'underline'],
  'minecraftia-font-generator': ['squared', 'darkCircled', 'pixelFrame', 'monospace', 'sansBold', 'fullwidth', 'angleBrackets', 'wideSpaced', 'glitch'],
  'metallica-font-generator': ['boldFraktur', 'fraktur', 'gothicFrame', 'slash', 'cross', 'bold', 'darkCircled', 'glitch', 'wideSpaced'],
  'tiktok-font-generator': ['boldScript', 'sansBold', 'circled', 'darkCircled', 'fullwidth', 'smallCaps', 'sparkle', 'hearts', 'sansBoldItalic', 'wideSpaced', 'brackets'],
  'facebook-font-generator': ['sansBold', 'bold', 'script', 'boldScript', 'italic', 'circled', 'smallCaps', 'underline', 'stars', 'brackets'],
  'linkedin-font-generator': ['sansBold', 'bold', 'italic', 'sansItalic', 'smallCaps', 'underline', 'spaced', 'doubleStruck', 'brackets'],
  'chicano-font-generator': ['boldScript', 'boldFraktur', 'script', 'fraktur', 'gothicFrame', 'underline', 'cross', 'wideSpaced', 'stars'],
  'fraktur-font-generator': ['fraktur', 'boldFraktur', 'gothicFrame', 'bold', 'doubleStruck', 'cross', 'underline', 'overline', 'wideSpaced'],
  'pop-culture-font-generators': ['boldScript', 'sansBold', 'boldFraktur', 'squared', 'darkCircled', 'fullwidth', 'sparkle', 'pixelFrame', 'gothicFrame', 'stars'],
  'disney-font-generator': ['script', 'boldScript', 'sparkle', 'stars', 'hearts', 'circled', 'sansBold', 'fullwidth', 'dotted'],
  'mario-font-generator': ['squared', 'darkCircled', 'pixelFrame', 'sansBold', 'circled', 'bold', 'stars', 'fullwidth', 'arrows'],
  'stranger-things-font-generator': ['doubleStruck', 'boldFraktur', 'fraktur', 'gothicFrame', 'fullwidth', 'glitch', 'wideSpaced', 'darkCircled', 'overline'],
  'instagram-font-generator': ['sansBold', 'boldScript', 'script', 'smallCaps', 'sansItalic', 'circled', 'sparkle', 'hearts', 'fullwidth', 'spaced'],
  'tattoo-font-generator': ['boldScript', 'boldFraktur', 'script', 'fraktur', 'boldItalic', 'bold', 'gothicFrame', 'cross', 'underline'],
  'name-font-generator': ['boldScript', 'sansBold', 'smallCaps', 'fraktur', 'script', 'bold', 'circled', 'sparkle', 'hearts', 'brackets'],
  'aesthetic-font-generator': ['sparkle', 'script', 'spaced', 'fullwidth', 'smallCaps', 'hearts', 'doubleStruck', 'fraktur', 'circled', 'wideSpaced'],
  'creepy-scary-font-generator': ['boldFraktur', 'gothicFrame', 'glitch', 'cross', 'fraktur', 'slash', 'inverted', 'strikethrough', 'ransom', 'darkCircled'],
  'goth-font-generator': ['fraktur', 'boldFraktur', 'gothicFrame', 'boldItalic', 'cross', 'overline', 'glitch', 'wideSpaced', 'darkCircled'],
  'medieval-font-generator': ['fraktur', 'boldFraktur', 'gothicFrame', 'bold', 'doubleStruck', 'stars', 'smallCaps', 'wideSpaced', 'overline'],
  'metal-font-generator': ['boldFraktur', 'gothicFrame', 'slash', 'glitch', 'cross', 'darkCircled', 'bold', 'angleBrackets', 'wideSpaced'],
  'glitch-font-generator': ['glitch', 'slash', 'strikethrough', 'monospace', 'angleBrackets', 'randomCase', 'ransom', 'wave', 'backwards'],
  'typewriter-font-generator': ['monospace', 'spaced', 'strikethrough', 'bold', 'underline', 'smallCaps', 'fullwidth', 'dotDivider', 'overline'],
  'japanese-font-generator': ['fullwidth', 'wideSpaced', 'angleBrackets', 'monospace', 'brackets', 'spaced', 'sparkle', 'smallCaps', 'dotDivider'],
  'minecraft-font-generator': ['squared', 'pixelFrame', 'monospace', 'fullwidth', 'darkCircled', 'sansBold', 'angleBrackets', 'wideSpaced', 'glitch'],
  'fortnite-font-generator': ['sansBold', 'squared', 'darkCircled', 'arrows', 'bold', 'fullwidth', 'pixelFrame', 'wideSpaced', 'angleBrackets'],
};

const platformSlugs = new Set([
  'instagram-font-generator',
  'tiktok-font-generator',
  'facebook-font-generator',
  'linkedin-font-generator',
]);

const realTypefaceSlugs = new Set([
  'times-new-roman-font-generator',
  'impact-font-generator',
  'papyrus-font-generator',
  'comic-sans-font-generator',
  'san-francisco-font-generator',
  'minecraftia-font-generator',
  'metallica-font-generator',
]);

const fandomSlugs = new Set([
  'pop-culture-font-generators',
  'disney-font-generator',
  'minecraft-font-generator',
  'fortnite-font-generator',
  'mario-font-generator',
  'stranger-things-font-generator',
]);

const seasonalSlugs = new Set([
  'christmas-font-generator',
  'fire-font-generator',
  'glitter-font-generator',
  'heart-font-generator',
]);

export const getGeneratorPageConfig = (
  slug: string,
  pageTitle: string,
): GeneratorPageConfig => {
  const cleanName = pageTitle.replace(/\s+Generator$/i, '').replace(/\s+Font$/i, '');
  const styleIds = packs[slug] ?? [
    'bold',
    'italic',
    'script',
    'sansBold',
    'circled',
    'fullwidth',
    'smallCaps',
    'sparkle',
  ];

  if (platformSlugs.has(slug)) {
    return {
      styleIds,
      initialText: slug.startsWith('linkedin') ? 'Creative Designer' : 'Your Name Here',
      intentLabel: 'Social profile styles',
      resultIntro: `Preview ${cleanName} text styles selected for names, bios, captions, and short profile sections. Every result is copy-paste Unicode.`,
      bestFor: ['Profile names', 'Short bios', 'Post headings'],
      compatibilityNote: 'Platform rules can change. Test the copied result in the exact field before updating an important profile.',
    };
  }

  if (realTypefaceSlugs.has(slug)) {
    return {
      styleIds,
      initialText: cleanName,
      intentLabel: 'Copy-paste alternatives',
      resultIntro: `Explore Unicode styles inspired by the visual qualities associated with ${cleanName}. These results are copy-paste text alternatives, not the original font file.`,
      bestFor: ['Social posts', 'Display names', 'Style exploration'],
      compatibilityNote: 'Unicode cannot reproduce a commercial or proprietary typeface exactly. Use the licensed original font for professional design work.',
    };
  }

  if (fandomSlugs.has(slug)) {
    return {
      styleIds,
      initialText: cleanName,
      intentLabel: 'Unofficial fan styles',
      resultIntro: `Create unofficial ${cleanName}-inspired text with several distinct Unicode treatments for fan posts, names, and themed messages.`,
      bestFor: ['Fan posts', 'Party messages', 'Themed profiles'],
      compatibilityNote: 'This independent fan tool uses standard Unicode and is not affiliated with or endorsed by the referenced brand or rights holder.',
    };
  }

  if (seasonalSlugs.has(slug)) {
    return {
      styleIds,
      initialText: cleanName === 'Christmas' ? 'Merry Christmas' : 'Your Text',
      intentLabel: 'Decorative text presets',
      resultIntro: `Generate ${cleanName.toLowerCase()} text with matching symbols, frames, and Unicode lettering instead of a single generic font.`,
      bestFor: ['Captions', 'Invitations', 'Seasonal messages'],
      compatibilityNote: 'Decorative symbols and combining marks may render slightly differently across devices and apps.',
    };
  }

  return {
    styleIds,
    initialText: cleanName.length < 22 ? cleanName : 'Hello World',
    intentLabel: 'Purpose-built Unicode styles',
    resultIntro: `Generate several distinct ${cleanName.toLowerCase()} styles, compare the results, and copy the version that best fits your message.`,
    bestFor: ['Usernames', 'Bios', 'Short headings'],
    compatibilityNote: 'Core Unicode letters work on most modern apps. Highly decorative effects may vary with the device font.',
  };
};

export const getAllStyleIds = () => generatorStyles.map((style) => style.id);

export const getStyleDefinition = (id: string) => styleMap.get(id);
