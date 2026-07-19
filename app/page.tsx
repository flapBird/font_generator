'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
 import Link from 'next/link';
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
            "name": "Font Generator",
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
              <span className="gradient-text">Font Generator</span>
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

          {/* Browse Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold text-center mb-8">Browse Text Styles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/styles" className="group p-6 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm rounded-3xl border border-white/60 dark:border-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/40 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-300 text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-2xl flex items-center justify-center text-2xl shadow-sm">🎨</div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Text Styles</h3>
                <p className="text-sm text-muted-foreground">30+ Unicode style generators</p>
              </Link>
              <Link href="/fandom" className="group p-6 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm rounded-3xl border border-white/60 dark:border-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/40 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-300 text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/50 dark:to-rose-900/50 rounded-2xl flex items-center justify-center text-2xl shadow-sm">⭐</div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Fandom Styles</h3>
                <p className="text-sm text-muted-foreground">Inspired by pop culture</p>
              </Link>
              <Link href="/guides" className="group p-6 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm rounded-3xl border border-white/60 dark:border-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/40 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-300 text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 rounded-2xl flex items-center justify-center text-2xl shadow-sm">📖</div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Guides</h3>
                <p className="text-sm text-muted-foreground">Learn how it works</p>
              </Link>
              <Link href="/about" className="group p-6 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm rounded-3xl border border-white/60 dark:border-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/40 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-300 text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-2xl flex items-center justify-center text-2xl shadow-sm">ℹ️</div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">About</h3>
                <p className="text-sm text-muted-foreground">Site &amp; tools info</p>
              </Link>
            </div>
          </motion.div>
 

         {/* SEO Content */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4 }}
           className="mt-16 prose prose-neutral dark:prose-invert max-w-none"
         >
           <h2>What Is This Font Generator?</h2>
           <p>
             This <strong>font generator</strong> is a free online tool that converts plain text into decorative Unicode characters. Unlike regular fonts that require specific software or formatting that gets stripped when copying, this tool produces actual Unicode symbols that survive copy-paste across virtually every platform and application.
           </p>
           <p>
             Each style in the <strong>Fancy Text Generator</strong> uses a different Unicode block — from Mathematical Bold and Script to Fraktur and Circled letters. The result is text that looks visually distinct while remaining readable and universally compatible. Whether you are updating your Instagram bio, writing a Discord server description, or crafting a TikTok caption, <strong>fancy text</strong> helps your words stand out in a crowded feed.
           </p>
           <p>
             The best part: there is no signup, no download, and no hidden cost. Type your text and the generator shows you every available style instantly. Click any result to copy it, then paste it wherever Unicode text is accepted — which is nearly everywhere in 2025.
           </p>

           <h2>How Does This Font Generator Work?</h2>
           <p>
             When you type into a <strong>font generator</strong>, the tool maps each letter to a corresponding character from a different Unicode block. The core set comes from the Mathematical Alphanumeric Symbols block (U+1D400–U+1D7FF), which contains complete alphabets drawn in bold, italic, script, fraktur, double-struck, and monospace styles.
           </p>
           <p>
             For example, the regular letter "A" (U+0041) becomes "𝐀" (U+1D400, Mathematical Bold Capital A) when you select the bold style. The same letter becomes "𝒜" (U+1D49C, Mathematical Script Capital A) with the script style. Each transformation is a direct character substitution — no CSS or font embedding involved.
           </p>
           <p>
             This approach has two advantages. First, the styled text works anywhere regular text works: messaging apps, social media platforms, forms, and documents. Second, it does not require the reader to have a specific font installed — the characters render using whatever Unicode-capable font their device provides. This wide compatibility is why <strong>font generators</strong> have become a standard tool for social media users worldwide.
           </p>

           <h3>Technical Note on Character Support</h3>
           <p>
             Not every letter has a direct equivalent in every Unicode style. For instance, subscript "q" and superscript "b" do not exist as standard codepoints, so the <strong>font generator</strong> falls back to the original character. Numbers are also unevenly covered — bold italic digits exist, but fraktur and script numerals do not. When a mapping is missing, the original character passes through unchanged so your text remains readable.
           </p>

           <h2>Popular Font Styles and Use Cases</h2>
           <ul>
             <li><strong>Bold (𝐁𝐨𝐥𝐝 𝐓𝐞𝐱𝐭):</strong> The go-to for emphasis. Use it in social media headlines, Discord announcements, and anywhere you want text that reads with authority. The Mathematical Bold block covers uppercase and lowercase letters plus digits.</li>
             <li><strong>Italic (𝐼𝑡𝑎𝑙𝑖𝑐 𝑇𝑒𝑥𝑡):</strong> A slanted, elegant alternative to regular text. Popular for quotes, book titles, and creative bios. The italic set pairs naturally with regular text for contrast.</li>
             <li><strong>Script (𝒮𝒸𝓇𝒾𝓅𝓉 𝒯𝑒𝓍𝓉):</strong> Flowing, handwriting-style letters that add a personal touch. Widely used in Instagram and TikTok bios to convey a creative or premium feel.</li>
             <li><strong>Fraktur (𝔉𝔯𝔞𝔨𝔱𝔲𝔯 𝔗𝔢𝔵𝔱):</strong> Gothic blackletter characters that evoke medieval manuscripts and heavy metal aesthetics. Perfect for Halloween posts, fantasy-themed content, and occult aesthetics.</li>
             <li><strong>Circled (ⓒⓘⓡⓒⓛⓔⓓ):</strong> Each letter wrapped in a circle. This style reads as playful and button-like, making it popular for usernames and short display text on social platforms.</li>
             <li><strong>Monospace (𝚖𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎):</strong> Fixed-width characters that mimic terminal output and code editors. Favored by developers and tech content creators for a "hacker" or retro computing aesthetic.</li>
           </ul>

           <h2>Where to Use Fancy Fonts on Social Media</h2>
           <p>
             Different platforms handle Unicode characters differently, and knowing which styles work best where saves you time. Here is a platform-by-platform breakdown based on community experience:
           </p>
           <ul>
             <li><strong>Instagram:</strong> Fancy text works in bios, captions, and comments. Script and cursive styles are the most popular choices for bio text. Bold italic works well for highlight reel titles. Avoid very long fancy strings in captions — they can feel visually overwhelming on mobile.</li>
             <li><strong>Discord:</strong> All major Unicode blocks render correctly in chat, nicknames, and server descriptions. The monospace style is especially popular in Discord for code snippets and tech-channel discussions. Long fancy text strings may trigger Discord spam filters, so keep messages concise.</li>
             <li><strong>TikTok:</strong> Bios and video descriptions support Unicode characters. The bold and circled styles trend among TikTok creators for profile text. Fullwidth text works well in video overlays for a retro digital-camera aesthetic.</li>
             <li><strong>Twitter/X:</strong> Bold and italic characters render in tweets and bios. Fraktur and double-struck work for standout profile headers. Twitter has historically been more restrictive with rare Unicode codepoints, so test before posting.</li>
             <li><strong>LinkedIn:</strong> Use fancy text sparingly. A single bold headline or a small-caps section header can look polished. Full-profile script formatting reads as unprofessional to recruiters.</li>
           </ul>

           <h2>Why Use This Free Font Generator?</h2>
           <p>
             There are plenty of fancy text tools online, but this one stands out for a few reasons. First, everything runs in your browser — your text is never uploaded to a server, which matters if you are generating sensitive content like passwords or personal messages. Second, the generator updates in real-time as you type, so you see every style variation instantly without clicking a "generate" button. Third, one-click copy is built into every result row — no selecting and right-clicking needed.
           </p>
           <p>
             The tool is completely free with no signup, no usage limits, and no watermarks. You can generate as much fancy text as you need, for as long as you need it. Updates and new Unicode style blocks are added as the Unicode standard evolves.
           </p>

           <h2>Frequently Asked Questions</h2>

           <h3>Is fancy text compatible with all social media platforms?</h3>
           <p>
             Most major platforms support the core Unicode blocks (bold, italic, script, fraktur, circled, monospace, double-struck). Some platforms may not render very rare codepoints, but the styles included in this generator have been tested across Instagram, Twitter/X, Facebook, TikTok, Discord, WhatsApp, Telegram, LinkedIn, Reddit, and YouTube. If a specific character does not display correctly on a platform, try switching to a different style from the same page.
           </p>

           <h3>Can I use fancy text in usernames and display names?</h3>
           <p>
             It depends on the platform. Discord, Telegram, and Instagram allow Unicode characters in display names. Twitter/X allows them but may limit length. Some platforms (like certain game clients) strip non-ASCII characters from usernames for moderation reasons. A good rule: try the fancy name on a secondary account first, and if it works, apply it to your primary account.
           </p>

           <h3>Why do some letters not convert in certain styles?</h3>
           <p>
             Unicode simply does not define every letter in every style. The Mathematical Alphanumerics block covers most letters for bold, italic, script, and fraktur, but some characters — particularly subscript "b", superscript "q", and a handful of accented letters — lack codepoints. When a letter has no mapped character, the generator leaves it unchanged so your text stays readable. This is a Unicode specification limitation, not a bug in the generator.
           </p>

           <h3>Is fancy text accessible for screen readers?</h3>
           <p>
             Screen readers typically announce Unicode characters by their official name rather than by their intended letter sound. For example, "𝐇" (Mathematical Bold Capital H) may be read as "mathematical bold capital H" instead of simply "H." This can make longer fancy-text passages difficult to follow for visually impaired users. A good practice is to use the <strong>Fancy Text Generator</strong> for visual display purposes — bios, post headers, usernames — and keep the main body of your content in regular characters.
           </p>

           <h3>Ready to Create Your Fancy Text?</h3>
           <p>
             Type any message into the generator above and browse through 20+ Unicode text styles. Click the copy button next to your favorite style and paste it wherever you want your text to stand out. No account needed, no limits, and the conversion happens instantly in your browser.
           </p>
         </motion.div>
        </div>
      </div>
    </>
  );
}
