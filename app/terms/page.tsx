'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FONT_PACK, STANDARD_FONT_CREDITS, availableGenerations } from '@/lib/ai-font/catalog';

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-lg text-muted-foreground">
            Last updated: October 20, 2026
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-neutral max-w-none rounded-2xl border border-white/60 bg-white/50 p-8 backdrop-blur-sm dark:prose-invert dark:border-slate-800 dark:bg-slate-950"
        >
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Font Generators (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). 
            If you disagree with any part of the terms, you may not access the Service.
          </p>
          <p>
            These Terms cover our free tools and optional paid AI Font Generator. The{' '}
            <Link href="/ai-font-generator/policy">AI font purchase terms and privacy</Link>{' '}
            provide additional details for that feature. Our <Link href="/privacy">Privacy Policy</Link>{' '}
            explains how we handle information across the site.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Font Generators provides free tools for decorative Unicode text, ASCII banners,
            typeface previews and downloadable text artwork. These tools remain available
            without an account. The optional AI Font Generator provides custom English font
            generation using account credits and external services.
          </p>
          <p>
            Free reference previews use existing typefaces and do not generate a new font file.
            Each standard AI generation produces one installable TTF style with 72 English
            letters, digits and basic punctuation. Extended character sets, image-to-font
            generation and families of font weights are not included in the current offer.
          </p>

          <h2>3. Accounts, prices and credits</h2>
          <p>
            Custom AI generation requires Google sign-in and sufficient account credits.
            Keep your sign-in account secure. Your account associates your purchases,
            credit balance, font history and private downloads with you.
          </p>
          <p>
            The <Link href="/pricing">Pricing page</Link> lists the {FONT_PACK.name}: a one-time
            payment of US ${(FONT_PACK.amountMinor / 100).toFixed(2)} for {FONT_PACK.credits} credits,
            enough for {availableGenerations(FONT_PACK.credits)} standard generations at{' '}
            {STANDARD_FONT_CREDITS} credits each. This pack is not a subscription and does not
            renew automatically. Any applicable taxes are shown at checkout. Purchased credits
            do not reset monthly or expire while your account and this service remain active.
            Reference previews, artwork edits, PNG exports and repeat downloads do not spend
            generation credits.
          </p>
          <p>
            Purchases are available only when checkout is enabled. While payments are being
            set up, Pricing continues to display the pack and price with a disabled
            &quot;Payments coming soon&quot; button. Payment is processed by Waffo or PayPal,
            depending on the checkout offered; we do not store your card details. Credits
            are delivered after payment is confirmed, independently of any optional
            transaction email.
          </p>

          <h2>4. Generation, delivery and refunds</h2>
          <p>
            Descriptions undergo safety checks before generation credits are reserved or
            generation starts. Pending or unavailable checks do not start generation.
            Generated files are validated and their glyph specimens screened before they
            become available for preview and download from your private library. Automated
            checks can make mistakes and do not guarantee visual quality or an exact match
            to your description.
          </p>
          <p>
            A confirmed technical failure or rejected output review restores the credits
            charged for that request once. Uncertain requests are held for review to avoid
            duplicate charges. Requesting another design after a successful result spends
            credits again. Restoring generation credits is separate from refunding a payment.
          </p>
          <p>
            Contact <Link href="/contact">support</Link> with your order or font reference
            if payment or delivery fails, or to request a refund. Support reviews eligibility
            and the monetary amount under the <Link href="/ai-font-generator/policy">AI font
            purchase terms</Link>. Confirmed refunds withdraw the related credits; spent
            credits can leave a negative balance. A negative balance or payment dispute can
            pause new purchases and generation pending review, while previously delivered
            fonts remain available. This does not automatically charge your card. Statutory
            consumer rights are unaffected.
          </p>

          <h2>5. Intellectual Property</h2>
          <p>
            The Service and its original content, features and functionality are owned by
            or licensed to Font Generators. Existing reference typefaces and other third-party
            assets remain subject to their respective licences.
          </p>
          <p>
            Generated fonts use <a href="https://www.mixfont.com/license" target="_blank" rel="noopener noreferrer">Mixfont&apos;s
            generated-font licence</a>, which permits commercial use, editing, embedding,
            redistribution and resale. A subscription is not required to keep using a
            delivered font. This does not guarantee exclusivity, copyright protection or
            clearance of third-party rights. Check the font in your intended application
            and submit only descriptions and references you are entitled to use.
          </p>

          <h2>6. User-Generated Content and Data</h2>
          <p>
            Text entered in the primary Unicode generators is processed locally in your browser and is
            not submitted to Font Generators for publication or storage. If you voluntarily email us
            feedback, corrections, or other material, you confirm that you have the right to share it
            and allow us to use it to respond to your request and improve the Service.
          </p>
          <p>
            AI font descriptions and rendered glyph specimens are sent to external services
            for generation and safety screening. Account records, descriptions and private
            font files are stored to provide the feature. Avoid submitting sensitive or
            confidential information. See our <Link href="/privacy">Privacy Policy</Link>{' '}
            and <Link href="/ai-font-generator/policy">AI font privacy details</Link> for
            providers, retention and deletion requests.
          </p>

          <h2>7. Prohibited Activities</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any illegal purposes</li>
            <li>Reverse engineer or attempt to extract the source code</li>
            <li>Transmit viruses or other harmful code</li>
            <li>Harass, abuse, or harm another person</li>
            <li>Impersonate any person or entity</li>
            <li>Request sexual, hateful, harassing, violent or other prohibited AI content, or attempt to bypass safety checks</li>
          </ul>

          <h2>8. Disclaimer of Warranties</h2>
          <p>
            The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. Font Generators expressly disclaims all 
            warranties of any kind, whether express or implied, including but not limited to the implied warranties of 
            merchantability, fitness for a particular purpose, and non-infringement.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            In no event shall Font Generators be liable for any indirect, incidental, special, consequential, or punitive 
            damages arising out of your use of the Service.
          </p>
          <p>Nothing in these Terms limits rights that cannot be excluded under applicable law.</p>

          <h2>10. Changes to Terms</h2>
          <p>
            We reserve the right to modify or replace these Terms at any time. We will notify users of any material changes 
            by posting the new Terms on this page.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at{' '}
            <span className="text-primary">
              <span>support</span>
              <span aria-hidden="true">@</span>
              <span>font-generators.org</span>
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
