import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header, Footer } from "@/components";
import { GoogleAnalytics } from "@next/third-parties/google";

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
      <GoogleAnalytics gaId="G-1LZVVCMCK5" />

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