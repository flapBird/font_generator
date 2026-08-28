 import Link from 'next/link';
 
 export default function Footer() {
   return (
     <footer className="bg-muted/50 border-t border-border">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(17rem,1fr)_auto] lg:items-start lg:gap-16">
           {/* Brand */}
          <div className="max-w-sm">
             <Link href="/" className="text-2xl font-bold gradient-text">
               Font Generators
             </Link>
             <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
               Transform your text into fancy Unicode styles. Free online tool for creating stylish text for social media, bios, and creative projects.
             </p>
           </div>
 
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 sm:gap-x-10 lg:justify-self-end lg:gap-x-12">
            <div className="min-w-0 sm:min-w-36">
              <h3 className="mb-3 font-semibold text-foreground">Font Styles</h3>
              <ul className="space-y-2">
                <li><Link href="/styles" className="text-sm text-muted-foreground transition-colors hover:text-foreground">All Font Styles</Link></li>
                <li><Link href="/small-text-generator" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Small Text</Link></li>
                <li><Link href="/cursive-font-generator" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Cursive</Link></li>
                <li><Link href="/bubble-font-generator" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Bubble</Link></li>
                <li><Link href="/fraktur-font-generator" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Fraktur</Link></li>
              </ul>
            </div>

            <div className="min-w-0 sm:min-w-36">
              <h3 className="mb-3 font-semibold text-foreground">Visual &amp; Art</h3>
              <ul className="space-y-2">
                <li><Link href="/visual-art" className="text-sm text-muted-foreground transition-colors hover:text-foreground">All Visual &amp; Art Generators</Link></li>
                <li><Link href="/big-font-generator" className="text-sm text-muted-foreground transition-colors hover:text-foreground">ASCII Art</Link></li>
                <li><Link href="/fire-font-generator" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Fire Text Art</Link></li>
                <li><Link href="/disney-font-generator" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Disney</Link></li>
                <li><Link href="/minecraft-font-generator" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Minecraft</Link></li>
              </ul>
            </div>

            <div className="min-w-0 sm:min-w-36">
              <h3 className="mb-3 font-semibold text-foreground">Site</h3>
              <ul className="space-y-2">
                <li><Link href="/#top" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Home</Link></li>
                <li><Link href="/guides" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Guides</Link></li>
                <li><Link href="/about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">About</Link></li>
                <li><Link href="/contact" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Contact</Link></li>
                <li><Link href="/terms" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
         </div>
 
         {/* Bottom */}
         <div className="mt-12 pt-8 border-t border-border text-center">
           <p className="text-muted-foreground text-sm">
             &copy; {new Date().getFullYear()} font-generators.org. All rights reserved.
           </p>
         </div>
       </div>
     </footer>
   );
 }
