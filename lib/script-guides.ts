import type { PageDefinition } from './data';

export const scriptGuides: PageDefinition[] = [
  {
    slug: 'what-is-cuneiform',
    title: 'What Is Cuneiform? Writing in Ancient Mesopotamia',
    metaTitle: 'What Is Cuneiform? History, Signs and Clay Tablets',
    metaDescription: 'Learn when cuneiform began, how scribes wrote on clay, and how to tell a sign, a transliteration and a translation apart. See a real tablet from The Met.',
    category: 'guides',
    description: 'See how wedge-shaped signs developed from early records at Uruk into a writing system for Sumerian, Akkadian and other languages.',
    content: `Cuneiform is a family of writing systems named for the wedge impressions in its signs. Its early forms are attested at Uruk in southern Mesopotamia in the late fourth millennium BCE. Many surviving early tablets kept track of goods or labor. One small tablet in The Met records malt and barley groats, evidence of the kinds of transactions people needed to remember.

**How did scribes make the wedges?**

Scribes pressed the end of a cut reed or wooden stylus into damp clay. A change of angle or direction made a different wedge, and groups of wedges formed signs. Some early signs had a recognizable pictorial shape. As the system changed, the wedges grew more conventional and a picture alone became an unreliable guide to the reading. Clay tablets were common, and inscriptions could also be cut into stone.

**Which languages used cuneiform?**

Sumerian was one of the first languages written with the script. Scribes adapted it to write Akkadian, including its Babylonian and Assyrian varieties, as well as other languages such as Hittite. The shape and use of a sign could change across centuries and places. By the third millennium BCE, people were using cuneiform for far more than records of goods, including letters, laws, literary works and scholarly texts.

**How do cuneiform signs represent words and sounds?**

A sign could stand for a whole word, a syllable or a clue to the category of a nearby word. For example, the AN sign can stand for the Sumerian word an, meaning sky, or carry other readings according to context. A short name can be approximated with signs read as syllables. Luna can be rendered as lu-na. The order shows a possible way to spell the sound of the name, and the same signs can have different values in an ancient text.

**What does a tablet translation require?**

Start with the collection record for the object and identify its date, language and place of origin. A transliteration writes the identified sign readings in Latin characters, often with hyphens and subscripts. A translation interprets the words and grammar of that reading. Compare a published transliteration with a museum or scholarly translation before assigning a meaning to a sign you found in isolation. For a photographed object, damage and the angle of the light can make the first step of recognizing the wedges difficult.

**Why do copied cuneiform signs sometimes display as squares?**

Unicode encodes signs as characters, and a compatible font provides the visible wedges. Use a cuneiform font such as Noto Sans Cuneiform for editable text. A PNG preserves the visible shapes when you share a label or illustration with someone who may have a different set of fonts.`,
    howToUse: 'Open the Cuneiform Translator and try Luna. Compare the LU and NA signs in the spelling breakdown, then use the chart to look up one sign by its Unicode code point.',
    examples: [
      { before: 'lu (U+121FB), na (U+1223E)', after: 'lu-na', note: 'Two selected readings used to approximate the modern name Luna' },
      { before: 'AN (U+1202D)', after: 'an, “sky” in Sumerian', note: 'One reading of a sign with several values' },
    ],
    faq: [
      { q: 'When was cuneiform invented?', a: 'Early writing at Uruk dates to the late fourth millennium BCE. The wedges and readings familiar from later cuneiform developed over time.' },
      { q: 'Is cuneiform a language or an alphabet?', a: 'It is a name for wedge-based writing systems. Mesopotamian cuneiform uses word and syllable signs, and scribes applied it to several languages.' },
      { q: 'Where can I look up the meaning of a real tablet?', a: 'Start with a museum record or a published corpus. The Oracc Sign List can help identify possible sign values after you know which sign you are looking at.' },
    ],
    relatedSlugs: ['unicode-font-compatibility-guide', 'how-unicode-text-works-guide'],
    icon: '◩',
  },
  {
    slug: 'minecraft-enchanting-table',
    title: 'Minecraft Enchanting Table Recipe, Bookshelves and Language',
    metaTitle: 'Minecraft Enchanting Table Recipe & 15 Bookshelf Setup',
    metaDescription: 'Craft an enchanting table with a book, diamonds and obsidian, lay out 15 bookshelves for level 30, and learn what the Galactic letters in the menu say.',
    category: 'guides',
    description: 'Craft an enchanting table, set up 15 bookshelves with a one-block gap, and read the Standard Galactic Alphabet in the menu.',
    content: `An enchanting table applies upgrades to eligible items and books. In survival, put the item and lapis lazuli in the interface, then choose an option you have enough experience levels to use. Check the enchantment clue before spending your materials.

**How to craft an enchanting table**

Use one book, two diamonds and four obsidian in a 3 × 3 crafting grid. Put the book in the top center. Fill the middle row with diamond, obsidian, diamond. Put the remaining three obsidian across the bottom and leave the two top corners empty.

**How to place 15 bookshelves for level 30**

Set the table in the center of a 5 × 5 area. At the table’s height, leave the eight spaces immediately around it empty. Put 15 regular bookshelves on the outer ring, leaving one opening for access. Keep the intervening spaces clear so the shelves can contribute. Regular bookshelves supply enchanting power. Chiseled bookshelves store books and serve a separate function.

Place an eligible item in the table to check the setup. The bottom option should show a level requirement of 30 with all 15 shelves in range. The level requirement is how much experience you need before selecting the option. In survival, using the third option costs three experience levels and three lapis lazuli.

**What do the enchanting table symbols mean?**

The interface uses the Standard Galactic Alphabet, originally created by Tom Hall for Commander Keen. Each of its 26 glyphs corresponds to a Latin letter. The words in the menu add flavor. To choose an enchantment, use the plain-text clue in the game interface. You can see one possible effect before committing, and the game may apply additional effects.

**How to read a line of Galactic text**

Start with the A–Z chart and look for shapes you can recognize, keeping the spaces between words. If the message is in a screenshot, use the translator’s symbol keyboard to enter each matching glyph. For a copied message in the tool’s Unicode alphabet, paste it into Galactic to English. Use English to Galactic to write a note for a build or a puzzle, then use the PNG if you want the rendered glyphs to keep their shape when shared.`,
    howToUse: 'Craft the table and place the bookshelves first. Once you can see the menu, compare a glyph with the A–Z chart and enter it in Galactic to English.',
    examples: [
      { before: '3 × 3 crafting grid', after: 'Book above diamond–obsidian–diamond', note: 'Fill the bottom row with the remaining three obsidian' },
      { before: 'Level-30 option in the bottom slot', after: 'Three lapis and three levels', note: 'You need to reach level 30 first' },
    ],
    faq: [
      { q: 'Do I need 30 bookshelves?', a: 'Use 15 regular bookshelves with a one-block gap to unlock the level-30 option. Additional shelves above that cap do not raise the highest offered level.' },
      { q: 'Why am I missing the level-30 option?', a: 'Check the number and type of shelves, clear the gap and place an eligible item in the table. With 15 working shelves, a player below level 30 may still see the third option unavailable.' },
      { q: 'Can you read an enchantment by translating the menu letters?', a: 'You can read the displayed flavor words. Use the in-game enchantment clue to learn which effect the option can apply.' },
    ],
    relatedSlugs: ['how-unicode-text-works-guide'],
    icon: '✧',
  },
];
