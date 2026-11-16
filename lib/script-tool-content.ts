export const scriptToolContent = {
  'cuneiform-translator': {
    heading: 'What is the Cuneiform Translator?',
    paragraphs: [
      'Cuneiform takes its name from the wedge-shaped strokes scribes pressed into clay. Mesopotamian scribes used the script to write languages including Sumerian and Akkadian. A single sign could have several readings depending on where it appeared.',
      'Enter an English name or short word to get an approximate spelling using selected cuneiform syllable signs. The tool works from the letters you type. For example, Luna uses lu and na, while Sam uses sa and am. Copy the signs as Unicode text or download a transparent PNG for a label, illustration or classroom activity.',
    ],
    howToHeading: 'How to write your name in cuneiform',
    steps: [
      { title: 'Type a name', text: 'Replace the example with up to 120 UTF-16 units. Try spelling the name the way you say it when the usual spelling has silent letters or unusual sounds.' },
      { title: 'Check the syllable signs', text: 'Open Spelling breakdown to see the matched parts, readings and Unicode code points. Use the sign chart to look up or copy an individual sign.' },
      { title: 'Copy or download', text: 'Keep Copyable text selected and tap the Cuneiform signs card to copy. Switch Output format to PNG image, check the preview, then choose Download PNG. Switching formats keeps your input.' },
    ],
    faq: [
      { question: 'Does the tool translate English into Sumerian or Akkadian?', answer: 'The result approximates the spelling of a modern name or word. Translating a sentence into an ancient language requires its vocabulary and grammar.' },
      { question: 'Is there a cuneiform alphabet from A to Z?', answer: 'Mesopotamian cuneiform combines syllable signs and signs that can stand for words. The chart lists the readings used by this tool and shows when different readings share one sign.' },
      { question: 'Can I decode a tablet or translate cuneiform from an image?', answer: 'This tool takes typed Latin input. Reading an inscription requires identifying the language, signs and context. The cuneiform guide links to a published tablet and a scholarly sign list you can consult.' },
      { question: 'Why do some signs appear as boxes after I copy them?', answer: 'The receiving app needs a font with cuneiform glyphs. Use a compatible editor with Noto Sans Cuneiform, or share the PNG for a fixed appearance.' },
      { question: 'Where is my text processed?', answer: 'Spelling, preview and PNG export run in this browser. The tool keeps the input in page memory and requires no account.' },
    ],
  },
  'enchanting-table-translator': {
    heading: 'What is the Enchanting Table Translator?',
    paragraphs: [
      'Minecraft’s enchanting table displays lettering based on the Standard Galactic Alphabet, the 26-letter script Tom Hall created for Commander Keen. Each glyph stands for a Latin letter. Reading the glyphs reveals the flavor words in the menu. The game’s plain-text enchantment clue is what tells you which effect to expect.',
      'Type a short message for a Minecraft puzzle or fan post, or paste symbols that use this page’s mapping. Copyable text uses Unicode lookalikes for pasting. Switch Output format to PNG image to preview and download lettering drawn with a locally hosted fan typeface.',
    ],
    howToHeading: 'How to translate Minecraft enchanting table text',
    steps: [
      { title: 'Choose a direction', text: 'Select English to Galactic to write a message, or Galactic to English to read supported symbols. Type up to 1,000 UTF-16 units for encoding or 2,000 for decoding.' },
      { title: 'Check the result', text: 'In English to Galactic, choose Copyable text for symbols to paste or PNG image for Galactic letter shapes. Switching formats keeps your message. For a screenshot, open the symbol keyboard in Galactic to English and enter the matching shapes by hand.' },
      { title: 'Copy or download', text: 'In Copyable text, tap the result card to copy or use Decode this result to check your message. In PNG image, check the lettering and choose Download PNG for a transparent image.' },
    ],
    faq: [
      { question: 'What language is on the Minecraft enchanting table?', answer: 'The menu uses Standard Galactic Alphabet lettering. Each glyph represents a Latin letter, so converting the glyphs recovers words written with those letters.' },
      { question: 'Can I use the words to predict my enchantment?', answer: 'The glyphs spell flavor words. Use the game’s plain-text enchantment clue, level requirement and lapis cost when choosing an option.' },
      { question: 'Does decoding restore capital letters?', answer: 'Both cases encode to the same shape. The decoder returns lowercase letters. Digits, line breaks and text outside the supported mapping pass through. An exact lookalike sequence such as two vertical bars is read as its mapped letter.' },
      { question: 'Can I paste the exact game lettering into a chat or username?', answer: 'The clipboard holds Unicode lookalikes. The app supplies the glyphs and decides which characters it accepts. The transparent PNG keeps the rendered appearance when sharing an image is possible.' },
      { question: 'Is my input uploaded?', answer: 'Conversion and PNG export run in this browser. You can switch directions without losing either input while the page is open.' },
    ],
  },
  'enderman-translator': {
    heading: 'What is the Enderman Translator?',
    paragraphs: [
      'This unofficial text tool uses the A–Z mapping from the fan-used Alien Language alphabet to write Enderman-style messages. Fans use symbol alphabets for in-character chat, notes and puzzles. Different communities can use different alphabets.',
      'The encoder changes unaccented Latin letters into Unicode symbols and keeps spaces, punctuation, digits and other text. Ender to English reverses the same chart into lowercase. The tool handles written text. Enderman sounds in Minecraft play during mob behavior such as teleporting and have no text transcription here.',
    ],
    howToHeading: 'How to write and read Ender symbols',
    steps: [
      { title: 'Enter a message', text: 'Use English to Ender with up to 1,000 UTF-16 units, or switch to Ender to English and paste up to 2,000 units in the supported fan alphabet.' },
      { title: 'Compare with the alphabet', text: 'Open the Ender alphabet chart to copy a letter. In reverse mode, use the Ender symbol keyboard to enter symbols you can see but cannot copy.' },
      { title: 'Copy the output', text: 'Tap the result card and try pasting the text into the intended chat or document. Use Decode this result to verify your own message.' },
    ],
    faq: [
      { question: 'Is this an official Enderman language?', answer: 'This is a fan cipher based on the A–Z mapping published by the Alien Language translator. It assigns symbols to letters for creative use.' },
      { question: 'Can it translate Enderman noises?', answer: 'This translator accepts text only. It reads symbols from the included alphabet and leaves other characters as typed.' },
      { question: 'Will every Enderspeak or Skrittish message decode?', answer: 'Reverse conversion understands the A–Z symbols shown in this page’s chart. A message from another fan alphabet may use different symbols or give them different values.' },
      { question: 'Why are capital letters lost when decoding?', answer: 'Uppercase and lowercase use the same symbols in this fan alphabet. The decoder chooses lowercase and preserves unmapped text, including ordinary digits.' },
      { question: 'Is my text saved or sent to a service?', answer: 'Conversion happens in this browser and the tool keeps its inputs in page memory.' },
    ],
  },
  'standard-galactic-alphabet': {
    heading: 'What is the Standard Galactic Alphabet?',
    paragraphs: [
      'The Standard Galactic Alphabet (SGA) is a fictional script with one glyph for each Latin letter. Tom Hall designed it for signs and hidden messages in Commander Keen. Minecraft later used it for the enchanting table interface.',
      'The chart pairs a Galactic glyph and its Latin letter with the Unicode lookalike copied by the tile. The Galactic shapes are drawn by a local subset of Sga, a community typeface. Common text lookalikes come from several Unicode blocks and some letters need two characters.',
    ],
    howToHeading: 'How to use the Galactic alphabet chart',
    steps: [
      { title: 'Find the shape', text: 'Compare the large glyphs with the letter you are trying to read. I, J and Y are easiest to distinguish by counting strokes or dots.' },
      { title: 'Copy the symbol', text: 'Tap a tile to copy its Unicode lookalike. Paste into a note or into Galactic to English to read a sequence.' },
      { title: 'Make a full message', text: 'Open the Enchanting Table Translator to convert several letters at once or download a PNG rendered with the Galactic typeface.' },
    ],
    faq: [
      { question: 'How many letters are in the Standard Galactic Alphabet?', answer: 'This chart covers 26 letters, A through Z. Uppercase and lowercase share one glyph for each letter.' },
      { question: 'Does the Standard Galactic Alphabet have a Unicode block?', answer: 'The letters have no dedicated standard Unicode block. The large preview glyphs use a font’s private-use positions. The copied symbols use ordinary Unicode lookalikes that have better portability.' },
      { question: 'Why does my copied glyph look different from the large preview?', answer: 'The preview uses a Galactic typeface. After pasting, the receiving device renders the substitute character with its own font, so its shape and spacing may vary.' },
      { question: 'Can I use the chart to read a screenshot?', answer: 'Yes, match shapes by eye. You can then enter those letters using the symbol keyboard in the Enchanting Table Translator.' },
      { question: 'Does this page offer a font file?', answer: 'The chart has single-symbol copy buttons. For a full line of Galactic lettering, the translator offers an image download and links to the community font source.' },
    ],
  },
};
