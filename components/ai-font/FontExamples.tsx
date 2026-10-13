'use client';

import { FONT_SAMPLES } from '@/lib/ai-font/catalog';
import styles from './AiFontStudio.module.css';

type Sample = (typeof FONT_SAMPLES)[number];
const examples = [
  { sample: FONT_SAMPLES[0], title: 'Give your brand a voice', copy: 'Describe the shapes and character you want for packaging, playful headlines or a wordmark.', text: 'good morning', font: 'Luckiest Guy', tone: 'playful' },
  { sample: FONT_SAMPLES[1], title: 'Set the tone for your next story', copy: 'Create a distinctive serif or display font for book covers, magazine titles and editorial projects.', text: 'Quiet Stories', font: 'EB Garamond', tone: 'editorial' },
] as const;

export default function FontExamples({ onUsePrompt }: { onUsePrompt: (sample: Sample) => void }) {
  return <section className={styles.examples} aria-labelledby="examples-title">
    <header className={styles.sectionHeading}>
      <h2 id="examples-title">From an idea to a typeface</h2>
      <p>Style references shown below, not AI-generated results. Your custom font will differ.</p>
    </header>
    <div className={styles.exampleRows}>
      {examples.map(({ sample, title, copy, text, font, tone }) => <article className={styles.exampleRow} key={sample.id}>
        <div className={styles.exampleCopy}>
          <h3>{title}</h3>
          <p>{copy}</p>
          <button onClick={() => onUsePrompt(sample)} aria-label={`Use ${sample.name.toLowerCase()} prompt`}>Use this prompt</button>
        </div>
        <div className={styles.exampleSpecimen} data-tone={tone}>
          <p className={styles.examplePrompt}>{sample.prompt}</p>
          <p className={styles.exampleWords} style={{ fontFamily: sample.family }}>{text}</p>
          <div className={styles.exampleFoot}><span aria-hidden="true">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />0123456789</span><span>Reference: {font}</span></div>
        </div>
      </article>)}
    </div>
  </section>;
}
