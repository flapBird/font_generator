import Link from 'next/link';
import GeneratorTool from '@/components/GeneratorTool';
import { generatorStyles, getGeneratorPageConfig } from '@/lib/generator';
import { homepageEntries } from '@/lib/generator-collections';

export default function HomePage() {
  const homeConfig = {
    ...getGeneratorPageConfig('fancy-font-generator', 'Fancy Font Generator'),
    initialText: 'Hello World',
    styleIds: generatorStyles.map((style) => style.id),
    resultIntro: 'Type once, search or browse the font styles, then copy and paste the result anywhere that supports Unicode text.',
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
              Turn ordinary text into fancy, copy-and-paste fonts. Search cursive, bold, gothic, bubble, gaming, and more Unicode styles instantly.
            </p>
          </div>

          <GeneratorTool
            config={homeConfig}
            discoveryItems={homepageEntries}
            pageTitle="Font Generator"
            enableStyleSearch
            initialResultLimit={18}
            recommendedLabel="All font styles"
            compactResults
            enablePopularFilters
            showSocialPreview
          />

          <div className="mx-auto mt-16 max-w-6xl">
            <div className="prose prose-neutral max-w-none dark:prose-invert">
              <section>
                <h2>Create Fancy Text in Three Steps</h2>
                <p>
                  Create copy-and-paste text in three quick steps. Everything updates in your browser, so there is no account, download, or separate Generate button.
                </p>
                <ol className="grid gap-4 pl-0 sm:grid-cols-3 [&>li]:m-0 [&>li]:list-none [&>li]:rounded-2xl [&>li]:border [&>li]:border-slate-200 [&>li]:bg-white [&>li]:p-5 dark:[&>li]:border-slate-800 dark:[&>li]:bg-slate-950">
                  <li><strong>1. Enter your text.</strong><br />Type a name, bio, caption, message, or short phrase in the input box.</li>
                  <li><strong>2. Explore the styles.</strong><br />Use popular tags or the broader categories. Open search only when you need a specific look.</li>
                  <li><strong>3. Preview and copy.</strong><br />Check a style in the social previews, then copy it into the app or document you use.</li>
                </ol>
              </section>

              <section className="mt-14">
                <h2>What This Font Generator Changes—and What It Doesn&apos;t</h2>
                <p>
                  The copyable results are not installed font files. This tool works as a Unicode text changer: it maps ordinary letters to existing characters such as bold 𝐀, script 𝒜, double-struck 𝔸, circled Ⓐ, and fullwidth Ａ. Because those results are characters rather than CSS formatting, their appearance can survive copy and paste in many text fields.
                </p>
                <p>
                  Unicode does not provide a complete styled version of every alphabet, number, accent, or symbol. When a matching character is unavailable, the generator keeps the original character so the message remains readable. This is also why copyable Unicode text is different from the site’s <Link href="/styles">rendered text artwork</Link>, which preserves a visual design in PNG or SVG output.
                </p>
              </section>

              <section className="mt-14">
                <h2>Find the Right Font Style for Your Text</h2>
                <div className="not-prose grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ['Cursive & Script', '𝒞𝓊𝓇𝓈𝒾𝓋𝑒', 'Names, signatures, bios, invitations, and elegant display phrases.'],
                    ['Bold & Italic', '𝐁𝐨𝐥𝐝  𝐼𝓉𝑎𝓁𝑖𝑐', 'Headlines, profile highlights, labels, and short emphasis.'],
                    ['Gothic & Old English', '𝔊𝔬𝔱𝔥𝔦𝔠', 'Dark, medieval, metal, tattoo, fantasy, and gaming themes.'],
                    ['Bubble & Enclosed', 'Ⓑⓤⓑⓑⓛⓔ', 'Playful usernames, badges, short captions, and cute profiles.'],
                    ['Tiny & Aesthetic', 'ᴛɪɴʏ  ＡＥＳＴＨＥＴＩＣ', 'Minimal bios, dividers, vaporwave looks, and compact labels.'],
                    ['Glitch & Weird', 'G̶̈ĺ̷ï̶t̷́c̶̈h̷́', 'Creepy, corrupted, upside-down, experimental, and unusual text.'],
                  ].map(([title, sample, description]) => (
                    <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/60">
                      <h3 className="font-bold text-slate-950 dark:text-white">{title}</h3>
                      <p className="mt-3 break-words text-2xl text-violet-700 dark:text-violet-300">{sample}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="mt-14">
                <h2>Where Copy-and-Paste Fonts Work Best</h2>
                <div className="grid gap-x-10 sm:grid-cols-2">
                  <ul>
                    <li><strong>Social profiles:</strong> display names, bios, captions, comments, and short posts.</li>
                    <li><strong>Messaging and communities:</strong> Discord names, chat messages, channel labels, and status text.</li>
                    <li><strong>Gaming:</strong> player names, clan tags, team labels, and community profiles where the characters are accepted.</li>
                  </ul>
                  <ul>
                    <li><strong>Creative projects:</strong> invitations, headings, digital notes, and decorative labels.</li>
                    <li><strong>Documents:</strong> short display text in editors that preserve the chosen Unicode characters.</li>
                    <li><strong>Rendered graphics:</strong> when exact colors, layout, outlines, or downloads matter, use a <Link href="/styles">visual generator</Link> instead.</li>
                  </ul>
                </div>
                <p>
                  Platform rules can differ between usernames, display names, bios, and message fields. Test the exact field before saving an important account name. Decorative text works best as an accent; keep essential instructions and long passages in ordinary characters.
                </p>
              </section>

              <section className="mt-14 rounded-3xl border border-amber-200 bg-amber-50/70 p-6 sm:p-8 dark:border-amber-900/60 dark:bg-amber-950/20">
                <h2 className="mt-0">When Fancy Text Shows as Boxes—or Changes Shape</h2>
                <p>
                  A box, question mark, or missing character usually means the destination device or app does not have a font that can draw that Unicode symbol. It does not necessarily mean the copied text is broken. Try a broadly supported style such as Bold, Italic, Sans, or Fullwidth, and test it on both mobile and desktop.
                </p>
                <p className="mb-0">
                  Some letters may stay normal because no reliable equivalent exists in that style. Combining effects such as glitch or underline can also render with different spacing. The <Link href="/guides/unicode-font-compatibility-guide">Unicode compatibility guide</Link> explains fallback fonts, missing glyphs, and safer choices in more detail.
                </p>
              </section>

              <section className="mt-14">
                <h2>Font Generator Questions, Answered</h2>
                <div className="not-prose divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                  {[
                    ['Is this font generator free?', 'Yes. You can generate, filter, preview, copy, and paste the available Unicode styles without signing up or downloading software.'],
                    ['Are these downloadable fonts?', 'No. The copyable results are Unicode characters that resemble different fonts. Use a rendered artwork generator when you need a design saved as PNG or SVG.'],
                    ['Can I use fancy fonts on Instagram, TikTok, and Discord?', 'Many styles work in bios, display names, captions, comments, and chats. Each platform and field can apply different character rules, so test the result before saving an important name.'],
                    ['Why do some letters stay unchanged?', 'Unicode does not contain a matching version of every letter, number, accent, or symbol in every style. The generator keeps unsupported characters unchanged so the original text remains readable.'],
                    ['Does the generator store my text?', 'The conversion and previews run in your browser. Avoid entering passwords or other sensitive information into any public web tool.'],
                  ].map(([question, answer]) => (
                    <article key={question} className="py-6 first:pt-5 last:pb-5">
                      <h3 className="text-base font-bold text-slate-950 dark:text-white">{question}</h3>
                      <p className="mt-2 max-w-5xl leading-7 text-slate-600 dark:text-slate-300">{answer}</p>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
