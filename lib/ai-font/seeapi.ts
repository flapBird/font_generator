import 'server-only';
import { requiredEnv } from './config';

export type ModerationKind = 'text' | 'image';
export type ModerationOutcome = {
  taskId: string;
  status: 'pending' | 'passed' | 'blocked' | 'failed';
  consumedCredits: number | null;
};

/** Only sanitized, actionable metadata crosses the provider boundary. */
export class SeeApiError extends Error {
  constructor(public readonly retryable = false, public readonly retryAfterSeconds: number | null = null, public readonly httpStatus: number | null = null, public readonly code: 'INVALID_RESPONSE' | 'HTTP_ERROR' | 'TRANSPORT_ERROR' = 'INVALID_RESPONSE', public readonly submissionRejected = false) {
    super('Content moderation is temporarily unavailable. Please try again later.');
    this.name = 'SeeApiError';
  }
}

const API = 'https://api.seeapi.com/v1/inferences';
const MAX_RESPONSE_BYTES = 64 * 1024;
const MAX_IMAGE_BYTES = 16 * 1024 * 1024;
const TEXT_CATEGORIES = ['sexual_explicit', 'sexual_suggestive', 'sexual_minors', 'violence', 'hate', 'harassment', 'self_harm'] as const;
const IDENTITIES = {
  text: { model: 'text-nsfw-filter', endpoint: 'text-moderation' },
  image: { model: 'nsfw-filter-2', endpoint: 'image-moderation' },
} as const;
const validTaskId = (value: unknown): value is string => typeof value === 'string' && /^task_[A-Za-z0-9_-]{1,240}$/.test(value);
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const number = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const invalid = (): never => { throw new SeeApiError(); };

function parseOutcome(kind: ModerationKind, value: unknown, expectedId?: string): ModerationOutcome {
  if (!record(value)) return invalid();
  const identity = IDENTITIES[kind];
  if (!validTaskId(value.id) || (expectedId !== undefined && value.id !== expectedId) || value.object !== 'inference'
    || value.model !== identity.model || value.endpoint !== identity.endpoint || value.provider !== 'seeapi') return invalid();
  if (!Object.hasOwn(value, 'result') || !Object.hasOwn(value, 'error')) return invalid();
  const consumedCredits = value.consumed_credits === undefined ? null : value.consumed_credits;
  if (consumedCredits !== null && (!number(consumedCredits) || consumedCredits < 0)) return invalid();
  if (kind === 'image' && consumedCredits === null) return invalid();
  // An error is a provider execution failure, never a clean content assessment.
  if (value.error !== null && (!record(value.error) || typeof value.error.code !== 'string' || typeof value.error.message !== 'string')) return invalid();
  const outcome = { taskId: value.id, consumedCredits };
  if (['failed', 'canceled', 'refunded', 'expired'].includes(String(value.status))) return { ...outcome, status: 'failed' };
  if (!['queued', 'processing', 'succeeded'].includes(String(value.status))) return invalid();
  if (value.error !== null) return { ...outcome, status: 'failed' };
  if (value.status === 'queued' || value.status === 'processing') {
    if (value.result !== null) return invalid();
    return { ...outcome, status: 'pending' };
  }
  if (!record(value.result) || value.result.type !== 'json' || !record(value.result.data)) return invalid();
  const data = value.result.data;
  if (typeof data.flagged !== 'boolean' || !record(data.categories)) return invalid();
  if (kind === 'text') {
    if (data.threshold !== 0.3) return invalid();
    let categoryFlagged = false;
    for (const category of TEXT_CATEGORIES) {
      const assessment = data.categories[category];
      if (!record(assessment) || typeof assessment.flagged !== 'boolean' || !number(assessment.score) || assessment.score < 0 || assessment.score > 1) return invalid();
      categoryFlagged ||= assessment.flagged;
    }
    // Respect provider verdicts; do not recalculate them from scores.
    if (data.flagged !== categoryFlagged) return invalid();
    return { ...outcome, status: data.flagged ? 'blocked' : 'passed' };
  }
  const { nsfw, special_care: specialCare } = data.categories;
  if (!Array.isArray(nsfw) || !nsfw.every((label) => typeof label === 'string' && ['nudity', 'sexual_activity', 'sexual_suggestive'].includes(label))
    || !Array.isArray(specialCare) || !specialCare.every((label) => label === 'sexual_minors')) return invalid();
  // Retain the strict special-care policy even if a provider verdict is inconsistent.
  return { ...outcome, status: data.flagged || nsfw.length > 0 || specialCare.length > 0 ? 'blocked' : 'passed' };
}

