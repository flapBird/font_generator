import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact Font Generators about corrections, privacy, accessibility, or site feedback.',
  alternates: {
    canonical: 'https://font-generators.org/contact',
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen pb-20 pt-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-7 sm:p-10 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
            Contact Font Generators
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl dark:text-white">
            Questions, corrections, or feedback?
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            We welcome reports about incorrect character mappings, platform
            compatibility, accessibility, privacy, and broken pages.
          </p>
        </header>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 sm:p-9 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">
            Email
          </h2>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            Send your message to{' '}
            <span className="font-semibold text-violet-700 dark:text-violet-300">
              <span>contact</span>
              <span aria-hidden="true">@</span>
              <span>font-generators.org</span>
            </span>
            . Include the page URL and a short description when reporting a
            problem.
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Please do not email passwords, payment details, government
            identifiers, or other sensitive information. This site does not
            provide custom font licensing or legal advice.
          </p>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ['Corrections', 'Unicode mappings, factual errors, or outdated platform information.'],
            ['Privacy', 'Data questions, consent choices, or deletion requests.'],
            ['Accessibility', 'Screen-reader, keyboard, contrast, or readability issues.'],
          ].map(([title, description]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
              <h2 className="font-bold text-slate-950 dark:text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {description}
              </p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
