import { keywordTools, type KeywordToolId } from '@/lib/keyword-tools';
import { LibraryPageShell } from './text-library/LibraryPage';
import KeywordTool from './KeywordTool';
import { generatorWorkspaceItems } from '@/lib/generator-workspace-navigation';
export default function KeywordToolPage({ id }: { id: KeywordToolId }) {
  const tool = keywordTools.find(item => item.id === id)!;
  const graphic = id === 'name-tracing-worksheet' || id === 'cross-stitch-font-generator';
  return <LibraryPageShell id={id} workspace category={{ title: 'All tools', path: '/tools' }}>
    <KeywordTool key={id} tool={tool} navigationItems={[...generatorWorkspaceItems, { id, title: tool.title, href: `/${id}`, icon: 'Aa', kind: 'unicode', collection: 'font-style', description: tool.description, searchText: tool.title.toLowerCase() }]} />
    <article className="mx-auto mt-12 max-w-3xl space-y-6 leading-7">
      <h2 className="text-2xl font-semibold">What is {tool.title}?</h2><p>{tool.description}</p>
      <h2 className="text-2xl font-semibold">How to use {tool.title}</h2>
      <ol className="list-decimal space-y-2 pl-6"><li>Enter your {graphic ? 'name or short label' : 'text'} in the input. {id === 'roman-numeral-converter' ? 'Use a number or Roman numeral; direction is detected automatically.' : 'The preview updates as you type.'}</li><li>{id === 'accents-keyboard' ? 'Tap an accented character to append it; edit the input to position it.' : 'Review the result and the limitations above.'}</li><li>{graphic ? 'Download SVG, open it in a browser and print from the browser menu.' : 'Click a result card to copy, then check it in your destination.'}</li></ol>
      <h2 className="text-2xl font-semibold">FAQ</h2>
      <details open><summary className="cursor-pointer py-3 font-semibold">What are the limitations?</summary><p>{tool.description} {graphic ? 'SVG is a chart or worksheet image, not an installable font or embroidery machine file.' : 'Copied text may display differently in another app.'}</p></details>
      <details><summary className="cursor-pointer py-3 font-semibold">Is my input uploaded?</summary><p>Processing happens in your browser. No account or paid credits are required for this tool.</p></details>
    </article>
  </LibraryPageShell>;
}
