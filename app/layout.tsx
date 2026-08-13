 import type { Metadata } from "next";
 import Script from "next/script";
 import "./globals.css";
 import { Header, Footer } from "@/components";
 import AdvertisingScripts from "@/components/AdvertisingScripts";
 import { fandomPages, guidePages, stylePages } from "@/lib/data";
 
 // Using system fonts for production to avoid Google Fonts fetch dependency
 // and improve page load speed with zero external font requests
 const geistSans = { variable: '--font-geist-sans' };
 const geistMono = { variable: '--font-geist-mono' };
 const adsenseClientId = 'ca-pub-4183802444188513';
 const homeMetaTitle = 'Font Generator – Copy & Paste Fancy Text Online';
 const homeMetaDescription = 'Free online font generator for copyable Unicode text, rendered font artwork, and ASCII banners. Create in your browser with no sign-up.';
 const adEligiblePaths = [
   '/',
   ...stylePages.map((page) => `/styles/${page.slug}`),
   ...fandomPages.map((page) => `/fandom/${page.slug}`),
   ...guidePages.map((page) => `/guides/${page.slug}`),
 ];
 const styleNavigationLinks = stylePages.map((page) => ({
   href: `/styles/${page.slug}`,
   label: page.title,
   icon: page.icon,
 }));
 const fandomNavigationLinks = fandomPages.map((page) => ({
   href: `/fandom/${page.slug}`,
   label: page.title,
   icon: page.icon,
 }));

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
      alt: "Font Generators — Type it. Style it. Copy it.",
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
    <html lang="en">
  <body
    className={`${geistSans.variable} ${geistMono.variable} antialiased`}
  >
        <AdvertisingScripts
          clientId={adsenseClientId}
          allowedPaths={adEligiblePaths}
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
        
        <Header
          styleLinks={styleNavigationLinks}
          fandomLinks={fandomNavigationLinks}
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
