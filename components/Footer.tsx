import Link from '@/components/IntentLink';
import { symbolNavigationLinks, unicodeNavigationLinks } from '@/lib/text-library/navigation-links';

const toolGroups = [
  {
    title: 'Font Styles',
    links: [
      { href: '/styles', label: 'All Font Styles' },
      { href: '/small-text-generator', label: 'Small Text' },
      { href: '/cursive-font-generator', label: 'Cursive' },
      { href: '/bubble-font-generator', label: 'Bubble' },
      { href: '/fraktur-font-generator', label: 'Fraktur' },
    ],
  },
  {
    title: 'Visual & Art',
    links: [
      { href: '/visual-art', label: 'All Visual & Art Generators' },
      { href: '/big-font-generator', label: 'ASCII Art' },
      { href: '/fire-font-generator', label: 'Fire Text Art' },
      { href: '/disney-font-generator', label: 'Disney' },
      { href: '/minecraft-font-generator', label: 'Minecraft' },
      { href: '/signature-generator', label: 'Signature Generator' },
    ],
  },
  { title: 'Symbols & Emoji', links: symbolNavigationLinks },
  { title: 'Unicode Tools', links: unicodeNavigationLinks },
];
const siteLinks = [
  { href: '/#top', label: 'Home' },
  { href: '/guides', label: 'Guides' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];
const policyLinks = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
];
const linkClass = 'inline-flex min-h-9 items-center text-sm leading-6 text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500';

export default function Footer() {
  return <footer className="border-t border-border bg-muted/50">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="grid gap-10 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,3fr)] xl:gap-12">
        <div className="max-w-sm">
          <Link href="/" className="gradient-text text-2xl font-bold">Font Generators</Link>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">Font styles, text artwork, symbols and practical Unicode tools in one place.</p>
        </div>
        <nav aria-label="Font and text tools" className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4 md:gap-x-8">
          {toolGroups.map((group) => <section key={group.title} aria-label={group.title} className="min-w-0">
            <h3 className="mb-3 font-semibold text-foreground">{group.title}</h3>
            <ul className="space-y-0.5">{group.links.map((item) => <li key={item.href}><Link href={item.href} className={linkClass}>{item.label}</Link></li>)}</ul>
          </section>)}
        </nav>
      </div>
      <div className="mt-10 flex flex-col justify-between gap-6 border-t border-border pt-6 sm:flex-row">
        <nav aria-label="Site information">
          <h3 className="text-xs font-semibold text-foreground">Site information</h3>
          <div className="mt-1 flex flex-wrap gap-x-5">{siteLinks.map((item) => <Link key={item.href} href={item.href} className={linkClass}>{item.label}</Link>)}</div>
        </nav>
        <nav aria-label="Site policies">
          <h3 className="text-xs font-semibold text-foreground">Policies</h3>
          <div className="mt-1 flex flex-wrap gap-x-5">{policyLinks.map((item) => <Link key={item.href} href={item.href} className={linkClass}>{item.label}</Link>)}</div>
        </nav>
      </div>
      <p className="mt-5 text-xs leading-6 text-muted-foreground">&copy; {new Date().getFullYear()} font-generators.org. All rights reserved.</p>
    </div>
  </footer>;
}
