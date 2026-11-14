import type { PageDefinition } from './data';
import { TITLE_ARTWORK_INPUT_LIMIT } from './title-artwork';

export const spidermanPage: PageDefinition = {
  slug: 'spiderman-font-generator',
  title: 'Spider-Man Font Generator',
  metaTitle: 'Spider-Man Font Generator — Comic Title PNG Maker',
  metaDescription: 'Make Spider-Man-inspired lettering in three comic-book styles. Add a web texture, adjust colors, and download a transparent banner or square PNG.',
  category: 'fandom',
  description: 'Create unofficial Spider-Man-inspired comic titles with layered outlines, optional web texture, and transparent PNG export.',
  content: [
    'The Spider-Man Font Generator turns a name or short headline into comic-cover artwork for a fan thumbnail, party invite or graphic. It uses the open-source Bangers typeface for the lettering, then draws a tilted title with layered outlines and depth. The Web texture on letters option adds a pattern inside the letter faces.',
    '**Pick a comic-cover style**',
    'Classic Cover has scarlet lettering, a near-black outline and deep blue sides. Midnight Web pairs icy letters with a navy shadow. Retro Issue uses golden lettering with a burgundy outline for a warmer look. Adjust Fill, Outline and Slant after choosing a preset. When you turn transparency off, the Scene color sits behind the title with a dotted border treatment.',
    '**Fit the title to your artwork**',
    'Choose Banner for a wide thumbnail or Square for a centered post. Put a subtitle on its own line by pressing Enter in Your title. Longer lines wrap and shrink to fit the canvas. Short phrases leave more space for the outline and make the web detail easier to see at small sizes.',
    '**Download a finished image**',
    'The PNG preserves the lettering, color and texture from the preview. Use a transparent background to place the title over your own image. The checkerboard shows where the canvas is transparent and stays out of the downloaded file. This independent fan tool uses original effects and Bangers under the SIL Open Font License 1.1.',
  ].join('\n\n'),
  howToUse: 'The preview updates as you type. Your title and image are processed locally in your browser.',
  workflowSteps: [
    { title: 'Enter your title', text: `Type a name or headline up to ${TITLE_ARTWORK_INPUT_LIMIT} UTF-16 units. Use line breaks to arrange a title and subtitle.` },
    { title: 'Choose a comic style', text: 'Pick a preset, adjust the colors or slant, and toggle Web texture on letters. Choose Banner or Square and set the background.' },
    { title: 'Download PNG', text: 'Review the artwork. When the size and PNG ready appear below the preview, select Download PNG.' },
  ],
  examples: [],
  faq: [
    { q: 'Which size does the Spider-Man Font Generator export?', a: 'Banner exports a 2000 × 1000 PNG. Square exports a 1600 × 1600 PNG. Both formats support a transparent background.' },
    { q: 'Can I keep the web texture on a transparent background?', a: 'Yes. Web texture on letters draws lines inside the lettering. Transparent background leaves the area around the title clear.' },
    { q: 'Can I edit the lettering after downloading it?', a: 'The download is a finished PNG image. To change the wording, edit Your title in the generator and download the new preview.' },
    { q: 'What happens with accented characters and other alphabets?', a: 'The bundled Bangers subset covers basic Latin text and common accented Latin characters. Other characters may use a device font. Check the preview before downloading.' },
    { q: 'Why is Download PNG unavailable?', a: 'Enter a title and wait for the preview to finish loading. If the font or preview fails to load, select Retry preview.' },
    { q: 'What typeface does this use?', a: 'The tool uses the open-source Bangers typeface with its own comic artwork effects. It is an independent fan-lettering tool.' },
  ],
  relatedSlugs: ['sonic-font-generator', 'comic-font-generator', 'pop-culture-font-generators', '3d-font-generator'],
  icon: '🕸️',
};
