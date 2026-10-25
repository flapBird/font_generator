import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { pollModeration, SeeApiError, submitModeration, type ModerationKind } from '../../lib/ai-font/seeapi';

const categories = ['sexual_explicit', 'sexual_suggestive', 'sexual_minors', 'violence', 'hate', 'harassment', 'self_harm'];
function result(kind: ModerationKind = 'text') {
  return {
    id: 'task_test-123', object: 'inference', model: kind === 'text' ? 'text-nsfw-filter' : 'nsfw-filter-2',
    endpoint: kind === 'text' ? 'text-moderation' : 'image-moderation', provider: 'seeapi', status: 'succeeded',
    consumed_credits: 0.002, error: null,
    result: { type: 'json', data: kind === 'text'
      ? { flagged: false, threshold: 0.3, categories: Object.fromEntries(categories.map((name) => [name, { score: 0.01, flagged: false }])) }
      : { flagged: false, categories: { nsfw: [], special_care: [] } } },
  };
}
type Fixture = Record<string, unknown>;
async function mockFetch(context: TestContext, fetcher: typeof fetch) {
  const originalFetch = globalThis.fetch, originalKey = process.env.SEEAPI_API_KEY;
  process.env.SEEAPI_API_KEY = 'unit-test-seeapi-key'; globalThis.fetch = fetcher;
  context.after(() => { globalThis.fetch = originalFetch; if (originalKey === undefined) delete process.env.SEEAPI_API_KEY; else process.env.SEEAPI_API_KEY = originalKey; });
}

test('SeeAPI sends original content with fixed policy, stable idempotency, server auth, timeout and no redirects', async (context) => {
  const seen: RequestInit[] = [];
  await mockFetch(context, async (url, init) => {
    assert.equal(String(url), 'https://api.seeapi.com/v1/inferences');
    seen.push(init!);
    assert.equal(init?.redirect, 'error'); assert.equal(init?.cache, 'no-store'); assert.ok(init?.signal);
    const headers = new Headers(init?.headers);
    assert.equal(headers.get('Authorization'), 'Bearer unit-test-seeapi-key');
    assert.equal(headers.get('Idempotency-Key'), 'job-1-prompt-v1');
    const payload = JSON.parse(String(init?.body));
    assert.deepEqual(payload, { model: 'text-nsfw-filter', endpoint: 'text-moderation', provider: 'seeapi', input: { text: 'A friendly serif font', threshold: 0.3, categories } });
    return Response.json(result());
  });
  for (let attempt = 0; attempt < 2; attempt++) assert.deepEqual(await submitModeration('text', 'A friendly serif font', 'job-1-prompt-v1'), { taskId: 'task_test-123', status: 'passed', consumedCredits: 0.002 });
  assert.equal(seen.length, 2);
});

test('SeeAPI preserves accepted tasks for later polling and distinguishes execution failures from content flags', async (context) => {
  let body: Fixture = { ...result('image'), status: 'processing', result: null, consumed_credits: 0 };
  await mockFetch(context, async (url, init) => {
    assert.equal(String(url), 'https://api.seeapi.com/v1/inferences/task_test-123');
    assert.equal(init?.method, 'GET'); assert.equal(new Headers(init?.headers).get('Idempotency-Key'), null);
    return Response.json(body, { status: body.status === 'processing' ? 202 : 200 });
  });
  assert.deepEqual(await pollModeration('image', 'task_test-123'), { taskId: 'task_test-123', status: 'pending', consumedCredits: 0 });
  body = { ...result('image'), status: 'failed', result: null, error: { code: 'processing_error', message: 'private upstream error' } };
  assert.equal((await pollModeration('image', 'task_test-123')).status, 'failed');
  body = result('image');
  assert.equal((await pollModeration('image', 'task_test-123')).status, 'passed');
});

test('SeeAPI blocks text category verdicts and image labels including special care regardless of contradictory image flag', async (context) => {
  let body: Fixture = result();
  await mockFetch(context, async () => Response.json(body));
  const text = result();
  text.result.data.flagged = true;
  (text.result.data.categories as Record<string, { score: number; flagged: boolean }>).hate.flagged = true;
  body = text;
  assert.equal((await pollModeration('text', 'task_test-123')).status, 'blocked');
  for (const labels of [{ nsfw: ['nudity'], special_care: [] }, { nsfw: [], special_care: ['sexual_minors'] }]) {
    body = { ...result('image'), result: { type: 'json', data: { flagged: false, categories: labels } } };
    assert.equal((await pollModeration('image', 'task_test-123')).status, 'blocked');
  }
});

