import { guidePages } from '@/lib/data';
import { libraryPages } from '@/lib/text-library/catalog';
import {
  generatorRegistry,
  type GeneratorDefinition,
  type GeneratorKind,
} from '@/lib/generator-registry';

export const dynamic = 'force-static';

const SITE_URL = 'https://font-generators.org';

const sectionOrder: GeneratorKind[] = [
  'unicode',
  'ascii',
  'font-preview',
  'meme',
  'theme-logo',
  'game-text',
  'hybrid',
  'directory',
];

const sectionHeadings: Record<GeneratorKind, string> = {
  unicode: 'Copy-and-paste Unicode text generators',
  ascii: 'ASCII art generators',
  'font-preview': 'Typeface preview and artwork generators',
  meme: 'Meme generators',
  'theme-logo': 'Theme and title artwork generators',
  'game-text': 'Game text and game-inspired artwork generators',
  hybrid: 'Hybrid artwork and copyable-text generators',
  directory: 'Generator directories and comparison tools',
};

const outputLabels: Record<string, string> = {
  text: 'copyable text',
  png: 'PNG',
  svg: 'SVG',
  txt: 'TXT',
  'game-code': 'game formatting code',
};

const generatorLine = (definition: GeneratorDefinition) => {
  const url = `${SITE_URL}${definition.canonicalPath}`;
  const outputs = definition.intent.expectedOutputs
    .map((output) => outputLabels[output] ?? output)
    .join(', ');
  return `- [${definition.title}](${url}): ${definition.intent.primary} Outputs: ${outputs}.`;
};

const generatorSections = sectionOrder.flatMap((kind) => {
  const generators = generatorRegistry.filter((definition) => definition.kind === kind);
  if (!generators.length) return [];
  return [
    `## ${sectionHeadings[kind]}`,
    '',
    ...generators.map(generatorLine),
    '',
  ];
});

const guideLines = guidePages.map(
  (page) => `- [${page.title}](${SITE_URL}/guides/${page.slug}): ${page.description}`,
);

