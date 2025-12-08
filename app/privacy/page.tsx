'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Privacy Policy</h1>
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
          <h2>1. Information We Collect</h2>
          
          <h3>Personal Information</h3>
          <p>We do not collect personal information unless you voluntarily provide it to us. This may include:</p>
          <ul>
            <li>Name and email address when contacting support</li>
            <li>User-generated content submitted through our tools</li>
          </ul>

          <h3>Automatically Collected Information</h3>
          <p>When you access our Service, we may automatically collect certain information:</p>
          <ul>
            <li><strong>Log Data</strong>: IP address, browser type, pages visited, time spent</li>
            <li><strong>Cookies</strong>: Session cookies for website functionality</li>
            <li><strong>Device Information</strong>: Device type, operating system, browser version</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the collected information for various purposes:</p>
          <ul>
            <li>To provide and maintain our Service</li>
            <li>To notify you about changes to our Service</li>
            <li>To allow participation in interactive features</li>
            <li>To provide customer support</li>
            <li>To gather analysis for improving our Service</li>
            <li>To monitor usage of our Service</li>
          </ul>

          <h2>3. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our Service and store certain information. 
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
          </p>

          <h2>4. Third-Party Services</h2>
          <p>
            We may employ third-party companies and individuals due to the following reasons:
          </p>
          <ul>
            <li>To facilitate our Service</li>
            <li>To provide analytics services</li>
            <li>To assist us in monitoring and analyzing Service usage</li>
          </ul>
          <p>
            These third parties have access to your Personal Information only to perform these tasks on our behalf 
            and are obligated not to disclose or use it for any other purpose.
          </p>

          <h2>5. Data Security</h2>
          <p>
            We take reasonable measures to protect your information. However, no method of transmission over the Internet 
            or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>

          <h2>6. Data Retention</h2>
          <p>
            We retain information we collect as long as necessary to provide our Service and for legitimate business purposes. 
            User-generated content may be retained indefinitely unless requested for deletion.
          </p>

          <h2>7. Children&apos;s Privacy</h2>
          <p>
            Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable 
            information from children under 13. If we discover such information, we will delete it promptly.
          </p>

          <h2>8. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting 
            the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
          </p>

          <h2>9. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at{' '}
            <Link href="mailto:leeswal123@gmail.com" className="text-primary hover:underline">
              leeswal123@gmail.com
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}