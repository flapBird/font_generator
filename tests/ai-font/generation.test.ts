import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { reconcileJob, reconcileJobs } from '../../lib/ai-font/generation';
import { reviewHash } from '../../lib/ai-font/moderation';

const fixture = readFileSync('tests/ai-font/fixtures/mixfont-standard.ttf');
const envKeys = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'MIXFONT_API_KEY', 'SEEAPI_API_KEY'] as const;
function configure(context: TestContext, fetcher: typeof fetch) {
  const fetch = globalThis.fetch, values = envKeys.map((key) => process.env[key]);
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  process.env.MIXFONT_API_KEY = 'test-mixfont-key';
  process.env.SEEAPI_API_KEY = 'test-seeapi-key';
  globalThis.fetch = fetcher;
  context.after(() => {
    globalThis.fetch = fetch;
    envKeys.forEach((key, index) => { if (values[index] === undefined) delete process.env[key]; else process.env[key] = values[index]; });
  });
}

type StoredJob = Parameters<typeof reconcileJob>[0];
type Check = { id: string; stage: string; input_hash: string; asset_hash: string; status: string; provider_task_id: string | null };
type Scenario = 'valid' | 'invalid' | 'oversized' | 'stream-oversized' | 'download-error' | 'download-redirect' | 'storage-error' | 'partial-storage' | 'bind-error' | 'stage-read-error' | 'blocked' | 'immediate-blocked' | 'malformed' | 'provider-error';

