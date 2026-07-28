import Link from 'next/link';
import { ToolLayout } from '@/components';

interface UnavailableToolProps {
  eyebrow: string;
  title: string;
  description: string;
  explanation: string;
}

export default function UnavailableTool({
  eyebrow,
  title,
  description,
  explanation,
}: UnavailableToolProps) {
  return (
    <ToolLayout>
      <section className="overflow-hidden rounded-[2rem] border border-border bg-background">
        <div className="bg-slate-950 px-6 py-10 text-white sm:px-10 sm:py-14">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
            {eyebrow}
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            {description}
          </p>
        </div>

        <div className="grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <h2 className="text-2xl font-bold">This feature is not available yet</h2>
            <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
              {explanation}
            </p>
            <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
              We have disabled the demo instead of returning an estimated or random
              answer. No file or prompt is uploaded from this page.
            </p>
          </div>

          <aside className="rounded-2xl border border-violet-200 bg-violet-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-700">
              Available now
            </p>
            <h2 className="mt-2 text-xl font-bold">Use the Unicode generators</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Type your text, compare page-specific styles, and copy the result
              immediately. Everything runs in your browser.
            </p>
            <Link
              href="/styles"
              className="mt-5 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
            >
              Browse text generators
            </Link>
          </aside>
        </div>
      </section>
    </ToolLayout>
  );
}
