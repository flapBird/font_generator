'use client';
import { useState, type ReactNode } from 'react';
import type { FontJob } from '@/lib/ai-font/catalog';
import { jobFailure, jobLabels } from '@/lib/ai-font/job-status';
import FontJobDetails from './FontJobDetails';
import styles from './AccountWorkspace.module.css';

export default function FontJobs({ jobs, busy, preview, download, renderPreview }: { jobs: FontJob[]; busy: boolean; preview: (job: FontJob) => void; download: (job: FontJob) => void; renderPreview: (job: FontJob) => ReactNode }) {
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<string | null>(null);
  const matches = (job: FontJob, category: string) => category === 'All' || (category === 'Ready' ? job.status === 'succeeded' : category === 'Failed' ? job.status === 'failed' : !['failed','succeeded'].includes(job.status));
  const visible = jobs.filter(job => matches(job, filter));
  const selectedJob = jobs.find(job => job.id === selected);
  return <>
    <div className={styles.filters} role="group" aria-label="Filter fonts">{['All','Ready','In progress','Failed'].map(category => <button key={category} className={styles.filter} aria-pressed={filter === category} onClick={() => setFilter(category)}>{category} <span className="ml-1 opacity-60">{jobs.filter(job => matches(job, category)).length}</span></button>)}</div>
    {!visible.length ? <div className={styles.empty}><h3 className="font-semibold">{jobs.length ? 'No fonts in this view' : 'Your first font starts with an idea'}</h3><p className="mt-3">{jobs.length ? 'Choose another filter to see your other generations.' : 'Describe the font you have in mind. Your completed fonts and generation history will be saved here.'}</p></div> : <div className={styles.fontGrid}>{visible.map(job => <article key={job.id} className={styles.job}>
      <span className={`${styles.badge} ${job.status === 'failed' ? styles.failed : job.status === 'succeeded' ? styles.ready : ''}`}>{jobLabels[job.status]}</span>
      <h3><button className={styles.jobTitle} onClick={() => setSelected(job.id)}>{job.name || 'Custom English font'}</button></h3><p className={styles.prompt}>{job.prompt}</p>
      {job.status === 'failed' && <p className={styles.failureSummary}>{jobFailure(job).title}. {job.credit_cost ? `${job.credit_cost} credits restored.` : 'Generation credits restored.'}</p>}
      {job.status === 'needs_review' && <p className={styles.failureSummary}>Your saved request needs a status check. Open details before trying again.</p>}
      {renderPreview(job)}
      {job.status === 'succeeded' && <div className={styles.jobActions}><button className={styles.button} disabled={busy} onClick={() => preview(job)}>Preview & create artwork</button><button className={styles.button} disabled={busy} onClick={() => download(job)}>Download TTF ↓</button></div>}
      <div className={styles.jobFooter}><span>{new Date(job.created_at).toLocaleDateString()} · {job.id.slice(0,8)}</span><button className={styles.detailLink} aria-label={`View details for ${job.name || 'Custom English font'}`} onClick={() => setSelected(job.id)}>View details →</button></div>
    </article>)}</div>}
    {selectedJob && <FontJobDetails job={selectedJob} close={() => setSelected(null)} />}
  </>;
}
