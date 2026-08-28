export interface GuideSource {
  title: string;
  url: string;
}

export interface GuideMetadata {
  updatedAt: string;
  updatedLabel: string;
  sources: GuideSource[];
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

const metadataBySlug: Record<string, GuideMetadata> = {
  'reddit-fancy-text-guide': {
    updatedAt: '2026-08-27',
    updatedLabel: 'August 27, 2026',
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
    toolLink: { href: '/', label: 'Try the Fancy Text Generator' },
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
    toolLink: { href: '/', label: 'Create text to test in Discord' },
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
