import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Last updated: July 28, 2026
          </p>
        </header>

        <article className="prose prose-neutral max-w-none rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 dark:prose-invert dark:border-slate-800 dark:bg-slate-950">
          <h2>1. Scope of this policy</h2>
          <p>
            This policy explains how Font Generators handles information when
            you visit font-generators.org, use a Unicode text generator, or
            contact us. It also explains the data practices associated with
            Google Analytics and Google AdSense.
          </p>

          <h2>2. Text entered in the generators</h2>
          <p>
            The primary Unicode generators transform text directly in your
            browser. Text typed into those generators is not sent to a Font
            Generators conversion server, stored in our database, or attached
            to a user account. Avoid entering passwords, payment details, or
            other sensitive information into any public website tool.
          </p>

          <h2>3. Information collected automatically</h2>
          <p>
            Our hosting provider and third-party services may automatically
            process information such as your IP address, browser and device
            type, operating system, referring page, pages visited, approximate
            region, timestamps, and interaction or diagnostic events. This
            information is used to operate, secure, measure, and improve the
            website.
          </p>

          <h2>4. Google Analytics</h2>
          <p>
            We use Google Analytics to understand aggregate traffic and product
            usage. Google Analytics may use cookies or similar identifiers to
            process information about visits and interactions. We do not send
            names, email addresses, generator input, or other information that
            we intend to identify you personally through analytics events.
          </p>

          <h2>5. Google AdSense and advertising cookies</h2>
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

          <h2>6. Consent controls</h2>
          <p>
            Where required, visitors may be shown a consent message that
            provides choices about advertising cookies, analytics storage, and
            personalized advertising. You can revisit the available privacy
            controls or adjust browser settings to delete or block cookies.
            Blocking cookies may affect some site or advertising features.
          </p>

          <h2>7. Contact information</h2>
          <p>
            If you contact us by email, we receive the email address, message,
            and any information you choose to include. We use it to respond to
            the request and maintain necessary support or security records. We
            do not sell contact information.
          </p>

          <h2>8. Data retention and sharing</h2>
          <p>
            We retain direct correspondence only for as long as reasonably
            needed to respond, keep business records, prevent abuse, or meet
            legal obligations. Hosting, analytics, and advertising providers
            may retain information under their own policies. We may disclose
            information when required by law, to protect the service and its
            users, or to service providers acting on our behalf.
          </p>

          <h2>9. Children&apos;s privacy</h2>
          <p>
            Font Generators is a general-audience service and is not directed
            to children under 13. We do not knowingly collect personal
            information from children under 13. If you believe a child has sent
            us personal information, contact us so we can review and delete it
            where appropriate.
          </p>

          <h2>10. Your choices and rights</h2>
          <p>
            Depending on your location, you may have rights to request access,
            correction, deletion, or restriction of certain personal
            information. You may also object to some processing or withdraw
            consent where processing relies on consent. Contact us to submit a
            request.
          </p>

          <h2>11. Changes and contact</h2>
          <p>
            We may update this policy as the site or legal requirements change.
            The date at the top shows the latest revision. Questions and privacy
            requests can be sent to{' '}
            <Link href="mailto:contact@font-generators.org">
              contact@font-generators.org
            </Link>
            .
          </p>
        </article>
      </div>
    </div>
  );
}