function retryAfter(response: Response): number | null {
  const raw = response.headers.get('retry-after');
  if (!raw) return null;
  const seconds = /^\d+$/.test(raw) ? Number(raw) : Math.ceil((Date.parse(raw) - Date.now()) / 1000);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.min(seconds, 300) : null;
}

async function readJson(response: Response): Promise<unknown> {
  const length = response.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_RESPONSE_BYTES)) {
    await response.body?.cancel();
    return invalid();
  }
  if (!response.headers.get('content-type')?.toLowerCase().split(';')[0].trim().endsWith('/json') || !response.body) return invalid();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        return invalid();
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

async function request(kind: ModerationKind, path: string, init: RequestInit, expectedId?: string): Promise<ModerationOutcome> {
  const key = requiredEnv('SEEAPI_API_KEY');
  try {
    const response = await fetch(API + path, {
      ...init, headers: { ...init.headers, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      // Workers rejects redirect: 'error' before sending. Manual mode keeps
      // credentials on this host; the status check below rejects every 3xx.
      cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(15000),
    });
    if (response.status !== 200 && response.status !== 202) {
      const error = new SeeApiError(response.status === 429 || response.status >= 500, retryAfter(response), response.status, 'HTTP_ERROR', init.method === 'POST' && [400, 401, 402, 403, 404, 422].includes(response.status));
      await response.body?.cancel();
      throw error;
    }
    return parseOutcome(kind, await readJson(response), expectedId);
  } catch (error) {
    if (error instanceof SeeApiError) throw error;
    // A timed-out POST may have been accepted. The caller must reuse its stored key.
    throw new SeeApiError(true, null, null, 'TRANSPORT_ERROR');
  }
}

export async function submitModeration(kind: ModerationKind, input: string, idempotencyKey: string): Promise<ModerationOutcome> {
  if (!Object.hasOwn(IDENTITIES, kind) || typeof input !== 'string' || typeof idempotencyKey !== 'string' || !/^[\x21-\x7e]{1,255}$/.test(idempotencyKey)) return invalid();
  if (kind === 'text') {
    if (!input.trim() || input.length > 20000) return invalid();
  } else {
    const prefix = 'data:image/png;base64,';
    if (!input.startsWith(prefix) || input.length > prefix.length + Math.ceil(MAX_IMAGE_BYTES / 3) * 4) return invalid();
    const base64 = input.slice(prefix.length);
    if (!base64 || base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) return invalid();
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    if ((base64.length / 4) * 3 - padding > MAX_IMAGE_BYTES) return invalid();
  }
  return request(kind, '', {
    method: 'POST', headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ ...IDENTITIES[kind], provider: 'seeapi', input: kind === 'text'
      ? { text: input, threshold: 0.3, categories: TEXT_CATEGORIES }
      : { image_url: input, threshold: 0.5, strict_special_care: true } }),
  });
}

export async function pollModeration(kind: ModerationKind, taskId: string): Promise<ModerationOutcome> {
  if (!Object.hasOwn(IDENTITIES, kind) || !validTaskId(taskId)) return invalid();
  return request(kind, `/${encodeURIComponent(taskId)}`, { method: 'GET' }, taskId);
}
