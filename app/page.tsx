import Link from 'next/link';
import GeneratorTool from '@/components/GeneratorTool';
import { getGeneratorPageConfig } from '@/lib/generator';

const discoveryItems = [
  {
    icon: '✨',
    title: 'Copy & Paste Text',
    description: 'Turn plain text into copyable Unicode styles.',
    linkLabel: 'You are here',
  },
  {
    icon: '🎨',
    title: 'Text Artwork',
    description: 'Design rendered titles and download PNG or SVG.',
    href: '/styles',
    linkLabel: 'Browse style tools',
  },
  {
    icon: '🔠',
    title: 'ASCII Banners',
    description: 'Build large multi-line art that remains plain text.',
    href: '/styles/big-font-generator',
    linkLabel: 'Make a banner',
  },
  {
    icon: '⭐',
    title: 'Fandom Styles',
    description: 'Create unofficial artwork inspired by visual themes.',
    href: '/fandom',
    linkLabel: 'Explore fandom tools',
  },
  {
    icon: '📖',
    title: 'Guides',
    description: 'Check Unicode, compatibility, and accessibility.',
    href: '/guides',
    linkLabel: 'Read practical guides',
  },
];

export default function HomePage() {
  const homeConfig = {
    ...getGeneratorPageConfig('fancy-font-generator', 'Fancy Font Generator'),
    initialText: 'Hello World',
    styleIds: [
      'bold',
      'italic',
      'boldItalic',
      'script',
      'boldScript',
      'fraktur',
      'monospace',
      'doubleStruck',
      'circled',
      'fullwidth',
      'smallCaps',
      'sparkle',
    ],
    resultIntro: 'Compare a broad set of Unicode letter styles, then copy the version that fits your message.',
  };

  return (
    <>
      <link rel="canonical" href="https://font-generators.org/" />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Font Generator",
            "url": "https://font-generators.org",
            "description": "Create copyable Unicode text, rendered text artwork, and ASCII banners with free browser-based tools.",
            "applicationCategory": "DesignApplication",
            "operatingSystem": "Any",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          })
        }}
      />

      <div className="min-h-screen pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <span className="gradient-text">Font Generator</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Create copyable Unicode text, rendered font artwork, and ASCII banners—free in your browser.
            </p>
          </div>

          <GeneratorTool
            config={homeConfig}
            discoveryItems={discoveryItems}
            examples={['Font Generator', 'Creative Text', 'Social Bio 2026']}
            pageTitle="Font Generator"
          />

         {/* SEO Content */}
         <div className="prose prose-neutral mx-auto mt-16 max-w-4xl dark:prose-invert">
           <h2>What Can You Make with Font Generators?</h2>
           <p>
             Font Generators is a collection of free browser-based tools for changing how short text looks and how it can be used. The main <strong>font generator</strong> above converts ordinary letters into decorative Unicode characters that you can copy and paste. Other tools create rendered text artwork with colors, outlines, shadows, and downloadable PNG or SVG files. The <Link href="/styles/big-font-generator">Big Font Generator</Link> builds multi-line ASCII banners that remain plain text, while the <Link href="/fandom">fandom generators</Link> offer unofficial, original treatments inspired by broad visual themes.
           </p>
           <p>
             These outputs solve different problems. Copyable Unicode is useful when a profile, caption, message, or username accepts the characters. Rendered artwork is the better choice when the exact appearance matters and you want to place a title in a post, thumbnail, banner, or design. ASCII text suits code blocks, terminal-style posts, and other places where a monospaced layout can be preserved. Use the module guide inside the generator to move directly to the type of output you need.
           </p>

           <h2>How Does the Copy-and-Paste Font Generator Work?</h2>
           <p>
             This page maps regular letters to existing Unicode characters. For example, a standard “A” can become “𝐀” in mathematical bold or “𝒜” in mathematical script. Because the result is made from characters rather than CSS styling or an installed font file, it can retain its decorative appearance when copied into many apps and text fields. Type or paste a message, compare the generated styles, and use the Copy button beside the version you prefer. Results update in the browser as you type, with no account or separate generation step.
           </p>
           <p>
             The available families include bold, italic, bold italic, script, fraktur, double-struck, monospace, circled, fullwidth, small caps, and decorative effects. Filters let you move beyond the recommended results and compare classic, modern, decorative, symbol, and effect categories. The generator leaves spaces and unsupported characters readable instead of silently deleting them.
           </p>
           <p>
             Unicode coverage is not perfectly even. Some alphabets include uppercase and lowercase letters but no styled digits; some small or raised styles contain only part of the Latin alphabet; and accented letters may not have a matching character. When a direct mapping is unavailable, the original character remains in the result. That mixed appearance reflects the characters defined by Unicode rather than a failed conversion.
           </p>

           <h2>Copyable Text, Rendered Artwork, and ASCII Are Different</h2>
           <p>
             A copy-and-paste font generator does not create or install a conventional font. It substitutes characters, so the destination app decides which installed typeface is used to draw them. This makes the output convenient, but the same string may look slightly different on another device. It also means a platform can reject a character even when your browser displays it correctly.
           </p>
           <p>
             The site’s rendered artwork generators take another approach. They draw the text in a browser preview and provide controls suited to the page’s purpose, such as preset treatments, font size, letter spacing, color, background, outline, shadow, transparency, and canvas format. A downloaded PNG preserves the rendered pixels. SVG keeps scalable text and shapes, but an editable SVG can use a fallback when the named font is unavailable on the device that opens it.
           </p>
           <p>
             ASCII banners are built from rows of ordinary symbols. They can be copied as text or downloaded as TXT, PNG, or SVG. Plain-text ASCII works best in a monospaced field because proportional fonts and automatic line wrapping can disturb the alignment. Short lines are also easier to reuse on mobile screens.
           </p>

           <h2>Popular Styles and Practical Uses</h2>
           <ul>
             <li><strong>Bold and italic:</strong> useful for short labels, profile highlights, headings, and selective emphasis where the destination accepts Unicode mathematical letters.</li>
             <li><strong>Script and cursive:</strong> decorative choices for names, short bios, invitations, and display phrases; longer passages can become difficult to scan.</li>
             <li><strong>Fraktur and themed effects:</strong> suited to fantasy, horror, music, retro, or fandom-inspired concepts where visual character matters more than neutral readability.</li>
             <li><strong>Circled, fullwidth, and monospace:</strong> useful for playful usernames, compact labels, gaming communities, and technology-inspired text.</li>
             <li><strong>Rendered title graphics:</strong> a better fit for social images, video thumbnails, banners, posters, and projects that need consistent colors and layout.</li>
           </ul>
           <p>
             Decorative text is usually strongest as an accent. Try it in a display name, a few words in a bio, a section label, or a short announcement rather than converting every sentence. If a platform has separate display-name and username fields, test the exact field you intend to change: acceptance rules can differ inside the same service. For an important account, keep a plain-text copy of the original value before editing it.
           </p>

           <h2>Compatibility, Readability, and Accessibility</h2>
           <p>
             Support varies by application, operating system, browser, field, and installed fonts. Common Unicode styles work in many modern environments, but no generator can guarantee that every character will display or be accepted everywhere. Missing-glyph boxes, fallback shapes, unexpected spacing, search mismatches, or rejected profile fields are all possible. Paste a short test into the exact destination before committing to a long name or post. The <Link href="/guides/unicode-font-compatibility-guide">Unicode compatibility guide</Link> explains the main checks and safer fallback choices.
           </p>
           <p>
             Accessibility matters as well. A screen reader may announce a decorative character by its formal Unicode name instead of reading it like an ordinary letter. Search, translation, moderation, and text-to-speech systems may also interpret the string differently. Keep essential instructions, contact details, navigation labels, and long body copy in standard characters. Decorative output is best reserved for optional visual emphasis, with the same meaning available in plain text when it is important. See the <Link href="/guides/accessible-fancy-text-guide">accessible fancy text guide</Link> for practical examples.
           </p>

           <h2>Privacy and Local Processing</h2>
           <p>
             Text conversion, artwork rendering, and ASCII generation take place in your browser. The text entered into a generator is not submitted to a Font Generators conversion service or attached to a user account. The site does use hosting, analytics, and advertising services that can process visit and device information as described in the <Link href="/privacy">Privacy Policy</Link>. As with any public website, avoid entering passwords, private identifiers, or other sensitive information into a generator.
           </p>

           <h2>Frequently Asked Questions</h2>

           <h3>Are these real fonts?</h3>
           <p>
             The copyable results are Unicode character substitutions, not downloadable font files. Rendered generator pages create text graphics using browser-available fonts and original visual presets. The site does not distribute proprietary typefaces or official brand assets.
           </p>

           <h3>Can I use the generated text on social media?</h3>
           <p>
             Often, yes, when the particular app and field accept the selected characters. Bios, display names, captions, comments, and chat fields can have different rules, so test the result before relying on it. If characters display incorrectly, switch to a simpler style or use a rendered image where images are supported.
           </p>

           <h3>Why do some letters stay unchanged?</h3>
           <p>
             Not every letter, digit, accent, or symbol has an equivalent in every Unicode style. The generator preserves the original character when no suitable mapping exists so the message remains readable.
           </p>

           <h3>Which generator should I choose?</h3>
           <p>
             Choose copyable Unicode when you need styled characters inside a text field. Choose rendered artwork when you need a predictable visual design or downloadable file. Choose ASCII when the output must remain multi-line plain text. If compatibility or accessibility is the main concern, start with the <Link href="/guides">guides</Link> before publishing.
           </p>
         </div>
        </div>
      </div>
    </>
  );
}
