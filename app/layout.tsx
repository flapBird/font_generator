 import '@fontsource/caveat/latin-400.css';
 import '@fontsource/caveat/latin-700.css';
 import '@fontsource/patrick-hand/latin-400.css';
 import type { Metadata } from "next";
 import Script from "next/script";
 import "@fontsource/anton/latin-400.css";
 import "@fontsource/bebas-neue/latin-400.css";
 import "@fontsource/montserrat/latin-900.css";
 import "@fontsource/oswald/latin-700.css";
 import "@fontsource/roboto/latin-900.css";
 import "@fontsource/poppins/latin-900.css";
 import "@fontsource/berkshire-swash/latin-400.css";
 import "@fontsource/eb-garamond/latin-400.css";
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
     // Keep the site light while the theme switch is unavailable, including
     // browsers that saved a dark preference before the switch was removed.
     document.documentElement.classList.remove('dark');
     document.documentElement.style.colorScheme = 'light';
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
        <GoogleAnalytics />
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "yob2wr65ot");
          `}
        </Script>
        
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
