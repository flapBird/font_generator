'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

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
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-neutral dark:prose-invert max-w-none bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-white/60"
        >
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Font Generators (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). 
            If you disagree with any part of the terms, you may not access the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Font Generators provides free online tools for generating fancy text, identifying fonts, and creating logo designs. 
            All services are provided &quot;as is&quot; without warranty of any kind.
          </p>

          <h2>3. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are owned by Font Generators and are protected 
            by international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </p>

          <h2>4. User-Generated Content</h2>
          <p>
            You retain ownership of any content you submit to the Service. By submitting content, you grant Font Generators 
            a worldwide, non-exclusive, royalty-free license to use, reproduce, adapt, publish, translate, and distribute 
            your content in connection with the Service.
          </p>

          <h2>5. Prohibited Activities</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any illegal purposes</li>
            <li>Reverse engineer or attempt to extract the source code</li>
            <li>Transmit viruses or other harmful code</li>
            <li>Harass, abuse, or harm another person</li>
            <li>Impersonate any person or entity</li>
          </ul>

          <h2>6. Disclaimer of Warranties</h2>
          <p>
            The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. Font Generators expressly disclaims all 
            warranties of any kind, whether express or implied, including but not limited to the implied warranties of 
            merchantability, fitness for a particular purpose, and non-infringement.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            In no event shall Font Generators be liable for any indirect, incidental, special, consequential, or punitive 
            damages arising out of your use of the Service.
          </p>

          <h2>8. Changes to Terms</h2>
          <p>
            We reserve the right to modify or replace these Terms at any time. We will notify users of any material changes 
            by posting the new Terms on this page.
          </p>

          <h2>9. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at{' '}
            <Link href="mailto:leeswal123@gmail.com" className="text-primary hover:underline">
              leeswal123@gmail.com
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}