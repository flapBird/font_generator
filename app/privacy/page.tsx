import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Last updated: October 20, 2026
          </p>
        </header>

        <article className="prose prose-neutral max-w-none rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 dark:prose-invert dark:border-slate-800 dark:bg-slate-950">
          <h2>1. Scope of this policy</h2>
          <p>
            This policy explains how Font Generators handles information when
            you visit font-generators.org, use our free text and artwork tools,
            use the optional AI Font Generator, sign in, make a purchase where
            checkout is available, or contact us. It also explains the data
            practices associated with Google Analytics and Google AdSense.
          </p>

          <h2>2. Free tools and AI font processing</h2>
          <p>
            The primary Unicode generators transform text directly in your
            browser. Text typed into those generators is not sent to a Font
            Generators conversion server, stored in our database, or attached
            to a user account. Avoid entering passwords, payment details, or
            other sensitive information into any public website tool.
          </p>
          <p>
            Our existing free text and artwork tools, reference font previews,
            and local PNG exports remain available without an account. Reference
            previews use existing typefaces and do not create a custom AI font.
            Custom AI font generation requires Google sign-in and sufficient
            account credits; its descriptions and generated files are processed
            by server-side services rather than only in your browser.
          </p>
          <p>
            The optional AI Font Generator sends font descriptions to SeeAPI for
            safety screening and, after approval, to Mixfont for font generation.
            Rendered glyph specimens are also sent to SeeAPI before a new font
            is delivered. SeeAPI currently states that stored input files, task
            information and moderation results have no scheduled automatic expiry;
            API request logs are retained for 60 days. See the{' '}
            <Link href="/ai-font-generator/policy">AI font terms and privacy</Link>{' '}
            for account, payment, storage, review and deletion details.
          </p>

          <h2>3. Accounts, purchases and font storage</h2>
          <p>
            We use Supabase to handle Google sign-in and retain your account
            identifier, email, display name, Google avatar URL and sign-in
            timestamps. These details provide your account and connect your
            purchases, credit balance and font history. You can change your
            display name on the account page. Supabase also stores order and
            credit records, generation descriptions and private font files for
            later download. Generated fonts are not automatically published in
            a public gallery.
          </p>
          <p>
            When checkout is available, Waffo or PayPal processes payments,
            depending on the checkout offered. We store payment references,
            amounts, status and credit transactions, not card numbers or other
            card details. We also retain safety-check task references, input
            fingerprints, statuses and reported API usage to resume checks,
            enforce limits and respond to support requests.
          </p>
          <p>
            When transaction email is enabled, your account email address and
            payment or credit adjustment summary are sent through our configured
            transactional email service and its delivery infrastructure.
            These messages cover purchases, refunds or payment reviews and do
            not enroll you in marketing email. Credit delivery does not depend
            on email delivery.
          </p>

          <h2>4. Information collected automatically</h2>
          <p>
            Our hosting provider and third-party services may automatically
            process information such as your IP address, browser and device
            type, operating system, referring page, pages visited, approximate
            region, timestamps, and interaction or diagnostic events. This
            information is used to operate, secure, measure, and improve the
            website.
          </p>

          <h2>5. Google Analytics</h2>
          <p>
            We use Google Analytics to understand aggregate traffic and product
            usage. Google Analytics may use cookies or similar identifiers to
            process information about visits and interactions. We do not send
            names, email addresses, generator input, or other information that
            we intend to identify you personally through analytics events.
          </p>
          <p>
            Sign-in and purchase analytics may link visits using a pseudonymous
            account identifier. When analytics is enabled, checkout and confirmed
            purchase events include a transaction identifier, product, amount,
            currency, and payment environment. These events help us measure where
            visitors complete or leave the purchase process. Server-side events
            depend on analytics configuration and an available browser analytics
            identifier; they do not include payment card details or font descriptions.
          </p>

          <h2>6. Google AdSense and advertising cookies</h2>
          <p>
            We use Google AdSense to support the site with advertising.
            Third-party vendors, including Google, use cookies to serve ads
            based on a user&apos;s prior visits to this website or other
            websites. Google&apos;s use of advertising cookies enables Google
            and its partners to serve ads based on visits to this site and
            other sites on the Internet.
          </p>
          <p>
            As a result of ad serving, third parties may place and read cookies
            in your browser or use web beacons, IP addresses, or other
            identifiers to collect information. Other third-party advertising
            vendors or networks may also use cookies where they are enabled in
            our advertising settings.
          </p>
          <p>
            You can manage or opt out of personalized Google advertising in{' '}
            <Link href="https://adssettings.google.com/" rel="noopener noreferrer">
              Google Ads Settings
            </Link>
            . You can also learn{' '}
            <Link
              href="https://policies.google.com/technologies/partner-sites"
              rel="noopener noreferrer"
            >
              how Google uses information from sites that use its services
            </Link>
            .
          </p>

          <h2>7. Consent controls</h2>
          <p>
            Where required, visitors may be shown a consent message that
            provides choices about advertising cookies, analytics storage, and
            personalized advertising. You can revisit the available privacy
            controls or adjust browser settings to delete or block cookies.
            Blocking cookies may affect some site or advertising features.
          </p>

          <h2>8. Contact information</h2>
          <p>
            If you contact us by email, we receive the email address, message,
            and any information you choose to include. We use it to respond to
            the request and maintain necessary support or security records. We
            do not sell contact information.
          </p>

          <h2>9. Data retention and sharing</h2>
          <p>
            We retain account, purchase and font data to provide accounts,
            purchase history, credits and repeat downloads. We retain direct
            correspondence as reasonably needed to respond, keep business
            records, prevent abuse, or meet legal obligations. Transaction
            records may need to be retained for accounting and dispute
            resolution even after an account or font deletion request.
          </p>
          <p>
            You can request account or font deletion through our{' '}
            <Link href="/contact">contact page</Link>. Download copies of fonts
            you wish to keep before requesting deletion. Our hosting,
            authentication, payment, generation, safety-screening, email,
            analytics and advertising providers may retain information under
            their own policies. Deleting our local review files does not delete
            a provider copy; SeeAPI deletion requests require review by its
            support team. We may disclose information when required by law, to
            protect the service and its users, or to service providers acting
            on our behalf.
          </p>

          <h2>10. Children&apos;s privacy</h2>
          <p>
            Font Generators is a general-audience service and is not directed
            to children under 13. We do not knowingly collect personal
            information from children under 13. If you believe a child has sent
            us personal information, contact us so we can review and delete it
            where appropriate.
          </p>

          <h2>11. Your choices and rights</h2>
          <p>
            Depending on your location, you may have rights to request access,
            correction, deletion, or restriction of certain personal
            information. You may also object to some processing or withdraw
            consent where processing relies on consent. Contact us to submit a
            request.
          </p>

          <h2>12. Changes and contact</h2>
          <p>
            We may update this policy as the site or legal requirements change.
            The date at the top shows the latest revision. Questions and privacy
            requests can be sent to{' '}
            <span>
              <span>support</span>
              <span aria-hidden="true">@</span>
              <span>font-generators.org</span>
            </span>
            .
          </p>
        </article>
      </div>
    </div>
  );
}
