 import Link from 'next/link';
 
 export default function Footer() {
   return (
     <footer className="bg-muted/50 border-t border-border">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
           {/* Brand */}
           <div className="sm:col-span-2 md:col-span-1">
             <Link href="/" className="text-2xl font-bold gradient-text">
               Font Generators
             </Link>
             <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
               Transform your text into fancy Unicode styles. Free online tool for creating stylish text for social media, bios, and creative projects.
             </p>
           </div>
 
           {/* Text Styles */}
           <div>
             <h3 className="font-semibold text-foreground mb-3">Text Styles</h3>
             <ul className="space-y-2">
               <li><Link href="/styles" className="text-muted-foreground hover:text-foreground text-sm transition-colors">All Styles</Link></li>
               <li><Link href="/styles/small-text-generator" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Small Text</Link></li>
               <li><Link href="/styles/cursive-font-generator" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Cursive</Link></li>
               <li><Link href="/styles/bubble-font-generator" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Bubble Letters</Link></li>
               <li><Link href="/styles/fraktur-font-generator" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Fraktur</Link></li>
             </ul>
           </div>
 
           {/* Fandom */}
           <div>
             <h3 className="font-semibold text-foreground mb-3">Fandom</h3>
             <ul className="space-y-2">
               <li><Link href="/fandom" className="text-muted-foreground hover:text-foreground text-sm transition-colors">All Fandom Styles</Link></li>
               <li><Link href="/fandom/pop-culture-font-generators" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Pop Culture Hub</Link></li>
               <li><Link href="/fandom/disney-font-generator" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Disney</Link></li>
               <li><Link href="/fandom/mario-font-generator" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Mario</Link></li>
               <li><Link href="/fandom/stranger-things-font-generator" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Stranger Things</Link></li>
             </ul>
           </div>
 
           {/* Links */}
           <div>
             <h3 className="font-semibold text-foreground mb-3">Links</h3>
             <ul className="space-y-2">
               <li><Link href="/" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Fancy Text Generator</Link></li>
               <li><Link href="/guides" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Guides</Link></li>
               <li><Link href="/about" className="text-muted-foreground hover:text-foreground text-sm transition-colors">About</Link></li>
               <li><Link href="/contact" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Contact</Link></li>
               <li><Link href="/terms" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Terms of Service</Link></li>
               <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Privacy Policy</Link></li>
             </ul>
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
