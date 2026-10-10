# Font Generators

[font-generators.org](https://font-generators.org/) is a collection of browser-based tools for creating copy-and-paste Unicode text, ASCII banners, font previews, meme captions, game text, and downloadable title artwork.

![Font Generators preview](./public/og-font-generators.png)

The project distinguishes between text and artwork instead of presenting every result as a “font”:

- **Unicode generators** substitute ordinary characters with compatible Unicode symbols that can be copied as plain text.
- **ASCII generators** arrange text into multi-line banners and can export TXT, PNG, or SVG files.
- **Font preview tools** render installed or bundled typefaces and label their source and availability.
- **Visual generators** create themed graphics, memes, and game-inspired titles for PNG or SVG download.
- **Hybrid generators** provide both rendered artwork and a separately labelled copyable-text alternative.

User-entered text and image composition are processed in the browser. The application has no account system, database, or text-generation API.

## Features

- Real-time Unicode conversion with search, category filters, and one-click copy
- 53 Unicode transformations, including bold, italic, script, fraktur, enclosed, fullwidth, small caps, superscript, effects, and decorative frames
- 45 style-generator pages and 6 fandom-generator pages backed by a shared registry
- PNG and SVG artwork export with colors, outlines, shadows, gradients, backgrounds, and page-specific presets
- Multi-line ASCII banners with copy, TXT, PNG, and SVG output
- Minecraft text codes, bitmap rendering, material effects, and block-logo output
- Device-font availability checks and clearly labelled bundled open-source alternatives
- Grapheme-aware text handling so emoji and combined characters are not split unnecessarily
- Responsive layouts, dark mode, social previews, FAQs, related content, and 8 practical guides
- Generated `sitemap.xml`, `robots.txt`, `llms.txt`, canonical URLs, Open Graph metadata, and structured data

## How Unicode Conversion Works

Copyable styles are characters, not downloadable font files. The generator maps supported Latin letters and digits to characters from Unicode blocks such as Mathematical Alphanumeric Symbols, Enclosed Alphanumerics, and Letterlike Symbols. Combining marks are used for effects such as underline and strikethrough.

Unsupported characters are preserved rather than removed. Rendering still depends on the destination app, operating system, and available fonts, so some styles may appear differently or display as missing-glyph boxes. Decorative Unicode can also be difficult for screen readers; it is best used for short, non-essential text.

Rendered artwork behaves differently: the browser draws the selected typeface and effects to a canvas or SVG. PNG preserves that rendering, while an editable SVG that references a device font may require the same font on the device where it is opened.

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | [Next.js](https://nextjs.org/) 16 with the App Router |
| UI | [React](https://react.dev/) 19 and TypeScript |
| Styling | [Tailwind CSS](https://tailwindcss.com/) 3 and Typography |
| Animation | [Motion](https://motion.dev/) / Framer Motion |
| Fonts | Self-hosted `@fontsource` packages plus labelled system-font stacks |
| Quality | ESLint 9 with Next.js Core Web Vitals and TypeScript rules |

## Getting Started

### Prerequisites

- Node.js 22 or newer (`nvm use` selects the version in `.nvmrc`)
- npm

### Installation

```bash
git clone <repository-url>
cd font_generator
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Changes under `app`, `components`, and `lib` are reflected by the development server.

No environment file is required for local development.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server with webpack |
| `npm run build` | Create an optimized production build with webpack |
| `npm run start` | Serve the production build |
| `npm run lint` | Run the Next.js ESLint configuration |
| `npm run build:cloudflare` | Build Next.js and adapt its output for Cloudflare Workers |
| `npm run preview` | Build and preview locally in the Workers runtime |
| `npm run preview:cloudflare` | Preview the existing Cloudflare build |
| `npm run deploy` | Build and deploy to Cloudflare Workers |
| `npm run deploy:cloudflare` | Deploy the existing Cloudflare build |
| `npm run cf-typegen` | Generate local Cloudflare binding types |
| `npm run test:cloudflare:browser` | Verify HTTP routes and assets in the Workers runtime |

Run a production build locally with:

```bash
npm run build
npm run start
```

## Analytics

Google Analytics uses the fixed measurement ID `G-P3P9SJKZEG` and is loaded only when the browser hostname is `font-generators.org` or `www.font-generators.org`, so local and preview traffic is not reported. The site also loads Google AdSense on eligible content routes; update those integrations when adapting the project for another deployment or production domain.

## Project Structure

```text
app/
├── layout.tsx                 # Global metadata, navigation, analytics, and ads
├── page.tsx                   # Main searchable Unicode generator
├── styles/                    # Style directory and dynamic generator routes
├── fandom/                    # Fandom directory and dynamic generator routes
├── guides/                    # Guide index and dynamic article routes
├── about/                     # About page
├── contact/                   # Contact page
├── privacy/                   # Privacy policy
├── terms/                     # Terms of use
├── llms.txt/route.ts          # Static machine-readable site directory
├── robots.ts                  # Generated robots.txt
├── sitemap.ts                 # Generated XML sitemap
└── globals.css                # Global styles and design tokens

components/
├── GeneratorTool.tsx          # Unicode conversion, filtering, previews, and copy
├── AsciiGeneratorTool.tsx     # ASCII banner rendering and export
├── VisualGeneratorTool.tsx    # Canvas/SVG artwork editor and export
├── MinecraftGeneratorTool.tsx # Game text and block-logo modes
├── PageTemplate.tsx           # Shared generator-page composition
├── GuideTemplate.tsx          # Shared guide-page composition
├── StyleDirectory.tsx         # Filterable generator listing
├── Header.tsx                 # Responsive site navigation
└── Footer.tsx                 # Footer navigation and site links

lib/
├── unicode.ts                 # Unicode maps and grapheme-safe utilities
├── generator.ts               # Unicode style definitions and page configs
├── ascii-font.ts              # ASCII glyph data and layout logic
├── pixel-font.ts              # Bitmap glyph data and measurements
├── visual-generator.ts        # Visual presets, capabilities, and font metadata
├── generator-registry.ts      # Canonical generator definitions and validation
├── generator-collections.ts   # Homepage and directory groupings
├── data.ts                    # Core page content, examples, and FAQs
├── new-keyword-pages.ts       # Additional style and fandom page content
├── additional-guides.ts       # Additional guide articles
├── guide-metadata.ts          # Guide navigation metadata
└── page-supplements.ts        # Page-specific content supplements

public/
├── ads.txt                    # Authorized digital seller declaration
└── og-font-generators.png     # Default social sharing image
```

## Content and Generator Architecture

Dynamic routes are generated from typed data rather than one file per generator:

1. Page copy, examples, FAQs, relationships, and default Unicode styles live in `lib/data.ts` or `lib/new-keyword-pages.ts`.
2. `lib/generator-registry.ts` assigns each page a generator kind, capabilities, expected outputs, and acceptance criteria.
3. Unicode transformations are defined in `lib/generator.ts`; visual tools use configurations from `lib/visual-generator.ts`.
4. `components/PageTemplate.tsx` selects the correct interactive tool for the registered generator kind.

When adding a page, keep its slug, category, canonical path, default style IDs, related links, and generator configuration aligned. The registry performs duplicate-ID, duplicate-path, output, acceptance-criteria, and unknown-style checks when it is loaded.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Main Unicode text generator |
| `/styles` | Browse Unicode, ASCII, font-preview, meme, and artwork tools |
| `/styles/[slug]` | Individual style generator |
| `/fandom` | Browse unofficial themed and game-related tools |
| `/fandom/[slug]` | Individual fandom generator |
| `/guides` | Browse compatibility, accessibility, and usage guides |
| `/guides/[slug]` | Individual guide |
| `/sitemap.xml` | Search-engine URL inventory |
| `/robots.txt` | Crawler rules |
| `/llms.txt` | Plain-text inventory of generators, outputs, and guides |

## Deployment

Cloudflare Workers deployment is configured using the OpenNext adapter. It retains the Next.js App Router, permanent redirects and prebuilt content pages. See [the Cloudflare deployment guide](docs/cloudflare-deployment.md) for CLI deployment, Workers Builds, environment variables and custom domains.

```bash
npm ci
npm run preview
# After configuring your Cloudflare account:
npx wrangler login
npm run deploy
```

Use **Workers**, with build command `npm run build:cloudflare` and deploy command `npm run deploy:cloudflare`, when connecting this Git repository in Cloudflare. The static-asset directory is `.open-next/assets`; the Worker entry is `.open-next/worker.js`. Content uses the adapter's read-only static-assets cache, so no R2, KV or Durable Object provisioning is needed for this site's current caching behavior.

`npm run build` and `npm run start` still support ordinary Node.js hosting. No `output: 'export'` setting is enabled; neither `.next` nor `.open-next/assets` alone is a complete site deployment.

Before publishing a fork, review the production domain in metadata, canonical URLs, sitemap, robots rules, analytics, AdSense client ID, `public/ads.txt`, contact information, privacy policy, and terms.

## Privacy and Compatibility Notes

- Text transformation, previews, uploads, and artwork export run locally in the browser.
- Analytics and advertising scripts make their own network requests when enabled; consult the privacy policy and configure consent requirements for the deployment region.
- Fandom and brand-inspired tools are unofficial and do not distribute official logos or proprietary font files.
- System-font previews vary by device. Bundled alternatives are identified with their source and license in the UI.
- Unicode availability and platform naming rules vary, so important usernames and bios should be tested in their final destination.

## License

This repository does not currently include a standalone license file. Add an appropriate `LICENSE` before redistributing the project or accepting external contributions.
