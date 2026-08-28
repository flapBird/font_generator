import Link from 'next/link';

const toolGroups = [
  {
    icon: '✨',
    title: 'Copy-and-paste text',
    description: 'Convert ordinary text into Unicode bold, script, fraktur, circled, small-cap, and other styles that can be copied into supported apps.',
    href: '/',
    linkLabel: 'Open the main generator',
  },
  {
    icon: '🎨',
    title: 'Style and artwork generators',
    description: 'Browse Unicode generators alongside rendered typography and ASCII tools with live previews and downloadable output.',
    href: '/styles',
    linkLabel: 'Browse text styles',
  },
  {
    icon: '⭐',
    title: 'Fandom-inspired generators',
    description: 'Create unofficial, original text treatments inspired by broad visual themes from games, films, television, and popular culture.',
    href: '/fandom',
    linkLabel: 'Browse fandom styles',
  },
  {
    icon: '📖',
    title: 'Practical guides',
    description: 'Learn how Unicode text works, what compatibility limits to expect, and how to use decorative text accessibly.',
    href: '/guides',
    linkLabel: 'Read the guides',
  },
];

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Font Generators',
            url: 'https://font-generators.org',
            description: 'Browser-based text and typography generators with practical compatibility guides.',
            email: 'contact@font-generators.org',
          }),
        }}
      />

      <div className="min-h-screen pb-20 pt-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <header className="text-center">
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl dark:text-white">
              About <span className="gradient-text">Font Generators</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Free browser-based tools for copyable Unicode text, rendered typography, ASCII art, and downloadable text graphics.
            </p>
          </header>

          <section className="mt-14">
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">What this site provides</h2>
            <div className="mt-4 space-y-4 text-base leading-8 text-slate-700 dark:text-slate-300">
              <p>
                Font Generators helps people turn short words, names, captions, headings, and display text into formats suited to different uses. Some tools produce characters that can be copied and pasted. Others render text as artwork that can be downloaded as an image or SVG. The big-text tool creates multi-line ASCII banners that remain plain text.
              </p>
              <p>
                Each generator is built around the intent named on its page. The controls, presets, examples, compatibility notes, and export options vary because a social profile, a meme headline, and a downloadable title graphic are different tasks.
              </p>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">Explore the tools and guides</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {toolGroups.map((group) => (
                <article key={group.title} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
                  <span aria-hidden="true" className="text-3xl">{group.icon}</span>
                  <h3 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">{group.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{group.description}</p>
                  <Link href={group.href} className="mt-auto pt-5 text-sm font-bold text-violet-700 hover:underline dark:text-violet-300">
                    {group.linkLabel} →
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-14 rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">How the generators work</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              <div>
                <h3 className="font-bold text-slate-950 dark:text-white">Unicode text</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Letters are mapped to existing Unicode characters. The result is copyable text, not a new font file, and character coverage varies by style.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-slate-950 dark:text-white">Rendered artwork</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  The browser draws text with the selected colors, outline, shadow, and layout. PNG preserves the appearance; editable SVG may depend on font availability when reopened.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-slate-950 dark:text-white">ASCII banners</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Ordinary letters are expanded into multi-line character art. The output can be copied as plain text or exported for use as a graphic.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-14 grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">Privacy and local processing</h2>
              <div className="mt-4 space-y-4 leading-7 text-slate-700 dark:text-slate-300">
                <p>
                  Generator conversion and rendering take place in the browser. Text entered into a generator is not submitted to a Font Generators conversion service or attached to an account.
                </p>
                <p>
                  The site uses hosting services, analytics, and advertising. Those services can process visit and device information as explained in the <Link href="/privacy" className="font-semibold text-violet-700 hover:underline dark:text-violet-300">Privacy Policy</Link>. Avoid entering sensitive information into any public web tool.
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">Compatibility and accessibility</h2>
              <div className="mt-4 space-y-4 leading-7 text-slate-700 dark:text-slate-300">
                <p>
                  Unicode coverage and installed fonts differ across browsers, operating systems, and apps. A style can look different, fall back to another typeface, or be rejected in a particular username or profile field.
                </p>
                <p>
                  Decorative Unicode can also be difficult for screen readers. Important information should remain available in ordinary text, and generated results should be tested in the exact place where they will be used.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">How pages are created and reviewed</h2>
            <div className="mt-4 space-y-4 leading-7 text-slate-700 dark:text-slate-300">
              <p>
                Pages are created and reviewed using documented Unicode mappings, browser rendering checks, cross-device considerations, and tests of the controls and exported files. We aim to state incomplete character coverage, font fallback, accessibility limitations, and platform-specific uncertainty where they matter.
              </p>
              <p>
                Platform rules and software behavior can change. If you find an incorrect mapping, broken export, outdated compatibility note, or accessibility problem, please send the page URL and details through the <Link href="/contact" className="font-semibold text-violet-700 hover:underline dark:text-violet-300">Contact page</Link>.
              </p>
            </div>
          </section>

          <section className="mt-14 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">Independent and unofficial references</h2>
            <p className="mt-4 leading-7 text-slate-700 dark:text-slate-300">
              Fandom, product, platform, and named-typeface pages are independent references. Font Generators is not affiliated with or endorsed by the brands named on those pages. The tools do not provide proprietary font files or official logos; they create original treatments, browser-rendered text, or Unicode approximations subject to the limitations stated on each page.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
