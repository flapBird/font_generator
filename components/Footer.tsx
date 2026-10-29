import Link from '@/components/IntentLink';
import { featuredToolCategories } from '@/lib/tool-navigation';

const toolLinks = [{ href: '/tools', title: 'All tools' }, ...featuredToolCategories];
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
      <div className="grid grid-cols-2 gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-12">
        <div className="col-span-2 max-w-sm md:col-span-1">
          <Link href="/" className="gradient-text text-2xl font-bold">Font Generators</Link>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">Font styles, text artwork, symbols and practical Unicode tools in one place.</p>
        </div>
        <nav aria-label="Font and text tools">
          <h3 className="mb-3 font-semibold text-foreground">Explore tools</h3>
          <ul>{toolLinks.map((item) => <li key={item.href}><Link href={item.href} className={linkClass}>{item.title}</Link></li>)}</ul>
        </nav>
        <nav aria-label="Site information">
          <h3 className="mb-3 font-semibold text-foreground">About &amp; Help</h3>
          <ul>{siteLinks.map((item) => <li key={item.href}><Link href={item.href} className={linkClass}>{item.label}</Link></li>)}</ul>
        </nav>
      </div>
      <div className="mt-8 flex flex-col-reverse justify-between gap-4 border-t border-border pt-5 sm:flex-row sm:items-center">
        <p className="text-xs leading-6 text-muted-foreground">&copy; {new Date().getFullYear()} font-generators.org. All rights reserved.</p>
        <nav aria-label="Site policies" className="flex flex-wrap gap-x-5">{policyLinks.map((item) => <Link key={item.href} href={item.href} className={linkClass}>{item.label}</Link>)}</nav>
      </div>
    </div>
  </footer>;
}
