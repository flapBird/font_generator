'use client';
import Link from '@/components/IntentLink';
import { useEffect, useState, type ReactNode } from 'react';
import styles from './AccountWorkspace.module.css';

export default function AccountWorkspace({ page, children, refresh, refreshing = false }: { page: 'account' | 'fonts'; children: ReactNode; refresh: () => void; refreshing?: boolean }) {
  return <div className={styles.workspace}>
    <aside className={styles.sidebar}><p className={styles.eyebrow}>Your workspace</p><nav className={styles.nav} aria-label="Account navigation">
      <Link href="/account" aria-current={page === 'account' ? 'page' : undefined}>Account & billing</Link>
      <Link href="/my-fonts" aria-current={page === 'fonts' ? 'page' : undefined}>My fonts & purchases</Link>
      <Link href="/contact">Help & support</Link>
    </nav><p className={styles.privacy}>Your account, your creations.<br />Only you can access this workspace.</p></aside>
    <section className="min-w-0"><header className={styles.header}><div><p className={styles.eyebrow}>Font Generators / Workspace</p><h1>{page === 'account' ? 'Account & billing' : 'My fonts & purchases'}</h1><p className={styles.subtitle}>{page === 'account' ? 'Manage your profile, credits and purchases in one place.' : 'Your creations, generation progress and purchase history.'}</p></div><div className={styles.actions}><button className={styles.button} disabled={refreshing} onClick={refresh}>{refreshing ? 'Refreshing…' : page === 'account' ? 'Refresh account' : 'Refresh'}</button><Link className={`${styles.button} ${styles.primary}`} href="/ai-font-generator">Create a font</Link></div></header>{children}</section>
  </div>;
}

export function AccountLoading({ fonts = false }: { fonts?: boolean }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setSlow(true), 3500); return () => clearTimeout(timer); }, []);
  return <div role="status" aria-label={fonts ? 'Loading your fonts' : 'Loading account'}><p className={styles.statusText}>{slow ? 'Taking longer than usual. Your saved records are safe; we are still checking your account.' : fonts ? 'Loading your fonts…' : 'Loading account…'}</p><div className={styles.grid} aria-hidden="true">{[0,1,2,3].map(i => <div key={i} className={styles.loadingPanel}><div className={styles.skeleton} /><div className={styles.skeleton} /><div className={styles.skeleton} /></div>)}</div></div>;
}
