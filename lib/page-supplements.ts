interface PageSupplement {
  heading: string;
  paragraphs: string[];
  tips: string[];
}

const supplements: Record<string, PageSupplement> = {
  'pop-culture-font-generators': {
    heading: 'Choosing a pop-culture-inspired text direction',
    paragraphs: [
      'Pop-culture typography is not one visual category. Retro science-fiction titles often rely on wide spacing and geometric capitals, fantasy references lean toward serif or blackletter shapes, and playful game-inspired text works better with rounded or enclosed characters. Start with the mood of the reference rather than trying to force every title into the same script alphabet.',
      'Unicode can suggest broad qualities such as blocky, dramatic, futuristic, magical, or nostalgic, but it cannot reproduce a protected logo or a custom commercial typeface. For fan profiles and themed messages, a recognizable mood is usually enough. For merchandise, branding, or public event artwork, use original licensed design assets and review the relevant rights.',
    ],
    tips: [
      'Use one style family per title instead of mixing unrelated alphabets.',
      'Keep franchise names readable and avoid implying official endorsement.',
      'Test symbols and enclosed letters on the device used by most of your audience.',
    ],
  },
  'mario-font-generator': {
    heading: 'How to create a readable block-game look',
    paragraphs: [
      'A convincing game-inspired label depends more on proportion and rhythm than on copying a logo. Squared capitals, heavy sans characters, monospace letters, and short pixel-like frames create a block-built feeling while remaining ordinary copy-paste Unicode. Short all-cap phrases usually communicate that mood more clearly than a long paragraph.',
      'Server names, party labels, fan posts, and video descriptions all have different constraints. A compact squared result may work in a social caption but fail in an in-game field with stricter character support. Keep a plain version of the name, test the exact destination, and remove decorative frames before replacing the core alphabet.',
    ],
    tips: [
      'Try short words first; block styles become crowded in long sentences.',
      'Check capital-only styles for unexpected lowercase fallback.',
      'This independent tool does not reproduce or distribute an official Nintendo font.',
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
      'The familiar supernatural-drama mood comes from several design cues working together: high-contrast serif shapes, generous tracking, centered composition, dark backgrounds, and restrained red or warm highlights. Unicode can supply serif, double-struck, or dramatic capital characters, but color, layout, and lighting must be added in the design tool or platform where the text is published.',
      'For a fan event or themed post, use the generated text as a compact title and pair it with ordinary body copy. This keeps dates, locations, and accessibility information readable. Avoid tracing an official wordmark or presenting the result as licensed artwork; this page provides an independent, general-purpose text treatment rather than franchise assets.',
    ],
    tips: [
      'Use uppercase or title case for a cleaner display rhythm.',
      'Leave event details and safety information in regular text.',
      'Test ornate capitals at small sizes before using them in a profile image.',
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
