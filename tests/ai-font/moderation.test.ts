import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { reviewHash, reviewPrompt, stagedFontBytes } from '../../lib/ai-font/moderation';

const prompt = 'A friendly rounded serif for a neighborhood bakery';
const categories = ['sexual_explicit', 'sexual_suggestive', 'sexual_minors', 'violence', 'hate', 'harassment', 'self_harm'];
function textResult(status: 'processing' | 'succeeded' = 'succeeded') {
  return {
    id: 'task_prompt-review', object: 'inference', model: 'text-nsfw-filter', endpoint: 'text-moderation', provider: 'seeapi',
    status, consumed_credits: 0.001, error: null,
    result: status === 'processing' ? null : { type: 'json', data: {
      flagged: false, threshold: 0.3, categories: Object.fromEntries(categories.map((name) => [name, { score: 0.01, flagged: false }])),
    } },
  };
}

function promptReview(context: TestContext, admissionError?: string) {
  const originalFetch = globalThis.fetch;
  const keys = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SEEAPI_API_KEY'] as const;
  const env = keys.map((key) => process.env[key]);
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  process.env.SEEAPI_API_KEY = 'test-seeapi-key';
  const events: string[] = [], submissions: { key: string | null; body: string }[] = [];
  const check = { id: 'persisted-review', status: 'pending', provider_task_id: null as string | null };
  let provider: (request: Request) => Promise<Response> = async () => Response.json(textResult());
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init), url = new URL(request.url);
    if (url.hostname === 'api.seeapi.com') {
      events.push(`provider-${request.method}`);
      if (request.method === 'POST') submissions.push({ key: request.headers.get('Idempotency-Key'), body: await request.clone().text() });
      return provider(request);
    }
    assert.equal(url.hostname, 'example.supabase.co');
    const body = await request.json();
    if (url.pathname.endsWith('/ai_font_prepare_moderation')) {
      events.push('admission');
      assert.deepEqual(body, { p_user: 'test-user', p_request: 'request-id', p_stage: 'prompt', p_input_hash: reviewHash(prompt), p_asset_hash: null });
      if (admissionError) return Response.json({ code: 'P0001', message: admissionError }, { status: 400 });
      return Response.json({ ...check, claim_token: check.status === 'pending' ? 'lease-token' : null });
    }
    assert.equal(url.pathname, '/rest/v1/rpc/ai_font_finish_moderation');
    events.push(`save-${body.p_status}`);
    assert.equal(body.p_id, check.id); assert.equal(body.p_token, 'lease-token');
    check.status = body.p_status === 'retry' ? 'pending' : body.p_status;
    check.provider_task_id = body.p_task_id ?? check.provider_task_id;
    return Response.json(true);
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
    keys.forEach((key, index) => { if (env[index] === undefined) delete process.env[key]; else process.env[key] = env[index]; });
  });
  return { check, events, submissions, provider: (fetcher: typeof provider) => { provider = fetcher; }, run: () => reviewPrompt('test-user', 'request-id', prompt) };
}

test('prompt admission checks balance, billing restrictions and limits before any paid provider call', async (context) => {
  for (const error of ['NO_CREDITS', 'BILLING_RESTRICTED', 'REVIEW_RATE_LIMIT', 'ACTIVE_JOB', 'REVIEW_MISMATCH']) await context.test(error, async (child) => {
    const review = promptReview(child, error);
    await assert.rejects(review.run(), { message: error });
    assert.deepEqual(review.events, ['admission']);
    assert.deepEqual(review.submissions, []);
  });
});

test('a lost prompt response replays its persisted idempotency key and exact body before recording approval', async (context) => {
  const review = promptReview(context);
  let lost = true;
  review.provider(async () => { if (lost) { lost = false; throw new TypeError('Connection lost after acceptance'); } return Response.json(textResult()); });
  await assert.rejects(review.run());
  assert.equal(review.check.status, 'pending');
  assert.equal(await review.run(), 'passed');
  assert.equal(review.submissions.length, 2);
  assert.deepEqual(review.submissions[0], review.submissions[1]);
  assert.equal(review.submissions[0].key, 'font-review-persisted-review');
  assert.deepEqual(review.events, ['admission', 'provider-POST', 'save-retry', 'admission', 'provider-POST', 'save-passed']);
  assert.equal(await review.run(), 'passed');
  assert.equal(review.submissions.length, 2, 'A durable pass should not create another paid task');
});

