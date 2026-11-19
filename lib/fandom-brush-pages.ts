import type { PageDefinition } from './data';
import { fandomBrushConfigs, fandomBrushSlugs } from './fandom-brush-catalog';

const subjects = {
  'naruto-font-generator': {
    description: 'Make original Naruto-inspired action titles with brush lettering, colored outlines and adjustable motion streaks. Download a transparent PNG.',
    content: 'Turn a nickname, video title or team name into an unofficial anime action graphic. The hand-drawn lettering leans forward into short painted motion trails. Ember Dash, Dusk Trail and Vermilion Rush give you three palettes to start with. The tool uses the locally hosted Permanent Marker typeface and original effects for your own words.',
    adjustment: 'Choose a preset, then change Fill, Outline and Slant. Toggle Motion trails to compare an energetic title with a cleaner version.',
    example: 'Ember Dash adds warm brush lettering, a dark edge and short motion trails.',
    icon: '💨',
    relatedSlugs: ['demon-slayer-font-generator', 'anime-font-generator', 'graffiti-font-generator', 'spiderman-font-generator'],
    specificFaq: { q: 'Can I remove the streaks for a smaller overlay?', a: 'Yes. Turn off Motion trails for a cleaner title, then choose a strong contrast between the fill and outline so the words stay readable at thumbnail size.' },
  },
  'demon-slayer-font-generator': {
    description: 'Make original Demon Slayer-inspired ink titles with brush lettering and optional dry-brush texture. Export your custom design as PNG.',
    content: 'Make an ink-brush title for a fan edit, chapter card or poster. Night Ink, Pine Mist and Crimson Paper pair angular lettering with subdued colors. A dry-brush option adds paper-like gaps inside the ink and a few splatters around the title. The locally hosted Sedgwick Ave Display typeface draws the lettering.',
    adjustment: 'Choose an ink preset and adjust Fill, Outline and Slant. Toggle Dry brush texture to compare a weathered title with smooth lettering.',
    example: 'Night Ink renders the words in dark brush lettering with subtle flecks.',
    icon: '🖌️',
    relatedSlugs: ['naruto-font-generator', 'anime-font-generator', 'japanese-font-generator', 'calligraphy-font-generator'],
    specificFaq: { q: 'Do the worn ink details survive transparent export?', a: 'Yes. With Dry brush texture on, the worn areas let the layer below the PNG show through, and the ink splatters stay visible. With a scene color selected, that color appears through the worn areas.' },
  },
};

export const fandomBrushPages: PageDefinition[] = fandomBrushSlugs.map((slug) => {
  const { name, sample, fontName } = fandomBrushConfigs[slug];
  const subject = subjects[slug];
  const title = `${name} Font Generator`;
  return {
    slug, title, category: 'fandom',
    metaTitle: `${title} — Fan Title PNG`,
    metaDescription: subject.description,
    description: subject.description,
    content: `${subject.content} The studio accepts up to 120 UTF-16 units, including line breaks. The main typeface covers Latin text, and other characters can use a device fallback. The live preview downloads as a PNG for image editors and thumbnails.`,
    workflowSteps: [
      { title: 'Enter a title', text: 'Replace the sample with your own name or short title. Add a line break for a stacked composition.' },
      { title: 'Adjust the artwork', text: subject.adjustment },
      { title: 'Download the PNG', text: 'Choose Banner (2000 × 1000) or Square (1600 × 1600). Keep the background transparent for overlays or choose a scene color, then download the preview.' },
    ],
    examples: [{ before: sample, after: subject.example, note: 'PNG artwork' }],
    faq: [
      { q: `Does this use the official ${name} logo?`, a: `This is an independent fan tool. It uses ${fontName} and original effects. Official logos, marks and character artwork are outside the studio’s scope.` },
      subject.specificFaq,
      { q: 'Can I paste this style into a profile name?', a: 'Use the downloaded PNG in image fields, thumbnails or image editors. Plain-text fields only receive the letters you typed.' },
      { q: 'Where does my text go?', a: 'Your browser renders the preview and creates the PNG locally. The title stays in page memory and starts at the sample when the tool is reopened.' },
    ],
    relatedSlugs: subject.relatedSlugs,
    icon: subject.icon,
  };
});
