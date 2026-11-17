import Link from '@/components/IntentLink';
import { keywordTools, type KeywordToolId } from '@/lib/keyword-tools';
import { keywordToolGuides } from '@/lib/keyword-tool-guides';
import { getContentUpdatedAt } from '@/lib/content-updates';
import KeywordTool from './KeywordTool';
export default function KeywordToolPage({ id }: { id: KeywordToolId }) {
  const tool = keywordTools.find(item => item.id === id)!;
  const guide = keywordToolGuides[id];
  const url = `https://font-generators.org/${id}`;
  return <div className="mx-auto max-w-[1168px] px-5 pb-16 pt-28 sm:px-6">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebApplication', name: tool.title, description: tool.description, url, dateModified: getContentUpdatedAt(`/${id}`), applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'All tools', item: 'https://font-generators.org/tools' }, { '@type': 'ListItem', position: 2, name: 'Font Tools', item: 'https://font-generators.org/font-tools' }, { '@type': 'ListItem', position: 3, name: tool.title, item: url }] }
    ] }).replace(/</g, '\\u003c') }} />
    <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-x-2 text-xs text-slate-600 dark:text-slate-300"><Link className="inline-flex min-h-11 items-center text-violet-800 dark:text-violet-300" href="/tools">All tools</Link><span aria-hidden="true">/</span><Link className="inline-flex min-h-11 items-center text-violet-800 dark:text-violet-300" href="/font-tools">Font Tools</Link><span aria-hidden="true">/</span><span aria-current="page">{tool.title}</span></nav>
    <header className="mx-auto mb-9 max-w-3xl text-center"><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{tool.title}</h1><p className="mt-4 text-base leading-7 text-slate-500 dark:text-slate-400">{tool.description}</p></header>
    <KeywordTool key={id} tool={tool} />
    <article className="mt-12 space-y-12">
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-12"><section><h2 className="mb-5 text-2xl font-semibold">What is {tool.title}?</h2>{guide.paragraphs.map(text => <p key={text} className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{text}</p>)}</section>
      <section><h2 className="mb-5 text-2xl font-semibold">How to use {tool.title}</h2><ol className="space-y-3">{guide.steps.map(([title,text],index) => <li key={title} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700"><h3 className="font-semibold">{index+1}. {title}</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p></li>)}</ol></section></div>
      <section className="max-w-3xl"><h2 className="mb-5 text-2xl font-semibold">Frequently asked questions</h2>{[...guide.faq, ['Is my input uploaded or saved?', 'These tools process your input locally in the browser without an account or paid credits. Downloads stay on your device. Switching tools starts the new tool’s default example rather than transferring your text.']].map(([question,answer]) => <details key={question} className="border-b border-slate-200 py-2 dark:border-slate-700"><summary className="min-h-12 cursor-pointer py-3 font-semibold">{question}</summary><p className="pb-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{answer}</p></details>)}</section>
    </article>
    <div className="mt-10 border-t border-slate-200 pt-5 dark:border-slate-700"><Link href="/font-tools" className="inline-flex min-h-11 items-center text-sm font-semibold text-violet-700 dark:text-violet-300">Explore all Font Tools →</Link></div>
  </div>;
}
