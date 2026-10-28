import type { PageDefinition } from './data';
import { discoveryStyleIds } from './discovery-catalog';

const textFaq = [
  { q: 'Do these results install a font?', a: 'No. They are Unicode characters you can copy. The destination controls their appearance and may reject some characters. Keep essential information and searchable names in ordinary text.' },
  { q: 'Is it free, and where is my text processed?', a: 'Conversion runs locally in your browser without an account or payment. Input accepts up to 1,000 characters per edit. Switching generators starts the destination example; switching options on this page keeps your input.' },
];
const artFaq = [
  { q: 'Can I download a transparent PNG?', a: 'Yes. Choose Transparent background to remove the scene while keeping the lettering effects. Banner exports are 2000 × 1000 pixels and square exports are 1600 × 1600 pixels.' },
  { q: 'Does this create an installable font or use AI?', a: 'No. These are original preset compositions rendered with locally hosted open-source Latin fonts. No AI service, font-file generation, login, payment or watermark is involved.' },
  { q: 'Can I use Japanese or other scripts?', a: 'The bundled display fonts cover Latin text. Other scripts stay in your input but may use a device fallback. This is not translation, and a Latin preset does not create Japanese letterforms. Check the preview before downloading.' },
];
type Entry = Omit<PageDefinition, 'category' | 'metaTitle' | 'metaDescription' | 'defaultStyleIds'> & { artwork?: boolean };
const entries: Entry[] = [
  {
    slug: 'old-english-font-generator', title: 'Old English Font Generator', icon: '𝔄',
    description: 'Copy Old English letters in classic or bold blackletter. Style a name, add an optional royal frame and explore uppercase and lowercase alphabets.',
    content: 'Old English font commonly describes the angular blackletter look used for names, monograms and decorative headings. This tool offers classic Fraktur and bold blackletter as copyable Unicode, with an optional crown or bracket frame. Start with a short name so the letter shapes remain easy to recognize.\n\nOpen the alphabet chart to compare uppercase and lowercase forms or copy a complete alphabet. Supported Latin letters are styled; numbers, punctuation and other scripts retain their spelling. Detected links and social references stay unchanged. These mathematical letter characters are not the same thing as installing a historical typeface.\n\nThis page changes the appearance of text, not its language: modern English stays modern English. For broader dark aesthetics visit Goth Font Generator; for a focused letter-style comparison visit Fraktur. Use a real licensed typeface in design software when you need precise printed typography.',
    howToUse: 'Enter a name or phrase, compare classic and bold blackletter, optionally choose a frame and tap a result to copy. Open the alphabet chart for individual letter forms.',
    examples: [{ before: 'Royal', after: 'ℜ𝔬𝔶𝔞𝔩', note: 'Classic Fraktur' }, { before: 'Royal', after: '𝕽𝖔𝖞𝖆𝖑', note: 'Bold blackletter' }],
    faq: [{ q: 'Is this an Old English translator?', a: 'No. It styles letters without translating the words or changing their meaning.' }, { q: 'Why do numbers look ordinary?', a: 'These blackletter alphabets do not provide matching mathematical blackletter digits. The tool keeps numbers readable instead of substituting unrelated symbols.' }, ...textFaq],
    relatedSlugs: ['fraktur-font-generator', 'goth-font-generator', 'medieval-font-generator', 'tattoo-font-generator'],
  },
  {
    slug: 'whatsapp-font-generator', title: 'WhatsApp Font Generator', icon: '💬',
    description: 'Create WhatsApp fancy text or native message formatting. Copy bold, italic, script and more, with a separate formatting source and live preview.',
    content: 'WhatsApp text styling has two different mechanisms. Fancy text substitutes Unicode characters for supported letters, so you can try a short styled name, group title or message. Native message formatting uses delimiters that WhatsApp interprets as bold, italic, strikethrough or code. Choose the output type before copying.\n\nThe Message formatting option shows four basic formats and a monospace result. Each card contains the source you will paste, while the preview illustrates the selected appearance. Formatting belongs in messages; profile fields do not interpret the same shortcuts. If your input already contains a conflicting delimiter, the affected result explains the conflict without deleting your words.\n\nFancy text protects detected URLs and references. It does not change the WhatsApp interface font, install a keyboard, or make text a different color. Keep long conversations readable and test decorative names in the exact field before saving. This is an independent tool with no Meta affiliation.',
    howToUse: 'Type a short message, choose Fancy text or Message formatting and copy a result. For formatting, paste into a WhatsApp message and inspect it before sending.',
    examples: [{ before: 'Hello', after: '𝗛𝗲𝗹𝗹𝗼', note: 'Copyable Unicode' }, { before: 'Hello', after: '*Hello*', note: 'WhatsApp bold source' }],
    faq: [{ q: 'Can I use the bold shortcut in my name?', a: 'Native formatting shortcuts are intended for message text. Use a Unicode alternative for a supported display field and check the saved result.' }, { q: 'Can this make colored WhatsApp text?', a: 'No. Color is controlled by WhatsApp, not by copied Unicode characters.' }, ...textFaq],
    relatedSlugs: ['snapchat-font-generator', 'keyboard-font-generator', 'discord-font-generator', 'bold-text-generator'],
  },
  {
    slug: 'square-text-generator', title: 'Square Text Generator', icon: '🄰',
    description: 'Turn letters into outline, filled or alternating Unicode squares. Add optional spacing and copy boxed text for short names, labels and headings.',
    content: 'Square text places each Latin letter inside its own box. Choose outline squares for a light border, filled squares for a heavier label, or an alternating black-and-white pattern. The optional spacing control adds a gap between consecutive letters without changing your original input.\n\nUnicode square alphabets are uppercase. Lowercase Latin input becomes boxed capitals, while digits, punctuation, line breaks, emoji and other scripts remain unchanged. Accents are retained, although their placement depends on the device font. Filled letters can display as colored emoji on some platforms; the tool cannot force a single black-and-white rendering everywhere.\n\nUse boxed letters for short names, menu labels and optional headings. Long paragraphs are difficult to scan in enclosed alphabets. A square text result is still text, not a square image or a border drawn around an entire paragraph. Original text remains available alongside the three square styles.',
    howToUse: 'Type your text, compare outline, filled and alternating square letters, optionally add letter spacing and tap the result you want to copy.',
    examples: [{ before: 'Hello', after: '🄷🄴🄻🄻🄾', note: 'Outline squares' }, { before: 'Hello', after: '🅷🅴🅻🅻🅾', note: 'Filled squares' }],
    faq: [{ q: 'Can square text preserve lowercase?', a: 'The square alphabets used here contain capital Latin letters. The tool preserves your input separately but converts supported letters to boxed capitals in styled results.' }, ...textFaq],
    relatedSlugs: ['bubble-font-generator', 'gaming-font-generator', 'keyboard-font-generator', 'small-caps-generator'],
  },
  {
    slug: 'snapchat-font-generator', title: 'Snapchat Font Generator', icon: '👻',
    description: 'Create copyable Snapchat display-name, chat and caption styles. Compare bold, script, bubble and gothic text with a display-name length estimate.',
    content: 'A Snapchat display name, a chat message and a Snap caption are different destinations. Select the place where you plan to paste your text, then compare a small set of readable bold, script, small-cap, bubble and blackletter styles. Your input stays in place when you switch destinations.\n\nDisplay names are separate from unique usernames. Snapchat documents a 30-character display-name limit; this workspace shows a visible-character estimate for each result. Combining marks and platform validation can count differently, so the final field is the authority. The tool does not check username availability or bypass naming rules.\n\nCopied Unicode keeps its characters, but the app and device determine their appearance. It does not copy a custom color, replace Snapchat’s interface font or recreate the in-app caption font carousel. Keep a plain-text fallback and test the saved result. This unofficial tool does not require Snapchat credentials.',
    howToUse: 'Enter text, choose Display name, Chat or Caption, and copy a style. For names, check the estimate and confirm the result in Snapchat before saving.',
    examples: [{ before: 'Sunny', after: '𝗦𝘂𝗻𝗻𝘆', note: 'Bold display text' }, { before: 'Sunny', after: 'Ⓢⓤⓝⓝⓨ', note: 'Circled letters' }],
    faq: [{ q: 'Can I use these styles in my @username?', a: 'Do not assume so. Usernames have separate restrictions; this tool targets editable display text and does not validate account usernames.' }, ...textFaq],
    relatedSlugs: ['whatsapp-font-generator', 'instagram-font-generator', 'preppy-font-generator', 'name-font-generator'],
  },
  {
    slug: 'sad-font-generator', title: 'Sad Font Generator', icon: '🥀',
    description: 'Style sad captions with delicate script, gothic letters or broken strokes. Add a broken heart, rain or wilted rose frame and copy your text.',
    content: 'Sad typography is a mood rather than a single alphabet. A quiet italic line, a delicate script name and heavy blackletter each communicate a different tone. This tool lets you compare them using your own wording, then add an optional broken heart, rain symbol or wilted rose.\n\nCrossed-out words and broken strokes use restrained combining overlays instead of dense random noise. Decorations apply to nonblank lines, so a multiline caption retains its structure. Detected links and references are protected, and the original spelling stays available without a frame. Existing emoji sequences are kept together.\n\nThese are copyable characters and symbols, not fading ink, transparency or colored images. Their appearance varies by device. Use a short expressive accent and keep the main message readable. If you want a stronger distortion effect, the separate Zalgo tool provides intensity controls.',
    howToUse: 'Enter your own caption, choose an optional mood decoration, compare the alphabets and broken-stroke results, then tap a card to copy.',
    examples: [{ before: 'Miss you', after: '💔 𝑀𝑖𝑠𝑠 𝑦𝑜𝑢 💔', note: 'Italic mood text' }, { before: 'Gone', after: 'G̶o̶n̶e̶', note: 'Crossed-out words' }],
    faq: [{ q: 'Does this write sad quotes for me?', a: 'No. It styles the text you supply. It does not generate lyrics, quotes or AI captions.' }, ...textFaq],
    relatedSlugs: ['goth-font-generator', 'strikethrough-text-generator', 'aesthetic-font-generator', 'zalgo-text-generator'],
  },
  {
    slug: 'reddit-font-generator', title: 'Reddit Font Generator', icon: '↗',
    description: 'Create Reddit Unicode text or desktop Markdown source. Preserve u/name, r/community and links, and compare source with an illustrative preview.',
    content: 'Reddit posts and comments can use native formatting, while short decorative accents can use Unicode letters. This tool separates Fancy text from Desktop Markdown. The first produces copyable styled characters; the second produces bold, italic, strikethrough and inline-code source for a desktop Markdown editor.\n\nReddit’s mobile app is transitioning to a rich text composer, where typed Markdown may remain literal text. Use its formatting controls on mobile. The source generated here belongs in the Markdown editor on reddit.com or old.reddit.com, and the preview is illustrative rather than a complete Reddit parser. Existing Markdown punctuation is escaped for emphasis formats; code spans use a delimiter long enough to preserve backticks.\n\nIn Fancy text mode, detected u/name and r/community references, URLs and other social entities keep their ordinary spelling. Community rules may restrict decorative content, and user flair depends on moderator settings. Keep searchable titles and important information readable. The linked Reddit guide explains the tradeoffs in more detail.',
    howToUse: 'Enter a short phrase, choose Fancy text or Desktop Markdown, and copy a result. Paste Markdown into a desktop Markdown editor; use native rich text controls on mobile.',
    examples: [{ before: 'Weekly thread', after: '𝗪𝗲𝗲𝗸𝗹𝘆 𝘁𝗵𝗿𝗲𝗮𝗱', note: 'Unicode accent' }, { before: 'Weekly thread', after: '**Weekly thread**', note: 'Desktop Markdown bold' }],
    faq: [{ q: 'Why does Markdown show its stars in the mobile app?', a: 'Reddit is moving its mobile app to rich text editing. Use the app’s formatting controls; generated Markdown is intended for desktop Markdown editors.' }, { q: 'Does the tool preserve subreddit links?', a: 'Fancy text preserves detected r/community and u/name references as well as URLs. Always inspect the final result, especially for unusual link syntax.' }, ...textFaq],
    relatedSlugs: ['reddit-fancy-text-guide', 'discord-font-generator', 'bold-text-generator', 'small-text-generator'],
  },
  {
    slug: 'keyboard-font-generator', title: 'Keyboard Font Generator', icon: '⌨',
    description: 'Make stylish text with your normal phone keyboard. Preview bold, script, bubble and more, then tap to copy. No keyboard app installation required.',
    content: 'You can create decorative text without adding another keyboard to your phone. Type with your usual keyboard in this browser workspace, compare the live results and tap a card to copy. Then switch to your messaging or social app and paste into a supported text field.\n\nThe available alphabets include bold, italic, script, small caps, circled letters, monospace and double-struck text. They are Unicode character substitutions, not downloadable keyboard themes. The destination app decides how the characters render and whether they are accepted. Links and detected references stay in ordinary characters.\n\nThis tool does not install a system keyboard, request full keyboard access, change your device font or type directly into other apps. It is useful for occasional names and captions. If you need native message formatting instead, the WhatsApp and Reddit tools explain their platform-specific options.',
    howToUse: 'Type using your normal keyboard, tap a result to copy, switch to the destination app and paste. Clear the input to begin another phrase.',
    examples: [{ before: 'Hello', after: '𝗛𝗲𝗹𝗹𝗼', note: 'Bold text' }, { before: 'hello', after: '𝕙𝕖𝕝𝕝𝕠', note: 'Double-struck lowercase example' }],
    faq: [{ q: 'Will this add a new keyboard to my phone?', a: 'No. It is a web-based copy-and-paste tool. Your normal keyboard and device font remain in place.' }, ...textFaq],
    relatedSlugs: ['whatsapp-font-generator', 'snapchat-font-generator', 'square-text-generator', 'cursive-font-generator'],
  },
  {
    slug: 'neon-font-generator', title: 'Neon Font Generator', icon: '✺', artwork: true,
    description: 'Create glowing neon text with tube outlines, colored halos and sign presets. Customize your lettering and download a free transparent PNG.',
    content: 'Neon lettering depends on light, color and the outline of a real typeface. This studio renders a bright tube core with layered colored halos, or softer filled glow lettering. Choose a script sign, a tall display face or a compact sign preset, then tune the colors and glow strength.\n\nThe dark sign scene makes the light easy to inspect; transparent export removes the scene while retaining the lettering and its halo. Size and letter spacing are adjustable, and long lines fit inside the canvas with space reserved for the effect. Banner and square formats support short titles, invitations and thumbnails.\n\nA neon effect cannot travel as plain copied text. Download PNG to preserve the appearance. These are static browser-rendered compositions, not animated lights, a physical sign quotation, SVG paths or an installable font. Each locally hosted Latin typeface has a license link in the workspace.',
    howToUse: 'Enter a short title, choose a neon preset, adjust tube color and glow, select a background or transparency and download PNG when the preview is ready.',
    examples: [{ before: 'Stay Electric', after: 'Pink script with a bright tube core and layered halo', note: 'PNG artwork' }, { before: 'OPEN LATE', after: 'Cyan display sign on a dark grid', note: 'PNG artwork' }],
    faq: [{ q: 'Will copying text keep the neon glow?', a: 'No. Light and color are visual effects. Download the PNG and use it as an image.' }, ...artFaq],
    relatedSlugs: ['cyberpunk-font-generator', 'fire-font-generator', 'y2k-font-generator', '3d-font-generator'],
  },
  {
    slug: 'cyberpunk-font-generator', title: 'Cyberpunk Font Generator', icon: '⌁', artwork: true,
    description: 'Create cyberpunk title artwork with chromatic splits, sliced lettering and scanlines. Export PNG or switch to separate copyable nickname styles.',
    content: 'Cyberpunk title design combines sharp display lettering with digital interference and industrial contrast. This workspace offers original yellow-and-black, cyan-magenta, terminal and warning-sign presets. Slice displacement and chromatic offsets give the text a fragmented signal effect; background scanlines stay separate from the transparent lettering.\n\nCustomize the primary and accent colors, text size, spacing and distortion strength. Switching presets retains your wording. Export a banner or square PNG, optionally with a transparent background. The separate Copyable text mode offers Unicode nickname alternatives, which do not reproduce the artwork effects.\n\nThese are original genre-inspired compositions using open-source Latin fonts. They are not official Cyberpunk 2077 logos or proprietary game fonts. The tool does not generate AI images, translate text or create a TTF. Keep important names readable, and use the Neon tool if you prefer continuous glowing lettering.',
    howToUse: 'Enter a title, select a signal or industrial preset, tune distortion and colors, then download PNG. Choose Copyable text separately for nickname characters.',
    examples: [{ before: 'NIGHT SIGNAL', after: 'Yellow sliced display lettering with cyan offsets', note: 'PNG artwork' }, { before: 'Night', after: 'Ｎｉｇｈｔ', note: 'Separate copyable fullwidth text' }],
    faq: [{ q: 'Is this the official Cyberpunk 2077 font?', a: 'No. These are original futuristic presets. No official game logo or proprietary font is included.' }, ...artFaq],
    relatedSlugs: ['neon-font-generator', 'glitch-font-generator', 'gaming-font-generator', 'y2k-font-generator'],
  },
  {
    slug: 'anime-font-generator', title: 'Anime Font Generator', icon: '✧', artwork: true,
    description: 'Design anime-inspired title artwork with bold outlines, candy colors and action accents. Download PNG or copy separate fan-name text styles.',
    content: 'Anime-inspired lettering can mean a colorful title card or a decorative fan name. This studio leads with title artwork: rounded candy lettering, high-energy action type, marker lettering and retro space-title presets. Each combines a real Latin typeface with outlines, gradients and original background accents.\n\nAdjust colors, outline strength, size, spacing and alignment, then export a square or banner PNG. Transparent background keeps the lettering and removes the scene. A separate Copyable text mode provides simple Unicode fan-name styles and optional stars, while retaining the same input when switching modes.\n\nThis tool does not replace English with random Japanese characters, translate names or reproduce a particular anime logo. Bundled fonts cover Latin lettering; Japanese and other scripts may use the device’s fallback font, so inspect the preview. Use the original plain spelling for searchable names and the PNG for visual titles.',
    howToUse: 'Type a title, select an anime-inspired preset, adjust the outline and colors and download PNG. Switch to Copyable text when you need a fan nickname instead of an image.',
    examples: [{ before: 'Dream Squad', after: 'Candy-colored rounded title with a bold outline', note: 'PNG artwork' }, { before: 'Luna', after: '✦ Ⓛⓤⓝⓐ ✦', note: 'Separate copyable fan name' }],
    faq: [{ q: 'Does this translate my name into Japanese?', a: 'No. It styles your supplied text. Japanese input is retained but may use a device fallback because the bundled title fonts cover Latin characters.' }, ...artFaq],
    relatedSlugs: ['gaming-font-generator', 'k-pop-font-generator', 'neon-font-generator', 'comic-font-generator'],
  },
];

export const discoveryKeywordPages: PageDefinition[] = entries.map(({ artwork, ...entry }) => ({
  ...entry, category: 'styles', metaTitle: `${entry.title} — ${artwork ? 'Free PNG Maker' : 'Copy & Paste'}`,
  metaDescription: entry.description, defaultStyleIds: discoveryStyleIds[entry.slug] ?? [],
}));
