export const keywordTools = [
  {
    "id": "name-tracing-worksheet",
    "title": "Name Tracing Worksheet",
    "description": "Create an A4 PDF or SVG name worksheet with 3–10 rows: a model, light tracing letters and a blank practice row. Standard print letters, not a stroke-order curriculum.",
    "sample": "Emma"
  },
  {
    "id": "roman-numeral-converter",
    "title": "Roman Numeral Converter",
    "description": "Convert whole numbers from 1 to 3999 to Roman numerals, or validate and decode canonical Roman numerals.",
    "sample": "2026"
  },
  {
    "id": "emoji-translator",
    "title": "Emoji Translator",
    "description": "Replace supported English words with emoji using a small visible dictionary. Unknown words and punctuation stay unchanged; this is playful substitution, not semantic translation.",
    "sample": "I love coffee and cats"
  },
  {
    "id": "cross-stitch-font-generator",
    "title": "Cross Stitch Font Generator",
    "description": "Create a single-color counted cross-stitch chart from A–Z letters, digits and spaces. Download an SVG chart with one cross per stitch.",
    "sample": "LOVE"
  },
  {
    "id": "accents-keyboard",
    "title": "Accents Keyboard",
    "description": "Add accented Latin letters to your text using an on-screen character palette and copy the result. No automatic spelling or translation.",
    "sample": "café"
  },
  {
    "id": "font-pairing",
    "title": "Font Pairing Preview",
    "description": "Compare three heading and body font pairings using installed system fonts. Copy CSS font stacks; appearance depends on fonts installed on your device.",
    "sample": "Good design starts with type"
  },
  {
    "id": "text-repeater",
    "title": "Text Repeater",
    "description": "Repeat text, lines, or emoji up to 10,000 times. Choose a separator, preview the result, and copy it or download a TXT file.",
    "sample": "Hello!"
  }
] as const;
export type KeywordToolId = typeof keywordTools[number]["id"];
