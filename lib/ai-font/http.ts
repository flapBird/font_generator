import 'server-only';
import { NextResponse } from 'next/server';
import { appOrigin, availability } from './config';
import { authClient } from './supabase';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } });
}

export async function endpoint(action: () => Promise<Response>) {
  try { return await action(); } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    // Never put upstream response bodies, tokens, prompts, or account data in logs.
    console.error('[ai-font] Request failed:', error instanceof Error ? error.name : 'UnknownError');
    return json({ error: 'The request could not be completed. Please try again.' }, 503);
  }
}

export function sameOrigin(request: Request) {
  if (request.headers.get('origin') !== appOrigin()) throw new HttpError(403, 'Please use this feature from our website.');
}

export async function body(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new HttpError(415, 'JSON required.');
  const text = await request.text();
  if (text.length > 4096) throw new HttpError(413, 'Request too large.');
  try {
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
    return data;
  } catch { throw new HttpError(400, 'Invalid request.'); }
}

export async function requireUser() {
  if (!availability().auth) throw new HttpError(503, 'Sign-in is not available yet.');
  const client = await authClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new HttpError(401, 'Sign in with Google to continue.');
  return user;
}
