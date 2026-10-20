import Link from 'next/link';
import { FONT_PACK, STANDARD_FONT_CREDITS, availableGenerations } from '@/lib/ai-font/catalog';
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
    <p>The AI Font Starter Pack includes {FONT_PACK.credits} credits, enough for {availableGenerations(FONT_PACK.credits)} standard font generations, for a one-time price of US ${(FONT_PACK.amountMinor / 100).toFixed(2)}. Each standard generation costs {STANDARD_FONT_CREDITS} credits. There is no recurring subscription. Each generation creates a single-style TTF with 72 English letters, digits and basic punctuation. It does not include all languages, every symbol, or a family of weights.</p>
    <p>Free previews use existing open-source typefaces as style references. They are not custom AI results and do not promise an exact match. Generated fonts are intended primarily for creative titles and display lettering. Check readability, character coverage and spacing in your intended application.</p>
    <h2>Generations, safety checks and failures</h2>
    <p>Font descriptions undergo automated safety checks before generation credits are reserved or font generation starts. A rejected description does not use generation credits. If a check is pending or unavailable, generation waits. Describe the font style you want without requesting sexual, hateful, harassing, violent or other prohibited content.</p>
    <p>Generated files remain private while their glyph outlines are rendered into specimen images and checked for NSFW content. A result is released for preview and download only after these checks pass. A rejected or failed output review restores the generation credits once. Automated checks can produce false positives or miss inappropriate content; they do not guarantee that a font is suitable for every audience. Contact support if you believe a description or font was incorrectly rejected. Previously delivered fonts remain available.</p>
    <p>The required credits are reserved when a request starts. A confirmed technical failure restores the exact credits charged for that request once. If the provider response is uncertain, the request is held for review to avoid duplicate charges. A successful result that you would like to redesign uses another generation. Purchased generations do not expire while your account and this service remain active.</p>
    <p>If payment or delivery fails, contact us with your order or font reference so we can resolve it or arrange an appropriate refund. Support reviews refund eligibility and the monetary amount; statutory consumer rights are unaffected. A confirmed full refund withdraws all credits from that payment. For Waffo purchases, partial refunds withdraw credits in proportion to the cumulative refunded amount divided by the original amount paid, including tax, rounded up to a whole credit and capped at the original credits.</p>
    <p>Already spent credits can leave a negative balance after a refund. New generations and purchases are paused until support resolves that balance; this does not automatically charge your card. Payment disputes can also pause new generations and purchases while the provider outcome is reviewed. Already delivered fonts remain in your library. A refund notification adjusts credits; it does not initiate an additional monetary refund.</p>
    <h2>Using your font</h2>
    <p>Generated fonts use Mixfont’s generated-font licence, which permits commercial use, editing, embedding, redistribution and resale. A subscription is not required to keep using a delivered font. This permission does not guarantee exclusivity, copyright protection, or clearance of third-party rights. Only submit descriptions and references you are entitled to use.</p>
    <p><a href="https://www.mixfont.com/license" target="_blank" rel="noopener noreferrer">Read the upstream generated-font licence</a>.</p>
    <h2>Data used by this feature</h2>
    <p>Google sign-in is handled through Supabase. We retain your account identifier, email, display name, Google avatar URL and sign-in timestamps to provide your account and associate purchases, credits and font history with you. You can change your display name on the account page. Supabase stores order records, generation descriptions and private font files. Waffo or PayPal processes payments, depending on the checkout offered. We store payment references, amounts, status and credit transactions, not card details.</p>
    <p>Your font description is sent to Mixfont to generate the requested font. Avoid including sensitive or confidential information. Generated font files are copied to our private storage for later download and are not automatically published in a public gallery. Free preview text is processed in your browser.</p>
    <p>Your description and rendered glyph specimen images are also sent to SeeAPI for safety screening. We retain task references, input fingerprints, check statuses and reported API usage to resume checks, enforce limits and handle support requests. SeeAPI states that stored input files, task information and moderation results have no scheduled automatic expiry, while API request records and logs are retained for 60 days. Deletion requests require review by its support team; expiring a source URL or deleting our local review files does not delete a provider copy. See <a href="https://www.seeapi.com/docs/data-handling/" target="_blank" rel="noopener noreferrer">SeeAPI data handling</a> for its current terms. Free reference previews and local artwork exports do not use this external screening.</p>
    <p>When transaction email is enabled, your account email address and payment or credit adjustment summary are sent through our Freemail service and its configured delivery provider, such as Mailjet. These messages cover confirmed credits, refunds and payment reviews; they do not enroll you in marketing email. Your account balance is updated independently of email delivery.</p>
    <p>Account and font data are retained to provide purchase history and downloads. You can request account or font deletion through our contact page; transaction records may need to be retained for accounting and dispute resolution. Download copies of fonts you wish to keep before requesting deletion.</p>
    <p>The site’s <Link href="/privacy">general privacy policy</Link> also describes analytics and other site services. This page explains the additional processing performed by the AI feature.</p>
    <p><Link href="/contact">Contact support</Link></p>
  </article>;
}
