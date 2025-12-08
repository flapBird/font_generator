'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ToolLayout } from '@/components';
import { logoFontStyles, generateLogoStyles } from '@/lib/fonts';

export default function LogoFontMakerPage() {
  const [brandName, setBrandName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ style: typeof logoFontStyles[0]; preview: string }[]>([]);

  const handleGenerate = async () => {
    if (!brandName.trim()) return;
    
    setIsLoading(true);
    try {
      const styles = await generateLogoStyles(brandName);
      setResults(styles);
    } catch (error) {
      console.error('Error generating logo styles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const displayResults = useMemo(() => {
    if (results.length > 0) return results;
    // Show preview with default styles when user starts typing
    if (brandName.trim()) {
      return logoFontStyles.map(style => ({
        style,
        preview: brandName,
      }));
    }
    return [];
  }, [results, brandName]);

  return (
    <ToolLayout>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Logo Font Maker",
            "url": "https://font-generators.org/tools/logo-font-maker",
            "description": "Create stunning logo typography. Enter your brand name and explore dozens of professional font styles.",
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
          <span className="gradient-text">Logo Font Maker</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Enter your brand name and explore professional logo typography styles.
        </p>
      </motion.div>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-muted/30 rounded-2xl p-6 mb-8"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Brand Name</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Enter your brand name..."
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={isLoading || !brandName.trim()}
              className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <span>🎯</span>
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Results Grid */}
      {displayResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12"
        >
          {displayResults.map((item, index) => (
            <motion.div
              key={item.style.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="group relative bg-zinc-900 rounded-2xl p-8 hover:ring-2 hover:ring-primary transition-all cursor-pointer overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              </div>
              
              {/* Logo Preview */}
              <div className="relative flex items-center justify-center min-h-[100px]">
                <span
                  className="text-white text-2xl sm:text-3xl text-center break-all"
                  style={{
                    fontFamily: item.style.fontFamily,
                    ...item.style.style,
                  }}
                >
                  {item.preview}
                </span>
              </div>

              {/* Style Name */}
              <div className="relative mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-zinc-400 text-center">{item.style.name}</p>
              </div>

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors">
                  Download SVG
                </button>
                <button className="px-4 py-2 bg-white/20 text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
                  Customize
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {displayResults.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 text-muted-foreground"
        >
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-lg">Enter your brand name above to see logo font styles</p>
        </motion.div>
      )}

      {/* SEO Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="prose prose-neutral dark:prose-invert max-w-none"
      >
        <h2>What is the Logo Font Maker?</h2>
        <p>
          The Logo Font Maker is a free online tool designed to help you explore different typography styles for your brand logo. Simply enter your brand name, and instantly see how it looks in dozens of professional font styles. This tool is perfect for entrepreneurs, designers, and marketers looking for logo inspiration or testing different typographic approaches.
        </p>

        <h2>How to Create the Perfect Logo Typography</h2>
        <p>
          Typography is one of the most crucial elements of logo design. The right font can convey professionalism, creativity, playfulness, or luxury. Our Logo Font Maker lets you experiment with various font families and styles to find the perfect match for your brand identity.
        </p>

        <h3>Available Style Categories</h3>
        <ul>
          <li><strong>Modern Sans:</strong> Clean, contemporary fonts for tech and startup brands</li>
          <li><strong>Elegant Serif:</strong> Sophisticated fonts for luxury and premium brands</li>
          <li><strong>Bold Display:</strong> High-impact fonts for sports and entertainment</li>
          <li><strong>Minimal Thin:</strong> Light, airy fonts for lifestyle and fashion brands</li>
          <li><strong>Tech Mono:</strong> Monospace fonts for developer and tech companies</li>
          <li><strong>Script Elegant:</strong> Flowing cursive fonts for creative businesses</li>
          <li><strong>And many more!</strong></li>
        </ul>

        <h2>Logo Design Best Practices</h2>
        <p>
          When choosing a logo font, consider these key factors: readability at small sizes, uniqueness, appropriateness for your industry, and how well it reflects your brand personality. The best logo fonts are memorable, versatile, and timeless. Avoid trendy fonts that may feel dated in a few years.
        </p>

        <h2>Export and Customize</h2>
        <p>
          Once you find a style you like, you can download it as an SVG file for further customization in professional design software like Adobe Illustrator, Figma, or Sketch. SVG format ensures your logo stays crisp and scalable at any size.
        </p>

        <h2>Free Logo Font Exploration</h2>
        <p>
          Our Logo Font Maker is completely free to use. Explore unlimited font styles, download as many variations as you want, and find the perfect typography for your brand. No signup required, no watermarks, no limitations.
        </p>
      </motion.div>
    </ToolLayout>
  );
}
