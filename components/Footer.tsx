import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-2xl font-bold gradient-text">
              Font Generators
            </Link>
            <p className="mt-4 text-muted-foreground max-w-md">
              Transform your text into fancy Unicode styles. Free online tool for creating stylish text for social media, bios, and creative projects.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Links</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Fancy Text Generator
                </Link>
              </li>
              <li>
                <Link 
                  href="/about"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} font-generators.org. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}