test('accepted prompt task IDs resume authenticated polling instead of duplicate submissions', async (context) => {
  const review = promptReview(context);
  review.provider(async (request) => {
    if (request.method === 'POST') return Response.json(textResult('processing'), { status: 202 });
    assert.equal(new URL(request.url).pathname, '/v1/inferences/task_prompt-review');
    return Response.json(textResult());
  });
  assert.equal(await review.run(), 'pending');
  assert.equal(review.check.provider_task_id, 'task_prompt-review');
  assert.equal(await review.run(), 'passed');
  assert.deepEqual(review.events, ['admission', 'provider-POST', 'save-pending', 'admission', 'provider-GET', 'save-passed']);
  assert.equal(review.submissions.length, 1);
});

test('blocked and malformed prompt outcomes cannot become generation approval', async (context) => {
  await context.test('blocked', async (child) => {
    const review = promptReview(child), result = textResult();
    result.result!.data.flagged = true; result.result!.data.categories.sexual_explicit.flagged = true;
    review.provider(async () => Response.json(result));
    assert.equal(await review.run(), 'blocked');
    assert.equal(await review.run(), 'blocked');
    assert.equal(review.submissions.length, 1);
  });
  await context.test('malformed completion', async (child) => {
    const review = promptReview(child);
    review.provider(async () => Response.json({ ...textResult(), result: null }));
    await assert.rejects(review.run());
    assert.equal(review.check.status, 'pending');
    assert.deepEqual(review.events, ['admission', 'provider-POST', 'save-retry']);
  });
});

test('staged fonts distinguish modern and legacy object misses from storage configuration or transient failures', async (context) => {
  const originalFetch = globalThis.fetch;
  const keys = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
  const env = keys.map((key) => process.env[key]);
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  context.after(() => {
    globalThis.fetch = originalFetch;
    keys.forEach((key, index) => { if (env[index] === undefined) delete process.env[key]; else process.env[key] = env[index]; });
  });
  const scenarios = [
    { name: 'modern missing object', status: 404, body: { code: 'NoSuchKey', message: 'Object not found' }, missing: true },
    { name: 'legacy missing object', status: 400, body: { statusCode: '404', error: 'NotFound', message: 'Object not found' }, missing: true },
    { name: 'missing bucket', status: 404, body: { code: 'NoSuchBucket', message: 'Bucket not found' }, missing: false },
    { name: 'explicit bucket error overrides numeric status', status: 404, body: { statusCode: '404', code: 'NoSuchBucket', message: 'Bucket not found' }, missing: false },
    { name: 'denied read', status: 403, body: { code: 'AccessDenied', message: 'Access denied' }, missing: false },
    { name: 'temporary outage', status: 503, body: { code: 'InternalError', message: 'Temporarily unavailable' }, missing: false },
  ];
  for (const scenario of scenarios) await context.test(scenario.name, async () => {
    let calls = 0;
    globalThis.fetch = async (input, init) => {
      const request = new Request(input, init), url = new URL(request.url);
      assert.equal(url.hostname, 'example.supabase.co');
      assert.equal(url.pathname, '/storage/v1/object/ai-font-review/test-user/test-job/staged.ttf');
      assert.equal(request.method, 'GET');
      calls++;
      return Response.json(scenario.body, { status: scenario.status });
    };
    const read = () => stagedFontBytes({ user_id: 'test-user', id: 'test-job' });
    if (scenario.missing) assert.equal(await read(), null);
    else await assert.rejects(read(), { name: 'StorageApiError' });
    assert.equal(calls, 1);
  });
});
