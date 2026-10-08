import type { Metadata } from 'next';
import Link from 'next/link';
import { FONT_PACK, STANDARD_FONT_CREDITS, availableGenerations } from '@/lib/ai-font/catalog';
import PricingCheckout from '@/components/ai-font/PricingCheckout';
import { availability } from '@/lib/ai-font/config';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Pricing — Free Tools & AI Font Packs',
  description: 'Use free font tools without an account. Create custom English fonts with a one-time AI Font Starter Pack. No subscription.',
  alternates: { canonical: '/pricing' },
  robots: { index: false, follow: true },
};
const action = 'mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground';

export default function PricingPage() {
  const services = availability();
  const enabled = services.checkout;
  return <main className="mx-auto max-w-5xl px-5 pb-24 pt-28">
    <p className="text-sm font-semibold uppercase tracking-widest text-primary">Simple, one-time pricing</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Free to explore. Pay to create a font.</h1>
    <p className="mt-5 max-w-2xl text-lg text-muted-foreground">Use our free tools for as long as you like. Buy a small pack when you want a custom English font. No subscription or automatic renewal.</p>
    <div className="mt-10 grid gap-x-6 md:grid-cols-2">
      <section className="mb-6 grid grid-rows-[auto_1fr_auto_auto] rounded-2xl border border-border bg-background p-6 md:row-span-4 md:grid-rows-subgrid sm:p-8">
        <div><h2 className="text-xl font-bold">Free tools</h2><p className="mt-4 text-4xl font-bold">$0</p><p className="mt-2 text-sm text-muted-foreground">No account needed</p></div>
        <div>
          <ul className="mt-6 space-y-3 text-sm"><li>Copy-and-paste font generators</li><li>Local style matching with existing reference fonts</li><li>Text, color, size and layout controls</li><li>PNG artwork exports without watermarks</li></ul>
          <Link className="mt-4 block text-center text-sm text-primary underline" href="/ai-font-generator#preview-title">Try a style preview</Link>
        </div>
        <Link className={action} href="/">Use free tools</Link>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">Reference previews use existing fonts. Free tools do not generate a new custom font file or include paid generation credits.</p>
      </section>
      <section className="mb-6 grid grid-rows-[auto_1fr_auto_auto] rounded-2xl border-2 border-primary bg-background p-6 md:row-span-4 md:grid-rows-subgrid sm:p-8">
        <div><h2 className="text-xl font-bold">{FONT_PACK.name}</h2><p className="mt-4 text-4xl font-bold">${(FONT_PACK.amountMinor / 100).toFixed(2)} <span className="text-sm font-normal">USD / pack</span></p>
        <p className="mt-2 text-sm text-muted-foreground">One-time payment · {availableGenerations(FONT_PACK.credits)} custom font generations</p></div>
        <ul className="mt-6 space-y-3 text-sm"><li>{FONT_PACK.credits} credits · {STANDARD_FONT_CREDITS} per basic English font</li><li>72 characters · One font style per generation</li><li>Downloadable, installable TTF files</li><li>Private font library and repeat downloads</li><li>Unlimited layout edits and PNG exports</li><li>Commercial use under the <Link href="/ai-font-generator/policy" className="underline">purchase terms</Link></li></ul>
        <PricingCheckout services={services} />
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{enabled ? 'Sign in with Google to purchase and use your pack.' : 'Purchases are not available yet. You can try the free reference previews now.'} Any applicable taxes are shown at checkout.</p>
      </section>
    </div>
    <section className="mt-12" aria-labelledby="pricing-questions"><h2 id="pricing-questions" className="text-2xl font-bold">Before you buy</h2>
      <div className="mt-5 divide-y divide-border">
        {[
          ['How do credits work?', `One basic English font costs ${STANDARD_FONT_CREDITS} credits. The pack contains ${FONT_PACK.credits} credits, enough for ${availableGenerations(FONT_PACK.credits)} generations. Credits belong to your account; previewing, editing artwork and downloading do not spend them.`],
          ['Is this a subscription?', 'No. Each pack is a one-time purchase. There is no monthly bill or automatic renewal.'],
          ['Do credits expire?', 'Purchased credits do not reset monthly or expire while your account and this service remain active.'],
          ['What happens if a generation fails?', 'A confirmed technical failure restores the credits charged for that job once. Uncertain results are held for review. Generating a different design after a successful result spends credits again.'],
          ['What characters and files are included?', 'Each generation creates one TTF font style with 72 English letters, digits and basic punctuation. Chinese, accented Latin characters and multiple font weights are not included in this pack.'],
          ['Can I try it without paying?', 'Yes. Explore existing reference fonts, match a style description and export PNG artwork for free. These references are not custom AI results and do not promise an exact match to a paid generation.'],
        ].map(([question, answer]) => <details key={question} className="py-5"><summary className="cursor-pointer font-semibold">{question}</summary><p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{answer}</p></details>)}
      </div>
      <Link href="/ai-font-generator/policy" className="mt-5 inline-block text-sm text-primary underline">Purchase terms, refunds & privacy</Link>
    </section>
  </main>;
}
