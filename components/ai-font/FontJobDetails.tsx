'use client';
import Link from '@/components/IntentLink';
import { useEffect, useRef } from 'react';
import type { FontJob } from '@/lib/ai-font/catalog';
import { jobFailure, jobLabels } from '@/lib/ai-font/job-status';
import styles from './AccountWorkspace.module.css';

export default function FontJobDetails({ job, close }: { job: FontJob; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const reason = jobFailure(job);
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); opener?.focus(); };
  }, []);
  const credits = job.credit_cost && job.credit_cost > 0 ? `${job.credit_cost} credits` : 'Generation credits';
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="font-job-detail-title" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div className={styles.dialogHead}><div><p className={`${styles.eyebrow} mb-2`}>Generation details</p><h2 id="font-job-detail-title">{job.name || 'Custom English font'}</h2></div><button className={styles.button} aria-label="Close task details" onClick={close}>Close</button></div>
    <div className={styles.dialogBody}><span className={`${styles.badge} ${job.status === 'failed' ? styles.failed : job.status === 'succeeded' ? styles.ready : ''}`}>{jobLabels[job.status]}</span>
      {job.status === 'failed' ? <><h3>{reason.title}</h3><p>{reason.message}</p><div className={styles.creditsNote}>{credits} restored. This failed task will not be charged again.</div><p>{reason.next}</p></>
        : job.status === 'needs_review' ? <><h3>Your generation needs a status check</h3><p>We could not confirm the provider response. Your request is saved and will not be charged again automatically. Contact support before starting another generation.</p><p>Credits remain reserved while the outcome is checked; a refund has not been confirmed.</p></>
        : job.status === 'succeeded' ? <><h3>Your font is ready</h3><p>Your saved TTF is available. Preview your font or download it from its library card.</p></>
        : <><h3>Your font is in progress</h3><p>We are preparing your font. Generated glyphs are reviewed before delivery.</p><p>Credits are reserved for this task. Refresh its progress rather than submitting it again.</p></>}
      <dl className={styles.definition}><div><dt>Created</dt><dd>{new Date(job.created_at).toLocaleString()}</dd></div>{job.updated_at && <div><dt>Last updated</dt><dd>{new Date(job.updated_at).toLocaleString()}</dd></div>}<div><dt>Credit status</dt><dd>{job.status === 'failed' ? 'Restored' : job.status === 'succeeded' ? 'Used' : 'Reserved'}{job.credit_cost ? ` · ${job.credit_cost} credits` : ''}</dd></div><div><dt>Task reference</dt><dd className="font-mono text-[10px]">{job.id}</dd></div></dl>
      <h3>Your description</h3><p className={styles.description}>{job.prompt}</p></div><div className={styles.dialogActions}><Link className={`${styles.button} ${styles.primary}`} href="/contact">Contact support</Link>{job.status === 'failed' && <Link className={styles.button} href="/ai-font-generator" onClick={() => { try { sessionStorage.setItem('ai-font-studio-draft-v1', job.prompt); } catch {} }}>Edit description</Link>}<button className={styles.button} onClick={close}>Back to fonts</button></div>
  </dialog>;
}
