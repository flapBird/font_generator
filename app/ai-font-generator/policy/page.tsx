import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Font Purchase Terms & Privacy', robots: { index: false, follow: true },
  alternates: { canonical: '/ai-font-generator/policy' },
};

export default function AiFontPolicy() {
  return <article className="prose prose-slate mx-auto max-w-3xl px-5 pb-20 pt-28 dark:prose-invert">
    <Link href="/ai-font-generator">← Back to AI Font Generator</Link>
    <h1>AI font purchase terms & privacy</h1>
    <p>These details apply to the paid AI Font Generator. Our existing free text and artwork tools remain available without an account.</p>
    <h2>What you purchase</h2>
    <p>The English font pack includes three standard font generations for a one-time price of US $4.99. There is no recurring subscription. Each generation creates a single-style TTF with 72 English letters, digits and basic punctuation. It does not include all languages, every symbol, or a family of weights.</p>
    <p>Free previews use existing open-source typefaces as style references. They are not custom AI results and do not promise an exact match. Generated fonts are intended primarily for creative titles and display lettering. Check readability, character coverage and spacing in your intended application.</p>
    <h2>Generations and technical failures</h2>
    <p>One generation is reserved when a request starts. A confirmed technical failure restores it once. If the provider response is uncertain, the request is held for review to avoid duplicate charges. A successful result that you would like to redesign uses another generation. Purchased generations do not expire while your account and this service remain active.</p>
    <p>If payment or delivery fails, contact us with your order or font reference so we can resolve it or arrange an appropriate refund. Refunds are reviewed through support; statutory consumer rights are unaffected. Refunded or reversed packs have their associated generations withdrawn. Partial refunds are reviewed manually and may suspend the entire pack pending resolution.</p>
    <h2>Using your font</h2>
    <p>Generated fonts use Mixfont’s generated-font licence, which permits commercial use, editing, embedding, redistribution and resale. A subscription is not required to keep using a delivered font. This permission does not guarantee exclusivity, copyright protection, or clearance of third-party rights. Only submit descriptions and references you are entitled to use.</p>
    <p><a href="https://www.mixfont.com/license" target="_blank" rel="noopener noreferrer">Read the upstream generated-font licence</a>.</p>
    <h2>Data used by this feature</h2>
    <p>Google sign-in is handled through Supabase. We retain your account identifier and email to associate purchases, remaining generations and font history with you. Supabase stores order records, generation descriptions and private font files. PayPal processes payments; we store payment references and status, not card details.</p>
    <p>Your font description is sent to Mixfont to generate the requested font. Avoid including sensitive or confidential information. Generated font files are copied to our private storage for later download and are not automatically published in a public gallery. Free preview text is processed in your browser.</p>
    <p>Account and font data are retained to provide purchase history and downloads. You can request account or font deletion through our contact page; transaction records may need to be retained for accounting and dispute resolution. Download copies of fonts you wish to keep before requesting deletion.</p>
    <p>The site’s <Link href="/privacy">general privacy policy</Link> also describes analytics and other site services. This page explains the additional processing performed by the AI feature.</p>
    <p><Link href="/contact">Contact support</Link></p>
  </article>;
}
