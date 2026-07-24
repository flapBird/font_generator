 import { Metadata } from 'next';
 
 export const metadata: Metadata = {
   title: 'Privacy Policy',
   alternates: {
     canonical: 'https://font-generators.org/privacy',
   },
 };
 
 export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
   return children;
 }
 
