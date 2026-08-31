import Link from 'next/link';
import GeneratorTool from './GeneratorTool';
import VisualGeneratorTool from './VisualGeneratorTool';
import MinecraftGeneratorTool from './MinecraftGeneratorTool';
import AsciiGeneratorTool from './AsciiGeneratorTool';
import ThreeDFontGeneratorTool from './ThreeDFontGeneratorTool';
import ResetPageScroll from './ResetPageScroll';
import { fandomPages, guidePages, stylePages, type PageDefinition } from '@/lib/data';
import { getGeneratorPageConfig, getStyleDefinition } from '@/lib/generator';
import { generatorRegistry, getGeneratorDefinition, isFontStyleGenerator } from '@/lib/generator-registry';
import { getPageSupplement } from '@/lib/page-supplements';
import { getSpecializedAbout, getSpecializedFaq, getSpecializedHowTo, getVisualGeneratorConfig } from '@/lib/visual-generator';

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
        href: relatedPage.category === 'guides' ? `/guides/${relatedPage.slug}` : `/${relatedPage.slug}`,
        title: relatedPage.title,
        description: relatedPage.description,
      };
    })
    .filter((link): link is { slug: string; href: string; title: string; description: string } => link !== null);

const cleanFaqQuestion = (question: string) =>
  question.replace(/\s+a:\s+.*$/i, '').trim();

const generatorNavigationItems = generatorRegistry
  .filter((generator) => generator.kind !== 'directory')
  .map((generator) => ({
    id: generator.id,
    title: generator.title,
    href: generator.canonicalPath,
    icon: generator.icon,
    kind: generator.kind,
    description: generator.intent.primary,
    collection: isFontStyleGenerator(generator) ? 'font-style' as const : 'visual-art' as const,
    searchText: `${generator.slug} ${generator.tags.join(' ')} ${generator.intent.primary} ${generator.intent.secondary.join(' ')}`,
  }));

