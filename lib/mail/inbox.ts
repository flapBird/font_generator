import 'server-only';

type DeliveryCode = 'DELIVERY_UNCERTAIN' | 'PERMANENT_CONFIGURATION' | 'PERMANENT_AUTHENTICATION'
  | 'PERMANENT_SENDER_UNAUTHORIZED' | 'PERMANENT_SENDER_NOT_FOUND' | 'PERMANENT_REJECTED' | 'RETRY_RATE_LIMIT';

export class InboxDeliveryError extends Error {
  constructor(public readonly code: DeliveryCode, public readonly status?: number) {
    super(code); this.name = 'InboxDeliveryError';
  }
}

type Recipients = string | string[];
export type InboxMessage = { to: Recipients; cc?: Recipients; bcc?: Recipients; subject: string; text?: string; html?: string };
const requiredSettings = ['INBOX_URL', 'INBOX_SEND_API_KEY', 'INBOX_FROM_EMAIL', 'INBOX_FROM_NAME'] as const;
const controls = /[\u0000-\u001f\u007f]/;
function email(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && !controls.test(value)
    && /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(value);
}
function recipients(value: unknown) {
  return Array.isArray(value) ? value.length > 0 && value.every(email) : email(value);
}

export function inboxAvailable() {
  return requiredSettings.every(name => Boolean(process.env[name]?.trim()));
}

export function inboxSettings() {
  try {
    if (!inboxAvailable()) throw new Error();
    const url = new URL(process.env.INBOX_URL!.trim());
    const from = { email: process.env.INBOX_FROM_EMAIL!.trim(), name: process.env.INBOX_FROM_NAME!.trim() };
    const token = process.env.INBOX_SEND_API_KEY!.trim();
    // Accept only a server-configured HTTPS origin; never follow credential-bearing redirects.
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/'
      || !email(from.email) || controls.test(from.name) || /\s|[\u0000-\u001f\u007f]/.test(token)) throw new Error();
    return { url: new URL('/api/v1/send', url), from, token };
  } catch {
    // URL parser errors can contain configuration values. Expose only a fixed code.
    throw new InboxDeliveryError('PERMANENT_CONFIGURATION');
  }
}

// The endpoint has no idempotency support. This function always makes at most one request.
export async function sendInboxMail(message: InboxMessage): Promise<string> {
  const settings = inboxSettings();
  const nonempty = (value: unknown) => typeof value === 'string' && Boolean(value.trim());
  if (!recipients(message.to) || (message.cc !== undefined && !recipients(message.cc))
    || (message.bcc !== undefined && !recipients(message.bcc))
    || !nonempty(message.subject) || controls.test(message.subject)
    || (message.text !== undefined && typeof message.text !== 'string')
    || (message.html !== undefined && typeof message.html !== 'string')
    || (!nonempty(message.text) && !nonempty(message.html))) {
    throw new InboxDeliveryError('PERMANENT_REJECTED');
  }
  const body = JSON.stringify({ from: settings.from, to: message.to, cc: message.cc, bcc: message.bcc,
    subject: message.subject, text: message.text, html: message.html });
  if (new TextEncoder().encode(body).byteLength > 20 * 1024 * 1024) throw new InboxDeliveryError('PERMANENT_REJECTED');

  let response: Response;
  try {
    response = await fetch(settings.url, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.token}` },
      body, cache: 'no-store', redirect: 'error', credentials: 'omit', signal: AbortSignal.timeout(35_000),
    });
  } catch { throw new InboxDeliveryError('DELIVERY_UNCERTAIN'); }

  if (response.status !== 202) {
    // Do not read or log upstream error bodies, which may echo message content.
    await response.body?.cancel().catch(() => undefined);
    const codes: Record<number, DeliveryCode> = {
      400: 'PERMANENT_REJECTED', 401: 'PERMANENT_AUTHENTICATION', 403: 'PERMANENT_SENDER_UNAUTHORIZED',
      404: 'PERMANENT_SENDER_NOT_FOUND', 413: 'PERMANENT_REJECTED', 429: 'RETRY_RATE_LIMIT',
      503: 'PERMANENT_CONFIGURATION',
    };
    throw new InboxDeliveryError(codes[response.status] || 'DELIVERY_UNCERTAIN', response.status);
  }

  // Bound the tiny acceptance receipt, including when Content-Length is absent.
  const reader = response.body?.getReader();
  try {
    if (!reader) throw new Error();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16 * 1024) throw new Error();
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (data?.status !== 'sent' || typeof data.id !== 'string' || !data.id.trim()
      || data.id.length > 200 || controls.test(data.id)) throw new Error();
    return data.id;
  } catch { throw new InboxDeliveryError('DELIVERY_UNCERTAIN', response.status); }
  finally { await reader?.cancel().catch(() => undefined); }
}