test('SeeAPI rejects forged identity, missing assessment fields and malformed or contradictory text verdicts', async (context) => {
  let body: Fixture = result();
  await mockFetch(context, async () => Response.json(body));
  const mutations: Array<(value: Fixture) => void> = [
    (v) => { v.object = 'generation'; }, (v) => { v.model = 'different-model'; }, (v) => { v.endpoint = 'image-moderation'; },
    (v) => { v.provider = 'unknown'; }, (v) => { v.id = 'task_other'; }, (v) => { v.id = '../bad'; },
    (v) => { v.status = 'unexpected'; }, (v) => { v.result = null; }, (v) => { delete v.error; },
    (v) => { v.consumed_credits = -1; }, (v) => { v.result = { type: 'json', data: { flagged: false } }; },
    (v) => { (v.result as ReturnType<typeof result>['result']).data.flagged = true; },
    (v) => { const data = (v.result as ReturnType<typeof result>['result']).data; delete (data.categories as Record<string, unknown>).hate; },
    (v) => { const data = (v.result as ReturnType<typeof result>['result']).data; (data.categories as Record<string, unknown>).hate = { score: 2, flagged: false }; },
    (v) => { const data = (v.result as ReturnType<typeof result>['result']).data; (data.categories as Record<string, unknown>).hate = { score: 0, flagged: 'false' }; },
    (v) => { (v.result as { data: { threshold: number } }).data.threshold = 0.5; },
  ];
  for (const mutate of mutations) { body = result(); mutate(body); await assert.rejects(pollModeration('text', 'task_test-123'), SeeApiError); }
});

test('SeeAPI image submission carries a private PNG and rejects incomplete or unknown image categories', async (context) => {
  const image = 'data:image/png;base64,iVBORw==';
  let body: Fixture = result('image');
  await mockFetch(context, async (_url, init) => {
    if (init?.method === 'POST') assert.deepEqual(JSON.parse(String(init.body)).input, { image_url: image, threshold: 0.5, strict_special_care: true });
    return Response.json(body);
  });
  assert.equal((await submitModeration('image', image, 'job-1-output-v1')).status, 'passed');
  for (const category of [{ nsfw: [] }, { nsfw: null, special_care: [] }, { nsfw: ['unknown'], special_care: [] }, { nsfw: [], special_care: ['unknown'] }]) {
    body = { ...result('image'), result: { type: 'json', data: { flagged: false, categories: category } } };
    await assert.rejects(pollModeration('image', 'task_test-123'), SeeApiError);
  }
});

test('SeeAPI fails closed without secrets and validates caller-controlled input before any request', async (context) => {
  let calls = 0;
  await mockFetch(context, async () => { calls++; return Response.json(result()); });
  for (const key of ['', 'x'.repeat(256), 'bad\r\nkey']) await assert.rejects(submitModeration('text', 'A serif font', key), SeeApiError);
  await assert.rejects(submitModeration('text', 'x'.repeat(20001), 'key'), SeeApiError);
  await assert.rejects(submitModeration('image', 'https://example.com/private.png', 'key'), SeeApiError);
  await assert.rejects(pollModeration('text', '../private'), SeeApiError);
  delete process.env.SEEAPI_API_KEY;
  await assert.rejects(submitModeration('text', 'A serif font', 'key'), /Missing configuration: SEEAPI_API_KEY/);
  assert.equal(calls, 0);
});

test('SeeAPI sanitizes HTTP, parsing, oversized and uncertain network failures without automatic resubmission', async (context) => {
  let calls = 0;
  let response = () => new Response('secret-upstream-body', { status: 429, headers: { 'Retry-After': '5' } });
  await mockFetch(context, async () => { calls++; return response(); });
  await assert.rejects(submitModeration('text', 'A serif font', 'stable-key'), (error: unknown) => {
    assert.ok(error instanceof SeeApiError); assert.equal(error.retryable, true); assert.equal(error.retryAfterSeconds, 5); assert.equal(error.httpStatus, 429); assert.equal(error.code, 'HTTP_ERROR'); assert.equal(error.submissionRejected, false); assert.ok(!error.message.includes('secret')); return true;
  });
  assert.equal(calls, 1);
  for (const next of [
    () => new Response('secret-upstream-body', { headers: { 'content-type': 'application/json' } }),
    () => new Response('{}', { headers: { 'content-type': 'application/json', 'content-length': '65537' } }),
    () => new Response(' '.repeat(65537), { headers: { 'content-type': 'application/json' } }),
    () => { throw new Error('Network error carrying secret-api-key'); },
  ]) {
    response = next;
    await assert.rejects(pollModeration('text', 'task_test-123'), (error: unknown) => error instanceof SeeApiError && !error.message.includes('secret'));
  }
  assert.equal(calls, 5);
});
