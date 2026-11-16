export interface GuideSource {
  title: string;
  url: string;
}

export interface GuideMetadata {
  updatedAt: string;
  updatedLabel: string;
  sources: GuideSource[];
  figure?: { src: string; width: number; height: number; alt: string; caption: string; source: GuideSource };
  toolLink: {
    href: string;
    label: string;
  };
}

const unicodeCharacterDatabase: GuideSource = {
  title: 'Unicode 17.0 Character Database',
  url: 'https://www.unicode.org/Public/17.0.0/ucd/UnicodeData.txt',
};

const mathematicalAlphanumerics: GuideSource = {
  title: 'Unicode Mathematical Alphanumeric Symbols chart',
  url: 'https://www.unicode.org/charts/nameslist/n_1D400.html',
};

const unicodeNormalization: GuideSource = {
  title: 'Unicode Standard Annex #15: Normalization Forms',
  url: 'https://www.unicode.org/reports/tr15/',
};

const metCuneiformTablet = {
  title: 'The Metropolitan Museum of Art, object 1988.433.3',
  url: 'https://www.metmuseum.org/art/collection/search/327385',
};

const metadataBySlug: Record<string, GuideMetadata> = {
  'what-is-cuneiform': {
    updatedAt: '2026-11-16',
    updatedLabel: 'November 16, 2026',
    sources: [
      { title: 'The Met · The Origins of Writing', url: 'https://www.metmuseum.org/essays/the-origins-of-writing' },
      metCuneiformTablet,
      { title: 'Oracc · Introduction to Cuneiform Sign Lists', url: 'https://oracc.museum.upenn.edu/dcclt/signlists/signlists/index.html' },
      { title: 'Oracc · The AN sign and its readings', url: 'https://oracc.museum.upenn.edu/osl/signlist/l0065/o0000099/index.html' },
      { title: 'Unicode · Cuneiform character chart', url: 'https://www.unicode.org/charts/PDF/U12000.pdf' },
    ],
    figure: {
      src: '/guides/cuneiform-tablet.webp', width: 768, height: 1024,
      alt: 'Small clay tablet from Mesopotamia with incised signs and divided rows of early writing',
      caption: 'Administrative account of malt and barley groats, ca. 3100–2900 BCE. Public domain.',
      source: metCuneiformTablet,
    },
    toolLink: { href: '/cuneiform-translator', label: 'Try the Cuneiform Translator' },
  },
  'minecraft-enchanting-table': {
    updatedAt: '2026-11-16',
    updatedLabel: 'November 16, 2026',
    sources: [
      { title: 'Mojang · Bedrock enchanting table recipe', url: 'https://github.com/Mojang/bedrock-samples/blob/main/behavior_pack/recipes/enchanting_table.json' },
      { title: 'Mojang · In-game enchanting instructions', url: 'https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/texts/en_US.lang#L3992-L4004' },
      { title: 'Minecraft · Chiseled Bookshelf', url: 'https://www.minecraft.net/en-us/article/chiseled-bookshelf' },
      { title: 'Tom Hall on creating the Standard Galactic Alphabet', url: 'https://cc314.shikadi.net/oldcc314/sga.htm' },
    ],
    toolLink: { href: '/enchanting-table-translator', label: 'Try the Enchanting Table Translator' },
  },
  'reddit-fancy-text-guide': {
    updatedAt: '2026-10-28',
    updatedLabel: 'October 28, 2026',
    sources: [
      {
        title: 'Reddit Help: Formatting Guide',
        url: 'https://support.reddithelp.com/hc/en-us/articles/360043033952-Formatting-Guide',
      },
      {
        title: 'Reddit Help: User flair',
        url: 'https://support.reddithelp.com/hc/en-us/articles/205242695-How-do-I-get-user-flair',
      },
    ],
    toolLink: { href: '/reddit-font-generator', label: 'Try the Reddit Font Generator' },
  },
  'how-unicode-text-works-guide': {
    updatedAt: '2026-08-27',
    updatedLabel: 'August 27, 2026',
    sources: [mathematicalAlphanumerics, unicodeNormalization],
    toolLink: { href: '/', label: 'Try the Fancy Text Generator' },
  },
  'unicode-font-compatibility-guide': {
    updatedAt: '2026-08-27',
    updatedLabel: 'August 27, 2026',
    sources: [mathematicalAlphanumerics],
    toolLink: { href: '/', label: 'Test a Unicode text style' },
  },
  'accessible-fancy-text-guide': {
    updatedAt: '2026-08-27',
    updatedLabel: 'August 27, 2026',
    sources: [
      {
        title: 'W3C WAI: Understanding the Readable guideline',
        url: 'https://www.w3.org/WAI/WCAG21/Understanding/readable.html',
      },
    ],
    toolLink: { href: '/', label: 'Create a short text sample' },
  },
  'instagram-bio-font-guide': {
    updatedAt: '2026-08-27',
    updatedLabel: 'August 27, 2026',
    sources: [
      {
        title: 'Instagram Help: Public profile information',
        url: 'https://www.facebook.com/help/instagram/347751748650214',
      },
      {
        title: 'Instagram Help: Update profile information',
        url: 'https://www.facebook.com/help/instagram/583107688369069',
      },
    ],
    toolLink: { href: '/instagram-font-generator', label: 'Open the Instagram Font Generator' },
  },
  'discord-font-guide': {
    updatedAt: '2026-08-27',
    updatedLabel: 'August 27, 2026',
    sources: [
      {
        title: 'Discord Support: Markdown Text 101',
        url: 'https://support.discord.com/hc/en-us/articles/210298617-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline',
      },
    ],
    toolLink: { href: '/discord-font-generator', label: 'Open the Discord Font Generator' },
  },
  'fancy-text-troubleshooting-guide': {
    updatedAt: '2026-08-27',
    updatedLabel: 'August 27, 2026',
    sources: [],
    toolLink: { href: '/', label: 'Try a simpler text style' },
  },
  'unicode-character-coverage-guide': {
    updatedAt: '2026-08-27',
    updatedLabel: 'August 27, 2026',
    sources: [unicodeCharacterDatabase, mathematicalAlphanumerics],
    toolLink: { href: '/small-text-generator', label: 'Test superscript and subscript coverage' },
  },
};

const fallbackMetadata: GuideMetadata = {
  updatedAt: '2026-08-27',
  updatedLabel: 'August 27, 2026',
  sources: [],
  toolLink: { href: '/', label: 'Try the Fancy Text Generator' },
};

export const getGuideMetadata = (slug: string): GuideMetadata =>
  metadataBySlug[slug] ?? fallbackMetadata;
