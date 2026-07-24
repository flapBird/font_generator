 import type { Metadata } from "next";
 import Script from "next/script";
 import "./globals.css";
 import { Header, Footer } from "@/components";
 
 // Using system fonts for production to avoid Google Fonts fetch dependency
 // and improve page load speed with zero external font requests
 const geistSans = { variable: '--font-geist-sans' };
 const geistMono = { variable: '--font-geist-mono' };

export const metadata: Metadata = {
  metadataBase: new URL('https://font-generators.org/'),
  title: {
    default: "Free Font Generator — Create Fancy Unicode Text | Font Generators",
    template: "%s | Font Generators"
  },
  description: "Free online font generator for creating fancy Unicode text. Transform your words into stylish fonts for Instagram, Discord, TikTok, and more. Try our font generator free.",
  authors: [{ name: "Font Generators" }],
  creator: "Font Generators",
  publisher: "Font Generators",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://font-generators.org",
    siteName: "Font Generators",
    title: "Free Font Generator — Fancy Unicode Text",
    description: "Free online font generator. Create fancy Unicode text for social media bios, posts, and creative projects.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Font Generator — Fancy Unicode Text",
    description: "Free font generator. Create fancy Unicode text for social media.",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'google-adsense-account': 'ca-pub-4183802444188513'
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID || 'G-XZ8VM9EYM9';
 
  return (
    <html lang="en">
  <body
    className={`${geistSans.variable} ${geistMono.variable} antialiased`}
  >
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4183802444188513"
          strategy="beforeInteractive"
          crossOrigin="anonymous"
        />
        {/* Google Analytics */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        />

        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              send_page_view: true
            });
          `}
        </Script>
        
        {/* Privacy-friendly analytics by Plausible */}
        <Script defer data-domain="font-generators.org" src="https://analytics.leeswalmonitor.top/js/plausible.js"></Script>

        <Header />
        <div className="flex flex-col min-h-screen">
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
