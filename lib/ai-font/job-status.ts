import type { FontJob } from './catalog';

export const jobLabels: Record<FontJob['status'], string> = {
  reserved: 'Queued', starting: 'Starting', processing: 'Generating & reviewing',
  needs_review: 'Needs review', succeeded: 'Ready', failed: 'Failed · credits restored',
};

export const failureReasons = {
  service_unavailable: { title: 'Generation service unavailable', message: 'The font service could not start this generation. This is a service issue; your description was not flagged.', next: 'Please try again later. If this keeps happening, contact support with the task reference.' },
  service_busy: { title: 'Generation service is busy', message: 'The font service could not accept another generation at that time.', next: 'Wait a little before starting a new generation.' },
  request_rejected: { title: 'Generation request not accepted', message: 'The font service could not accept this request.', next: 'Review your description before trying again, or contact support for help.' },
  generation_failed: { title: 'Font generation did not complete', message: 'The font service reported that this generation could not finish.', next: 'You can review your description and start a new generation when you are ready.' },
  output_invalid: { title: 'Font file could not be delivered', message: 'The generated file did not pass our font integrity checks.', next: 'Contact support if this happens again. An incomplete font will not be offered for download.' },
  output_blocked: { title: 'Generated font did not pass safety review', message: 'The generated glyph artwork was not approved for delivery. This does not mean your original description was flagged.', next: 'Try a different description, or contact support if you believe this was a mistake.' },
  review_failed: { title: 'Output review could not complete', message: 'We could not complete the required safety checks for the generated font.', next: 'Please try again later, or contact support with the task reference.' },
};
export type JobFailureCode = keyof typeof failureReasons;
export function jobFailure(job: FontJob) {
  return job.failure_code && Object.hasOwn(failureReasons, job.failure_code)
    ? failureReasons[job.failure_code as JobFailureCode]
    : { title: 'This generation did not complete', message: 'A detailed reason was not recorded for this task.', next: 'Contact support with the task reference if you would like us to investigate.' };
}
