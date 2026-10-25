import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { requiredEnv } from './config';

// Only called in this module's route handlers, where refreshed cookies can be
// written. No global auth middleware or dynamic root layout is necessary.
export async function authClient(signal?: AbortSignal) {
  const jar = await cookies();
  return createServerClient(requiredEnv('NEXT_PUBLIC_SUPABASE_URL'), requiredEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'), {
    ...(signal ? { global: { fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([init.signal, signal]) : signal }) } } : {}),
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => values.forEach(({ name, value, options }) => jar.set(name, value, options)),
    },
  });
}

export function adminClient() {
  return createClient(requiredEnv('NEXT_PUBLIC_SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
