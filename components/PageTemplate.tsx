import Link from 'next/link';
import GeneratorTool from './GeneratorTool';
import VisualGeneratorTool from './VisualGeneratorTool';
import AsciiGeneratorTool from './AsciiGeneratorTool';
import { fandomPages, guidePages, stylePages, type PageDefinition } from '@/lib/data';
import { getGeneratorPageConfig, getStyleDefinition } from '@/lib/generator';
import { getPageSupplement } from '@/lib/page-supplements';
import { getSpecializedAbout, getSpecializedDescription, getSpecializedFaq, getSpecializedHowTo, getVisualGeneratorConfig } from '@/lib/visual-generator';

interface PageTemplateProps {
  page: PageDefinition;
  categoryPath: string;
  categoryName: string;
}

const pagesBySlug = new Map(
  [...stylePages, ...fandomPages, ...guidePages].map((page) => [page.slug, page]),
);

const getRelatedLinks = (slugs: string[]) =>
  slugs
    .map((slug) => {
      const relatedPage = pagesBySlug.get(slug);
      if (!relatedPage) return null;

      return {
        slug,
        href: `/${relatedPage.category}/${relatedPage.slug}`,
      };
    })
    .filter((link): link is { slug: string; href: string } => link !== null);

const relatedLabel = (slug: string) =>
  slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const cleanFaqQuestion = (question: string) =>
  question.replace(/\s+a:\s+.*$/i, '').trim();

