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
  '## Optional account and AI features',
  '',
  'The AI font studio starts with a description input. Custom generation requires sign-in and sufficient purchased or subscription-funded credits; availability depends on service configuration. Purchases take place on the Pricing page. Current sales are one-time credit packs, not recurring subscriptions. Existing free generators remain available without an account.',
  'Below the custom generator, use-case examples pair font descriptions with clearly labelled existing reference typefaces for branding and editorial titles. Use this prompt fills the description without starting or charging for a generation. Custom generation currently produces one standard English TTF with 72 glyphs; image-to-font and extended character sets are not offered. Free reference previews and the artwork editor let visitors try their own text and export square, wide, or transparent PNG artwork. Reference previews use existing fonts, not AI-generated results. Layout edits and PNG exports do not spend credits.',
  'Before delivery, generated TTF files are checked for table integrity, decodable outlines, and core English coverage (uppercase and lowercase letters, digits, space, period, comma, exclamation mark, and question mark). Invalid results fail the generation and restore its reserved customer credits. Downloads become available after the file is saved to private storage. Generated previews load that same stored file, and previews and artwork show a warning for characters absent from its character map. These checks do not guarantee visual quality, prompt accuracy, or compatibility with every design application.',
  'Custom generation also requires configured SeeAPI safety checks. Descriptions are reviewed for sexual content, violence, hate, harassment, and self-harm before generation credits are reserved or Mixfont is called. Pending or unavailable prompt checks do not start generation. Generated files remain quarantined while all visible glyph outlines, including unencoded glyphs, are rendered into specimen images and screened for NSFW content. New results are previewable and downloadable only after all specimen pages pass; rejected or failed output reviews restore the generation credits once. Existing delivered fonts remain accessible. Automated checks can make mistakes and are not a guarantee that every unsafe symbol or context will be detected.',
  'Safety processing sends descriptions and rendered glyph specimens to SeeAPI. Its current data policy provides no scheduled automatic expiry for stored input files, task information, or moderation results; API request logs are retained for 60 days. Free reference previews and local PNG exports do not call the moderation API.',
  'Confirmed Waffo refunds withdraw credits in proportion to the refunded payment, with full refunds withdrawing all credits from that payment. Already spent credits can result in a negative balance. Negative balances and Waffo payment disputes pause new generation and purchases pending support review; previously delivered fonts remain available. Transaction email for Waffo purchases is optional and depends on mail service configuration; credit delivery does not depend on email delivery.',
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
