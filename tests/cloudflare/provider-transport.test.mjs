import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Use the workerd/Miniflare version installed with this project's Wrangler.
const require = createRequire(import.meta.url);
const wranglerRequire = createRequire(require.resolve('wrangler/package.json'));
const { Miniflare, convertV4MiniflareOptions } = wranglerRequire('miniflare');
const root = fileURLToPath(new URL('../../', import.meta.url));
const config = JSON.parse(readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8'));

function assessment(kind, flagged = false) {
  const categories = ['sexual_explicit', 'sexual_suggestive', 'sexual_minors', 'violence', 'hate', 'harassment', 'self_harm'];
  return {
    id: `task_${kind}`, object: 'inference', provider: 'seeapi', status: 'succeeded', error: null, consumed_credits: 0.002,
    model: kind === 'text' ? 'text-nsfw-filter' : 'nsfw-filter-2',
    endpoint: kind === 'text' ? 'text-moderation' : 'image-moderation',
    result: { type: 'json', data: kind === 'text'
      ? { flagged, threshold: 0.3, categories: Object.fromEntries(categories.map(name => [name, { score: 0.01, flagged: flagged && name === 'hate' }])) }
      : { flagged, categories: { nsfw: flagged ? ['nudity'] : [], special_care: [] } } },
  };
}

test('provider requests work in Workers and refuse credential-bearing redirects', async context => {
  // Bundle the actual clients, with fake configuration and no Next server or live secrets.
  const bundle = await build({
    stdin: { resolveDir: root, loader: 'ts', contents: `
      import { submitModeration, pollModeration } from './lib/ai-font/seeapi';
      import { sendInboxMail } from './lib/mail/inbox';
      export default { async fetch(request) {
        const url = new URL(request.url), kind = url.searchParams.get('kind') === 'image' ? 'image' : 'text';
        try {
          if (url.pathname === '/mail') return Response.json({ id: await sendInboxMail({ to: 'person@example.com', subject: 'Fixture', text: 'Offline fixture' }) });
          const result = url.pathname === '/poll' ? await pollModeration(kind, 'task_' + kind)
            : await submitModeration(kind, kind === 'text' ? 'A friendly serif font' : 'data:image/png;base64,iVBORw==', 'stable-runtime-key');
          return Response.json(result);
        } catch (error) { return Response.json({ code: error.code, httpStatus: error.httpStatus ?? error.status ?? null }, { status: 503 }); }
      } };
    ` },
    bundle: true, write: false, format: 'esm', platform: 'browser', conditions: ['react-server'],
    define: { 'process.env': JSON.stringify({
      SEEAPI_API_KEY: 'offline-seeapi-key', INBOX_URL: 'https://mail.example.com',
      INBOX_SEND_API_KEY: 'offline-mail-key', INBOX_FROM_EMAIL: 'receipts@example.com', INBOX_FROM_NAME: 'Font Generators',
    }) },
  });
  const calls = [];
  let reply;
  const mf = new Miniflare(convertV4MiniflareOptions({
    modules: true, script: bundle.outputFiles[0].text,
    compatibilityDate: config.compatibility_date, compatibilityFlags: config.compatibility_flags,
    // Every subrequest terminates here, including unexpected redirect destinations.
    // No real moderation, mail, generation or analytics endpoint can be contacted.
    outboundService: async request => {
      const url = new URL(request.url);
      assert.ok(['api.seeapi.com', 'mail.example.com'].includes(url.hostname));
      const body = request.method === 'POST' ? await request.json() : null;
      calls.push({ url, method: request.method, body, key: request.headers.get('Idempotency-Key') });
      assert.equal(request.headers.get('Authorization'), url.hostname === 'api.seeapi.com' ? 'Bearer offline-seeapi-key' : 'Bearer offline-mail-key');
      return reply(request, body);
    },
  }));
  context.after(() => mf.dispose());

  for (const kind of ['text', 'image']) {
    await context.test(`${kind} submissions and polling return validated outcomes`, async () => {
      reply = () => Response.json(assessment(kind));
      for (const path of ['/submit', '/poll']) {
        const response = await mf.dispatchFetch(`http://localhost${path}?kind=${kind}`);
        assert.equal(response.status, 200);
        assert.equal((await response.json()).status, 'passed');
      }
      const [submission, poll] = calls.slice(-2);
      assert.equal(submission.method, 'POST');
      assert.equal(submission.key, 'stable-runtime-key');
      assert.equal(submission.body.input[kind === 'text' ? 'text' : 'image_url'], kind === 'text' ? 'A friendly serif font' : 'data:image/png;base64,iVBORw==');
      assert.equal(poll.method, 'GET');
      assert.equal(poll.url.pathname, `/v1/inferences/task_${kind}`);
      assert.equal(poll.key, null);
      reply = () => Response.json(assessment(kind, true));
      assert.equal((await (await mf.dispatchFetch(`http://localhost/poll?kind=${kind}`)).json()).status, 'blocked');
    });
  }
  await context.test('mail can receive an acceptance receipt in Workers', async () => {
    reply = () => Response.json({ status: 'sent', id: 'offline-receipt' }, { status: 202 });
    const response = await mf.dispatchFetch('http://localhost/mail');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { id: 'offline-receipt' });
  });
  await context.test('all redirect statuses fail closed with one outbound request', async () => {
    for (const status of [301, 302, 303, 307, 308]) {
      reply = () => new Response(null, { status, headers: { Location: 'https://untrusted.example/' } });
      for (const path of ['/submit', '/poll', '/mail']) {
        const before = calls.length;
        const response = await mf.dispatchFetch(`http://localhost${path}`);
        assert.equal(response.status, 503);
        assert.deepEqual(await response.json(), { code: path === '/mail' ? 'DELIVERY_UNCERTAIN' : 'HTTP_ERROR', httpStatus: status });
        assert.equal(calls.length, before + 1, 'Never follow the redirect or resubmit');
      }
    }
  });
});
