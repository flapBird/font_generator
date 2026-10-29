import Link from '@/components/IntentLink';
import SignatureGeneratorTool from '@/components/SignatureGeneratorTool';
import { LibraryPageShell, libraryMetadata } from '@/components/text-library/LibraryPage';
import { signatureFonts } from '@/lib/signature';

export const metadata = libraryMetadata('signature-generator');

export default function SignaturePage() {
  return <LibraryPageShell id="signature-generator">
    <SignatureGeneratorTool />
    <div className="mt-5 flex flex-wrap gap-5 text-sm text-violet-700"><Link href="/handwriting-font-generator" className="py-2">Create a handwritten note →</Link><Link href="/cursive-font-generator" className="py-2">Copy cursive Unicode text →</Link></div>
    <details className="mt-5 rounded-xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold">Font sources and licenses</summary><p className="mt-3 text-sm leading-6 text-slate-600">All six fonts are unmodified Latin subsets from Fontsource packages, distributed under SIL Open Font License 1.1. Fonts load only when selected. The tool does not distribute a custom font file.</p><ul className="mt-3 flex flex-wrap gap-4 text-xs text-violet-700">{signatureFonts.map((font) => <li key={font.id}><a href={`/fonts/signature/${font.id}-LICENSE.txt`} className="underline">{font.label} license</a></li>)}</ul></details>
  </LibraryPageShell>;
}
