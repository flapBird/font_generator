import { fandomPages, stylePages, type PageDefinition } from './data';
import { generatorStyles } from './generator';

export type GeneratorKind =
  | 'unicode'
  | 'ascii'
  | 'font-preview'
  | 'meme'
  | 'theme-logo'
  | 'game-text'
  | 'hybrid'
  | 'directory';

export type GeneratorOutput = 'text' | 'png' | 'svg' | 'txt' | 'game-code';

export type GeneratorCapability =
  | 'copy'
  | 'style-filter'
  | 'grapheme-safe'
  | 'font-availability'
  | 'font-specimen'
  | 'image-upload'
  | 'meme-layout'
  | 'multicolor-letters'
  | 'bitmap-rendering'
  | 'game-codes'
  | 'copyable-name'
  | 'inline-format-codes'
  | 'variable-glyph-spacing'
  | 'material-textures'
  | 'extrusion-depth'
  | 'preset-gallery'
  | 'png-export'
  | 'svg-export'
  | 'txt-export';

export interface GeneratorIntent {
  primary: string;
  secondary: string[];
  expectedOutputs: GeneratorOutput[];
}

export interface GeneratorDefinition {
  id: string;
  slug: string;
  title: string;
  icon: string;
  category: 'styles' | 'fandom';
  canonicalPath: string;
  kind: GeneratorKind;
  tags: string[];
  intent: GeneratorIntent;
  capabilities: GeneratorCapability[];
  acceptanceCriteria: string[];
  homepage: {
    enabled: boolean;
    featured: boolean;
    priority: number;
  };
}

type GeneratorOverride = Partial<Omit<GeneratorDefinition, 'id' | 'slug' | 'title' | 'icon' | 'category' | 'canonicalPath'>>;

