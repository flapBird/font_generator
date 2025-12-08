'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ToolLayout } from '@/components';
import { generateAllFancyVariants, fancyTextStyles } from '@/lib/fonts';

export default function FancyTextPage() {
  const [inputText, setInputText] = useState('Hello World');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const variants = useMemo(() => {
    return generateAllFancyVariants(inputText || 'Hello World');
  }, [inputText]);

  const filteredVariants = useMemo(() => {
    if (filter === 'all') return variants;
    return variants.filter(v => v.id === filter);
  }, [variants, filter]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <ToolLayout>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Fancy Text Generator",
            "url": "https://font-generators.org/tools/fancy-text",
            "description": "Transform your text into 50+ fancy Unicode styles. Perfect for social media, bios, and creative projects.",
            "applicationCategory": "DesignApplication",
            "operatingSystem": "Any",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          })
        }}
      />

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          <span className="gradient-text">Fancy Text Generator</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Transform your text into fancy Unicode styles. Copy and paste anywhere!
        </p>
      </motion.div>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-muted/30 rounded-2xl p-6 mb-8"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Enter Your Text</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type something..."
              rows={3}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Filter Style</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Styles</option>
              {fancyTextStyles.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Results */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-3 mb-12 max-h-[600px] overflow-y-auto pr-2"
      >
        {filteredVariants.map((variant, index) => (
          <motion.div
            key={variant.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.02 }}
            className="group flex items-center justify-between bg-background border border-border rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1">{variant.name}</p>
              <p className="text-lg truncate">{variant.text}</p>
            </div>
            <button
              onClick={() => handleCopy(variant.text, variant.id)}
              className="ml-4 shrink-0 px-4 py-2 bg-muted hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors flex items-center gap-2"
            >
              {copiedId === variant.id ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </motion.div>
        ))}
      </motion.div>

      {/* SEO Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="prose prose-neutral dark:prose-invert max-w-none"
      >
        <h2>What is the Fancy Text Generator?</h2>
        <p>
          The Fancy Text Generator is a free online tool that transforms your regular text into stylish Unicode characters. These fancy text styles work on any platform that supports Unicode, including Instagram, Twitter, Facebook, Discord, TikTok, and more. Unlike regular fonts, Unicode text can be copied and pasted anywhere because it uses special character sets that are universally supported.
        </p>

        <h2>How Does Fancy Text Work?</h2>
        <p>
          Unicode contains thousands of different characters, including mathematical symbols, decorative letters, and special alphabets. Our fancy text generator maps regular letters to these special Unicode characters, creating visually distinct text that stands out while remaining copyable and shareable across all platforms.
        </p>

        <h3>Available Text Styles</h3>
        <ul>
          <li><strong>Bold:</strong> 𝐇𝐞𝐥𝐥𝐨 - Mathematical bold letters</li>
          <li><strong>Italic:</strong> 𝐻𝑒𝑙𝑙𝑜 - Mathematical italic letters</li>
          <li><strong>Script:</strong> 𝒽ℯ𝓁𝓁ℴ - Cursive script style</li>
          <li><strong>Fraktur:</strong> 𝔥𝔢𝔩𝔩𝔬 - Gothic/medieval style</li>
          <li><strong>Double Struck:</strong> 𝕙𝕖𝕝𝕝𝕠 - Outline/hollow letters</li>
          <li><strong>Circled:</strong> ⓗⓔⓛⓛⓞ - Letters in circles</li>
          <li><strong>Squared:</strong> 🅷🅴🅻🅻🅾 - Letters in squares</li>
          <li><strong>And many more!</strong></li>
        </ul>

        <h2>Popular Use Cases</h2>
        <p>
          Fancy text is perfect for making your social media profiles stand out, creating unique usernames, designing eye-catching bios, adding flair to comments and posts, and personalizing your online presence. Many influencers and content creators use fancy text to make their profiles more memorable and visually appealing.
        </p>

        <h2>Tips for Using Fancy Text</h2>
        <p>
          While fancy text looks great, keep in mind that some Unicode characters may not display correctly on all devices or fonts. It&apos;s best to test your fancy text before using it in important contexts. Also, screen readers may have difficulty with fancy text, so consider accessibility when using these styles.
        </p>

        <h2>Free and Easy to Use</h2>
        <p>
          Our fancy text generator is completely free with no signup required. Simply type your text, browse through the available styles, and click to copy your favorite version. The conversion happens instantly, making it quick and easy to create stylish text for any purpose.
        </p>
      </motion.div>
    </ToolLayout>
  );
}
