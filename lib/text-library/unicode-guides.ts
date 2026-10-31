import type { LibraryId } from './catalog';
import type { CollectionGuide } from './guides';

// Explanations follow the actual local tools; they are not loaded by the header.
export const unicodeGuides: Partial<Record<LibraryId, CollectionGuide>> = {
  'unicode-tools': {
    heading: 'What are Unicode text tools?',
    paragraphs: [
      'Unicode text tools help you examine or change the characters inside a string. Text that looks identical can contain different code points: é can be a single character or an e followed by a combining accent. Spaces and formatting characters can also affect text without leaving a visible mark.',
      'This directory offers four tasks: inspect characters, selectively remove invisible characters, restore supported fancy letters to ordinary text, and copy a chosen blank character. These tools work with text, not font files or pictures. Choose a tool for the change you actually need; inspecting text never changes it.',
    ],
    howToHeading: 'How to choose and use a Unicode tool',
    steps: [
      { title: 'Choose your task', text: 'Use Character Inspector to understand a string, Invisible Character Remover to make selected changes, Fancy Text to Normal Text to restore supported letter styles, or Invisible Character to copy blank text.' },
      { title: 'Paste or select your text', text: 'Paste into the chosen tool. For blank text, select a character type and a repeat count instead. Read the available options before changing joiners, spaces or letter styles.' },
      { title: 'Review, then copy', text: 'Check the report or compare the original and result. Use the matching Copy button and paste into your destination. Test the pasted text there because apps can handle characters differently.' },
    ],
    faq: [
      { question: 'Which tool should I start with if text looks wrong?', answer: 'Start with Unicode Character Inspector when you do not know what is in the string. It shows code points and encoding information without changing the input. Choose a separate cleanup tool only after identifying what needs to change.' },
      { question: 'Do these tools create or convert font files?', answer: 'No. They inspect, copy or change Unicode text. They do not create TTF, OTF or WOFF files, identify fonts from pictures or change the font installed in another app.' },
      { question: 'Will cleaning text keep all emoji and languages intact?', answer: 'The remover starts with every change disabled. Turning on joiner, direction-control or variation-selector removal can change emoji or writing systems. Review the result; blanket removal is not suitable for every string.' },
      { question: 'Do I need an account or an upload?', answer: 'No account is required for these free tools. Their processing runs in your browser, and tool input stays in page memory. Switching to another tool opens its own example rather than carrying your input across.' },
      { question: 'Can I use the tools on a phone?', answer: 'Yes. Open a tool, paste from your keyboard or long-press Paste, adjust its controls and tap Copy. If the browser blocks automatic clipboard access, use the selectable manual-copy text provided by the copy control.' },
    ],
  },
  'unicode-character-inspector': {
    heading: 'What is a Unicode Character Inspector?',
    paragraphs: [
      'A Unicode Character Inspector reveals the code points that make up pasted text. It helps explain why an emoji counts as several units, why two similar-looking strings differ, or where an invisible formatting character appears. The report includes UTF-16 offsets, escaped forms, broad categories and UTF-8 bytes.',
      'For example, é and é can look alike while using different sequences. A joined family emoji also contains more than one code point. The inspector preserves the exact input; it does not normalize accents, repair invalid surrogates or remove characters.',
    ],
    howToHeading: 'How to inspect Unicode characters',
    steps: [
      { title: 'Paste the text', text: 'Replace the example in Text to inspect with the string you want to check. The input accepts up to 2,000 UTF-16 units; an oversized edit keeps the previous text rather than truncating it.' },
      { title: 'Read the report', text: 'Compare the code point, grapheme-cluster and UTF-16 totals. Read the rows for character values, offsets and bytes. Use Show next 80 code points when a longer report has more rows.' },
      { title: 'Copy your findings', text: 'Use Copy character report to copy the complete report, including rows not yet displayed. Use Clear input to inspect another string. Cleanup is available in the separate remover.' },
    ],
    faq: [
      { question: 'Why do the three character counts disagree?', answer: 'A code point is one Unicode value, a grapheme cluster groups characters as users perceive them, and UTF-16 units measure the storage units used by JavaScript strings. Joined emoji and combining accents can produce different totals.' },
      { question: 'Why does a character have no full Unicode name?', answer: 'This compact inspector includes names for common controls and Latin characters, not the complete Unicode name database. An unnamed row still exposes its code point and encoding information.' },
      { question: 'Does inspecting text remove hidden characters?', answer: 'No. Inspection is read-only. The input and its character sequence remain unchanged. Use Invisible Character Remover if you want to choose and preview a specific cleanup operation.' },
      { question: 'Does Copy character report include rows I have not opened?', answer: 'Yes. Pagination limits the number of visible rows, not the copied report. The report includes every code point within the accepted input.' },
      { question: 'Is this a complete security or spoofing check?', answer: 'No. Showing code points can help explain a string, but the inspector does not establish that a username, URL or document is safe. It is not a complete Unicode name database or security scanner.' },
    ],
  },
  'invisible-character-remover': {
    heading: 'What is an Invisible Character Remover?',
    paragraphs: [
      'An Invisible Character Remover lets you change selected blank-looking and formatting characters in pasted text. It can help with unexpected spacing or copied text containing zero-width characters, while keeping the original available for comparison.',
      'Not all invisible characters are mistakes. Joiners can connect emoji and letters, no-break spaces affect wrapping, and direction controls affect reading order. This tool therefore starts with every operation off and shows the changes you choose instead of silently applying a blanket cleanup.',
    ],
    howToHeading: 'How to remove invisible characters',
    steps: [
      { title: 'Paste the original', text: 'Enter up to 2,000 UTF-16 units in the input. With no options selected, the output matches the original. Inspect unfamiliar characters first if you are unsure what they do.' },
      { title: 'Enable a specific operation', text: 'Select the relevant removal or space-replacement option. Joiners, direction controls and variation selectors have separate switches because changing them can affect visible text.' },
      { title: 'Compare and copy', text: 'Read the change summary and expand the before-and-after code points when the difference is invisible. Check the output before using the Copy result card, then test it in your destination.' },
    ],
    faq: [
      { question: 'Why is my output unchanged when I paste text?', answer: 'All cleanup options start disabled. Select the operation you want. If the text contains no characters targeted by that operation, there is nothing to change.' },
      { question: 'Can removal break a family emoji or change connected letters?', answer: 'Yes, if you explicitly enable joiner removal. A joined emoji can split into separate symbols, and some scripts use joiners to control shaping. Leave that option off unless you intend the change.' },
      { question: 'Does this remove ordinary spaces and line breaks?', answer: 'The listed operations preserve normal spaces, tabs and line endings. Special-space replacement changes supported special spaces into ordinary spaces; it is not a trim-all-whitespace function.' },
      { question: 'Can I recover the original after changing the options?', answer: 'The original input remains available on the current page. Turn off the selected options to return to the unchanged result. The tool does not save a permanent edit history after you leave the page.' },
      { question: 'Does cleaned text become safe for every website or parser?', answer: 'No. This tool changes only the supported character types selected by you. Destination-specific validation and security checks are separate concerns.' },
    ],
  },
  'fancy-text-to-normal-text': {
    heading: 'What is Fancy Text to Normal Text?',
    paragraphs: [
      'Fancy Text to Normal Text replaces supported decorative Unicode letters and numbers with ordinary characters. For example, mathematical bold 𝐇𝐞𝐥𝐥𝐨 becomes Hello, and fullwidth ＡＢＣ becomes ABC. This can make supported styled text easier to edit or search.',
      'It works on characters, not screenshots or the visual font applied by an editor. Some styles lose information: small capitals may not reveal the original case, and arbitrary lookalikes cannot always be reversed. Unsupported characters are kept instead of guessed.',
    ],
    howToHeading: 'How to turn fancy text into normal text',
    steps: [
      { title: 'Paste styled text', text: 'Replace the example with up to 2,000 UTF-16 units. Supported mathematical Latin, fullwidth ASCII, enclosed alphanumerics and compatible super/subscript forms are restored automatically.' },
      { title: 'Choose optional handling', text: 'Enable small-cap conversion only when lowercase recovery is acceptable. Enable combining underline and overlay removal if you want to remove the supported decoration marks.' },
      { title: 'Review and copy', text: 'Compare the original with the normal-text result, especially names, mathematical content and unsupported symbols. Use the Copy result card to copy the result for your destination.' },
    ],
    faq: [
      { question: 'Can every fancy text style be reversed?', answer: 'No. Decorative frames, mixed alphabets and arbitrary lookalikes may not have an unambiguous original. The tool restores its supported compatibility forms and preserves unsupported characters.' },
      { question: 'Will this remove accents or split emoji?', answer: 'The default conversion preserves ordinary accents and emoji sequences. The optional decoration setting targets combining underline and overlay marks U+0332–U+0338, not every combining mark.' },
      { question: 'Why do small capitals become lowercase?', answer: 'The original capitalization is not always recoverable from small-cap characters. The separate optional mapping returns supported small-cap forms as lowercase rather than inventing the original case.' },
      { question: 'Can it read styled text from an image or PDF screenshot?', answer: 'No. Paste actual text into the input. This tool does not perform OCR or recognize a font from an image.' },
      { question: 'Does normalizing mathematical letters always preserve meaning?', answer: 'No. Styled letters can have specific meanings in mathematics. Review those expressions before using the ordinary-letter result; the tool converts characters without interpreting the expression.' },
    ],
  },
  'invisible-character': {
    heading: 'What is an invisible character?',
    paragraphs: [
      'An invisible character is a text character that may appear blank or have no visible width. The options here include spaces, zero-width formatting characters and blank-looking characters such as the Braille blank. These are different code points with different behavior, not interchangeable empty images.',
      'This tool copies one selected character repeated 1–100 times. Its brackets show the result boundaries and are not copied. The separate paste checker identifies supported blank and formatting characters without removing or normalizing them.',
    ],
    howToHeading: 'How to copy and check invisible text',
    steps: [
      { title: 'Select a character type', text: 'Choose one of the eight types in Character type and read its note. A zero-width character may leave no gap, while other blanks can occupy visible space.' },
      { title: 'Set the repeat count and copy', text: 'Enter a whole number from 1 to 100, then tap Copy invisible text. Only the repeated character is copied, without the preview brackets.' },
      { title: 'Paste and verify', text: 'Paste into Check what you pasted to see counts and detected character types, then test in the intended app. The checker accepts up to 2,000 UTF-16 units and retains the pasted text unchanged.' },
    ],
    faq: [
      { question: 'Why does the preview look empty after copying?', answer: 'That is expected for a blank or zero-width character. The brackets are only visual boundaries. Paste into the checker to confirm the actual code point and count.' },
      { question: 'Will a blank username work in every game or social app?', answer: 'No. Each destination decides which characters are allowed. It may remove, reject or display a blank character differently; copying here cannot bypass those rules.' },
      { question: 'Is a zero-width space the same as a normal space?', answer: 'No. U+200B is a different code point from the ordinary U+0020 space. It may affect line breaking without displaying a gap. Read the note for the selected type before using it.' },
      { question: 'Does the checker remove invisible text?', answer: 'No. It reports supported characters and preserves the input. Use the separate Invisible Character Remover to select cleanup operations and compare a changed result.' },
      { question: 'Why is copying disabled for my repeat count?', answer: 'The repeat count must be a whole number from 1 to 100. Empty, fractional or out-of-range values are invalid. Correct the count before copying.' },
    ],
  },
};
