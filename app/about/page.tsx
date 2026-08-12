'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { tools } from '@/lib/fonts';

export default function AboutPage() {
  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Font Generators",
            "url": "https://font-generators.org",
            "description": "Browser-based Unicode text generators and typography guides.",
            "email": "contact@font-generators.org",
            "sameAs": []
          })
        }}
      />

      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              About <span className="gradient-text">Font Generators</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Practical Unicode text tools for names, bios, captions, and creative projects.
            </p>
          </motion.div>

          {/* Mission */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p>
                At Font Generators, we believe that great typography should be accessible to everyone. 
                Our mission is to make decorative Unicode text easy to understand, preview, and copy.
                Each generator is designed around a specific style or use case so visitors can compare
                relevant results without installing software or creating an account.
              </p>
              <p>
                Whether you&apos;re a professional designer looking for inspiration, a startup founder 
                designing your first logo, or a social media enthusiast wanting to stand out, our 
                suite of tools is designed to make typography exploration effortless and enjoyable.
              </p>
            </div>
          </motion.section>

          {/* Tools */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-6">Our Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tools.map((tool) => (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="flex items-start gap-4 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <span className="text-3xl">{tool.icon}</span>
                  <div>
                    <h3 className="font-semibold mb-1">{tool.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Transform text into Unicode styles
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>

          {/* Why Us */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-6">Why Choose Us?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: '🆓',
                  title: '100% Free',
                  description: 'All our tools are completely free. No hidden costs, no premium tiers, no signup required.'
                },
                {
                  icon: '🚀',
                  title: 'Fast & Modern',
                  description: 'Built with the latest technology for instant results and a smooth user experience.'
                },
                {
                  icon: '🔒',
                  title: 'Privacy First',
                  description: 'Generator text is transformed locally in your browser. Analytics and advertising data are handled as described in our Privacy Policy.'
                }
              ].map((item) => (
                <div key={item.title} className="text-center p-6">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Technology */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-4">Built with Modern Technology</h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p>
                Font Generators is built using cutting-edge web technologies including Next.js, 
                React, and TypeScript. Text transformations run directly in the browser using
                documented Unicode character mappings and carefully designed decorative presets.
              </p>
              <p>
                We&apos;re constantly improving our tools and adding new features. Our roadmap includes 
                more useful style presets, broader character coverage, clearer compatibility guidance,
                and enhanced customization options.
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-4">How We Create and Review Content</h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p>
                Generator presets are selected for the specific style, platform, or use case named on
                each page. We distinguish copy-paste Unicode text from downloadable font files and
                call out incomplete character coverage, accessibility limitations, and device-dependent
                rendering where they matter.
              </p>
              <p>
                Guides are written and reviewed by the Font Generators editorial team. When a platform
                can change its character rules, we recommend testing the final result in the exact field
                where it will be used. Fandom and named-typeface pages are independent references and do
                not claim official affiliation or reproduce proprietary font files.
              </p>
              <p>
                To report an incorrect mapping, outdated compatibility note, or accessibility issue,
                visit the <Link href="/contact">Contact page</Link>.
              </p>
            </div>
          </motion.section>

          {/* CTA */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
          </motion.section>
        </div>
      </div>
    </>
  );
}
