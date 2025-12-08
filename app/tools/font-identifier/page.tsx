'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToolLayout } from '@/components';
import { identifyFont, IdentifiedFont } from '@/lib/fonts';

export default function FontIdentifierPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<IdentifiedFont | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsLoading(true);
    setResult(null);

    try {
      const identified = await identifyFont(file);
      setResult(identified);
    } catch (error) {
      console.error('Error identifying font:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const reset = () => {
    setResult(null);
    setPreviewUrl(null);
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
            "name": "Font Identifier",
            "url": "https://font-generators.org/tools/font-identifier",
            "description": "Upload an image and let AI identify the font. Get font name, similar alternatives, and download links.",
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
          <span className="gradient-text">Font Identifier</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Upload an image with text and let AI identify the font for you.
        </p>
      </motion.div>

      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          {previewUrl ? (
            <div className="space-y-4">
              <img
                src={previewUrl}
                alt="Uploaded preview"
                className="max-w-full max-h-64 mx-auto rounded-lg shadow-lg"
              />
              <button
                onClick={reset}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Upload different image
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-5xl">🖼️</div>
              <div>
                <p className="text-lg font-medium">Drop an image here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports: JPG, PNG, GIF, WebP
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="mt-4 text-muted-foreground">Analyzing image...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-muted/30 rounded-2xl p-8 mb-12"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Font Identified!</h2>
              <p className="text-muted-foreground">
                {result.confidence}% confidence match
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Main Result */}
              <div className="bg-background rounded-xl p-6 border border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Identified Font</h3>
                <p className="text-3xl font-bold mb-4">{result.name}</p>
                <a
                  href={result.downloadUrl}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Font
                </a>
              </div>

              {/* Similar Fonts */}
              <div className="bg-background rounded-xl p-6 border border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Similar Fonts</h3>
                <ul className="space-y-3">
                  {result.similarFonts.map((font, index) => (
                    <li key={index} className="flex items-center justify-between">
                      <span className="font-medium">{font}</span>
                      <a
                        href="#"
                        className="text-sm text-primary hover:underline"
                      >
                        View
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
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
        <h2>What is the Font Identifier?</h2>
        <p>
          The Font Identifier is an AI-powered tool that helps you discover fonts from images. Whether you&apos;ve seen a beautiful typeface on a poster, website, or product packaging, our font recognition technology can analyze the text and identify the font family, giving you instant access to similar alternatives and download links.
        </p>

        <h2>How Does AI Font Recognition Work?</h2>
        <p>
          Our advanced machine learning model has been trained on thousands of fonts and their characteristics. When you upload an image, the AI analyzes the letter shapes, weights, serifs, spacing, and other typographic features to match the text against our database of known fonts. The result includes a confidence score and suggestions for similar alternatives.
        </p>

        <h3>Tips for Best Results</h3>
        <ul>
          <li><strong>Clear Images:</strong> Use high-resolution images with clearly visible text</li>
          <li><strong>Good Contrast:</strong> Text should have good contrast against the background</li>
          <li><strong>Straight Alignment:</strong> Text that&apos;s straight (not curved or distorted) works best</li>
          <li><strong>Multiple Characters:</strong> Include several letters for more accurate identification</li>
        </ul>

        <h2>Common Use Cases</h2>
        <p>
          Designers often use font identification tools when they encounter typography they love but can&apos;t identify. This tool is perfect for recreating designs, finding fonts for branding projects, identifying fonts from screenshots, and discovering new typefaces to add to your collection.
        </p>

        <h2>What If the Font Isn&apos;t Found?</h2>
        <p>
          If we can&apos;t find an exact match, we&apos;ll provide you with the closest alternatives that share similar characteristics. Sometimes fonts are custom-designed or modified versions of existing typefaces, making exact identification impossible. In these cases, the similar fonts we suggest can help you achieve a comparable look.
        </p>

        <h2>Free Font Identification</h2>
        <p>
          Our font identifier is completely free to use with no limitations. Upload as many images as you need and discover the fonts behind any design. No signup or account required - just drag, drop, and discover.
        </p>
      </motion.div>
    </ToolLayout>
  );
}
