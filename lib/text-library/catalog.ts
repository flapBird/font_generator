// This catalog is separate from the font-style registry: old directories stay unchanged.
export type UnicodeUtilityId = 'unicode-character-inspector' | 'invisible-character-remover' | 'fancy-text-to-normal-text';
export type LibraryId = 'symbols' | 'hearts' | 'stars' | 'arrows' | 'kaomoji' | 'emoji-combos' | 'unicode-tools' | 'invisible-character' | 'signature-generator' | UnicodeUtilityId;
export type LibraryPageDefinition = {
  id: LibraryId; path: string; title: string; description: string; intro: string; icon: string;
  sections: { title: string; text: string }[];
  related: LibraryId[];
};

export const libraryPages: LibraryPageDefinition[] = [
  {
    id: 'signature-generator', path: '/signature-generator', title: 'Signature Generator', icon: '✍',
    description: 'Type a signature in six real handwriting fonts or draw with a mouse, pen or finger. Download an automatically cropped transparent PNG, free and without sign-in.',
    intro: 'Make a signature image from your name, or draw it yourself. Choose your ink and download a transparent PNG ready to place in your design.',
    sections: [
      { title: 'Type or draw your signature', text: 'Typed mode renders your name using Allura, Dancing Script, Great Vibes, Sacramento, Caveat or Patrick Hand. Draw mode supports mouse, touch and pen input, stroke undo and clearing. Your typed name and drawing remain separate while you switch modes on this page.' },
      { title: 'A transparent image with room to breathe', text: 'The preview shows your ink on white paper. Download exports only the ink, with transparent pixels around it and a small margin. Use letter size or stroke width to adjust the result. Colors and strokes are part of the image; it does not behave like editable text when pasted into a document.' },
      { title: 'What the tool creates', text: 'This is a signature image maker, not a font creator, handwriting clone, identity check or document-signing service. Names and drawings are processed locally and are not saved by the tool. Typed styles use Latin font subsets; other scripts may use fallback fonts, or you can draw them by hand.' },
    ], related: ['unicode-tools', 'symbols'],
  },
  {
    id: 'unicode-character-inspector', path: '/unicode-character-inspector', title: 'Unicode Character Inspector', icon: 'U+',
    description: 'Inspect code points, grapheme clusters, UTF-8 bytes and UTF-16 positions. Reveal formatting characters and copy a character report without uploading text.',
    intro: 'See what a piece of text contains, including the characters you cannot see. The original text stays unchanged.',
    sections: [
      { title: 'One visible character can contain several code points', text: 'A family emoji can contain several people joined with U+200D. An accented letter can be one precomposed character or a letter followed by a combining mark. Grapheme clusters describe user-perceived character boundaries; UTF-16 units are the units used by JavaScript strings.' },
      { title: 'Read the character report', text: 'Each row shows a code point, its position, a broad Unicode category, an escaped representation and UTF-8 bytes. Common controls and Latin letters have names; this compact inspector does not include the complete Unicode name database. An isolated surrogate is reported as invalid rather than silently repaired.' },
      { title: 'Inspect first, change deliberately', text: 'Formatting characters can affect line breaks, script shaping and reading direction. Inspecting does not remove them. Use the separate remover if you want to choose a specific kind of change and compare the result.' },
    ], related: ['unicode-tools', 'invisible-character-remover', 'invisible-character', 'fancy-text-to-normal-text'],
  },
  {
    id: 'invisible-character-remover', path: '/invisible-character-remover', title: 'Invisible Character Remover', icon: '⌫',
    description: 'Detect and selectively remove invisible characters or replace special spaces. Compare before and after while preserving emoji joiners and accents by default.',
    intro: 'Paste your text, choose the character types to change, and compare the result. All changes start off; your original stays available.',
    sections: [
      { title: 'Choose exactly what to clean', text: 'Options cover zero-width spaces, BOM and soft hyphens; special spaces; blank-looking Braille and Hangul characters; joiners; direction controls; and variation selectors. Normal spaces, tabs, line endings and accents are preserved unless a listed option explicitly applies.' },
      { title: 'Invisible does not mean unnecessary', text: 'Removing a joiner can split a family emoji or change the way letters connect. Removing direction controls can change reading order. Replacing a no-break space changes line wrapping. These options are separate and off by default so you can make an informed choice.' },
      { title: 'Check the difference before copying', text: 'The change summary counts affected code points by the selected operation. Expand the before-and-after code points to inspect invisible differences. This tool is not a complete sanitizer or a security audit and does not claim that the output is safe for every parser or platform.' },
    ], related: ['unicode-character-inspector', 'invisible-character', 'fancy-text-to-normal-text', 'unicode-tools'],
  },
  {
    id: 'fancy-text-to-normal-text', path: '/fancy-text-to-normal-text', title: 'Fancy Text to Normal Text', icon: 'Aa',
    description: 'Restore supported mathematical letter styles, fullwidth text, enclosed characters and super/subscripts to ordinary text, with optional small-cap and overlay handling.',
    intro: 'Turn supported decorative letters back into readable text. Preview the result and keep anything the tool cannot reliably restore.',
    sections: [
      { title: 'What this tool can restore', text: 'Supported compatibility forms include mathematical Latin letters and digits, selected script and blackletter symbols, fullwidth ASCII characters, enclosed alphanumerics and compatible superscripts or subscripts. Only supported characters that normalize to ASCII are replaced; a general normalization is not applied to the whole input.' },
      { title: 'Some styling loses information', text: 'Small caps may no longer reveal the original case. Their optional mapping returns the supported forms as lowercase. Mixed alphabets, decorative frames and arbitrary lookalikes cannot always be reversed. This tool preserves unsupported characters rather than guessing what you meant.' },
      { title: 'Keep emoji and accents intact', text: 'Joined emoji, flags, keycaps and emoji-presentation sequences are preserved. An optional setting removes only combining underline and overlay marks U+0332–U+0338, not ordinary accents or all Zalgo marks. Review mathematical content before using it, because removing styling can change meaning.' },
    ], related: ['unicode-character-inspector', 'invisible-character-remover', 'unicode-tools', 'symbols'],
  },
  {
    id: 'symbols', path: '/symbols', title: 'Symbols Copy and Paste', icon: '✦',
    description: 'Browse hearts, stars, arrows, brackets and decorative symbols. Search by name or code point, build a combination and copy it as plain text.',
    intro: 'Find a small detail for a bio, a clear arrow for a caption, or a border for a message. Choose a collection below, or browse all symbols here.',
    sections: [
      { title: 'A symbol library, ready to use', text: 'Choose a category or search for a name such as “white heart”, “rightwards arrow” or a code point such as U+2605. Tap a card to copy the exact characters. Add several items to your combination, reorder them, and edit the final text before copying.' },
      { title: 'Text symbols and emoji are different', text: 'A text symbol usually takes its shape and color from the surrounding font. Emoji may appear in color and vary between devices. A variation selector can request a presentation, but a destination app or font may still display it differently. We keep those sequences intact when copying.' },
      { title: 'Make decoration easy to read', text: 'Use short accents around a name or heading instead of replacing every word. Symbols may be read aloud by screen readers, and some services restrict them in usernames. Keep an ordinary-text version of important information.' },
    ], related: ['hearts', 'stars', 'arrows', 'kaomoji', 'emoji-combos', 'unicode-tools'],
  },
  {
    id: 'hearts', path: '/symbols/heart-symbols', title: 'Heart Symbols Copy and Paste', icon: '♡',
    description: 'Copy outline hearts, filled hearts, heart emoji and small heart decorations. Compare exact characters and build your own love-themed text.',
    intro: 'A simple ♡ for a quiet sign-off, a ♥ for a label, or a colorful heart for a message. Browse text hearts and emoji separately, then make your own combination.',
    sections: [
      { title: 'Choose an outline, a filled heart or an emoji', text: '♡ is WHITE HEART SUIT (U+2661), an outline text symbol. ♥ is BLACK HEART SUIT (U+2665), a filled text symbol whose appearance still depends on the app. ❤️ includes an emoji presentation selector; it is not the same sequence as ❤. The code points on each card identify what you copy.' },
      { title: 'Ideas for a heart accent', text: 'Try “Alex ♡”, “made with ♥”, or a pair of small hearts around a short greeting. For a colorful caption, add a heart from the Emoji category. The combination editor lets you include your own words without changing their letters.' },
      { title: 'Why a heart can change appearance', text: 'Copying preserves characters, not an image, color or installed font. The same heart can look different on a phone and a desktop. Colored hearts have context-dependent meanings; choose the one that fits your message rather than assuming a universal meaning.' },
    ], related: ['symbols', 'stars', 'kaomoji', 'emoji-combos'],
  },
  {
    id: 'stars', path: '/symbols/star-symbols', title: 'Star Symbols Copy and Paste', icon: '☆',
    description: 'Copy filled stars, outline stars, sparkles and decorative asterisks. Filter by shape, inspect code points and create a star combination.',
    intro: 'Browse solid and outline stars, little sparkles, and ornamental star shapes for ratings, headings and profile decorations.',
    sections: [
      { title: 'Stars for ratings and decoration', text: '★ and ☆ are a useful filled-and-outline pair for a simple text rating such as ★★★★☆. ✦ and ✧ make compact decorative accents. Sparkle emoji such as ✨ are a different choice and may render in color.' },
      { title: 'Different points, different shapes', text: 'The collection includes four-, five-, six- and eight-point forms. Names describe the encoded character; they do not guarantee an identical outline in every font. Use the shape filters to compare a small group before copying.' },
      { title: 'Keep ratings understandable', text: 'For a rating, add a readable label such as “4 out of 5” next to the stars. Decorative stars alone do not communicate the same information to every reader or assistive technology.' },
    ], related: ['symbols', 'hearts', 'arrows', 'emoji-combos'],
  },
  {
    id: 'arrows', path: '/symbols/arrow-symbols', title: 'Arrow Symbols Copy and Paste', icon: '→',
    description: 'Find arrows by direction and style: left, right, up, down, diagonal, double and curved. Copy the exact symbol or combine arrows with text.',
    intro: 'Point to the next step, show a return, or mark a direction. Search “right”, “down” or “double” and copy the arrow that fits your text.',
    sections: [
      { title: 'Match an arrow to its purpose', text: 'Use → for a next step, ← for a return direction, ↑ or ↓ for vertical movement, and ↔ for a two-way relationship. Curved arrows can suggest a return or rotation. Pair them with words when a direction needs to be unambiguous.' },
      { title: 'Single, double and decorative arrows', text: 'Double arrows such as ⇒ have specific meanings in some mathematical contexts. Decorative arrows are useful in captions but should not replace the accessible label on a real navigation button. Search includes the official character name and its code point.' },
      { title: 'Copying into documents and apps', text: 'These are Unicode characters, not drawn shapes. They can be pasted into ordinary text fields if the destination allows them. If an arrow appears as a box, try a simpler arrow or a font with broader symbol coverage.' },
    ], related: ['symbols', 'stars', 'unicode-tools'],
  },
  {
    id: 'kaomoji', path: '/kaomoji', title: 'Kaomoji Copy and Paste', icon: '(^‿^)',
    description: 'Find happy, shy, sad, surprised, animal and action kaomoji. Copy complete faces, save favorites locally and combine them with your message.',
    intro: 'A little face for the feeling you want to share. Browse by mood, copy the whole expression, or add it to a message of your own.',
    sections: [
      { title: 'What is a kaomoji?', text: 'Kaomoji are text faces built from punctuation, letters and symbols. Many are read upright, such as (^‿^), rather than sideways like :-). The mood labels here are suggestions for use, not fixed definitions.' },
      { title: 'Copy the whole expression', text: 'Each bracket, space and combining mark can contribute to a face. Copying a complete card keeps the sequence together. Wide faces may wrap in a narrow chat bubble; choose a shorter expression when space is limited.' },
      { title: 'A reply that still sounds like you', text: 'Add a cheerful face after a thank-you, a waving face to a greeting, or a sleepy face to a good-night message. Include words when the emotion might otherwise be unclear. Favorites are stored in this browser and can be cleared here.' },
    ], related: ['emoji-combos', 'hearts', 'symbols'],
  },
  {
    id: 'emoji-combos', path: '/emoji-combos', title: 'Emoji Combos Copy and Paste', icon: '🌙',
    description: 'Browse curated emoji combinations for cozy days, nature, travel, celebrations and more. Edit your combination and copy it without signing in.',
    intro: 'Little collections for a caption, a mood or a moment. Pick a theme and make a combination your own before sharing it.',
    sections: [
      { title: 'Combinations for everyday moments', text: 'Pair coffee with a book for a quiet morning, a wave with a shell for a beach day, or a cake with confetti for a birthday. These are editorial suggestions, not emoji translations or universal meanings.' },
      { title: 'Build your own caption', text: 'Add one or more combinations, move the pieces into order, and choose a separator. You can also add words or edit the final text. The clipboard receives plain text; we do not merge emoji into a new image or sticker.' },
      { title: 'How emoji travel between devices', text: 'Phones, apps and fonts supply their own emoji artwork. A newer emoji may appear as a box on an older system. We preserve variation selectors and joined sequences when copying, but the destination controls the final appearance.' },
    ], related: ['kaomoji', 'hearts', 'stars', 'symbols'],
  },
  {
    id: 'unicode-tools', path: '/unicode-tools', title: 'Unicode Text Tools', icon: 'U+',
    description: 'Inspect Unicode characters, selectively remove invisible text, restore supported fancy letters, or copy exact blank characters with free browser-based tools.',
    intro: 'Understand the characters behind the text. Inspect code points, choose what to clean, restore supported letter styles or copy an exact blank character.',
    sections: [
      { title: 'Choose a tool by the result you need', text: 'Inspect characters and their encoding, select invisible character types to remove, restore supported fancy letters, or copy a specific blank character. Symbols lets you browse visible characters. Font Styles changes supported letters into copyable Unicode alternatives.' },
      { title: 'Characters are not font files', text: 'Unicode identifies characters; a font supplies their shapes. Copying text does not install a typeface. If you need a PNG image or an installable font, use the separate artwork or AI font tools and review their output descriptions.' },
    ], related: ['invisible-character', 'unicode-character-inspector', 'invisible-character-remover', 'fancy-text-to-normal-text', 'symbols'],
  },
  {
    id: 'invisible-character', path: '/invisible-character', title: 'Invisible Character Copy and Paste', icon: '␣',
    description: 'Copy a chosen invisible or blank character, repeat it up to 100 times and inspect pasted text for supported blank characters. See exact Unicode code points.',
    intro: 'Choose the exact character you need, copy it, and paste into the checker to see what arrived. A blank-looking character is not necessarily a space.',
    sections: [
      { title: 'Blank text and zero-width text', text: 'A normal space and a no-break space occupy width. A zero-width space (U+200B) normally does not, and can provide a line-break opportunity. Braille Pattern Blank (U+2800) looks empty in many fonts but is a Braille character, not a whitespace character.' },
      { title: 'Check before using a blank nickname', text: 'Games and social apps can reject, trim or replace these characters. A successful copy here does not verify acceptance in a username, bio or message. Paste into the checker to inspect the exact sequence; an empty field and a field containing a blank character are different.' },
      { title: 'Inspect without silently changing text', text: 'The checker counts code points, UTF-16 units and grapheme clusters, and lists the supported blank and formatting characters it finds. It does not remove anything. Joiners and variation selectors can be important for emoji and other scripts, so they are reported separately and preserved.' },
    ], related: ['unicode-tools', 'symbols', 'kaomoji'],
  },
];

export function getLibraryPage(id: LibraryId) {
  return libraryPages.find((page) => page.id === id)!;
}

export type LibraryItem = { id: string; text: string; name: string; category: string; tags: string[]; family: string };
