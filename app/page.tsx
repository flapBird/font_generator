'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { generateAllFancyVariants } from '@/lib/fonts';

export default function HomePage() {
  const [inputText, setInputText] = useState('Hello World');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const variants = useMemo(() => {
    return generateAllFancyVariants(inputText || 'Hello World');
  }, [inputText]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Fancy Text Generator",
            "url": "https://font-generators.org",
            "description": "Transform your text into fancy Unicode styles. Copy and paste anywhere!",
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

      <div className="min-h-screen pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <span className="gradient-text">Fancy Text Generator</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform your text into fancy Unicode styles. Copy and paste anywhere!
            </p>
          </motion.div>

          {/* Main Content - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left - Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-lg shadow-indigo-500/5 border border-white/50 ring-1 ring-black/5"
            >
              <label className="block text-sm font-semibold mb-4 text-foreground">Enter Your Text</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type something..."
                rows={6}
                className="w-full px-5 py-4 bg-slate-50/80 border border-slate-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white resize-none text-lg transition-all duration-300 placeholder:text-slate-400"
                autoFocus
              />
              <p className="mt-4 text-sm text-muted-foreground">
                Type your text above and see it transformed into {variants.length}+ fancy styles.
              </p>
            </motion.div>

            {/* Right - Results */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 max-h-[600px] overflow-y-auto shadow-lg shadow-indigo-500/5 border border-white/50 ring-1 ring-black/5"
            >
              <div className="space-y-3">
                {variants.map((variant, index) => (
                  <motion.div
                    key={variant.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="group bg-gradient-to-r from-slate-50/80 to-white/80 hover:from-indigo-50/50 hover:to-purple-50/50 border border-slate-100 hover:border-indigo-200/50 rounded-2xl p-4 transition-all duration-300 hover:shadow-md hover:shadow-indigo-500/5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-xs font-medium text-muted-foreground mb-1">{variant.name}</p>
                        <p className="text-lg truncate">{variant.text}</p>
                      </div>
                      <button
                        onClick={() => handleCopy(variant.text, variant.id)}
                        className="shrink-0 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 text-sm font-medium"
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
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { icon: '⚡', title: 'Instant', desc: 'Real-time conversion as you type' },
              { icon: '🆓', title: 'Free', desc: 'No signup or payment required' },
              { icon: '📋', title: 'Easy Copy', desc: 'One-click copy to clipboard' },
            ].map((feature) => (
              <div key={feature.title} className="text-center p-8 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/60 ring-1 ring-black/5 hover:bg-white/70 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1 group">
                <div className="w-14 h-14 mx-auto mb-5 bg-gradient-to-br from-indigo-100 to-purple-100 group-hover:from-indigo-200 group-hover:to-purple-200 rounded-2xl flex items-center justify-center text-2xl transition-colors duration-300 shadow-sm">{feature.icon}</div>
                <h3 className="font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </motion.div>

          {/* SEO Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 prose prose-neutral dark:prose-invert max-w-none"
          >
            <h2>What is the Fancy Text Generator?</h2>
            <p>
              The Fancy Text Generator is a free online tool that transforms your regular text into stylish Unicode characters. These fancy text styles work on any platform that supports Unicode, including Instagram, Twitter, Facebook, Discord, TikTok, and more.
            </p>

            <h2>How Does It Work?</h2>
            <p>
              Unicode contains thousands of different characters, including mathematical symbols, decorative letters, and special alphabets. Our fancy text generator maps regular letters to these special Unicode characters, creating visually distinct text that stands out while remaining copyable and shareable.
            </p>

            <h3>Available Styles Include:</h3>
            <ul>
              <li><strong>Bold:</strong> 𝐇𝐞𝐥𝐥𝐨 - Mathematical bold letters</li>
              <li><strong>Italic:</strong> 𝐻𝑒𝑙𝑙𝑜 - Mathematical italic letters</li>
              <li><strong>Script:</strong> 𝒽ℯ𝓁𝓁ℴ - Cursive script style</li>
              <li><strong>Fraktur:</strong> 𝔥𝔢𝔩𝔩𝔬 - Gothic/medieval style</li>
              <li><strong>Circled:</strong> ⓗⓔⓛⓛⓞ - Letters in circles</li>
              <li><strong>And many more!</strong></li>
            </ul>

            <h2>Perfect For</h2>
            <p>
              Social media bios, unique usernames, eye-catching posts, creative projects, and anywhere you want your text to stand out!
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}