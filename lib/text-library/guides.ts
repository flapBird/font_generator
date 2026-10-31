import type { LibraryId } from './catalog';
import { unicodeGuides } from './unicode-guides';

export type SymbolCollectionId = 'symbols' | 'hearts' | 'stars' | 'arrows' | 'kaomoji' | 'emoji-combos';
export type CollectionGuide = {
  heading: string; paragraphs: string[]; howToHeading: string;
  steps: { title: string; text: string }[];
  faq: { question: string; answer: string }[];
};

// Editorial content stays server-side; the header imports only navigation-links.ts.
export const collectionGuides: Record<SymbolCollectionId, CollectionGuide> = {
  symbols: {
    heading: 'What are copy and paste symbols?',
    paragraphs: [
      'Copy and paste symbols are text characters you can use alongside ordinary letters: a heart after a name, an arrow between steps, or stars in a rating. This library brings 261 symbol sequences together so you can browse their shapes without remembering keyboard shortcuts or character codes.',
      'The copied result is plain text. It can go into a caption, message, document or profile field that accepts the characters. Its appearance comes from the destination font or emoji artwork, so the same symbol can look different between apps. Choosing a symbol here does not install a font.',
    ],
    howToHeading: 'How to copy and use symbols',
    steps: [
      { title: 'Find a symbol', text: 'Browse the grid, choose a category, or search for a name, character or code point such as U+2605. Use the collection tabs for hearts, stars and arrows.' },
      { title: 'Click to copy', text: 'Click the symbol card and wait for Copied. Paste into your destination with its Paste command. If automatic copying is unavailable, select the manual-copy text shown on the card.' },
      { title: 'Combine or save', text: 'Use + Add to build a line with several symbols and your own words. Copy the finished combination, or use the heart button to save a favorite in this browser.' },
    ],
    faq: [
      { question: 'Do I need to download a font to use these symbols?', answer: 'No. Copying places Unicode text on your clipboard. The app where you paste supplies the font. If that font lacks a character, it may display a box even though the copied text is correct.' },
      { question: 'What is the difference between a symbol and an emoji?', answer: 'Many text symbols follow the surrounding font and text color. Emoji often use colorful artwork supplied by the device. Some characters support both presentations; the library keeps their different sequences separate.' },
      { question: 'Can I use symbols in a username or bio?', answer: 'You can try pasting them into the field, but each service sets its own rules. A service may remove a symbol, count it differently toward a limit, or refuse it in a username while allowing it in a message.' },
      { question: 'How do I copy several symbols at once?', answer: 'Click + Add on each card. The bottom editor lets you add words and copy the whole line. Open Arrange pieces & spacing to reorder items or choose spaces, no separator, or new lines.' },
      { question: 'Where are my favorite symbols saved?', answer: 'Favorite and recent item IDs are stored in this browser when local storage is available. They do not sync between devices. Clear saved items removes both lists across the collections; clearing browser data can also remove them.' },
    ],
  },
  hearts: {
    heading: 'What are heart symbols?',
    paragraphs: [
      'Heart symbols include simple text shapes such as ♡ and ♥, ornamental hearts such as ❦, and colorful emoji such as ❤️. This collection contains 30 sequences, grouped into text hearts and emoji hearts so you can choose the kind of decoration you need.',
      'An outline heart works as a light accent after a name, while a filled heart can fit a short label such as “made with ♥”. Emoji hearts can add color to a greeting. Copying preserves the characters rather than a fixed picture, so always check the result in the app where you intend to use it.',
    ],
    howToHeading: 'How to copy a heart symbol',
    steps: [
      { title: 'Choose a heart style', text: 'Browse outline, filled and decorative shapes, or select Emoji hearts for colored hearts. Search for a name such as “white heart” to narrow the list.' },
      { title: 'Copy and paste', text: 'Click a heart card, wait for Copied, then paste it into a message, caption or document. The code points identify the exact sequence on the clipboard.' },
      { title: 'Make a heart decoration', text: 'Use + Add to pair hearts with your own text, for example ♡ Alex ♡. Change the order or spacing in the editor, then copy the complete line.' },
    ],
    faq: [
      { question: 'How can I copy an empty or outline heart?', answer: 'Choose White heart suit, ♡ (U+2661). It is an outline text symbol. White heart, 🤍, is a separate emoji and can have a shaded or filled appearance depending on the device.' },
      { question: 'Why do ❤ and ❤️ look different?', answer: '❤️ includes U+FE0F, an emoji presentation selector, after the heart. ❤ has no selector. Apps and fonts can render them differently; neither sequence guarantees the same appearance on every device.' },
      { question: 'Can I change the color of a text heart?', answer: 'A text heart such as ♡ usually takes the text color set by the destination app. Copying alone does not carry a chosen color. For a colored emoji, select one of the available colored heart characters.' },
      { question: 'Do heart colors have fixed meanings?', answer: 'Their meaning depends on the people and context. A color can suggest a mood or match a design, but the tool does not assign universal meanings or translate a heart into a specific message.' },
      { question: 'Can I put hearts on both sides of a name?', answer: 'Yes. Add a heart, edit the combined text to include your name, and add another heart. For a quick result, type a line such as ♡ Alex ♡ directly into the combination editor and copy it.' },
    ],
  },
  stars: {
    heading: 'What are star symbols?',
    paragraphs: [
      'Star symbols are text shapes used for ratings, highlights and decoration. This collection has 44 sequences, from the familiar ★ and ☆ to four-point accents such as ✦ and ✧, ornamental asterisks, and sparkle emoji.',
      'Choose a filled-and-outline pair for a text rating, or a small sparkle to separate words in a caption. These shapes are individual characters rather than image files. Their outlines, weight and color can change with the destination font, and emoji sparkles may appear as colorful artwork.',
    ],
    howToHeading: 'How to copy and combine stars',
    steps: [
      { title: 'Compare the shapes', text: 'Browse filled stars, outline stars and sparkles. Search by name or code point, or use the category selector to reduce the list.' },
      { title: 'Copy your choice', text: 'Click a star card and paste after the Copied confirmation. Check its appearance beside your text in the destination app.' },
      { title: 'Build a rating or accent', text: 'Add stars to the combination editor to create a line such as ★★★★☆ or ✦ New arrivals ✦. Choose no separator when the stars should sit together.' },
    ],
    faq: [
      { question: 'Which stars should I use for a rating?', answer: '★ (black star) and ☆ (white star) form a simple filled-and-outline pair. For example, ★★★★☆ can show four filled positions out of five. Include a readable label such as “4 out of 5” when the rating matters.' },
      { question: 'Are ✦ and ✨ the same character?', answer: 'No. ✦ is a four-point text star. ✨ is the sparkles emoji. They have different code points and can differ in color, spacing and rendering across devices.' },
      { question: 'Can I make a row of stars with no spaces?', answer: 'Yes. Add the stars you want, open Arrange pieces & spacing, and set Between pieces to Nothing. You can also edit the text directly to make a row such as ★★★★★.' },
      { question: 'Why does an outline star look thicker after pasting?', answer: 'The destination app supplies the font. A different font can draw the same character with a heavier outline or different proportions. Copying the star preserves its code point, not the preview font.' },
      { question: 'Can I use decorative stars in a heading or bio?', answer: 'Usually, if the destination field accepts them. Keep decorations short and check readability. Some services restrict symbols in usernames or may count a sequence differently toward a length limit.' },
    ],
  },
  arrows: {
    heading: 'What are arrow symbols?',
    paragraphs: [
      'Arrow symbols are text characters that indicate direction, movement or relationships. The 109 arrows in this collection include left, right, up, down and diagonal directions, as well as double, curved and decorative forms.',
      'A simple → can connect steps, ↔ can show a two-way relationship, and a curved arrow can suggest a return. Some arrows also carry specific mathematical meanings, so choose with the context in mind. These are copyable text characters; they do not become clickable navigation controls when pasted.',
    ],
    howToHeading: 'How to find and copy an arrow',
    steps: [
      { title: 'Pick a direction', text: 'Choose a direction category or search for “right”, “left”, “down” or “double”. You can also search for a specific code point such as U+2192.' },
      { title: 'Copy the arrow', text: 'Click a card and wait for Copied, then paste it into your document or message. Compare how the arrow aligns with nearby text.' },
      { title: 'Add context', text: 'Use + Add to combine arrows with words, such as Start → Review → Done. Copy the completed sequence from the bottom editor.' },
    ],
    faq: [
      { question: 'How do I copy a simple right arrow?', answer: 'Search for U+2192 or “rightwards arrow”, then click the → card. It is a text arrow that can be pasted into fields supporting that character.' },
      { question: 'What is the difference between → and ⇒?', answer: 'They are distinct characters. → is a rightwards arrow and ⇒ is a rightwards double arrow. In mathematics, a double arrow may indicate implication; it should not be substituted automatically just for a heavier appearance.' },
      { question: 'Can I use an arrow in a button or link label?', answer: 'An arrow can accompany a readable label, such as “Next →”. Copying the arrow does not create a link or button. In an interface, the underlying control still needs its own action and accessible name.' },
      { question: 'Why does an arrow show as a square?', answer: 'The destination font may not include that character. Try a simpler arrow such as →, ←, ↑ or ↓, or select a font with broader symbol support if the app lets you change it.' },
      { question: 'Can I combine several arrows with text?', answer: 'Yes. Add the arrows you need, type your labels into the editor, and copy the result. New-line spacing can help when you want one step on each line rather than a single long sequence.' },
    ],
  },
  kaomoji: {
    heading: 'What are kaomoji?',
    paragraphs: [
      'Kaomoji are expressive text faces made from punctuation, letters and symbols. Unlike a sideways face such as :-), many are read upright: (^‿^) looks cheerful, while (T_T) can suggest tears. This library has 100 complete expressions grouped by mood, animal and action.',
      'They are plain-text sequences rather than stickers or pictures. Brackets, spaces and combining marks help create the expression, so copying the whole face is more reliable than rebuilding it one character at a time. The mood labels are suggestions; the words around a face still give it context.',
    ],
    howToHeading: 'How to use kaomoji in a message',
    steps: [
      { title: 'Choose an expression', text: 'Pick a mood or action category, or search for an expression by name. Compare the full face, including hands, brackets and spacing.' },
      { title: 'Copy the whole face', text: 'Click its card and wait for Copied. Paste into your message without deleting the spaces or punctuation that give the face its shape.' },
      { title: 'Add words or save it', text: 'Use + Add to combine the expression with your message. Save frequently used faces with the heart button so you can find them again in this browser.' },
    ],
    faq: [
      { question: 'How are kaomoji different from emoji?', answer: 'Kaomoji are arrangements of text characters. Emoji are encoded characters or sequences that devices often display as artwork. A kaomoji depends on the text font and spacing; an emoji depends on the device’s emoji design.' },
      { question: 'Why does a face look uneven after pasting?', answer: 'Fonts give characters different widths, and narrow text fields can wrap a long face. Try a shorter expression, preserve its spaces, and check it in the app where you plan to send it.' },
      { question: 'Can I edit a kaomoji before copying?', answer: 'Yes. Click + Add to place it in the bottom editor, then change the text or add a message. Editing merges the current pieces into one, so review the result before copying.' },
      { question: 'Why does a backslash disappear in some chat apps?', answer: 'Some apps interpret punctuation as formatting or escape characters. The copied sequence can be correct while the displayed message differs. Check the app’s preview and use its plain-text or code formatting when appropriate.' },
      { question: 'Can I save a collection of favorite faces?', answer: 'Use the heart button on each card, then select Favorites. The saved item IDs stay in this browser when storage is available. They are not linked to an account or synced to another device.' },
    ],
  },
  'emoji-combos': {
    heading: 'What are emoji combos?',
    paragraphs: [
      'Emoji combos are small groups of emoji chosen to suggest a theme, activity or mood. A coffee, book and sun can set the scene for a quiet morning; a wave and shell can fit a beach caption. This collection has 100 editorial combinations organized into themes.',
      'Each combination remains a sequence of text characters. Copying does not fuse the emoji into one new emoji or image. You can paste a complete combination into a caption or message, or add your own words and reorder several combinations in the editor. Meanings depend on context and are not universal translations.',
    ],
    howToHeading: 'How to copy or make an emoji combo',
    steps: [
      { title: 'Browse a theme', text: 'Choose a category such as Cozy, Nature or Travel, or search for a combination by name. Select one that fits the message you want to write.' },
      { title: 'Copy a ready-made combo', text: 'Click a card and wait for Copied, then paste the entire sequence. Check the destination app’s preview, especially when it contains newer emoji.' },
      { title: 'Make it your own', text: 'Use + Add to collect several combos. Edit the text, add a caption, or arrange the pieces and spacing before copying the finished result.' },
    ],
    faq: [
      { question: 'Does this tool combine emoji into a new image?', answer: 'No. It copies text sequences that your destination app renders as emoji. It does not generate a sticker, merge artwork or create a new encoded emoji.' },
      { question: 'Can I change a combination or add my own emoji?', answer: 'Yes. Add a combo to the bottom editor, then type or paste your own emoji and words. You can also open Combine symbols and start with an empty editor.' },
      { question: 'Why does an emoji look different on another phone?', answer: 'Devices and apps use different emoji artwork and support different character sets. A newer emoji may display as a box on an older system. Copying preserves the sequence but cannot control the recipient’s rendering.' },
      { question: 'Do the combinations have official meanings?', answer: 'The names and themes are editorial suggestions. A group of emoji can suggest a scene or mood, but interpretation depends on the people and the surrounding message. Add words when the meaning needs to be clear.' },
      { question: 'How many combinations can I add to the editor?', answer: 'The editor accepts up to 40 pieces and 1,000 UTF-16 units. Some emoji use several units, so the limit is not a count of visible pictures. If an addition would exceed either limit, the current combination is kept.' },
    ],
  },
};

export function getCollectionGuide(id: LibraryId): CollectionGuide | undefined {
  return Object.hasOwn(collectionGuides, id) ? collectionGuides[id as SymbolCollectionId] : unicodeGuides[id];
}
