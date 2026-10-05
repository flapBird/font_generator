import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconcileJobs } from '../../lib/ai-font/generation';

test('reconciliation bounds provider concurrency and continues after a failed job', async () => {
  const originalFetch = globalThis.fetch;
  const keys = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'MIXFONT_API_KEY'] as const;
  const originalEnv = keys.map((key) => process.env[key]);
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  process.env.MIXFONT_API_KEY = 'test-mixfont-key';
  let active = 0;
  let peak = 0;
  const visited: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.hostname === 'example.supabase.co' && url.pathname === '/rest/v1/ai_font_jobs') {
      assert.equal(url.searchParams.get('limit'), '10');
      return Response.json(['first', 'failed', 'last'].map((id) => ({
        id, user_id: 'test-user', status: 'processing', external_id: id,
        updated_at: new Date().toISOString(),
      })));
    }
    assert.equal(url.hostname, 'api.mixfont.com');
    const id = url.pathname.split('/').at(-1)!;
    visited.push(id);
    active++;
    peak = Math.max(peak, active);
    await new Promise<void>((resolve) => setImmediate(resolve));
    active--;
    if (id === 'failed') return new Response(null, { status: 503 });
    return Response.json({ id, status: 'processing' });
  };
  try {
    assert.deepEqual(await reconcileJobs(), { checked: 3, errors: 1 });
    assert.equal(peak, 1, 'Large downloads must not run concurrently within a batch');
    assert.deepEqual(visited, ['first', 'failed', 'last']);
  } finally {
    globalThis.fetch = originalFetch;
    keys.forEach((key, index) => {
      if (originalEnv[index] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[index];
    });
  }
});
