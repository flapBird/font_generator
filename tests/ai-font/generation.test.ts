import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { reconcileJob, reconcileJobs } from '../../lib/ai-font/generation';

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

test('only a validated, successfully stored font completes delivery; invalid fonts restore credits', async (context) => {
  const fixture = readFileSync('tests/ai-font/fixtures/mixfont-standard.ttf');
  const originalFetch = globalThis.fetch;
  const keys = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'MIXFONT_API_KEY'] as const;
  const values = keys.map((key) => process.env[key]);
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  process.env.MIXFONT_API_KEY = 'test-mixfont-key';
  context.after(() => {
    globalThis.fetch = originalFetch;
    keys.forEach((key, index) => { if (values[index] === undefined) delete process.env[key]; else process.env[key] = values[index]; });
  });
  for (const scenario of ['valid', 'invalid', 'oversized', 'stream-oversized', 'download-error', 'storage-error'] as const) {
    await context.test(scenario, async () => {
      const events: string[] = [];
      const job = { id: 'test-job', user_id: 'test-user', prompt: 'A playful font', name: null, status: 'processing' as const, external_id: 'provider-id', storage_path: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      globalThis.fetch = async (input, init) => {
        const request = new Request(input, init);
        const url = new URL(request.url);
        if (url.hostname === 'api.mixfont.com') {
          events.push('poll');
          return Response.json({ id: job.external_id, status: 'succeeded', ttf_url: 'https://static.mixfont.com/test.ttf', name: 'Sample font' });
        }
        if (url.hostname === 'static.mixfont.com') {
          events.push('download');
          if (scenario === 'download-error') return new Response(null, { status: 503 });
          if (scenario === 'invalid') return new Response(fixture.subarray(0, 12));
          if (scenario === 'oversized') return new Response('too big', { headers: { 'Content-Length': String(21 * 1024 * 1024) } });
          if (scenario === 'stream-oversized') return new Response(new Uint8Array(20 * 1024 * 1024 + 1));
          return new Response(fixture);
        }
        assert.equal(url.hostname, 'example.supabase.co');
        if (url.pathname === '/storage/v1/object/ai-fonts/test-user/test-job.ttf') {
          events.push('upload');
          assert.deepEqual(Buffer.from(await request.arrayBuffer()), fixture, 'Persist the original validated bytes');
          assert.equal(request.headers.get('content-type'), 'font/ttf');
          return scenario === 'storage-error' ? Response.json({ message: 'Unavailable' }, { status: 503 }) : Response.json({ Key: 'ai-fonts/test-user/test-job.ttf' });
        }
        assert.equal(url.pathname, '/rest/v1/rpc/ai_font_finish_job');
        const body = await request.json();
        events.push(body.p_status);
        assert.equal(body.p_id, job.id);
        assert.equal(body.p_path, scenario === 'valid' ? 'test-user/test-job.ttf' : null);
        return Response.json(null);
      };
      if (scenario === 'download-error' || scenario === 'storage-error') {
        await assert.rejects(reconcileJob(job));
        assert.deepEqual(events, ['poll', 'download', ...(scenario === 'storage-error' ? ['upload'] : [])]);
      } else {
        await reconcileJob(job);
        assert.deepEqual(events, ['poll', 'download', ...(scenario === 'valid' ? ['upload', 'succeeded'] : ['failed'])]);
      }
    });
  }
});
