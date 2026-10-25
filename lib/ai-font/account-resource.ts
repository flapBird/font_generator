'use client';

import type { FontJob } from './catalog';
import { authChangedEvent } from './auth-navigation';

export type AccountData = {
  user: { email?: string; displayName?: string; avatarUrl?: string | null; provider?: string; createdAt?: string; lastSignInAt?: string } | null;
  credits: number | null; billingRestricted?: boolean; billingUnavailable?: boolean; unavailableSections?: string[];
  jobs: FontJob[];
  orders: { id: string; provider: string; amount_minor: number; currency: string; credits: number; status: string; created_at: string }[];
  creditEvents?: { id: number; kind: string; delta: number; created_at: string }[];
  subscriptions?: { id: string; plan_id: string; status: string; billing_interval: string; credits_per_period: number; current_period_end: string | null; cancel_requested_at: string | null }[];
  services: { auth: boolean; generation: boolean; checkout: boolean; sandbox: boolean; provider?: 'paypal' | 'waffo' };
};
type Snapshot = { account: AccountData | null; loading: boolean; error: string };
const empty: Snapshot = { account: null, loading: false, error: '' };
let snapshot = empty, expires = 0, epoch = 0;
let pending: Promise<AccountData> | null = null;
let controller: AbortController | null = null;
let listening = false;
const listeners = new Set<() => void>();
function publish(value: Snapshot) { snapshot = value; listeners.forEach(listener => listener()); }
function invalidate() {
  epoch++; expires = 0; pending = null; controller?.abort(); controller = null;
  publish(empty);
  if (listeners.size) void fetchAccount().catch(() => {});
}
function listen() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener(authChangedEvent, invalidate);
  window.addEventListener('focus', invalidate);
  window.addEventListener('pageshow', event => { if (event.persisted) invalidate(); });
}

// Memory only: no private account records in localStorage, sessionStorage or CDN caches.
// Authentication changes/focus clear old data; late responses cannot restore it.
export function fetchAccount(force = false): Promise<AccountData> {
  listen();
  if (force && pending) { epoch++; controller?.abort(); pending = null; }
  if (pending) return pending;
  if (!force && snapshot.account && Date.now() < expires) return Promise.resolve(snapshot.account);
  const requestEpoch = ++epoch;
  controller = new AbortController();
  const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]);
  publish({ ...snapshot, loading: true, error: '' });
  pending = (async () => {
    try {
      const response = await fetch('/api/ai-font/account', { credentials: 'same-origin', cache: 'no-store', signal });
      if (!response.ok) throw new Error();
      const data = await response.json() as AccountData;
      if (requestEpoch !== epoch) return pending || snapshot.account || fetchAccount();
      if (requestEpoch === epoch) { expires = Date.now() + 15000; publish({ account: data, loading: false, error: '' }); }
      return data;
    } catch (error) {
      if (requestEpoch !== epoch) return pending || snapshot.account || fetchAccount();
      const message = signal.aborted ? 'Your account is taking longer than expected. Please try again.' : 'Your account could not load. Please try again.';
      if (requestEpoch === epoch) publish({ ...snapshot, loading: false, error: message });
      throw new Error(message, { cause: error });
    } finally { if (requestEpoch === epoch) { pending = null; controller = null; } }
  })();
  return pending;
}
export function refreshAccount() { return fetchAccount(true); }
function subscribe(listener: () => void) { listeners.add(listener); listen(); return () => { listeners.delete(listener); }; }
export const accountResource = { subscribe, getSnapshot: () => snapshot, getServerSnapshot: () => empty };
