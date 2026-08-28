export interface ContextualLink {
  href: string;
  title: string;
  description: string;
}

export interface GuideToolGroup {
  heading: string;
  intro: string;
  links: ContextualLink[];
}

export const homepagePriorityLinks: ContextualLink[] = [
  {
    href: '/cursive-font-generator',
    title: 'Cursive Font Generator',
    description: 'Create copyable script text for names, signatures, bios, and invitations.',
  },
  {
    href: '/small-text-generator',
    title: 'Small Text Generator',
    description: 'Compare small caps, superscript, and subscript coverage before copying.',
  },
  {
    href: '/big-font-generator',
    title: 'Big Font Generator',
    description: 'Build genuine multi-line ASCII banners and export TXT, PNG, or SVG.',
  },
  {
    href: '/typewriter-font-generator',
    title: 'Typewriter Font Generator',
    description: 'Create monospace and vintage text while keeping the output copyable.',
  },
  {
    href: '/japanese-font-generator',
    title: 'Japanese Font Generator',
    description: 'Style Latin text for Japanese-inspired display use with clear limitations.',
  },
  {
    href: '/fire-font-generator',
    title: 'Fire Font Generator',
    description: 'Render flame artwork with gradients, glow, outlines, and image downloads.',
  },
  {
    href: '/disney-font-generator',
    title: 'Disney Font Generator',
    description: 'Create unofficial magical storybook artwork with an open-source swash font.',
  },
  {
    href: '/minecraft-font-generator',
    title: 'Minecraft Font Generator',
    description: 'Choose pixel game text with formatting codes or a textured block logo.',
  },
];

const guideToolGroups: Record<string, GuideToolGroup> = {
  'reddit-fancy-text-guide': {
    heading: 'Tools for short Reddit accents',
    intro: 'These two tools suit short flair or title accents; keep post structure in Reddit’s native editor.',
    links: [
      { href: '/italics-font-generator', title: 'Italics Font Generator', description: 'Compare copyable italic alphabets with Reddit’s native italic formatting.' },
      homepagePriorityLinks[1],
    ],
  },
  'how-unicode-text-works-guide': {
    heading: 'Compare different Unicode alphabets',
    intro: 'Open several character families and compare the actual codepoints, coverage, and unchanged punctuation.',
    links: [
      { href: '/serif-font-generator', title: 'Serif Font Generator', description: 'Compare bold, italic, and serif-like mathematical alphabets.' },
      { href: '/fraktur-font-generator', title: 'Fraktur Font Generator', description: 'Inspect a visibly different mathematical alphabet with known Unicode gaps.' },
      homepagePriorityLinks[3],
      homepagePriorityLinks[0],
    ],
  },
  'unicode-font-compatibility-guide': {
    heading: 'Stress-test fallback and rendering',
    intro: 'These outputs expose different fallback risks, from mixed scripts to combining marks and uncommon symbols.',
    links: [
      homepagePriorityLinks[4],
      { href: '/glitch-font-generator', title: 'Glitch Font Generator', description: 'Check how combining marks align and collide across apps and devices.' },
      { href: '/bubble-font-generator', title: 'Bubble Font Generator', description: 'Compare enclosed characters and fallback coverage for letters and numbers.' },
    ],
  },
  'accessible-fancy-text-guide': {
    heading: 'Try restrained display styles',
    intro: 'Use short, nonessential samples and compare them with the same phrase in ordinary text.',
    links: [
      { href: '/aesthetic-font-generator', title: 'Aesthetic Font Generator', description: 'Try lighter decorative treatments for a short optional accent.' },
      { href: '/name-font-generator', title: 'Name Font Generator', description: 'Test a short display name while keeping an ordinary-text version nearby.' },
    ],
  },
  'instagram-bio-font-guide': {
    heading: 'Build and compare an Instagram bio',
    intro: 'Keep the sample short, then paste it into the exact name, bio, or caption field you plan to use.',
    links: [
      { href: '/instagram-font-generator', title: 'Instagram Font Generator', description: 'Create a focused set of styles for display names, bios, and captions.' },
      homepagePriorityLinks[0],
      { href: '/heart-font-generator', title: 'Heart Font Generator', description: 'Add restrained heart dividers or frames around a short profile phrase.' },
    ],
  },
  'discord-font-guide': {
    heading: 'Check text in the exact Discord field',
    intro: 'A nickname, channel topic, and message can behave differently, so start with these contrasting outputs.',
    links: [
      { href: '/weird-text-generator', title: 'Weird Text Generator', description: 'Test uncommon symbols and decorative mappings in the intended Discord field.' },
      { href: '/minecraft-font-generator', title: 'Minecraft Font Generator', description: 'Compare copyable game-style text with artwork-only output before sharing.' },
    ],
  },
  'fancy-text-troubleshooting-guide': {
    heading: 'Isolate the failing character or effect',
    intro: 'Move from broad-coverage alphabets to more complex effects to identify where the destination fails.',
    links: [
      { href: '/serif-font-generator', title: 'Serif Font Generator', description: 'Start with broader-coverage mathematical alphabets.' },
      homepagePriorityLinks[3],
      { href: '/upside-down-text-generator', title: 'Upside Down Text Generator', description: 'Check reversal, punctuation order, and field normalization.' },
    ],
  },
  'unicode-character-coverage-guide': {
    heading: 'Compare difficult character coverage',
    intro: 'Test digits, accents, punctuation, and uncommon letters before choosing a complete-looking style.',
    links: [
      { href: '/small-text-generator', title: 'Small Text Generator', description: 'Reveal the intentional gaps in superscript, subscript, and small-cap mappings.' },
      { href: '/fraktur-font-generator', title: 'Fraktur Font Generator', description: 'Compare strong letter coverage with the lack of a matching numeral alphabet.' },
      { href: '/japanese-font-generator', title: 'Japanese Font Generator', description: 'Check how Latin styling, symbols, and real Japanese characters are handled separately.' },
      { href: '/italics-font-generator', title: 'Italics Font Generator', description: 'Test letters and digits in a broad mathematical alphabet.' },
    ],
  },
};

export const getGuideToolGroup = (slug: string) => guideToolGroups[slug];
