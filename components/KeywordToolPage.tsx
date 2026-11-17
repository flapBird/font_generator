import Link from '@/components/IntentLink';
import { keywordTools, type KeywordToolId } from '@/lib/keyword-tools';
import { keywordToolGuides } from '@/lib/keyword-tool-guides';
import { LibraryPageShell } from './text-library/LibraryPage';
import KeywordTool from './KeywordTool';
export default function KeywordToolPage({ id }: { id: KeywordToolId }) {
  const tool = keywordTools.find(item => item.id === id)!;
  const guide = keywordToolGuides[id];
  return <LibraryPageShell id={id} workspace centeredHeading category={{ title: 'Font Tools', path: '/font-tools' }}>
    <nav aria-label="Font tools" className="mb-6 flex flex-wrap gap-2"><Link href="/font-tools" className="inline-flex min-h-11 items-center rounded-xl border px-4 font-semibold text-violet-700">All Font Tools →</Link>{keywordTools.map(item => <Link key={item.id} href={`/${item.id}`} aria-current={item.id === id ? 'page' : undefined} className="inline-flex min-h-11 items-center rounded-xl border px-3 text-sm aria-[current=page]:border-violet-500 aria-[current=page]:bg-violet-50 aria-[current=page]:text-violet-800">{item.title}</Link>)}</nav>
    <KeywordTool key={id} tool={tool} />
    <article className="mx-auto mt-14 max-w-3xl space-y-10 leading-8">
      <section><h2 className="mb-5 text-2xl font-semibold">What is {tool.title}?</h2>{guide.paragraphs.map(text => <p key={text} className="mt-4 text-slate-600 dark:text-slate-300">{text}</p>)}</section>
      <section><h2 className="mb-5 text-2xl font-semibold">How to use {tool.title}</h2><ol className="space-y-5">{guide.steps.map(([title,text],index) => <li key={title} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700"><h3 className="font-semibold">{index+1}. {title}</h3><p className="mt-2 text-slate-600 dark:text-slate-300">{text}</p></li>)}</ol></section>
      <section><h2 className="mb-5 text-2xl font-semibold">Frequently asked questions</h2>{[...guide.faq, ['Is my input uploaded or saved?', 'These tools process your input locally in the browser without an account or paid credits. Downloads stay on your device. Switching tools starts the new tool’s default example rather than transferring your text.']].map(([question,answer]) => <details key={question} className="border-b border-slate-200 py-2 dark:border-slate-700"><summary className="min-h-12 cursor-pointer py-3 font-semibold">{question}</summary><p className="pb-4 text-slate-600 dark:text-slate-300">{answer}</p></details>)}</section>
    </article>
  </LibraryPageShell>;
}