function pipeline(context: TestContext, scenario: Scenario = 'valid') {
  const job: StoredJob = {
    id: 'test-job', user_id: 'test-user', prompt: 'A playful font', name: null,
    status: 'processing', external_id: 'provider-id', storage_path: null,
    output_hash: null, review_page_count: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  };
  const events: string[] = [], uploads: string[] = [], providerRequests: { method: string; id: string | null }[] = [];
  const objects = new Map<string, Buffer>(), checks = new Map<string, Check>();
  const finished: string[] = [];
  let stageFailure = false, expiredVendor = false;
  configure(context, async (input, init) => {
    const request = new Request(input, init), url = new URL(request.url);
    if (url.hostname === 'api.mixfont.com') {
      events.push('mixfont-poll');
      if (expiredVendor) return new Response(null, { status: 410 });
      return Response.json({ id: job.external_id, status: 'succeeded', ttf_url: 'https://static.mixfont.com/test.ttf', name: 'Sample font' });
    }
    if (url.hostname === 'static.mixfont.com') {
      events.push('font-download');
      assert.equal(request.redirect, 'manual');
      if (expiredVendor) return new Response(null, { status: 410 });
      if (scenario === 'download-error') return new Response(null, { status: 503 });
      if (scenario === 'download-redirect') return new Response(null, { status: 302, headers: { Location: 'https://untrusted.example/font.ttf' } });
      if (scenario === 'invalid') return new Response(fixture.subarray(0, 12));
      if (scenario === 'oversized') return new Response('too big', { headers: { 'Content-Length': String(21 * 1024 * 1024) } });
      if (scenario === 'stream-oversized') return new Response(new Uint8Array(20 * 1024 * 1024 + 1));
      return new Response(fixture);
    }
    if (url.hostname === 'api.seeapi.com') {
      const post = request.method === 'POST';
      const id = post ? `task_page-${providerRequests.filter((entry) => entry.method === 'POST').length}` : url.pathname.split('/').at(-1)!;
      providerRequests.push({ method: request.method, id: request.headers.get('Idempotency-Key') });
      events.push(`review-${request.method}`);
      if (post) {
        const payload = await request.json();
        assert.equal(payload.model, 'nsfw-filter-2');
        assert.equal(payload.input.strict_special_care, true);
        const bytes = Buffer.from(payload.input.image_url.split(',')[1], 'base64');
        assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
        assert.equal(bytes.readUInt32BE(16), 1024);
        assert.equal(bytes.readUInt32BE(20), 1024);
        assert.equal(objects.size, 7, 'Durably stage the TTF and quarantine the font plus all five specimen pages before paying for review');
      }
      if (!post && scenario === 'provider-error') return new Response(null, { status: 503 });
      const pending = post && scenario !== 'immediate-blocked';
      const blocked = scenario === 'blocked' || scenario === 'immediate-blocked';
      return Response.json({
        id, object: 'inference', model: 'nsfw-filter-2', endpoint: 'image-moderation', provider: 'seeapi',
        status: pending ? 'processing' : 'succeeded', consumed_credits: pending ? 0 : 0.01, error: null,
        result: pending || scenario === 'malformed' ? null : { type: 'json', data: {
          flagged: blocked, categories: { nsfw: blocked ? ['nudity'] : [], special_care: [] },
        } },
      }, { status: pending ? 202 : 200 });
    }
    assert.equal(url.hostname, 'example.supabase.co');
    if (url.pathname.startsWith('/storage/v1/object/')) {
      const path = decodeURIComponent(url.pathname.slice('/storage/v1/object/'.length));
      if (request.method === 'GET') {
        if (scenario === 'stage-read-error' && path.endsWith('/staged.ttf')) return Response.json({ message: 'Temporarily unavailable' }, { status: 503 });
        if (!objects.has(path)) return Response.json({ statusCode: '404', error: 'NotFound', message: 'Object not found' }, { status: 404 });
        return new Response(new Uint8Array(objects.get(path)!), { headers: { 'Content-Type': path.endsWith('.png') ? 'image/png' : 'font/ttf' } });
      }
      if (request.method === 'DELETE') {
        const body = await request.json();
        for (const prefix of body.prefixes) objects.delete(`${path}/${prefix}`);
        return Response.json([]);
      }
      uploads.push(path);
      if (scenario === 'storage-error') return Response.json({ message: 'Unavailable' }, { status: 503 });
      if (scenario === 'partial-storage' && path.endsWith('/1.png') && !stageFailure) {
        stageFailure = true; return Response.json({ message: 'Upload interrupted' }, { status: 503 });
      }
      if (path.endsWith('/staged.ttf')) {
        assert.equal(request.headers.get('x-upsert'), 'false', 'The durable recovery source must remain immutable');
        if (objects.has(path)) return Response.json({ statusCode: '409', error: 'Duplicate', message: 'The resource already exists' }, { status: 409 });
      }
      const bytes = Buffer.from(await request.arrayBuffer());
      objects.set(path, bytes);
      if (path.startsWith('ai-fonts/')) {
        assert.deepEqual(bytes, fixture, 'Final delivery must use the reviewed TTF bytes');
        assert.equal(checks.size, 5);
        assert.ok([...checks.values()].every((check) => check.status === 'passed'));
      }
      return Response.json({ Key: path });
    }
    if (url.pathname === '/rest/v1/ai_font_jobs') {
      if (request.method === 'PATCH') { Object.assign(job, await request.json()); return Response.json(null); }
      return Response.json({ output_hash: job.output_hash, review_page_count: job.review_page_count });
    }
    if (url.pathname === '/rest/v1/ai_font_moderation_checks') return Response.json([...checks.values()]);
    const body = await request.json();
    if (url.pathname.endsWith('/ai_font_bind_review')) {
      if (scenario === 'bind-error' && !stageFailure) {
        stageFailure = true; return Response.json({ code: 'database_unavailable', message: 'Connection lost' }, { status: 503 });
      }
      events.push('bind'); job.output_hash = body.p_hash; job.review_page_count = body.p_pages;
      assert.equal(job.output_hash, reviewHash(fixture)); assert.equal(job.review_page_count, 5);
      return Response.json(true);
    }
    if (url.pathname.endsWith('/ai_font_prepare_moderation')) {
      events.push('prepare');
      let check = checks.get(body.p_stage);
      if (!check) {
        check = { id: `review-${checks.size}`, stage: body.p_stage, status: 'pending', input_hash: body.p_input_hash, asset_hash: body.p_asset_hash, provider_task_id: null };
        checks.set(check.stage, check);
      }
      assert.equal(body.p_asset_hash, job.output_hash);
      return Response.json({ ...check, claim_token: check.status === 'pending' ? 'claim-token' : null });
    }
    if (url.pathname.endsWith('/ai_font_finish_moderation')) {
      const check = [...checks.values()].find((value) => value.id === body.p_id)!;
      assert.ok(check); assert.equal(body.p_token, 'claim-token');
      check.status = body.p_status === 'retry' ? 'pending' : body.p_status;
      check.provider_task_id = body.p_task_id ?? check.provider_task_id;
      return Response.json(true);
    }
    assert.equal(url.pathname, '/rest/v1/rpc/ai_font_finish_job');
    assert.equal(body.p_id, job.id);
    finished.push(body.p_status); job.status = body.p_status;
    assert.equal(body.p_path, body.p_status === 'succeeded' ? 'test-user/test-job.ttf' : null);
    return Response.json(null);
  });
  return { job, events, uploads, objects, checks, finished, providerRequests, expireVendor: () => { expiredVendor = true; }, run: () => reconcileJob({ ...job }) };
}

