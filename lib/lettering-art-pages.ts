import type { PageDefinition } from './data';

export const letteringArtPages: PageDefinition[] = [
  {
    slug: 'varsity-font-generator',
    title: 'Varsity Font Generator',
    metaTitle: 'Varsity Font Generator — College & Jersey Lettering',
    metaDescription: 'Create varsity block lettering for team names, jerseys, and school graphics. Choose an arch, set two colors, and download a transparent PNG.',
    category: 'styles',
    description: 'Create an arched team name or straight jersey number in collegiate block lettering. Customize the fill and outline and download a PNG.',
    content: 'A varsity font generator turns a team name, mascot name, or jersey number into an image in collegiate block lettering. The locally hosted Graduate typeface uses angular shapes and slab serifs associated with letterman jackets. The editor sets your text in capitals and lets you raise the center of the line and rotate the letters along that arch. Use a straight baseline for numbers, small front-of-shirt graphics, or lettering that goes under a separate mascot illustration.\n\nThe preview matches the exported PNG. A banner gives wide names more horizontal room, while a square fits short team names and numbers. The editor shrinks long lines to fit. For a more prominent print, keep the lettering short and choose a high-contrast fill and outline.',
    workflowSteps: [
      { title: 'Enter a team name or number', text: 'Type one line of up to 60 UTF-16 units. Lettering appears in uppercase.' },
      { title: 'Set your team colors', text: 'Start with a preset. Adjust the fill, outline, outline width, and arch height. Set Arch height to zero for a straight baseline.' },
      { title: 'Check and download the preview', text: 'Choose Banner or Square and enable Transparent background if you will place the lettering over another design. Download the PNG.' },
    ],
    examples: [
      { before: 'Westfield', after: 'WESTFIELD', note: 'Letterman arch with cream fill and a red outline' },
      { before: '24', after: '24', note: 'Straight jersey number with a gold outline' },
    ],
    faq: [
      { q: 'Can I make flat block letters?', a: 'Yes. Set Arch height to zero, or start with the Jersey numbers preset. Turn the outline width down to zero for a solid result.' },
      { q: 'Will the downloaded PNG preserve the arch?', a: 'Yes. The same canvas powers preview and export. Choose a 2000 × 1000 banner or a 1600 × 1600 square, with an optional transparent background.' },
      { q: 'Can I copy varsity lettering into a text field?', a: 'The angles, colors, and arch are part of the PNG image. A plain-text field keeps only the characters. For large copyable block letters, try the Big Font Generator.' },
      { q: 'Which characters work best?', a: 'The Graduate font is designed for Latin lettering and digits. Other scripts and emoji may use a browser fallback, which can change their look or leave a missing glyph. The editor works locally and does not upload the entered text.' },
    ],
    relatedSlugs: ['stencil-letter-generator', 'big-font-generator', '3d-font-generator', 'wavy-text-generator'],
    icon: '🏅',
  },
  {
    slug: 'wavy-text-generator',
    title: 'Wavy Text Generator',
    metaTitle: 'Wavy Text Generator — Custom Wave Lettering PNG',
    metaDescription: 'Bend custom text into one, two, or three waves. Adjust wave height, colors, and outline, then download your lettering as a transparent PNG.',
    category: 'styles',
    description: 'Bend your text into a continuous wave with adjustable height, wave count, and outline. Preview and download banner or square PNG artwork.',
    content: 'A wavy text generator bends the shapes of the letters along a continuous wave. Try it for a retro headline, a sticker, or a short title on a photo. One broad wave suits a short phrase. Two or three smaller waves are easier to see across a longer title. The wave runs through the edges of every letter, including the outline, so the lettering moves together.\n\nEach preset combines an existing display font with a starting color palette. Adjust Wave height to control how far the lettering moves up and down, and choose the number of waves across the line. The checkerboard indicates transparency in the preview. It stays out of the PNG.',
    workflowSteps: [
      { title: 'Enter a word or short title', text: 'Use one line of up to 60 UTF-16 units. The preview scales longer titles to fit.' },
      { title: 'Shape the wave', text: 'Choose a preset, then adjust Wave height, Waves, fill, outline, and outline width. Use a low wave for long or narrow lettering.' },
      { title: 'Review and download PNG', text: 'Choose a banner or a square. To layer the lettering over a photo or another design, enable Transparent background before downloading.' },
    ],
    examples: [
      { before: 'Good vibrations', after: 'Good vibrations', note: 'One broad wave in a two-tone warm palette' },
      { before: 'High tide', after: 'High tide', note: 'Two waves in tall mint and blue lettering' },
    ],
    faq: [
      { q: 'Do the letters actually bend?', a: 'Yes. The editor shifts strips of the text by different amounts along a sine wave, bending both the fill and the outline. Set Wave height to zero to return to a flat line.' },
      { q: 'Can I paste the wave into Instagram or Discord as text?', a: 'The wave is visual artwork embedded in a PNG. You can attach the image where uploads are supported. The Wavy Text Generator does not produce Unicode-styled text.' },
      { q: 'Why does my result look different in another script?', a: 'The bundled typefaces target Latin text. The browser may fall back to another font for unsupported characters. Short Latin titles provide the most predictable proportions.' },
      { q: 'Does the tool send my text to a server?', a: 'The browser renders and exports the image locally. Your input is held in the page while it is open.' },
    ],
    relatedSlugs: ['varsity-font-generator', 'neon-font-generator', 'glitch-font-generator', '3d-font-generator'],
    icon: '🌊',
  },
];
