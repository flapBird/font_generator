import type { PageDefinition } from './data';

export const letteringArtPages: PageDefinition[] = [
  {
    slug: 'varsity-font-generator',
    title: 'Varsity Font Generator',
    metaTitle: 'Varsity Font Generator — College & Jersey Lettering',
    metaDescription: 'Create varsity block lettering for team names, jerseys, and school graphics. Choose an arch, set two colors, and download a transparent PNG.',
    category: 'styles',
    description: 'Create an arched team name, straight jersey number, or stacked name-and-number design in collegiate block lettering. Customize the fill and outline and download a PNG.',
    content: 'A varsity font generator turns a team name, mascot name, or jersey number into an image in collegiate block lettering. The locally hosted Graduate typeface uses angular shapes and slab serifs associated with letterman jackets. The editor sets your text in capitals and lets you raise the center of the line and rotate the letters along that arch. Use Single line for a stand-alone name or number. Name + number adds a separate straight three-digit jersey field below the arched name. Use a straight baseline for small front-of-shirt graphics or lettering that goes under a separate mascot illustration.\n\nThe preview matches the exported PNG. A banner gives wide names more horizontal room, while a square fits short team names and numbers. The editor shrinks long lines to fit. For a more prominent print, keep the lettering short and choose a high-contrast fill and outline.',
    workflowSteps: [
      { title: 'Enter a team name or number', text: 'Choose Single line or Name + number, then enter a name up to 60 UTF-16 units. The separate jersey field takes up to three digits.' },
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
    metaTitle: 'Wavy Text Generator — Curved Lettering, PNG & JPG',
    metaDescription: 'Make letters turn along a wave, arc or custom curve, or warp the letter shapes. Overlay a photo and download a transparent PNG or JPG.',
    category: 'styles',
    description: 'Curve or warp your lettering, place it over a photo or transparent canvas, and download PNG or JPG.',
    content: 'A wavy text generator is a small composition tool for bending a headline, sticker, thumbnail or story title. Follow and turn keeps each letter intact and rotates it with the path. Warp letter shapes bends the ink and outline across the line. Choose Wave, Arc, Custom curve or Straight. For a wave, choose from half to three cycles and adjust the phase to move the peaks. Custom curve lets you drag two handles or set their bends with sliders.\n\nType one line of up to 120 UTF-16 units. Set the typeface independently of the four starter templates, or adjust spacing and position to keep your text clear. The Banner, Square and Story canvases can be transparent, solid or filled by a centered crop of a JPG, PNG or WebP photo. Use Path guide to see the baseline while working. The guide stays out of downloads.',
    workflowSteps: [
      { title: 'Write the title', text: 'Enter up to 120 UTF-16 units on one line. Start with a template or choose your own shape.' },
      { title: 'Set the curve and canvas', text: 'Choose how the letters move. Adjust the curve and spacing, then open Canvas and background to position your title or choose a local photo.' },
      { title: 'Download the composition', text: 'Save PNG to preserve transparency or choose JPG for a flat image. JPG uses white behind transparent artwork.' },
    ],
    examples: [],
    faq: [
      { q: 'How do Follow and turn and Warp differ?', a: 'Follow and turn rotates each grapheme along the curve. Warp bends vertical strips of an entire word, including its outline.' },
      { q: 'Can I place wavy text on my own photo?', a: 'Yes. In Canvas and background select Photo, then choose a JPG, PNG or WebP up to 12 MB and 24 megapixels. The image is center-cropped to fill the canvas, and you can move the text horizontally or vertically.' },
      { q: 'Which canvas sizes can I export?', a: 'Banner is 2000 × 1000 pixels, Square is 1600 × 1600, and Story is 1080 × 1920. PNG supports transparency. JPG uses white behind transparent art.' },
      { q: 'Where are my text and photo processed?', a: 'The browser opens the photo, renders the preview and exports the image locally. The photo and your text stay in this page while it is open.' },
    ],
    relatedSlugs: ['varsity-font-generator', 'neon-font-generator', 'glitch-font-generator', '3d-font-generator'],
    icon: '🌊',
  },
];