const body = [
  '# Font Generators',
  '',
  '> Font Generators offers free browser-based tools for copy-and-paste Unicode text, ASCII banners, real typeface previews, meme captions, 3D text, and downloadable title artwork, alongside an optional paid AI Font Generator for custom English TTF files. Each generator keeps its existing canonical URL and explains the exact output it produces.',
  '',
  'Use the output type to interpret a page correctly:',
  '',
  '- Unicode generators substitute characters and return copyable plain text; they do not install or reproduce a font file.',
  '- Bold Text offers bold serif, sans-serif, italic, script, and fraktur Unicode variants. Strikethrough Text offers long, short, and tilde combining overlays, preserving spaces, line breaks, and emoji. Their standard input fields accept up to 240 characters per edit.',
  '- Discord Font Generator separates Unicode display-name and bio styles from native message Markdown. Decorative Unicode is not valid in unique Discord usernames. Message mode lists all six copyable result cards containing the exact Markdown source. The desktop Font Studio card renders the selected message formatting without the generated Markdown delimiters; this preview is illustrative, not a complete Discord renderer.',
  '- Zalgo Text Generator displays five simultaneous result cards: None, Mild, Medium, Strong and Extreme. Advanced settings provide a separate custom result with intensity from 0 to 10 and independent above/through/below mark directions applied to all results. Randomization is available for up to 1,000 input characters. It preserves emoji and complex scripts; it does not remove existing accents or pasted Zalgo marks. These text tools run in the browser without sign-in or payment.',
  '- Bold Text, Strikethrough, Underline, Small Caps, Vaporwave, Double-Struck, Roblox, Twitter/X, Twitch, Adopt Me, Discord, Zalgo, and the Handwriting copyable alternatives support one-click copying from the result card, including keyboard activation and a selectable-text fallback when clipboard access fails. Adopt Me offers four compact decoration chips with icons and labels (None, Hearts, Stars and Brackets), with 44-pixel minimum touch targets; Discord message formats and Zalgo strengths are directly listed as copyable results. Detailed platform notes remain available under Platform tips & compatibility on the four platform workspaces.',
  '- Free text tools keep input within the current generator only; no account is needed.',
  '- Old English, WhatsApp, Square Text, Snapchat, Sad, Reddit and Keyboard use the shared text workspace, page-local input, card copying, keyboard activation and live preview. They accept up to 1,000 characters per edit and include an unchanged original result in Unicode mode. Old English offers classic and bold blackletter, optional royal/bracket frames and uppercase/lowercase alphabet charts; it does not translate languages. Square Text offers outline, filled and alternating capitals with optional spacing; digits and other scripts are preserved, and filled squares may render as emoji.',
  '- WhatsApp separates fancy Unicode from native bold, italic, strikethrough, inline-code and monospace message source. Conflicting input delimiters disable the affected formatting result without changing the input. Reddit separates Unicode from desktop Markdown source; mobile Reddit uses rich text controls and may display Markdown literally. Formatting previews are illustrative, not complete platform renderers. The new Unicode tools protect detected URLs, email addresses, mentions, hashtags and Reddit u/name and r/community references.',
  '- Snapchat offers display-name, chat and caption destinations, with a visible-character estimate against the documented 30-character display-name limit. It does not validate usernames or platform acceptance. Sad combines restrained alphabets and Latin combining overlays with optional broken-heart, rain and wilted-rose frames. Keyboard is a mobile-friendly copy-and-paste web tool, not an installable keyboard or system-font changer.',
  '- Neon, Cyberpunk and Anime are listed in /visual-art and have independent artwork workspaces with four original presets each. Neon renders tube outlines and layered glow; Cyberpunk renders chromatic splits, sliced lettering and terminal scanlines; Anime renders outlined gradients, dimensional action titles and decorative scenes. Controls include colors, effect strength, size, spacing, alignment, banner/square layout and transparency. PNG export uses the same canvas as the preview at 2000 × 1000 or 1600 × 1600 pixels. Artwork accepts 120 characters. Font or preview failures block export and offer retry.',
  '- Cyberpunk and Anime additionally offer a separate copyable-text mode with optional stars or brackets and an original result; text mode accepts 1,000 characters. Switching modes preserves input and shows an over-limit warning rather than truncating longer text. Neon exports PNG only. These three tools use locally hosted Caveat, Oswald, Bebas Neue and Luckiest Guy Latin fonts on demand, with licenses under /fonts/discovery/. Unsupported scripts may use device fallback. No official franchise logos, translation, AI images, SVG or installable font files are generated. The ten discovery pages are excluded from permanent navigation; the seven text pages show a temporary current-generator HERE entry and remain accessible from /styles, while the three artwork pages are in /visual-art. All ten retain canonical URLs, related links and sitemap entries.',
  '- On Neon, Cyberpunk and Anime mobile artwork pages, input is followed by the preview, download action and presets before the detailed settings; desktop retains controls beside the preview. This ordering is isolated to those three new workspaces.',
  '- Underline Text offers single and double combining low lines while retaining emoji and whitespace. Small Caps offers all-small-cap output or preservation of existing uppercase letters; its Unicode alphabet is approximate, not a font-level small-caps feature. Double-Struck covers Latin letters and decimal digits. Vaporwave converts printable ASCII to fullwidth characters and spaces, with uppercase and extra-spacing variants. These standard inputs accept up to 240 characters per edit.',
  '- Twitter/X uses one canonical page, /twitter-font-generator; /x-font-generator redirects there. Standard 280-character post estimates use twitter-text and account for weighted Unicode, detected URLs, and recognized emoji. Bio and display-name modes do not reuse the post counter. Subscription-specific longer posts and reply context are not modeled. Twitter/X and Twitch preserve detected links, mentions, hashtags, and cashtags while styling surrounding text.',
  '- Roblox, Twitter/X, Twitch, and Adopt Me text inputs accept up to 1,000 characters per edit and keep an unchanged original result available. Roblox and Adopt Me browser previews do not verify in-game acceptance or bypass filtering. Adopt Me offers optional heart, star, and bracket frames for pet-name ideas. Twitch text styling targets titles, bios, and chat, not arbitrary account-name fonts.',
  '- Handwriting Font Generator renders the bundled open-source Caveat and Patrick Hand families as PNG, editable SVG, or faithful SVG, with separately labelled Unicode script alternatives. Artwork input accepts up to 120 characters per edit and supports manual line breaks. It does not upload handwriting photos, clone signatures, or create a personal TTF. Editable SVG may require the same fonts; PNG and faithful SVG preserve the rendered appearance. Font license notices: /licenses/caveat-OFL.txt and /licenses/patrick-hand-OFL.txt.',
  '- Korean, Chinese, Arabic and Graffiti are listed in /visual-art. Their independent artwork workspace accepts up to 120 characters per edit, renders locally hosted open-source typefaces, supports manual line breaks, size, color, alignment, banner/square canvases and transparent PNG download. Only the selected font and required character subsets load. Missing glyphs may use device fallback; language pages show a hint when the input contains none of the target script. Failed font loads disable export. No translation, transliteration, Simplified/Traditional conversion, vertical writing, SVG, AI generation or font-file export is offered by these four workspaces. Fonts and license notices are under /fonts/artwork/.',
  '- Graffiti offers Rubik Spray Paint, Permanent Marker, Rubik Bubbles and Sedgwick Ave Display. Its artwork workspace supports outlines, gradients and shadows. Korean offers Jua, Gaegu, Nanum Pen Script and Black Han Sans. Chinese offers Ma Shan Zheng, Zhi Mang Xing, Noto Sans SC and Noto Serif TC; choosing a font does not convert the text. Arabic offers Amiri, Cairo, Lateef and Reem Kufi, with whole-line RTL shaping and preserved diacritics.',
  '- Generator input is local to each page. Switching generators starts the destination example; text is not transferred or restored from a cross-tool session draft. Switching styles or output tabs within the same page keeps the current text.',
  '- Halloween remains in /visual-art and uses its own style studio. It offers 24 PNG artwork presets across Horror, Playful, Gothic, Neon and Posters, and a separate tab with 24 copyable Gothic, Spooky, Cute, Glitch and Plain text styles. Input is preserved between tabs on this page; navigating to another generator starts its own default example. Artwork accepts 120 characters and text accepts 1,000; oversized drafts are shown without truncation. Artwork thumbnails and fonts load as cards enter view. Each preset has direct PNG download and a Customize dialog with colors, size, outline, alignment, optional stacked words, extra depth, banner/square format, theme background or transparent lettering. PNG sizes are 2000 × 1000 or 1600 × 1600; transparent export removes the scene. Font failures block export and can be retried. No SVG, font files or AI images are generated. Twelve locally hosted open-source typefaces are used: Creepster, Nosifer, Eater, Butcherman, Metal Mania, New Rocker, Pirata One, Frijole, Rubik Wet Paint, Lacquer, Trade Winds and UnifrakturMaguntia. Fonts and licenses are under /fonts/artwork/. Latin display fonts may use device fallback for unsupported characters.',
  '- K-pop, Preppy, Emoji, Gaming and Wingdings are listed in /styles and use the shared text workspace, card copying, live preview and page-local input. Inputs accept up to 1,000 characters per edit; oversized saved drafts remain visible with an error instead of silent truncation. K-pop, Preppy, Emoji and Gaming show compact decoration chips with icons and labels, with 44-pixel minimum touch targets. Usage notes are collapsed under Tips & compatibility after the results. K-pop preserves Hangul and detected links and mentions. Preppy provides hearts, stars and bows. Emoji separates lookalike letters, themed substitution codes and readable decoration; it is not a semantic translator. Gaming offers nickname styles, clan brackets, an original fallback and links to dedicated game tools; it does not verify platform acceptance.',
  '- Wingdings encodes and decodes A-Z, a-z and 0-9 using 62 portable Unicode counterparts, including approximate shapes. Both Letters to Symbols and Symbols to Letters result cards are always shown and can be copied independently, without a direction selector. Its character chart is searchable. A prominent Gaster mode switch shows its On/Off state and uppercases Latin input for encoding only; decoding stays unchanged. Detailed mapping notes are collapsed under About these symbols after the results. Punctuation and unsupported characters stay unchanged. Decoding assumes this mapping. No proprietary Microsoft font is distributed.',
  '- ASCII generators arrange plain-text characters into multi-line banners whose spacing is best preserved in monospace contexts.',
  '- Typeface preview tools render a device font when available and label fallbacks; PNG preserves the browser rendering, while editable SVG may require the same font.',
  '- Visual, meme, and theme generators render artwork for PNG and, where offered, SVG download; their canvas result is not copy-and-paste text.',
  '- The 3D Font Generator uses layered browser-canvas rendering for the front face, extrusion, outline, highlight, perspective, and shadow. It exports a high-resolution PNG, including transparent PNG, and does not currently export STL, OBJ, GLB, or other 3D geometry.',
  '- Hybrid generators lead with downloadable artwork and provide a separate, clearly labelled Unicode alternative for text-only destinations.',
  '- Fandom and brand-inspired tools are unofficial. They use system fonts, bundled open-source alternatives, and original effects rather than distributing official logos or proprietary font assets.',
  '',
  '- Workspace sidebars and mobile navigation retain the existing generator entries, order, search, and collection-link placement. The previous 13 additions and the October batch of 10 are excluded from the permanent navigation lists; their canonical pages remain in /styles or /visual-art, related links, and the sitemap. On the five October text pages only, mobile results appear before the full generator navigation so input, options and results stay together; desktop navigation and all older page layouts are unchanged. The previous 12 text tools and five October text tools share the existing navigation, input/results workspace and live Font Studio preview. A temporary current-page item marked HERE appears below the navigation search only while visiting one of these text tools. Client-side links open each tool with its own input, URL and page content. Specialized controls for platforms, Discord Markdown and Zalgo remain available. Handwriting presents visible typeface presets and a jump link to its separate copyable script section.',
  '',
  '## Main navigation',
  '',
  `- [Homepage](${SITE_URL}/): Browse featured generators and generator categories.`,
  `- [Text Style Generators](${SITE_URL}/styles): Browse copy-and-paste text tools, including Bold, Strikethrough, Discord, and Zalgo generators.`,
  `- [Visual & Art Generators](${SITE_URL}/visual-art): Browse ASCII, font-preview, meme, and visual artwork tools.`,
  `- [Fandom Font Generators](${SITE_URL}/fandom): Browse unofficial game, film, television, and pop-culture-inspired generators.`,
  `- [Guides](${SITE_URL}/guides): Read compatibility, accessibility, troubleshooting, and Unicode reference material. Available from the footer; omitted from desktop and mobile header navigation.`,
  '',
  ...generatorSections,
  '## Guides and reference material',
  '',
  ...guideLines,
  '',
  '## Optional account and AI features',
  '',
  'The AI font studio starts with a description input. Custom generation requires sign-in and sufficient purchased or subscription-funded credits; availability depends on service configuration. Purchases take place on the Pricing page when checkout is available for the signed-in account. During the initial private rollout, purchases are restricted to authorized test accounts even when payment services are configured; other visitors see Payments coming soon. Pricing continues to show the one-time credit pack and its price when checkout is unavailable, with a disabled Payments coming soon button. The pack is a one-time purchase, not a recurring subscription. Existing free generators remain available without an account.',
  'Signed-in users have a separate My fonts & purchases page for their private font library, generated-font previews, TTF downloads, artwork exports, and recent orders. Account & billing manages profile details and credit activity. If an account data section is unavailable, successfully loaded profile and library records remain visible; unknown balances are not shown as zero, and new generation and checkout are paused when required account checks cannot complete. Private account and library pages are not indexed or included in the public sitemap.',
  'Account and library views provide structured loading, timeout and retry states. A recent account snapshot is briefly reused in browser memory during navigation and cleared on sign-in changes or window focus; it is not persisted in browser storage. Font tasks can be opened to inspect their status, description, timestamps, credit outcome and support reference. Recorded failures include an explanation and next steps; older tasks without a recorded reason are labelled unknown. Unconfirmed submissions remain under review with credits reserved and are not automatically submitted again.',
  'Below the custom generator, use-case examples pair font descriptions with clearly labelled existing reference typefaces for branding and editorial titles. Use this prompt fills the description without starting or charging for a generation. Custom generation currently produces one standard English TTF with 72 glyphs; image-to-font and extended character sets are not offered. Free reference previews and the artwork editor let visitors try their own text and export square, wide, or transparent PNG artwork. Reference previews use existing fonts, not AI-generated results. Layout edits and PNG exports do not spend credits.',
  'Before delivery, generated TTF files are checked for table integrity, decodable outlines, and core English coverage (uppercase and lowercase letters, digits, space, period, comma, exclamation mark, and question mark). Invalid results fail the generation and restore its reserved customer credits. Downloads become available after the file is saved to private storage. Generated previews load that same stored file, and previews and artwork show a warning for characters absent from its character map. These checks do not guarantee visual quality, prompt accuracy, or compatibility with every design application.',
  'Custom generation also requires configured SeeAPI safety checks. Descriptions are reviewed for sexual content, violence, hate, harassment, and self-harm before generation credits are reserved or Mixfont is called. Pending or unavailable prompt checks do not start generation. The studio distinguishes active description checks from temporary retry waits and shows a countdown when another attempt must wait; an unresolved description check is not shown as a running font generation. Generated files remain quarantined while all visible glyph outlines, including unencoded glyphs, are rendered into specimen images and screened for NSFW content. New results are previewable and downloadable only after all specimen pages pass; rejected or failed output reviews restore the generation credits once. Existing delivered fonts remain accessible. Automated checks can make mistakes and are not a guarantee that every unsafe symbol or context will be detected.',
  'Safety processing sends descriptions and rendered glyph specimens to SeeAPI. Its current data policy provides no scheduled automatic expiry for stored input files, task information, or moderation results; API request logs are retained for 60 days. Free reference previews and local PNG exports do not call the moderation API.',
  'Optional transactional email can notify signed-in users when a font is ready after file and safety checks, or when a generation finally fails and its reserved credits are restored. Availability requires the notification database migration and configured mail service. Notices link to the private font library and include the task reference, final outcome, public failure reason where recorded, and restored credit amount. These details and the account email address are sent to the transactional mail service; descriptions, font attachments and private download URLs are excluded. Pending checks and unconfirmed submissions do not trigger result email. Historical completed tasks are not backfilled. Font and credit delivery do not depend on email delivery; queued delivery can be delayed and provider acceptance does not guarantee arrival.',
  'Confirmed Waffo refunds withdraw credits in proportion to the refunded payment, with full refunds withdrawing all credits from that payment. Already spent credits can result in a negative balance. Negative balances and Waffo payment disputes pause new generation and purchases pending support review; previously delivered fonts remain available. Transaction email for Waffo purchases is optional and depends on mail service configuration; credit delivery does not depend on email delivery. These notifications send the account email address and payment or credit adjustment summary to the configured transactional email service. They are not marketing messages; acceptance by the mail service does not guarantee final delivery.',
  '',
  '## Symbols, emoji combinations and Unicode utilities',
  '',
  'These free browser-based tools have a separate catalog from Font Styles and Visual & Art. The symbol library contains 261 curated symbol sequences, including distinct text and emoji presentations; Kaomoji and Emoji Combos each contain 100 editorial selections. Search names, characters or code points, filter categories, copy complete sequences, and build a combination with up to 40 pieces and 1,000 UTF-16 units. Pieces can be reordered or removed; editing the combined text merges the pieces. No AI service, sign-in or font installation is required.',
  'Favorites (up to 500 item IDs) and the 24 most recently copied items are stored in this browser when storage is available. Clear saved items removes both lists across collections. Combinations and checker input stay in page memory and are not saved. Optional usage events record fixed tool or item identifiers, not entered text, combinations, pasted text or search terms. Clipboard failures show a selectable manual-copy field and are not reported as successful copies.',
  'Invisible Character offers eight character types with 1–100 repetitions. Its paste checker accepts up to 2,000 UTF-16 units, reports code-point and grapheme counts, and identifies the supported blank characters, joiners, variation selectors, tabs and line endings without modifying them. It is not a complete Unicode inspector or remover. Spaces and blank-looking characters have different semantics; destination apps can reject or trim them. Platform username acceptance is not verified.',
  'The separate Unicode Character Inspector reports all input code points, grapheme counts, UTF-16 offsets, escaped forms and UTF-8 bytes; only common characters have names in its compact name table. Invisible Character Remover starts with every change disabled and offers six explicit removal or space-replacement options, retaining the original for comparison. Fancy Text to Normal Text restores supported mathematical Latin, fullwidth ASCII, enclosed alphanumerics and compatible super/subscripts; optional small-cap and combining-overlay mappings are separate. Unsupported text, accents and emoji sequences are preserved by default. These three tools accept up to 2,000 UTF-16 units, keep page-local input and use the existing workspace with a temporary current-tool navigation item. They do not promise universal recovery or a security audit.',
  ...libraryPages.map((page) => `- [${page.title}](${SITE_URL}${page.path}): ${page.description}`),
  'Signature Generator uses an independent image workspace. Type up to 80 UTF-16 units in six locally hosted SIL OFL handwriting fonts, or draw with mouse, touch or pen; change ink color, adjust size or stroke width, undo or clear drawing strokes, and download a transparent PNG automatically cropped around the ink. Fonts load only when selected; failed font loads block typed export until retried. Names and drawings stay in page memory. It does not create font files, clone handwriting or provide document signing. Other scripts may use device font fallback. The existing Handwriting generator and its PNG/SVG exports remain separate.',
  '',
  '## Site information',
  '',
  'Google Analytics measures visits and sign-in or purchase steps using browser identifiers and a pseudonymous account identifier. Optional server-side checkout and confirmed-purchase events include the transaction identifier, product, amount, and currency; availability depends on analytics configuration and an available browser analytics identifier. Analytics events exclude account emails, names, font descriptions, and payment card details.',
  '',
  `- [About](${SITE_URL}/about): Free tools, optional paid AI fonts, output types, and service scope.`,
  `- [Contact](${SITE_URL}/contact): Support for site issues, AI font purchases, refunds, and privacy requests.`,
  `- [Privacy Policy](${SITE_URL}/privacy): Local processing for free tools, AI account and payment data, external generation and safety services, storage, and deletion requests.`,
  `- [Terms of Use](${SITE_URL}/terms): Free and paid service terms, one-time AI font credits, delivery, usage, and refund conditions.`,
  `- [XML Sitemap](${SITE_URL}/sitemap.xml): Complete crawlable URL inventory.`,
  '',
].join('\n');

export function GET() {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
