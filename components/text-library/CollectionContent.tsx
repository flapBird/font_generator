import type { LibraryPageDefinition } from '@/lib/text-library/catalog';
import { getCollectionGuide } from '@/lib/text-library/guides';

export default function CollectionContent({ page }: { page: LibraryPageDefinition }) {
  const guide = getCollectionGuide(page.id);
  if (!guide) return null;
  return <div className="mt-14 space-y-12 border-t border-slate-200 pt-10" data-testid="collection-guide">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      '@context': 'https://schema.org', '@type': 'FAQPage', '@id': `https://font-generators.org${page.path}#faq`,
      mainEntity: guide.faq.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })),
    }).replace(/</g, '\\u003c') }} />
    <section aria-labelledby="collection-about-heading" className="max-w-3xl">
      <h2 id="collection-about-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">{guide.heading}</h2>
      <div className="mt-5 space-y-4 text-base leading-8 text-slate-600">{guide.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
    </section>
    <section aria-labelledby="collection-how-heading">
      <h2 id="collection-how-heading" className="text-2xl font-semibold tracking-tight">{guide.howToHeading}</h2>
      <ol className="mt-5 grid gap-4 md:grid-cols-3">{guide.steps.map((step, index) => <li key={step.title} className="rounded-2xl bg-slate-50 p-5 sm:p-6">
        <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">{index + 1}</span>
        <h3 className="mt-4 text-base font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{step.text}</p>
      </li>)}</ol>
    </section>
    <div className="grid gap-6 lg:grid-cols-3">{page.sections.map((section) => <section key={section.title} className="rounded-2xl border border-slate-200 p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{section.title}</h2><p className="mt-3 text-sm leading-7 text-slate-600">{section.text}</p>
    </section>)}</div>
    <section id="faq" aria-labelledby="collection-faq-heading" className="max-w-4xl scroll-mt-24">
      <h2 id="collection-faq-heading" className="text-2xl font-semibold tracking-tight">Frequently asked questions</h2>
      <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">{guide.faq.map((item) => <details key={item.question} className="group">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-5 py-4 font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
          {item.question}<span aria-hidden="true" className="shrink-0 text-xl font-normal text-violet-600 transition-transform group-open:rotate-45">+</span>
        </summary>
        <p className="max-w-3xl pb-5 pr-6 text-sm leading-7 text-slate-600">{item.answer}</p>
      </details>)}</div>
    </section>
  </div>;
}
