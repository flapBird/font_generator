interface PageSupplement {
  heading: string;
  paragraphs: string[];
  tips: string[];
}

const supplements: Record<string, PageSupplement> = {
  'pop-culture-font-generators': {
    heading: 'Choosing a pop-culture-inspired artwork direction',
    paragraphs: [
      'Pop-culture typography is not one visual category. This generator therefore compares genuinely different rendered directions: storybook swashes and sparkles, multicolor arcade letters, pixel game text, glowing 1980s horror serifs, superhero display lettering, and wide science-fiction titles. Choose the direction that matches the project instead of treating every fandom as the same alphabet with a different color.',
      'The presets use bundled open-source fonts and original browser-rendered effects rather than official franchise logos or proprietary brand fonts. Adjust the composition, colors, outline, shadow, and spacing, then export PNG for a fixed appearance or SVG when you need a scalable result. For merchandise, branding, or public event artwork, review the relevant font and brand rights.',
    ],
    tips: [
      'Compare the same short phrase across presets before changing detailed controls.',
      'Use transparent export when the title will be placed over another design.',
      'Keep franchise references readable and avoid implying official endorsement.',
    ],
  },
  'mario-font-generator': {
    heading: 'How to build a playful multicolor game title',
    paragraphs: [
      'This generator creates downloadable title artwork, not squared copy-and-paste characters. Its presets use a bundled open-source cartoon display face with rotating per-letter colors, thick outlines, gradients, and offset shadows to produce a lively game-title composition. Rainbow Game Title is the strongest multicolor option, while Red Hero, Green World, and Coin Rush provide more controlled palettes.',
      'Short uppercase phrases give the chunky letters enough room to stay readable. Adjust letter spacing, outline, shadow, canvas shape, and transparency for a party banner, thumbnail, invitation, or fan graphic, then download PNG to preserve the exact appearance or SVG for scalable artwork.',
    ],
    tips: [
      'Use Rainbow Game Title when per-letter color is the main visual requirement.',
      'Reduce letter spacing before shrinking a long title excessively.',
      'This independent tool uses no official Nintendo font, logo, or character art.',
    ],
  },
  'tiktok-font-generator': {
    heading: 'Using Unicode across TikTok profile fields',
    paragraphs: [
      'A display name, biography, caption, comment, and in-video text layer are separate surfaces. Text accepted in one field is not guaranteed to be accepted in another, and the visual size can differ substantially. Use the generator for profile and caption text that accepts pasted Unicode; use TikTok’s own editing tools for text that must be positioned inside a video.',
      'Profiles are scanned quickly, so the most useful styles are those that preserve the name and topic at mobile size. Bold, small caps, and restrained script can create hierarchy. Wide, circled, or heavily framed text should be limited to one short phrase because it wraps earlier and can compete with links or calls to action.',
    ],
    tips: [
      'Keep searchable names and important keywords in ordinary characters.',
      'Paste into the exact field and save a draft before changing a live profile.',
      'View the result on another phone to check fallback fonts and wrapping.',
    ],
  },
  'stranger-things-font-generator': {
    heading: 'Building an atmospheric 1980s title without copying a logo',
    paragraphs: [
      'The familiar 1980s supernatural-horror mood comes from several design cues working together: a high-contrast serif face, generous tracking, centered capitals, dark backgrounds, red outlines, glow, and cinematic line decoration. This generator renders those elements together as artwork instead of asking the user to copy unrelated double-struck or fraktur Unicode characters.',
      'Use Red Outline Horror for the strongest poster treatment, Solid Crimson for better small-size readability, Neon 1984 for a brighter event graphic, or Paperback Horror for a printed retro direction. PNG preserves the exact rendered result; SVG provides a scalable export. The presets use an open-source serif alternative and do not reproduce the official wordmark.',
    ],
    tips: [
      'Use uppercase or title case for a cleaner display rhythm.',
      'Leave event details and safety information in regular text.',
      'Check the red outline and tracking at the final thumbnail or poster size.',
    ],
  },
  'christmas-font-generator': {
    heading: 'Planning festive text for invitations and seasonal posts',
    paragraphs: [
      'Seasonal text works best when the lettering supports the message instead of overwhelming it. Script styles can suit a greeting or host name, bold serif text keeps dates readable, and star or sparkle frames provide decoration around one short line. Use ordinary characters for addresses, times, URLs, and booking information.',
      'Emoji and ornamental symbols may appear in color on one device and as monochrome glyphs on another. They can also change line height or wrap earlier than letters. Before sending an invitation or publishing a promotion, test the full message on a phone and desktop and confirm that punctuation, numbers, and accented names remain intact.',
    ],
    tips: [
      'Separate the decorative greeting from practical event details.',
      'Use one frame or symbol system consistently.',
      'Keep a plain-text fallback for email clients and older devices.',
    ],
  },
  'heart-font-generator': {
    heading: 'Where heart text works—and where it becomes distracting',
    paragraphs: [
      'Heart symbols can signal affection, celebration, friendship, or a soft visual identity, but their meaning depends on context. A small heart frame can work around a name or short greeting. Replacing every separator and letter with hearts makes longer messages harder to scan and may be announced repeatedly by screen readers.',
      'For invitations, relationship announcements, and creator profiles, keep names, dates, and contact details in ordinary or broadly supported bold characters. Add hearts as a border or divider so the information survives if a platform removes an unsupported symbol. Different systems may render the same heart as text, emoji, monochrome, or color.',
    ],
    tips: [
      'Use hearts as an accent rather than the only source of meaning.',
      'Check color-emoji rendering in the destination app.',
      'Avoid decorative symbols in essential contact and event information.',
    ],
  },
};

export const getPageSupplement = (slug: string) => supplements[slug];
