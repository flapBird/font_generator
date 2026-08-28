 import type { Metadata } from "next";
 import "@fontsource/anton/latin-400.css";
 import "@fontsource/berkshire-swash/latin-400.css";
 import "@fontsource/eb-garamond/latin-700.css";
 import "@fontsource/luckiest-guy/latin-400.css";
 import "@fontsource/pixelify-sans/latin-700.css";
 import "./globals.css";
 import { Header, Footer } from "@/components";
 import AdvertisingScripts from "@/components/AdvertisingScripts";
 import GoogleAnalytics from "@/components/GoogleAnalytics";
 import { guidePages } from "@/lib/data";
 import { generatorRegistry, getFontStyleGenerators, getVisualArtGenerators } from "@/lib/generator-registry";
 
 // The core UI uses system fonts; fandom artwork faces above are self-hosted
 // packages, so production still makes zero external font requests.
 const geistSans = { variable: '--font-geist-sans' };
 const geistMono = { variable: '--font-geist-mono' };
 const adsenseClientId = 'ca-pub-4183802444188513';
 const homeMetaTitle = 'Free Font Generator – Copy & Paste Stylish Text';
 const homeMetaDescription = 'Create stylish copy-and-paste text and custom font art for social media, games, usernames, and more with free browser-based generators.';
 const adEligiblePaths = [
   '/',
   '/visual-art',
   ...generatorRegistry.map((generator) => generator.canonicalPath),
   ...guidePages.map((page) => `/guides/${page.slug}`),
 ];
 const fontStyleNavigationLinks = getFontStyleGenerators()
   .map((generator) => ({
   href: generator.canonicalPath,
   label: generator.title,
   icon: generator.icon,
 }));
 const visualArtNavigationLinks = getVisualArtGenerators()
   .map((generator) => ({
   href: generator.canonicalPath,
   label: generator.title,
   icon: generator.icon,
 }));
 const themeInitializationScript = `
   (() => {
     let savedTheme = null;
     try {
       savedTheme = localStorage.getItem('font-generators-theme-v2');
     } catch {}
     const useDarkTheme = savedTheme === 'dark';
     document.documentElement.classList.toggle('dark', useDarkTheme);
     document.documentElement.style.colorScheme = useDarkTheme ? 'dark' : 'light';
   })();
 `;

export const metadata: Metadata = {
  metadataBase: new URL('https://font-generators.org/'),
  title: {
    default: homeMetaTitle,
    template: "%s | Font Generators"
  },
  description: homeMetaDescription,
  authors: [{ name: "Font Generators" }],
  creator: "Font Generators",
  publisher: "Font Generators",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://font-generators.org",
    siteName: "Font Generators",
    title: homeMetaTitle,
    description: homeMetaDescription,
    images: [{
      url: "/og-font-generators.png",
      width: 1731,
      height: 909,
      alt: "Free Font Generator for copy-and-paste text and custom font art",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: homeMetaTitle,
    description: homeMetaDescription,
    images: ["/og-font-generators.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'google-adsense-account': 'ca-pub-4183802444188513'
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID || 'G-XZ8VM9EYM9';
 
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          id="theme-initialization"
          dangerouslySetInnerHTML={{ __html: themeInitializationScript }}
        />
      </head>
  <body
    className={`${geistSans.variable} ${geistMono.variable} antialiased`}
  >
        <AdvertisingScripts
          clientId={adsenseClientId}
          allowedPaths={adEligiblePaths}
        />
        <GoogleAnalytics measurementId={gaId} />
        
        <Header
          fontStyleLinks={fontStyleNavigationLinks}
          visualArtLinks={visualArtNavigationLinks}
        />
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