export default function PageTemplate({
  page,
  categoryPath,
  categoryName,
}: PageTemplateProps) {
  const config = getGeneratorPageConfig(page.slug, page.title);
  const visualConfig = getVisualGeneratorConfig(page.slug);
  const isAsciiGenerator = page.slug === 'big-font-generator';
  const isSpecializedGenerator = Boolean(visualConfig) || isAsciiGenerator;
  const specializedDescription = getSpecializedDescription(page.slug);
  const specializedAbout = getSpecializedAbout(page.slug, page.title);
  const specializedFaq = getSpecializedFaq(page.slug, page.title);
  const specializedHowTo = getSpecializedHowTo(page.slug);
  const generatorCountLabel = isAsciiGenerator
    ? '6 ASCII styles'
    : visualConfig
      ? `${visualConfig.presets.length} rendered presets`
      : `${config.styleIds.length} recommended styles`;
  const supplement = getPageSupplement(page.slug);
  const generatedExamples = page.examples.slice(0, 4).map((example, index) => {
    const styleId = config.styleIds[index % config.styleIds.length];
    const style = getStyleDefinition(styleId);
    return {
      before: example.before,
      after: style?.transform(example.before) ?? example.after,
      note: style?.name ?? example.note,
    };
  });

  return (
    <div className="min-h-screen pb-20 pt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/" className="font-medium hover:text-violet-700 dark:hover:text-violet-300">
            Font Generators
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={categoryPath} className="font-medium hover:text-violet-700 dark:hover:text-violet-300">
            {categoryName}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-900 dark:text-slate-100">{page.title}</span>
        </nav>

        <header className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white px-6 py-9 shadow-[0_24px_80px_-56px_rgba(79,70,229,0.5)] sm:px-10 sm:py-12 dark:border-slate-800 dark:bg-slate-950">
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-violet-200/45 blur-3xl dark:bg-violet-900/20" aria-hidden="true" />
          <div className="absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-sky-100/55 blur-3xl dark:bg-sky-900/10" aria-hidden="true" />
          <div className="relative max-w-4xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">
              <span>{page.icon}</span>
              <span>Free online generator</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>{generatorCountLabel}</span>
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
              {page.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl dark:text-slate-300">
              {specializedDescription ?? page.description}
            </p>
            <a
              href="#generator"
              className="mt-7 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/20"
            >
              Start generating
            </a>
          </div>
        </header>

        {isAsciiGenerator ? (
          <AsciiGeneratorTool
            examples={page.examples.map((example) => example.before)}
            pageTitle={page.title}
          />
        ) : visualConfig ? (
          <VisualGeneratorTool
            config={visualConfig}
            examples={page.examples.map((example) => example.before)}
            pageTitle={page.title}
          />
        ) : (
          <GeneratorTool
            config={config}
            examples={page.examples.map((example) => example.before)}
            pageTitle={page.title}
          />
        )}

        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
                About this generator
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                What is the {page.title}?
              </h2>
              <div className="mt-5 space-y-5 text-base leading-8 text-slate-700 dark:text-slate-300">
                {(specializedAbout ?? page.content.split('\n\n')).map((paragraph, index) => {
                  if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                    return (
                      <h3 key={index} className="pt-2 text-xl font-bold text-slate-950 dark:text-white">
                        {paragraph.replace(/\*\*/g, '')}
                      </h3>
                    );
                  }
                  return <p key={index}>{paragraph}</p>;
                })}
              </div>
            </section>

            {supplement && (
              <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
                  Practical selection guide
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                  {supplement.heading}
                </h2>
                <div className="mt-5 space-y-4 leading-8 text-slate-700 dark:text-slate-300">
                  {supplement.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                <ul className="mt-6 grid gap-3 sm:grid-cols-3">
                  {supplement.tips.map((tip) => (
                    <li
                      key={tip}
                      className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      {tip}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {page.howToUse && (
              <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
                  Simple workflow
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                  How to use this generator
                </h2>
                <ol className="mt-5 grid gap-4 sm:grid-cols-3">
                  {[
                    ['1', 'Enter text', 'Type a name, phrase, caption, or heading in the generator.'],
                    ['2', 'Compare styles', isSpecializedGenerator ? 'Compare the page-specific rendered presets and adjust the visual controls.' : `Review the ${config.styleIds.length} page-specific recommendations or choose another style family.`],
                    ['3', isSpecializedGenerator ? 'Download and use' : 'Copy and test', isSpecializedGenerator ? 'Export your finished result in the format that fits your project.' : 'Copy your preferred result and test it in the app or field where you plan to use it.'],
                  ].map(([number, title, copy]) => (
                    <li key={number} className="rounded-2xl bg-white p-4 dark:bg-slate-950">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-black text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                        {number}
                      </span>
                      <h3 className="mt-3 font-bold text-slate-950 dark:text-white">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{copy}</p>
                    </li>
                  ))}
                </ol>
                <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-400">{specializedHowTo ?? page.howToUse}</p>
              </section>
            )}

            {!isSpecializedGenerator && <section className="mt-12">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
                Live output examples
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                {page.title.replace(/\s+Generator$/i, '')} examples
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400">
                These examples are produced by the same transformations used in the generator above.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {generatedExamples.map((example, index) => (
                  <article key={`${example.before}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Plain text</p>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">{example.before}</p>
                    <div className="my-4 h-px bg-slate-200 dark:bg-slate-800" />
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-300">
                        {example.note}
                      </p>
                    </div>
                    <p className="mt-2 break-words text-xl leading-8 text-slate-950 dark:text-white">{example.after}</p>
                  </article>
                ))}
              </div>
            </section>}

            <section className="mt-12">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
                Common questions
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                Frequently asked questions
              </h2>
              <div className="mt-5 space-y-3">
                {(specializedFaq ?? page.faq).map((item, index) => (
                  <details key={index} className="group rounded-2xl border border-slate-200 bg-white open:border-violet-300 dark:border-slate-800 dark:bg-slate-950 dark:open:border-violet-700">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-bold text-slate-900 dark:text-white">
                      {cleanFaqQuestion(item.q)}
                      <span aria-hidden="true" className="text-xl text-violet-600 transition group-open:rotate-45">+</span>
                    </summary>
                    <p className="border-t border-slate-100 px-5 py-4 leading-7 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>

            {(page.disclaimer || (!isSpecializedGenerator && page.fontNote)) && (
              <section className="mt-10 space-y-3" aria-label="Important notes">
                {page.disclaimer && (
                  <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                    {page.disclaimer}
                  </p>
                )}
                {!isSpecializedGenerator && page.fontNote && (
                  <p className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm leading-7 text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-200">
                    {page.fontNote}
                  </p>
                )}
              </section>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
              <h2 className="font-black text-slate-950 dark:text-white">Related generators</h2>
              <nav className="mt-3 space-y-2" aria-label="Related generators">
                {getRelatedLinks(page.relatedSlugs).slice(0, 4).map(({ slug, href }) => (
                  <Link
                    key={slug}
                    href={href}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700 dark:text-slate-300 dark:hover:bg-violet-950/40 dark:hover:text-violet-300"
                  >
                    <span>{relatedLabel(slug)}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                ))}
              </nav>
              <Link
                href={categoryPath}
                className="mt-4 inline-flex text-sm font-bold text-violet-700 hover:text-violet-900 dark:text-violet-300"
              >
                Browse all {categoryName.toLowerCase()} →
              </Link>
            </div>

            <div className="rounded-3xl bg-slate-950 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">{isSpecializedGenerator ? 'Export note' : 'Unicode note'}</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {isSpecializedGenerator
                  ? 'PNG preserves the current rendered appearance. SVG keeps editable text, so its font can change when opened on a device without the same typeface.'
                  : 'Fancy text changes characters, not the installed font. That is why the result can be copied into many apps, but rendering may vary by device.'}
              </p>
              {!isSpecializedGenerator && <Link href="/guides/how-unicode-text-works-guide" className="mt-4 inline-flex text-sm font-bold text-white hover:text-violet-300">
                Learn how Unicode text works →
              </Link>}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
