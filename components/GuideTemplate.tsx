import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';
import {
  getRelatedPages,
  guidePages,
  type PageDefinition,
} from '@/lib/data';
import { getGuideMetadata } from '@/lib/guide-metadata';

interface GuideTemplateProps {
  page: PageDefinition;
  categoryPath: string;
  categoryName: string;
}

const cleanQuestion = (question: string) =>
  question.replace(/\s+a:\s+.*$/i, '').trim();

const emailPattern = /([A-Z0-9._%+-]+)@([A-Z0-9.-]+\.[A-Z]{2,})/gi;

const renderSafeEmailText = (text: string, keyPrefix: string): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(emailPattern)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      nodes.push(
        <Fragment key={`${keyPrefix}-text-${lastIndex}`}>
          {text.slice(lastIndex, matchIndex)}
        </Fragment>,
      );
    }

    nodes.push(
      <span key={`${keyPrefix}-email-${matchIndex}`}>
        <span>{match[1]}</span>
        <span aria-hidden="true">@</span>
        <span>{match[2]}</span>
      </span>,
    );
    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(
      <Fragment key={`${keyPrefix}-text-${lastIndex}`}>
        {text.slice(lastIndex)}
      </Fragment>,
    );
  }

  return nodes.length > 0 ? nodes : [text];
};

const renderInlineFormatting = (text: string): ReactNode[] =>
  text.split(/(\*\*.*?\*\*)/g).filter(Boolean).reduce<ReactNode[]>((nodes, part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      nodes.push(
        <strong key={index}>
          {renderSafeEmailText(part.slice(2, -2), `inline-${index}`)}
        </strong>,
      );
    } else {
      nodes.push(...renderSafeEmailText(part.replace(/\\'/g, "'"), `inline-${index}`));
    }

    return nodes;
  }, []);

const sectionLeadPattern = /^\*\*(.+?)\.\*\*\s*([\s\S]*)$/;

export default function GuideTemplate({
  page,
  categoryPath,
  categoryName,
}: GuideTemplateProps) {
  const paragraphs = page.content.split('\n\n');
  const relatedPages = getRelatedPages(page, guidePages);
  const guideMetadata = getGuideMetadata(page.slug);

  return (
    <div className="min-h-screen pb-20 pt-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-violet-700 dark:hover:text-violet-300">Font Generators</Link>
          <span className="mx-2">/</span>
          <Link href={categoryPath} className="hover:text-violet-700 dark:hover:text-violet-300">{categoryName}</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 dark:text-white">{page.title}</span>
        </nav>

        <header className="rounded-[2rem] border border-slate-200 bg-white p-7 sm:p-10 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
            Font Generators guide
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl dark:text-white">
            {page.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">{page.description}</p>
          <p className="mt-6 text-sm font-medium text-slate-500 dark:text-slate-400">
            Maintained and reviewed by Font Generators · Updated {guideMetadata.updatedLabel}
          </p>
        </header>

        <article className="prose prose-slate mt-10 max-w-none dark:prose-invert">
          {paragraphs.map((paragraph, index) => {
            const sectionLead = paragraph.match(sectionLeadPattern);
            if (sectionLead) {
              return (
                <section key={index}>
                  <h2>{sectionLead[1]}</h2>
                  {sectionLead[2] && <p>{renderInlineFormatting(sectionLead[2])}</p>}
                </section>
              );
            }
            if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
              return <h2 key={index}>{paragraph.replace(/\*\*/g, '')}</h2>;
            }
            if (paragraph.startsWith('- ')) {
              return (
                <ul key={index}>
                  {paragraph.split('\n').map((line, lineIndex) => (
                    <li key={lineIndex}>
                      {renderInlineFormatting(line.replace(/^- /, ''))}
                    </li>
                  ))}
                </ul>
              );
            }
            return <p key={index}>{renderInlineFormatting(paragraph)}</p>;
          })}
        </article>

        {page.examples.length > 0 && (
          <section className="mt-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
              Practical examples
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
              Examples to compare
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {page.examples.map((example, index) => (
                <article
                  key={`${example.before}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
                >
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {renderSafeEmailText(example.before, `example-before-${index}`)}
                  </p>
                  <p className="mt-3 break-words text-xl font-semibold leading-8 text-slate-950 dark:text-white">
                    {renderSafeEmailText(example.after, `example-after-${index}`)}
                  </p>
                  {example.note && (
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {renderSafeEmailText(example.note, `example-note-${index}`)}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {page.howToUse && (
          <section className="mt-10 rounded-2xl border border-violet-200 bg-violet-50 p-6 dark:border-violet-900 dark:bg-violet-950/30">
            <h2 className="text-xl font-black text-slate-950 dark:text-white">Put this guide into practice</h2>
            <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{page.howToUse}</p>
          </section>
        )}

        <section className="mt-12">
          <h2 className="text-2xl font-black text-slate-950 dark:text-white">Frequently asked questions</h2>
          <div className="mt-5 space-y-3">
            {page.faq.map((item, index) => (
              <details key={index} className="group rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-bold text-slate-900 dark:text-white">
                  {cleanQuestion(item.q)}
                  <span aria-hidden="true" className="text-xl text-violet-600 transition group-open:rotate-45">+</span>
                </summary>
                <p className="border-t border-slate-100 px-5 py-4 leading-7 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {guideMetadata.sources.length > 0 && (
          <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/60">
            <h2 className="text-xl font-black text-slate-950 dark:text-white">Sources and further reading</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Primary references used to check the technical and platform-specific details in this guide.
            </p>
            <ul className="mt-4 space-y-2">
              {guideMetadata.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-violet-700 hover:underline dark:text-violet-300"
                  >
                    {source.title} ↗
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {relatedPages.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">
              Continue reading
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {relatedPages.map((relatedPage) => (
                <Link
                  key={relatedPage.slug}
                  href={`/guides/${relatedPage.slug}`}
                  className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-violet-300 hover:text-violet-700 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-violet-700 dark:hover:text-violet-300"
                >
                  <span className="mr-2" aria-hidden="true">{relatedPage.icon}</span>
                  <span className="font-bold">{relatedPage.title}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 border-t border-slate-200 pt-8 text-center dark:border-slate-800">
          <Link href={guideMetadata.toolLink.href} className="inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white hover:bg-violet-500">
            {guideMetadata.toolLink.label}
          </Link>
        </div>
      </div>
    </div>
  );
}
