 import { Metadata } from 'next';
 
 export const metadata: Metadata = {
   title: 'Terms of Service',
   description: 'Terms for free text tools and the optional paid AI Font Generator, including credits, delivery, usage and refunds.',
   alternates: {
     canonical: 'https://font-generators.org/terms',
   },
 };
 
 export default function TermsLayout({ children }: { children: React.ReactNode }) {
   return children;
 }
