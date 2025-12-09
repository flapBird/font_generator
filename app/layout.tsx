import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header, Footer } from "@/components";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://font-generators.org'),
  title: {
    default: "Fancy Text Generator — Free Unicode Text Converter | Font Generators",
    template: "%s | Font Generators"
  },
  description: "Transform your text into fancy Unicode styles. Create stylish text for Instagram, Twitter, Discord, and more. Free online fancy text generator.",
  authors: [{ name: "Font Generators" }],
  creator: "Font Generators",
  publisher: "Font Generators",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://font-generators.org",
    siteName: "Font Generators",
    title: "Fancy Text Generator — Free Unicode Text Converter",
    description: "Transform your text into fancy Unicode styles for social media, bios, and creative projects.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fancy Text Generator — Free Unicode Text Converter",
    description: "Transform your text into fancy Unicode styles.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google Analytics */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-1LZVVCMCK5"
        />

        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-1LZVVCMCK5', {
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