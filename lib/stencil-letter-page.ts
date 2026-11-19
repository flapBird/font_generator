import type { PageDefinition } from './data';
import { STENCIL_INPUT_LIMIT } from './stencil-letter-art';

export const stencilLetterPage: PageDefinition = {
  slug: 'stencil-letter-generator',
  title: 'Stencil Letter Generator',
  metaTitle: 'Stencil Letter Generator — Printable Stencil Font',
  metaDescription: 'Make printable stencil letters with adjustable bridges. Try classic, military and industrial presets, then save a print PDF, vector SVG or transparent PNG.',
  category: 'styles',
  description: 'Create bridged stencil lettering for signs, labels and craft templates. Adjust bridge width, letter spacing and paper size, then download a print PDF, SVG or PNG.',
  content: [
    'This stencil font generator turns short text into printable uppercase letters for labels, signs, posters and craft projects. The stencil alphabet is built from geometric vector outlines. Letters such as A, B and O have openings called bridges. When you remove the printed letter shapes from stencil material, those openings connect the inner spaces to the surrounding sheet.',
    'Choose Classic for balanced block letters, Military for narrower olive lettering with wider bridges, or Industrial for broad letterforms. Adjust Bridge width after picking a preset. Wider bridges leave more material connecting the center of a letter to the stencil sheet. Letter spacing controls the room between the cutouts.',
    'Use Fit artwork for a graphic sized around your lettering, or select A4 landscape or US Letter landscape to export a lettered sheet with margins. Turn on One character per sheet for large individual cutouts. Page through the preview and download a single PDF containing all sheets. In a vector editor, the SVG contains letter paths that can be resized and inspected without installing a font. Print a small test on scrap material to check that the bridges suit the size and material you plan to use.',
  ].join('\n\n'),
  howToUse: 'Type a short label or sign, choose a preset and adjust the bridges in the preview. The tool processes the text and makes downloads in your browser.',
  workflowSteps: [
    { title: 'Enter your text', text: `Type up to ${STENCIL_INPUT_LIMIT} UTF-16 units. Latin lowercase letters become uppercase. Press Enter for a new line.` },
    { title: 'Check the bridges', text: 'Choose Classic, Military or Industrial. Adjust the bridge width, letter spacing and ink color. Select a paper size to preview the print layout.' },
    { title: 'Download your stencil', text: 'Choose Download print PDF for A4 or US Letter, or save the previewed sheet as SVG or PNG. Print the PDF at Actual size.' },
  ],
  examples: [],
  faq: [
    { q: 'Why are there gaps in letters like A and O?', a: 'The gaps leave narrow strips of uncut material connecting the inner spaces of the letters to the sheet. Increase Bridge width if your material needs stronger connections.' },
    { q: 'Can I make military-style stencil letters?', a: 'Yes. The Military preset starts with narrower letterforms, wider bridges and an olive fill. You can change the bridge width, spacing and color after selecting it.' },
    { q: 'Which characters can I use?', a: 'Use A–Z, 0–9, spaces and the punctuation . , - / ! ? : +. Lowercase Latin letters become capitals. Accented letters, emoji and other unsupported characters are omitted, with a notice above the preview.' },
    { q: 'How do I print to A4 or US Letter?', a: 'Select the matching landscape layout and download the print PDF. Choose Actual size in your PDF viewer. Enable One character per sheet to export every supported character on a separate page. Spaces and line breaks are skipped in this mode.' },
    { q: 'Can I open the stencil in cutting software?', a: 'The SVG contains filled vector paths, including the bridge gaps. Import it into an editor or cutter that accepts SVG and check the cut shapes, sizes and bridge widths before cutting. For a raster image, download PNG.' },
    { q: 'Can I install these letters as a font or copy them as text?', a: 'This tool exports PDF, vector SVG and transparent PNG. Use the Square Text Generator if you need characters you can paste into a text field.' },
  ],
  relatedSlugs: ['big-font-generator', 'square-text-generator', 'impact-font-generator'],
  icon: '🔠',
};
