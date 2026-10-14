import 'server-only';
import { requiredEnv } from './config';
import type { TransactionalMessage } from './notifications';

export class FreemailDeliveryError extends Error {
  constructor(public code: 'DELIVERY_UNCERTAIN' | 'PERMANENT_CONFIGURATION' | 'PERMANENT_REJECTED' | 'RETRY_RATE_LIMIT') {
    super(code); this.name = 'FreemailDeliveryError';
  }
}

// Opt in only after confirming the deployed bridge implements this documented
// Freemail contract. The site never holds Mailjet credentials or calls Mailjet.
export function freemailAvailable() {
  return process.env.FREEMAIL_API_CONTRACT === 'idinging-send-v1'
    && ['FREEMAIL_API_URL', 'FREEMAIL_API_TOKEN', 'FREEMAIL_FROM_EMAIL'].every(name => Boolean(process.env[name]?.trim()));
}

function email(value: string) { return /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value) && value.length <= 254; }

export function freemailSettings() {
  if (!freemailAvailable()) throw new FreemailDeliveryError('PERMANENT_CONFIGURATION');
  const url = new URL(requiredEnv('FREEMAIL_API_URL'));
  const local = process.env.NODE_ENV !== 'production' && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
  const from = requiredEnv('FREEMAIL_FROM_EMAIL');
  if ((!local && url.protocol !== 'https:') || url.username || url.password || url.search || url.hash || !email(from)) {
    throw new FreemailDeliveryError('PERMANENT_CONFIGURATION');
  }
  return { url, from, token: requiredEnv('FREEMAIL_API_TOKEN'), fromName: process.env.FREEMAIL_FROM_NAME?.trim() || 'Font Generators' };
}

// Freemail docs/api.md: POST /api/send with Bearer authentication, response
// {success:true,id,provider}. This upstream contract has no idempotency key.
export async function sendFreemail(message: TransactionalMessage): Promise<string> {
  const settings = freemailSettings();
  if (!email(message.to)) throw new FreemailDeliveryError('PERMANENT_REJECTED');
  let response: Response;
  try {
    response = await fetch(settings.url, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.token}` },
      body: JSON.stringify({ from: settings.from, fromName: settings.fromName, to: message.to, subject: message.subject, text: message.text }),
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000),
    });
  } catch { throw new FreemailDeliveryError('DELIVERY_UNCERTAIN'); }
  if (response.status === 429) throw new FreemailDeliveryError('RETRY_RATE_LIMIT');
  if ([400, 401, 403, 404, 405, 413, 415, 422].includes(response.status)) throw new FreemailDeliveryError('PERMANENT_REJECTED');
  // A 5xx, timeout or malformed successful response might follow acceptance.
  // Without upstream deduplication, hold it for review rather than resend.
  if (!response.ok) throw new FreemailDeliveryError('DELIVERY_UNCERTAIN');
  try {
    const data = await response.json();
    const id = typeof data.id === 'number' && Number.isSafeInteger(data.id) ? String(data.id) : data.id;
    if (data.success !== true || typeof id !== 'string' || !id || id.length > 200) throw new Error();
    return id;
  } catch { throw new FreemailDeliveryError('DELIVERY_UNCERTAIN'); }
}