test('reconciliation bounds provider concurrency and continues after a failed job', async () => {
  const originalFetch = globalThis.fetch;
  const keys = envKeys;
  const originalEnv = keys.map((key) => process.env[key]);
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  process.env.MIXFONT_API_KEY = 'test-mixfont-key';
  process.env.SEEAPI_API_KEY = 'test-seeapi-key';
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
    if (url.hostname === 'example.supabase.co' && url.pathname.startsWith('/storage/v1/object/ai-font-review/')) {
      return Response.json({ statusCode: '404', error: 'NotFound', message: 'Object not found' }, { status: 404 });
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

test('invalid font downloads fail without moderation; transient download/storage errors remain recoverable', async (context) => {
  for (const scenario of ['invalid', 'oversized', 'stream-oversized', 'download-error', 'download-redirect', 'storage-error'] as const) {
    await context.test(scenario, async (child) => {
      const state = pipeline(child, scenario);
      if (scenario === 'download-error' || scenario === 'download-redirect' || scenario === 'storage-error') {
        await assert.rejects(state.run());
        assert.deepEqual(state.finished, []);
      } else {
        await state.run();
        assert.deepEqual(state.finished, ['failed']);
      }
      assert.deepEqual(state.providerRequests, []);
      assert.ok(!state.uploads.some((path) => path.startsWith('ai-fonts/')));
    });
  }
});

test('all five specimen pages resume durable task polling before the identical TTF is delivered', async (context) => {
  const state = pipeline(context);
  await state.run();
  assert.deepEqual(state.finished, []);
  assert.equal(state.job.output_hash, reviewHash(fixture));
  assert.equal(state.uploads.length, 7);
  assert.deepEqual(state.events.slice(0, 5), ['mixfont-poll', 'font-download', 'bind', 'prepare', 'review-POST']);
  for (let attempt = 0; attempt < 9; attempt++) await state.run();
  assert.deepEqual(state.finished, ['succeeded']);
  assert.equal(state.events.filter((event) => event === 'mixfont-poll').length, 1);
  assert.equal(state.events.filter((event) => event === 'font-download').length, 1);
  assert.deepEqual(state.providerRequests.map((request) => request.method), Array.from({ length: 5 }, () => ['POST', 'GET']).flat());
  assert.equal(new Set(state.providerRequests.filter((request) => request.method === 'POST').map((request) => request.id)).size, 5);
  assert.deepEqual(state.objects.get('ai-fonts/test-user/test-job.ttf'), fixture);
  assert.equal(state.objects.size, 1, 'Quarantine should be cleaned after successful delivery');
  await state.run();
  assert.deepEqual(state.finished, ['succeeded']);
});

test('flagged output stops delivery and invokes the atomic failure/refund only once', async (context) => {
  const state = pipeline(context, 'blocked');
  await state.run(); await state.run(); await state.run();
  assert.deepEqual(state.finished, ['failed']);
  assert.equal(state.providerRequests.length, 2);
  assert.ok(!state.uploads.some((path) => path.startsWith('ai-fonts/')));
});

test('an immediate first-page block cleans the newly bound quarantine without publishing a font', async (context) => {
  const state = pipeline(context, 'immediate-blocked');
  await state.run();
  assert.deepEqual(state.finished, ['failed']);
  assert.equal(state.providerRequests.length, 1);
  assert.equal(state.uploads.length, 7);
  assert.equal(state.objects.size, 0, 'The first invocation must reload its newly persisted binding before cleanup');
});

test('null/malformed completed assessments and temporary provider errors never deliver or discard accepted task IDs', async (context) => {
  for (const scenario of ['malformed', 'provider-error'] as const) await context.test(scenario, async (child) => {
    const state = pipeline(child, scenario);
    await state.run();
    const task = state.checks.get('output:0')!.provider_task_id;
    await assert.rejects(state.run());
    await assert.rejects(state.run());
    assert.equal(state.checks.get('output:0')!.provider_task_id, task);
    assert.deepEqual(state.providerRequests.map((entry) => entry.method), ['POST', 'GET', 'GET']);
    assert.deepEqual(state.finished, []);
    assert.ok(!state.uploads.some((path) => path.startsWith('ai-fonts/')));
  });
});

test('changed quarantined TTF cannot be delivered using previously bound approvals', async (context) => {
  const state = pipeline(context);
  for (let attempt = 0; attempt < 9; attempt++) await state.run();
  state.objects.set(`ai-font-review/test-user/test-job/${state.job.output_hash}/font.ttf`, Buffer.from('replacement bytes'));
  await assert.rejects(state.run(), /Review asset changed/);
  assert.deepEqual(state.finished, []);
  assert.ok(!state.uploads.some((path) => path.startsWith('ai-fonts/')));
});

test('partial specimen upload or binding failure resumes staged bytes even after vendor URLs expire', async (context) => {
  for (const scenario of ['partial-storage', 'bind-error'] as const) await context.test(scenario, async (child) => {
    const state = pipeline(child, scenario);
    await assert.rejects(state.run());
    assert.equal(state.job.output_hash, null, 'Failure happened before an output binding was recorded');
    assert.deepEqual(state.objects.get('ai-font-review/test-user/test-job/staged.ttf'), fixture);
    assert.deepEqual(state.finished, []);
    assert.deepEqual(state.providerRequests, []);
    state.job.updated_at = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    state.expireVendor();
    for (let attempt = 0; attempt < 10; attempt++) await state.run();
    assert.deepEqual(state.finished, ['succeeded']);
    assert.equal(state.events.filter((event) => event === 'mixfont-poll').length, 1);
    assert.equal(state.events.filter((event) => event === 'font-download').length, 1);
    assert.deepEqual(state.objects.get('ai-fonts/test-user/test-job.ttf'), fixture);
    assert.equal(state.objects.size, 1, 'Successful retry removes the durable staging source and specimen quarantine');
  });
});

test('staging storage failure is unresolved rather than absent and cannot trigger a paid/provider retry', async (context) => {
  const state = pipeline(context, 'stage-read-error');
  await assert.rejects(state.run());
  assert.deepEqual(state.events, []);
  assert.deepEqual(state.uploads, []);
  assert.deepEqual(state.finished, []);
});

test('missing moderation configuration prevents both paid generation and completed output delivery', async (context) => {
  const state = pipeline(context);
  delete process.env.SEEAPI_API_KEY;
  await state.run();
  await reconcileJob({ ...state.job, status: 'reserved' });
  assert.deepEqual(state.events, []);
  assert.deepEqual(state.uploads, []);
  assert.deepEqual(state.finished, []);
});