const overrides: Record<string, GeneratorOverride> = {
  '3d-font-generator': {
    kind: 'theme-logo',
    tags: ['3d text', '3d letters', '3d lettering', '3d font maker', 'transparent png'],
    intent: {
      primary: 'Create dimensional text artwork with adjustable extrusion, direction, perspective, and lighting.',
      secondary: ['Design 3D letters for logos, thumbnails, banners, gaming graphics, and social media.'],
      expectedOutputs: ['png'],
    },
    capabilities: ['extrusion-depth', 'preset-gallery', 'png-export'],
    acceptanceCriteria: [
      'Render a front face, visible extrusion, outline, highlight, and independent shadow on the browser canvas.',
      'Update the preview immediately when text or a visual control changes.',
      'Auto-fit long text without overflowing the artwork canvas.',
      'Export high-resolution transparent PNG artwork without UI, watermark, login, or server processing.',
    ],
    homepage: { enabled: true, featured: true, priority: 0 },
  },
  'big-font-generator': {
    kind: 'ascii',
    intent: {
      primary: 'Create large multi-line ASCII banners that remain plain text.',
      secondary: ['Download the same banner as TXT, PNG, or SVG.'],
      expectedOutputs: ['text', 'txt', 'png', 'svg'],
    },
    capabilities: ['copy', 'grapheme-safe', 'txt-export', 'png-export', 'svg-export'],
  },
  'times-new-roman-font-generator': fontPreviewIntent('Preview an installed Times New Roman family across real weights and export artwork.'),
  'papyrus-font-generator': fontPreviewIntent('Preview Papyrus when installed and compare clearly labelled alternatives.'),
  'comic-sans-font-generator': fontPreviewIntent('Preview Comic Sans MS and compare friendly comic-lettering alternatives.'),
  'san-francisco-font-generator': fontPreviewIntent('Compare Apple system typography directions for interface and product mockups.'),
  'minecraftia-font-generator': {
    ...fontPreviewIntent('Preview Minecraftia when installed and create pixel-aligned bitmap-style artwork.'),
    capabilities: ['font-availability', 'font-specimen', 'bitmap-rendering', 'preset-gallery', 'png-export', 'svg-export'],
  },
  'impact-font-generator': {
    kind: 'meme',
    intent: {
      primary: 'Add high-contrast Impact captions to a meme or uploaded image.',
      secondary: ['Create standalone poster and thumbnail headlines.'],
      expectedOutputs: ['png', 'svg'],
    },
    capabilities: ['font-availability', 'image-upload', 'meme-layout', 'preset-gallery', 'png-export', 'svg-export'],
  },
  'metallica-font-generator': themeLogoIntent('Create original heavy-metal wordmarks with angular, metallic title treatments.'),
  'brat-text-generator': hybridIntent('Create the recognizable lime-and-black brat-style graphic while retaining copyable bold alternatives.'),
  'fire-font-generator': hybridIntent('Create flame-styled title artwork while retaining lightweight copyable fire text.'),
  'glitter-font-generator': hybridIntent('Create sparkling title artwork while retaining copyable decorative text.'),
  'ransom-note-font-generator': hybridIntent('Create mixed cutout-style ransom artwork while retaining copyable mixed Unicode text.'),
  'pop-culture-font-generators': {
    kind: 'directory',
    intent: {
      primary: 'Discover themed font generators by film, television, game, and visual genre.',
      secondary: ['Compare a phrase across several broad pop-culture directions.'],
      expectedOutputs: ['png', 'svg'],
    },
    capabilities: ['preset-gallery', 'png-export', 'svg-export'],
  },
  'disney-font-generator': themeLogoIntent('Create unofficial magical storybook title artwork with a clearly labelled open-source alternative.'),
  'mario-font-generator': {
    ...themeLogoIntent('Create playful multicolor game-title artwork with chunky dimensional letters.'),
    capabilities: ['multicolor-letters', 'preset-gallery', 'png-export', 'svg-export'],
  },
  'stranger-things-font-generator': themeLogoIntent('Create an unofficial two-line 80s horror title with red outlines and glow.'),
  'minecraft-font-generator': {
    kind: 'game-text',
    intent: {
      primary: 'Render variable-width pixel UI text with inline Minecraft formatting codes.',
      secondary: ['Create textured block-logo artwork with material inside the letters and adjustable 3D depth.'],
      expectedOutputs: ['png', 'svg', 'game-code'],
    },
    capabilities: ['bitmap-rendering', 'game-codes', 'inline-format-codes', 'variable-glyph-spacing', 'material-textures', 'extrusion-depth', 'preset-gallery', 'png-export', 'svg-export'],
    acceptanceCriteria: [
      'Keep in-game text and decorative logo output as separate modes.',
      'Draw solid bitmap cells directly and preserve variable glyph widths without browser font smoothing.',
      'Render inline color and formatting codes in the game-text preview.',
      'Keep each user-entered line intact, scale it down to fit without horizontal scrolling, and grow the preview height only for manual line breaks.',
      'Place procedural material inside the logo glyphs, not only in the background.',
      'Preserve every manual Block Logo line and expand the logo canvas height instead of truncating after three lines.',
      'Export transparent artwork without distributing official game assets.',
    ],
  },
  'fortnite-font-generator': {
    kind: 'game-text',
    intent: {
      primary: 'Create unofficial condensed battle-title artwork and copyable player-name alternatives.',
      secondary: ['Test a Unicode player-name alternative separately from the rendered artwork.'],
      expectedOutputs: ['png', 'svg', 'text'],
    },
    capabilities: ['preset-gallery', 'copyable-name', 'png-export', 'svg-export'],
  },
};

function fontPreviewIntent(primary: string): GeneratorOverride {
  return {
    kind: 'font-preview',
    intent: {
      primary,
      secondary: ['Inspect availability, source, and licensing before export.'],
      expectedOutputs: ['png', 'svg'],
    },
    capabilities: ['font-availability', 'font-specimen', 'preset-gallery', 'png-export', 'svg-export'],
  };
}

function themeLogoIntent(primary: string): GeneratorOverride {
  return {
    kind: 'theme-logo',
    intent: {
      primary,
      secondary: ['Download transparent artwork for invitations, thumbnails, and fan projects.'],
      expectedOutputs: ['png', 'svg'],
    },
    capabilities: ['preset-gallery', 'png-export', 'svg-export'],
  };
}

function hybridIntent(primary: string): GeneratorOverride {
  return {
    kind: 'hybrid',
    intent: {
      primary,
      secondary: ['Offer copyable Unicode variants when an image is not required.'],
      expectedOutputs: ['text', 'png', 'svg'],
    },
    capabilities: ['copy', 'grapheme-safe', 'preset-gallery', 'png-export', 'svg-export'],
  };
}

const defaultIntent = (page: PageDefinition): GeneratorIntent => {
  const subject = page.title
    .replace(/\s+Generator$/i, '')
    .replace(/\s+(?:Font|Text)$/i, '')
    .toLowerCase();

  return {
    primary: `Create copy-and-paste ${subject} text.`,
    secondary: ['Compare several relevant Unicode styles before copying.'],
    expectedOutputs: ['text'],
  };
};