export default function PageTemplate({
  page,
  categoryPath,
  categoryName,
}: PageTemplateProps) {
  const config = {
    ...getGeneratorPageConfig(page.slug, page.title, page.defaultStyleIds),
    initialText: page.title,
  };
  const definition = getGeneratorDefinition(page.slug);
  const baseVisualConfig = getVisualGeneratorConfig(page.slug);
  const visualConfig = baseVisualConfig
    ? { ...baseVisualConfig, initialText: page.title }
    : undefined;
  const isAsciiGenerator = definition?.kind === 'ascii';
  const isThreeDGenerator = page.slug === '3d-font-generator';
  const isHybridGenerator = definition?.kind === 'hybrid';
  const isMinecraftGenerator = visualConfig?.engine === 'minecraft-renderer';
  const requiresVisualConfig = definition
    ? !isThreeDGenerator && ['font-preview', 'meme', 'theme-logo', 'game-text', 'hybrid', 'directory'].includes(definition.kind)
    : false;
  if (requiresVisualConfig && !visualConfig) {
    throw new Error(`Generator ${page.slug} is registered as ${definition?.kind} but has no visual configuration.`);
  }
  if (visualConfig && definition?.kind === 'unicode') {
    throw new Error(`Generator ${page.slug} has a visual configuration but is still registered as Unicode-only.`);
  }
  const isSpecializedGenerator = Boolean(visualConfig) || isAsciiGenerator || isThreeDGenerator;
  const usesFontWorkspace = !isSpecializedGenerator;
  const specializedAbout = getSpecializedAbout(page.slug, page.title);
  const specializedFaq = getSpecializedFaq(page.slug, page.title);
  const specializedHowTo = getSpecializedHowTo(page.slug);
  const workflowSteps = isThreeDGenerator
    ? [
        ['1', 'Enter text', 'Type a short title or up to three manual lines. The 3D preview updates immediately.'],
        ['2', 'Choose a 3D style', 'Apply a complete preset such as Gold, Chrome, Neon, Gaming, Bubble, or Retro.'],
        ['3', 'Customize the depth', 'Adjust extrusion, direction, perspective, colors, outline, shadow, font, and background.'],
        ['4', 'Download PNG', 'Export only the finished artwork at 2× resolution, with a transparent background when selected.'],
      ]
    : isMinecraftGenerator
    ? [
        ['1', 'Enter text', 'Type a sign, MOTD, server title, label, or short heading.'],
        ['2', 'Choose mode and color', 'Use Game Text with the 16-color palette and inline codes, or switch to a textured Block Logo.'],
        ['3', 'Copy or download', 'Copy compatible formatting-code text, or export the exact artwork as PNG or faithful SVG.'],
      ]
    : [
        ['1', 'Enter text', 'Type a name, phrase, caption, or heading in the generator.'],
        ['2', 'Compare styles', isSpecializedGenerator ? 'Compare the page-specific rendered presets and adjust the visual controls.' : `Review the ${config.styleIds.length} page-specific recommendations or choose another style family.`],
        ['3', isSpecializedGenerator ? 'Download and use' : 'Copy and test', isSpecializedGenerator ? 'Export your finished result in the format that fits your project.' : 'Copy your preferred result and test it in the app or field where you plan to use it.'],
      ];
  const supplement = getPageSupplement(page.slug);
  const relatedLinks = getRelatedLinks(page.relatedSlugs).slice(0, 4);
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
      <ResetPageScroll routeKey={page.slug} />
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${usesFontWorkspace ? 'max-w-7xl' : 'max-w-6xl'}`}>
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400 sm:mb-5">
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

        <header className={`text-center ${usesFontWorkspace ? 'mb-6 sm:mb-8' : ''}`}>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            {page.title}
          </h1>
          {isThreeDGenerator && (
            <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
              Create 3D text online with customizable depth, colors, shadows and perspective. Design your letters and download a transparent PNG.
            </p>
          )}
        </header>

        {isThreeDGenerator ? (
          <ThreeDFontGeneratorTool key={page.slug} />
        ) : isAsciiGenerator ? (
          <AsciiGeneratorTool
            key={page.slug}
            pageTitle={page.title}
          />
        ) : isMinecraftGenerator ? (
          <MinecraftGeneratorTool key={page.slug} config={visualConfig} pageTitle={page.title} />
        ) : visualConfig ? (
          <>
            <VisualGeneratorTool
              key={`${page.slug}-visual`}
              config={visualConfig}
              pageTitle={page.title}
            />
            {isHybridGenerator && (
              <GeneratorTool
                key={`${page.slug}-copyable`}
                config={config}
                pageTitle={`${page.title.replace(/\s+Generator$/i, '')} copyable text`}
                compactResults
                sectionId="copyable-styles"
                recommendedLabel="Copyable alternatives"
              />
            )}
          </>
        ) : (
          <GeneratorTool
            key={page.slug}
            config={config}
            pageTitle={page.title}
            compactResults
            workspaceMode
            enableStyleSearch
            enablePopularFilters
            initialResultLimit={18}
            recommendedLabel="Recommended styles"
            generatorSearchItems={generatorNavigationItems}
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
              <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
                  Simple workflow
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                  {isThreeDGenerator ? 'How to Use the 3D Font Generator' : 'How to use this generator'}
                </h2>
                <ol className={`mt-5 grid gap-4 ${isThreeDGenerator ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-3'}`}>
                  {workflowSteps.map(([number, title, copy]) => (
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
                  <details open={index === 0} key={index} className="group rounded-2xl border border-slate-200 bg-white open:border-violet-300 dark:border-slate-800 dark:bg-slate-950 dark:open:border-violet-700">
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

            {relatedLinks.length > 0 && (
              <section className="mt-12">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
                  Choose by outcome
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                  Compare related generators
                </h2>
                <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
                  These tools serve adjacent intents or produce a different kind of output. Compare them when this page is close to—but not exactly—the result you need.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {relatedLinks.map((item) => (
                    <Link
                      key={item.slug}
                      href={item.href}
                      className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-violet-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-violet-700"
                    >
                      <h3 className="font-bold text-slate-950 dark:text-white">{item.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.description}</p>
                      <span className="mt-4 inline-flex text-sm font-bold text-violet-700 dark:text-violet-300">Open generator →</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

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
              <h2 className="font-black text-slate-950 dark:text-white">Explore the directory</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Search by output type, theme, platform, or visual style when you want to compare the full collection.
              </p>
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
                {isThreeDGenerator
                  ? 'PNG export preserves the exact browser-rendered depth, color, outline, highlight, and shadow. Choose Transparent before downloading when you want to place the artwork over another design.'
                  : isMinecraftGenerator
                  ? 'PNG and faithful SVG both preserve the exact rendered canvas. Copy formatting-code text separately when the destination supports Minecraft § or & codes.'
                  : isSpecializedGenerator
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
