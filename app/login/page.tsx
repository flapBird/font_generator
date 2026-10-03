import type { Metadata } from 'next';
import GoogleLogin from '@/components/ai-font/GoogleLogin';
import { availability } from '@/lib/ai-font/config';

export const metadata: Metadata = {
  title: 'Log in', alternates: { canonical: '/login' }, robots: { index: false, follow: true },
};

export default function LoginPage() {
  return <GoogleLogin available={availability().auth} />;
}
