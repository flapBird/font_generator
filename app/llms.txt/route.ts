import { guidePages } from '@/lib/data';
import {
  generatorRegistry,
  type GeneratorDefinition,
  type GeneratorKind,
} from '@/lib/generator-registry';

export const dynamic = 'force-static';

const SITE_URL = 'https://font-generators.org';

const sectionOrder: GeneratorKind[] = [
  'unicode',
  'ascii',
  'font-preview',
  'meme',
  'theme-logo',
  'game-text',
  'hybrid',
  'directory',
];

const sectionHeadings: Record<GeneratorKind, string> = {
  unicode: 'Copy-and-paste Unicode text generators',
  ascii: 'ASCII art generators',
  'font-preview': 'Typeface preview and artwork generators',
  meme: 'Meme generators',
  'theme-logo': 'Theme and title artwork generators',
  'game-text': 'Game text and game-inspired artwork generators',
  hybrid: 'Hybrid artwork and copyable-text generators',
  directory: 'Generator directories and comparison tools',
};

const outputLabels: Record<string, string> = {
  text: 'copyable text',
  png: 'PNG',
  svg: 'SVG',
  txt: 'TXT',
  'game-code': 'game formatting code',
};

const generatorLine = (definition: GeneratorDefinition) => {
  const url = `${SITE_URL}${definition.canonicalPath}`;
  const outputs = definition.intent.expectedOutputs
    .map((output) => outputLabels[output] ?? output)
    .join(', ');
  return `- [${definition.title}](${url}): ${definition.intent.primary} Outputs: ${outputs}.`;
};

const generatorSections = sectionOrder.flatMap((kind) => {
  const generators = generatorRegistry.filter((definition) => definition.kind === kind);
  if (!generators.length) return [];
  return [
    `## ${sectionHeadings[kind]}`,
    '',
    ...generators.map(generatorLine),
    '',
  ];
});

const guideLines = guidePages.map(
  (page) => `- [${page.title}](${SITE_URL}/guides/${page.slug}): ${page.description}`,
);

const body = [
  '# Font Generators',
  '',
  '> Font Generators is a free collection of browser-based tools for copy-and-paste Unicode text, ASCII banners, real typeface previews, meme captions, 3D text, and downloadable title artwork. Each generator keeps its existing canonical URL and explains the exact output it produces.',
  '',
  'Use the output type to interpret a page correctly:',
  '',
  '- Unicode generators substitute characters and return copyable plain text; they do not install or reproduce a font file.',
  '- ASCII generators arrange plain-text characters into multi-line banners whose spacing is best preserved in monospace contexts.',
  '- Typeface preview tools render a device font when available and label fallbacks; PNG preserves the browser rendering, while editable SVG may require the same font.',
  '- Visual, meme, and theme generators render artwork for PNG and, where offered, SVG download; their canvas result is not copy-and-paste text.',
  '- The 3D Font Generator uses layered browser-canvas rendering for the front face, extrusion, outline, highlight, perspective, and shadow. It exports a high-resolution PNG, including transparent PNG, and does not currently export STL, OBJ, GLB, or other 3D geometry.',
  '- Hybrid generators lead with downloadable artwork and provide a separate, clearly labelled Unicode alternative for text-only destinations.',
  '- Fandom and brand-inspired tools are unofficial. They use system fonts, bundled open-source alternatives, and original effects rather than distributing official logos or proprietary font assets.',
  '',
  '## Main navigation',
  '',
  `- [Homepage](${SITE_URL}/): Browse featured generators and generator categories.`,
  `- [Text Style Generators](${SITE_URL}/styles): Browse Unicode, ASCII, font-preview, meme, and visual style tools.`,
  `- [Fandom Font Generators](${SITE_URL}/fandom): Browse unofficial game, film, television, and pop-culture-inspired generators.`,
  `- [Guides](${SITE_URL}/guides): Read compatibility, accessibility, troubleshooting, and Unicode reference material.`,
  '',
  ...generatorSections,
  '## Guides and reference material',
  '',
  ...guideLines,
  '',
  '## Site information',
  '',
  `- [About](${SITE_URL}/about): Site purpose and scope.`,
  `- [Contact](${SITE_URL}/contact): Contact information.`,
  `- [Privacy Policy](${SITE_URL}/privacy): Privacy and local-processing information.`,
  `- [Terms of Use](${SITE_URL}/terms): Terms and usage conditions.`,
  `- [XML Sitemap](${SITE_URL}/sitemap.xml): Complete crawlable URL inventory.`,
  '',
].join('\n');

export function GET() {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
