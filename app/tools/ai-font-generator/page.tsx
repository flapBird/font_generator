'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToolLayout } from '@/components';
import { generateFontStyles, FontStyle } from '@/lib/fonts';

export default function AIFontGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<FontStyle[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    try {
      const styles = await generateFontStyles(prompt);
      setResults(styles);
    } catch (error) {
      console.error('Error generating fonts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadSVG = (text: string, fontName: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="100">
      <text x="10" y="50" font-family="Arial" font-size="24" fill="black">${text}</text>
    </svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fontName.replace(/\s+/g, '-').toLowerCase()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
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
            "name": "AI Font Generator",
            "url": "https://font-generators.org/tools/ai-font-generator",
            "description": "Generate unique font styles using AI. Enter a prompt and get multiple creative font variations.",
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
          <span className="gradient-text">AI Font Generator</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Enter a description and let AI generate unique font styles for your project.
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
            <label className="block text-sm font-medium mb-2">Font Description (Prompt)</label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Modern minimalist sans-serif for tech startup"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Preview Text</label>
            <input
              type="text"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
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
                <span>✨</span>
                Generate Fonts
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12"
          >
            {results.map((style, index) => (
              <motion.div
                key={style.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-background border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{style.name}</h3>
                    <p className="text-sm text-muted-foreground">{style.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(previewText, style.id)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      title="Copy text"
                    >
                      {copiedId === style.id ? (
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleDownloadSVG(previewText, style.name)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      title="Download SVG"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="text-2xl leading-relaxed overflow-hidden text-ellipsis">
                  {previewText}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEO Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="prose prose-neutral dark:prose-invert max-w-none"
      >
        <h2>What is the AI Font Generator?</h2>
        <p>
          The AI Font Generator is a revolutionary tool that uses artificial intelligence to create unique font styles based on your descriptions. Whether you&apos;re a designer looking for inspiration, a developer needing custom typography, or a content creator wanting to stand out, our AI-powered font generator helps you discover the perfect font style in seconds.
        </p>

        <h2>How Does AI Font Generation Work?</h2>
        <p>
          Our AI font generator analyzes your text prompt and generates multiple font style variations that match your description. The system understands design concepts like &quot;modern,&quot; &quot;elegant,&quot; &quot;bold,&quot; &quot;minimalist,&quot; and many more, translating them into actual font characteristics including weight, spacing, and style.
        </p>

        <h3>Key Features</h3>
        <ul>
          <li><strong>Instant Generation:</strong> Get multiple font styles in seconds</li>
          <li><strong>Custom Preview:</strong> See your own text in each generated style</li>
          <li><strong>Easy Export:</strong> Download fonts as SVG files for use in any design tool</li>
          <li><strong>One-Click Copy:</strong> Copy styled text directly to your clipboard</li>
          <li><strong>AI-Powered:</strong> Smart understanding of design terminology and concepts</li>
        </ul>

        <h2>Best Practices for Font Generation Prompts</h2>
        <p>
          To get the best results from our AI font generator, try to be specific in your descriptions. Instead of just saying &quot;nice font,&quot; describe the feeling you want to convey. For example:
        </p>
        <ul>
          <li>&quot;Clean modern sans-serif for a tech startup&quot;</li>
          <li>&quot;Elegant script font for wedding invitations&quot;</li>
          <li>&quot;Bold condensed display font for sports branding&quot;</li>
          <li>&quot;Playful rounded font for children&apos;s app&quot;</li>
          <li>&quot;Professional serif font for law firm&quot;</li>
        </ul>

        <h2>Use Cases for AI-Generated Fonts</h2>
        <p>
          Our AI font generator is perfect for various creative projects including logo design, social media graphics, website headers, presentation titles, marketing materials, and brand identity development. The generated styles can serve as inspiration or be used directly in your projects.
        </p>

        <h2>Why Choose Our Font Generator?</h2>
        <p>
          Unlike traditional font libraries where you browse through thousands of options, our AI font generator understands what you&apos;re looking for. Simply describe your ideal font, and let artificial intelligence do the heavy lifting. It&apos;s faster, more intuitive, and designed for the modern creative workflow.
        </p>
      </motion.div>
    </ToolLayout>
  );
}
