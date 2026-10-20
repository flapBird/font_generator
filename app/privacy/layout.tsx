 import { Metadata } from 'next';
 
 export const metadata: Metadata = {
   title: 'Privacy Policy',
   description: 'How Font Generators handles free-tool input, AI font accounts, purchases, generation data, storage and deletion requests.',
   alternates: {
     canonical: 'https://font-generators.org/privacy',
   },
 };
 
 export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
   return children;
 }
 
