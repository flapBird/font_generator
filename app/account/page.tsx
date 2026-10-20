import type { Metadata } from 'next';
import AccountSettings from '@/components/ai-font/AccountSettings';
export const metadata: Metadata = { title: 'Account & Billing', robots: { index: false, follow: false } };
export default function AccountPage() { return <AccountSettings />; }