const defaultAcceptanceCriteria: Record<GeneratorKind, string[]> = {
  unicode: ['Preserve grapheme clusters.', 'Keep unsupported characters unchanged.', 'Provide one-click copy for every result.'],
  ascii: ['Keep the output valid plain text.', 'Preserve alignment in downloadable formats.'],
  'font-preview': ['Identify whether the requested font is available.', 'Label alternatives accurately.', 'Preserve the browser rendering in PNG.'],
  meme: ['Support an image background.', 'Support recognizable high-contrast caption layout.', 'Export the composed result.'],
  'theme-logo': ['Provide a page-specific visual signature.', 'Avoid presenting an alternative as an official brand font.', 'Export transparent artwork.'],
  'game-text': ['Separate image artwork from game-compatible text output.', 'Explain platform compatibility.', 'Export or copy the selected mode.'],
  hybrid: ['Lead with the visual result users expect.', 'Retain a clearly labelled copyable-text mode.', 'Keep both modes on the existing URL.'],
  directory: ['Expose crawlable links to every listed generator.', 'Avoid creating duplicate detail URLs.'],
};

const buildDefinition = (page: PageDefinition, priority: number): GeneratorDefinition => {
  const override = overrides[page.slug] ?? {};
  const kind = override.kind ?? 'unicode';
  const canonicalPath = `/${page.slug}`;

  return {
    id: page.slug,
    slug: page.slug,
    title: page.title,
    icon: page.icon,
    category: page.category as 'styles' | 'fandom',
    canonicalPath,
    kind,
    tags: Array.from(new Set([
      page.category,
      kind,
      ...page.slug.replace(/-font-generator|-text-generator|-generator/g, '').split('-'),
      ...(override.tags ?? []),
    ])),
    intent: override.intent ?? defaultIntent(page),
    capabilities: override.capabilities ?? ['copy', 'style-filter', 'grapheme-safe'],
    acceptanceCriteria: override.acceptanceCriteria ?? defaultAcceptanceCriteria[kind],
    homepage: {
      enabled: override.homepage?.enabled ?? true,
      featured: override.homepage?.featured ?? false,
      priority: override.homepage?.priority ?? priority,
    },
  };
};

export const generatorRegistry: GeneratorDefinition[] = [
  ...stylePages.map((page, index) => buildDefinition(page, index)),
  ...fandomPages.map((page, index) => buildDefinition(page, stylePages.length + index)),
];

export const validateGeneratorRegistry = (definitions: GeneratorDefinition[] = generatorRegistry) => {
  const issues: string[] = [];
  const ids = new Set<string>();
  const paths = new Set<string>();
  const knownStyleIds = new Set(generatorStyles.map((style) => style.id));

  definitions.forEach((definition) => {
    if (ids.has(definition.id)) issues.push(`Duplicate generator id: ${definition.id}`);
    if (paths.has(definition.canonicalPath)) issues.push(`Duplicate canonical path: ${definition.canonicalPath}`);
    if (definition.canonicalPath !== `/${definition.slug}`) {
      issues.push(`Canonical path does not match category and slug: ${definition.id}`);
    }
    if (!definition.intent.expectedOutputs.length) issues.push(`No expected output declared: ${definition.id}`);
    if (!definition.acceptanceCriteria.length) issues.push(`No acceptance criteria declared: ${definition.id}`);
    ids.add(definition.id);
    paths.add(definition.canonicalPath);
  });

  [...stylePages, ...fandomPages].forEach((page) => {
    page.defaultStyleIds?.forEach((styleId) => {
      if (!knownStyleIds.has(styleId)) issues.push(`${page.slug} has unknown default Unicode style ${styleId}`);
    });
  });

  return issues;
};

const registryIssues = validateGeneratorRegistry();
if (registryIssues.length) {
  throw new Error(`Invalid generator registry:\n${registryIssues.join('\n')}`);
}

const generatorMap = new Map(generatorRegistry.map((definition) => [definition.slug, definition]));

export const getGeneratorDefinition = (slug: string) => generatorMap.get(slug);

export const getGeneratorsByKind = (kind: GeneratorKind) =>
  generatorRegistry.filter((definition) => definition.kind === kind);

export const getGeneratorsByCategory = (category: 'styles' | 'fandom') =>
  generatorRegistry.filter((definition) => definition.category === category);

export const isFontStyleGenerator = (definition: GeneratorDefinition) =>
  definition.kind === 'unicode';

export const getFontStyleGenerators = () =>
  generatorRegistry.filter(isFontStyleGenerator);

export const getVisualArtGenerators = () =>
  generatorRegistry.filter((definition) => definition.kind !== 'directory' && !isFontStyleGenerator(definition));
