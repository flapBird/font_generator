'use client';
import { useRef } from 'react';
import { keywordTools } from '@/lib/keyword-tools';
import { convertRoman, translateEmoji, emojiWords } from '@/lib/keyword-converters';
import { getPixelGlyph } from '@/lib/pixel-font';
import { useGeneratorText } from '@/lib/use-generator-text';
import { getGeneratorPageConfig } from '@/lib/generator';
import type { GeneratorSearchItem } from './GeneratorTool';
import TextToolLayout from './TextToolLayout';
import TextToolInput from './TextToolInput';
import TextOutputCard from './TextOutputCard';
const pairs = [['Editorial','Georgia, serif','Arial, sans-serif'],['Modern','Arial, sans-serif','Georgia, serif'],['Technical','Courier New, monospace','Verdana, sans-serif']];
export default function KeywordTool({ tool, navigationItems }: { tool: typeof keywordTools[number]; navigationItems: GeneratorSearchItem[] }) {
 const [text,setText] = useGeneratorText(tool.sample); const svg = useRef<SVGSVGElement>(null);
 const tracing = tool.id === 'name-tracing-worksheet', stitch = tool.id === 'cross-stitch-font-generator', graphic = tracing || stitch;
 const limit = graphic ? 24 : 1000; const valid = text.length <= limit && (!stitch || /^[a-z0-9 ]*$/i.test(text));
 const result = !valid ? '' : tool.id === 'roman-numeral-converter' ? convertRoman(text) : tool.id === 'emoji-translator' ? translateEmoji(text) : text;
 const download = () => { if (!svg.current) return; const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg.current)],{type:'image/svg+xml'})); const a = document.createElement('a'); a.href=url; a.download=tool.id+'.svg'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); };
 const controls = <div className="space-y-4"><TextToolInput id="keyword-input" text={text} onChange={setText} limit={limit} /><p className="text-sm text-slate-500">{tool.description}</p>{!valid && <p role="alert">Use at most {limit} characters{stitch ? ', with only A–Z, digits and spaces' : ''}. Your input has been preserved.</p>}{tool.id === 'accents-keyboard' && <div className="flex flex-wrap gap-2">{Array.from('àáâãäåæçèéêëìíîïñòóôõöøùúûüýÿÀÁÂÄÇÉÈÊËÑÖÜßœ').map(c=><button className="min-h-11 min-w-11 rounded border" key={c} aria-label={`Append ${c}`} onClick={()=>setText(text+c)}>{c}</button>)}</div>}</div>;
 const chartWidth = Math.max(180,text.length*72+24);
 const output = <>
 {graphic && valid && <><div className="overflow-x-auto rounded-xl border bg-white p-3 text-black"><svg ref={svg} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={tool.title} viewBox={tracing ? '0 0 800 1000' : `0 0 ${chartWidth} 132`} className="w-full" style={stitch ? {minWidth:Math.min(chartWidth,900)} : {}}>
 <rect width="100%" height="100%" fill="white" />
 {tracing ? <><text x="40" y="50" fontSize="22" fill="black">Name practice</text>{Array.from({length:8},(_,i)=><g key={i}><path d={`M40 ${150+i*105}H760 M40 ${110+i*105}H760`} stroke="#aaa" strokeDasharray="4 4"/><text x="40" y={145+i*105} fill={i===0 ? '#222' : '#bbb'} fontFamily="Arial, sans-serif" fontSize={Math.min(62,680/Math.max(1,text.length)*1.5)}>{i<5 ? text : ''}</text></g>)}</> : <>{Array.from({length:text.length*6+1},(_,i)=><path key={i} d={`M${12+i*12} 12V96`} stroke="#ddd"/>)}{Array.from({length:8},(_,i)=><path key={i} d={`M12 ${12+i*12}H${12+text.length*72}`} stroke="#ddd"/>)}{Array.from(text.toUpperCase()).flatMap((c,i)=>{const g=getPixelGlyph(c);return g.rows.flatMap((row,y)=>Array.from({length:g.width},(_,x)=>row & (1<<(g.width-1-x)) ? <path key={`${i}-${x}-${y}`} d={`M${14+i*72+x*12} ${14+y*12}l8 8m0 -8l-8 8`} stroke="#222" strokeWidth="2"/> : null));})}<text x="12" y="120" fontSize="12">{text.length*6} × 7 stitches · one cross = one stitch</text></>}
 </svg></div><button disabled={!text} className="min-h-11 rounded-xl bg-violet-700 px-5 text-white disabled:opacity-40" onClick={download}>Download SVG</button></>}
 {!graphic && (tool.id === 'font-pairing' ? pairs.map(([name,heading,body])=><div key={name} className="rounded-xl border p-5"><h3 className="text-3xl" style={{fontFamily:heading}}>{text}</h3><p className="my-4 leading-7" style={{fontFamily:body}}>Readable body text gives your headline room to shine. Compare the rhythm, contrast and spacing before choosing a pairing.</p><TextOutputCard title={name+' CSS'} text={`h1, h2 { font-family: ${heading}; }\nbody { font-family: ${body}; }`} /></div>) : <TextOutputCard title="Result" text={result} />)}
 {tool.id === 'emoji-translator' && <details><summary className="cursor-pointer py-3">Supported words</summary><p className="leading-8">{Object.entries(emojiWords).map(([word,emoji])=>`${word} ${emoji}`).join(' · ')}</p></details>}
 </>;
 return <TextToolLayout label={tool.title} controls={controls} workspace={graphic ? undefined : {pageTitle:tool.title,config:getGeneratorPageConfig(tool.id,tool.title),navigationItems,preview:{id:'keyword',name:'Result',text:result,category:'classic'},enableResultLayout:true}}>{output}</TextToolLayout>;
}
