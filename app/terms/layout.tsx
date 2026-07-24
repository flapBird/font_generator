 import { Metadata } from 'next';
 
 export const metadata: Metadata = {
   title: 'Terms of Service',
   alternates: {
     canonical: 'https://font-generators.org/terms',
   },
 };
 
 export default function TermsLayout({ children }: { children: React.ReactNode }) {
   return children;
 }
