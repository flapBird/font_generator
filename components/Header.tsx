 'use client';
 
 import Link from 'next/link';
 import { useState } from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
 
 const navItems = [
   { href: '/', label: 'Home', icon: '🎨' },
   { href: '/styles', label: 'Text Styles', icon: '🔤' },
   { href: '/fandom', label: 'Fandom', icon: '⭐' },
   { href: '/guides', label: 'Guides', icon: '📖' },
   { href: '/about', label: 'About', icon: 'ℹ️' },
 ];
 
 export default function Header() {
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
 
   return (
     <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
       <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="flex items-center justify-between h-16">
           {/* Logo */}
           <Link href="/" className="flex items-center space-x-2">
             <span className="text-2xl font-bold gradient-text">Font Generators</span>
           </Link>
 
           {/* Desktop Navigation */}
           <div className="hidden md:flex items-center gap-1">
             {navItems.map((item) => (
               <Link
                 key={item.href}
                 href={item.href}
                 className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
               >
                 {item.label}
               </Link>
             ))}
           </div>
 
           {/* Mobile Menu Button */}
           <button
             className="md:hidden p-2"
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             aria-label="Toggle menu"
           >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               {isMobileMenuOpen ? (
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               ) : (
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
               )}
             </svg>
           </button>
         </div>
 
         {/* Mobile Menu */}
         <AnimatePresence>
           {isMobileMenuOpen && (
             <motion.div
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: 'auto' }}
               exit={{ opacity: 0, height: 0 }}
               className="md:hidden overflow-hidden"
             >
               <div className="py-4 space-y-1">
                 {navItems.map((item) => (
                   <Link
                     key={item.href}
                     href={item.href}
                     className="flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-lg transition-colors"
                     onClick={() => setIsMobileMenuOpen(false)}
                   >
                     <span>{item.icon}</span>
                     <span>{item.label}</span>
                   </Link>
                 ))}
               </div>
             </motion.div>
           )}
         </AnimatePresence>
       </nav>
     </header>
   );
 }
