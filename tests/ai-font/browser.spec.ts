import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { authChangedEvent } from '../../lib/ai-font/auth-navigation';

// These local regressions never contact production analytics or payment services.
test.beforeEach(async ({ context }) => {
  await context.route('https://**/*', route => route.abort());
});

test('homepage stays idle while browsing links and prefetches a destination on hover', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const prefetches: string[] = [];
  page.on('request', request => {
    if (request.headers()['next-router-prefetch'] === '1') prefetches.push(new URL(request.url()).pathname);
  });
  await page.goto('/');
  await page.getByLabel('Enter your text', { exact: true }).fill('Hello');
  await expect(page.getByText('𝐇𝐞𝐥𝐥𝐨', { exact: true }).first()).toBeVisible();
  await page.waitForTimeout(1000);
  expect(prefetches).toEqual([]);
  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  expect(prefetches).toEqual([]);
  const guides = page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Guides', exact: true }).first();
  await guides.hover();
  await expect.poll(() => prefetches.includes('/guides')).toBe(true);
  await guides.click();
  await expect(page).toHaveURL(/\/guides$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('keyboard focus prefetches the chosen header link and preserves navigation', async ({ page }) => {
  const prefetches: string[] = [];
  page.on('request', request => {
    if (request.headers()['next-router-prefetch'] === '1') prefetches.push(new URL(request.url()).pathname);
  });
  await page.goto('/');
  const styles = page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Font Styles', exact: true }).first();
  await styles.focus();
  await expect.poll(() => prefetches.includes('/styles')).toBe(true);
  await styles.press('Enter');
  await expect(page).toHaveURL(/\/styles$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('free AI references require no account, payment or generation API', async ({ page }) => {
  const paidCalls: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && /\/api\/ai-font\/(jobs|orders)/.test(request.url())) paidCalls.push(request.url());
  });
  await page.goto('/ai-font-generator');
  await expect(page.getByRole('heading', { name: 'AI Font Generator', exact: true })).toBeVisible();
  await page.getByLabel('Your preview text').fill('My weekend project');
  await page.getByRole('button', { name: 'Arcade', exact: true }).click();
  await expect(page.getByLabel('Font description')).toHaveValue(/retro pixel/);
  await expect(page.getByText('My weekend project', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Generate font · 100 credits' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Download PNG', exact: true })).toBeEnabled();
  const freeExport = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PNG', exact: true }).click();
  expect((await freeExport).suggestedFilename()).toBe('Arcade-square.png');
  expect(paidCalls).toEqual([]);
  expect(await page.locator('script[src*="supabase"],script[src*="paypal.com/sdk"]').count()).toBe(0);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: '/tmp/font-generator-ai-font-desktop.png', fullPage: true });
  await page.screenshot({ path: '/tmp/font-generator-ai-font-preview.png' });
  await page.evaluate(() => localStorage.setItem('font-generators-theme-v2', 'dark'));
  await page.reload();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await expect(page.getByRole('button', { name: /Switch to .* mode/ })).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel('Font description')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/font-generator-ai-font-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('existing tools remain public and skip account calls when auth is unconfigured', async ({ page }) => {
  const aiCalls: string[] = [];
  page.on('request', (request) => { if (request.url().includes('/api/ai-font/')) aiCalls.push(request.url()); });
  for (const path of ['/', '/small-text-generator', '/3d-font-generator', '/minecraft-font-generator']) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    const input = page.getByRole('textbox').first();
    await expect(input).toBeVisible();
    await input.fill('Hello Font');
    await expect(input).toHaveValue('Hello Font');
    expect(page.url()).not.toContain('auth');
  }
  expect(aiCalls).toEqual([]);
});

test('header login remains visible at desktop and mobile sizes without gating free tools', async ({ page }) => {
  for (const width of [1280, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Primary navigation' });
    const login = nav.getByRole('link', { name: 'Log in', exact: true });
    await expect(login).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await login.click();
    await expect(page).toHaveURL(/\/login\?next=%2F$/);
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeDisabled();
    await expect(page.getByText('Google sign-in is not available yet.', { exact: false })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Continue with free tools' })).toHaveCount(0);
    await page.goto('/');
    await expect(page).toHaveURL('http://localhost:3211/');
  }
});

test('paid routes reject unauthenticated and cross-origin requests', async ({ request }) => {
  const account = await request.get('/api/ai-font/account');
  expect(account.status()).toBe(200);
  expect((await account.json()).user).toBeNull();
  expect(account.headers()['cache-control']).toContain('no-store');
  for (const path of ['jobs', 'orders', 'orders/complete', 'subscriptions/cancel']) {
    const response = await request.post(`/api/ai-font/${path}`, {
      headers: { origin: 'http://localhost:3211' }, data: { id: '10000000-0000-4000-8000-000000000001' },
    });
    expect([401, 503]).toContain(response.status());
    const crossOrigin = await request.post(`/api/ai-font/${path}`, { headers: { origin: 'https://attacker.example' }, data: {} });
    expect(crossOrigin.status()).toBe(403);
  }
  const download = await request.get('/api/ai-font/jobs/10000000-0000-4000-8000-000000000001/download');
  expect([401, 503]).toContain(download.status());
});

test('signed-in UI purchases only after agreement and spends a generation explicitly (mocked account)', async ({ page }) => {
  let credits = 0;
  const checkoutIds: string[] = [];
  let submitted: Record<string, unknown> | undefined;
  await page.route('**/api/ai-font/account', (route) => route.fulfill({ json: {
    user: { email: 'test@example.com' }, credits, jobs: [], orders: [],
    services: { auth: true, generation: true, checkout: true, sandbox: true },
  } }));
  await page.route('**/api/ai-font/orders', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.provider).toBe('paypal');
    expect(body.acceptedTerms).toBe(true);
    expect(body.packageId).toBe('english-starter');
    expect(body.amount).toBeUndefined();
    checkoutIds.push(body.id);
    if (checkoutIds.length === 1) {
      await route.fulfill({ status: 410, json: { error: 'This checkout expired. Please try purchasing again.' } });
      return;
    }
    await route.fulfill({ json: { approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=TEST' } });
  });
  await page.route('https://www.sandbox.paypal.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<h1>Mock PayPal approval</h1>' }));
  await page.goto('/pricing');
  const buy = page.getByRole('button', { name: 'Buy 3 generations with PayPal' });
  await expect(buy).toBeDisabled();
  await page.getByRole('checkbox').check();
  await buy.click();
  await expect(page.getByRole('alert').filter({ hasText: 'checkout expired' })).toBeVisible();
  await buy.click();
  await expect(page.getByRole('heading', { name: 'Mock PayPal approval' })).toBeVisible();
  expect(checkoutIds[0]).not.toBe(checkoutIds[1]);
  credits = 300;
  await page.route('**/api/ai-font/orders/complete', (route) => route.fulfill({ json: { status: 'paid' } }));
  await page.route('**/api/ai-font/jobs', async (route) => {
    submitted = route.request().postDataJSON(); credits = 200;
    await route.fulfill({ status: 202, json: { id: submitted?.id } });
  });
  await page.goto('/ai-font-generator?checkout=return&order=10000000-0000-4000-8000-000000000001');
  await expect(page.getByText('3 generations available')).toBeVisible();
  expect(submitted).toBeUndefined();
  await page.getByLabel('Font description').fill('A friendly rounded display font for a cafe');
  await page.getByRole('button', { name: 'Generate font · 100 credits' }).click();
  await expect(page.getByText('2 generations available')).toBeVisible();
  expect(submitted?.prompt).toBe('A friendly rounded display font for a cafe');
  expect(submitted?.id).toMatch(/^[a-f0-9-]{36}$/);
});

test('artwork export uses the selected generated font without spending credits (mocked account)', async ({ page }) => {
  const paidCalls: string[] = [];
  page.on('request', request => { if (request.method() === 'POST' && /\/api\/ai-font\/(jobs|orders)/.test(request.url())) paidCalls.push(request.url()); });
  const id = '10000000-0000-4000-8000-000000000002';
  await page.route('**/api/ai-font/account', route => route.fulfill({ json: {
    user: { email: 'test@example.com' }, credits: 200, orders: [],
    jobs: [{ id, name: 'Test display font', prompt: 'A bold display font', status: 'succeeded', created_at: '2026-10-06T00:00:00Z' }],
    services: { auth: true, generation: true, checkout: true, sandbox: true },
  } }));
  await page.route(`**/api/ai-font/jobs/${id}/download`, route => route.fulfill({ json: { url: 'http://localhost:3211/test-font.ttf' } }));
  const fontRequests: string[] = [];
  await page.route('**/test-font.ttf', route => {
    fontRequests.push(route.request().url());
    return route.fulfill({ path: 'tests/ai-font/fixtures/mixfont-standard.ttf', contentType: 'font/ttf', headers: { 'Content-Disposition': 'attachment; filename="test-font.ttf"' } });
  });
  await page.goto('/ai-font-generator');
  await expect(page.getByRole('button', { name: 'Download PNG', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Preview & create artwork' }).click();
  await expect(page.getByText('Editing with your generated font:', { exact: false })).toBeVisible();
  expect(await page.evaluate((family) => document.fonts.check(`32px ${family}`, 'Aa 123'), `generated-${id}`)).toBe(true);
  const ttfDownloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download TTF ↓', exact: true }).click();
  const ttfDownload = await ttfDownloadEvent;
  expect(ttfDownload.suggestedFilename()).toBe('test-font.ttf');
  const ttfChunks: Buffer[] = [];
  for await (const chunk of (await ttfDownload.createReadStream())!) ttfChunks.push(Buffer.from(chunk));
  expect(Buffer.concat(ttfChunks)).toEqual(readFileSync('tests/ai-font/fixtures/mixfont-standard.ttf'));
  expect(fontRequests).toEqual(['http://localhost:3211/test-font.ttf', 'http://localhost:3211/test-font.ttf']);
  await page.getByLabel('Your preview text').fill('Hello 中文🙂');
  await expect(page.getByRole('status').filter({ hasText: 'This font does not include these characters' })).toContainText('中文🙂');
  await page.getByLabel('Artwork text', { exact: true }).fill('Hello 中文🙂');
  await expect(page.getByRole('status').filter({ hasText: 'This font does not include these characters' })).toHaveCount(2);
  await page.getByLabel('Artwork text', { exact: true }).fill('MY POSTER');
  await page.getByLabel('Image format', { exact: true }).selectOption('transparent');
  const downloadButton = page.getByRole('button', { name: 'Download PNG', exact: true });
  await expect(downloadButton).toBeEnabled();
  expect(await page.locator('canvas').evaluate((c: HTMLCanvasElement) => c.getContext('2d')!.font)).toContain(`generated-${id}`);
  const downloadEvent = page.waitForEvent('download');
  await downloadButton.click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('Test-display-font-transparent.png');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const png = Buffer.concat(chunks);
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  expect(png.readUInt32BE(16)).toBe(1600);
  expect(png.readUInt32BE(20)).toBe(600);
  const pixels = await page.evaluate(async (base64) => {
    const img = new Image(); img.src = `data:image/png;base64,${base64}`; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    return { cornerAlpha: data[3], hasText: data.some((value, index) => index % 4 === 3 && value > 0) };
  }, png.toString('base64'));
  expect(pixels).toEqual({ cornerAlpha: 0, hasText: true });
  await page.getByLabel('Image format', { exact: true }).selectOption('wide');
  await expect(downloadButton).toBeEnabled();
  expect(await page.locator('canvas').evaluate((c: HTMLCanvasElement) => c.getContext('2d')!.getImageData(0, 0, 1, 1).data[3])).toBe(255);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#font-artwork').screenshot({ path: '/tmp/font-artwork-mobile.png' });
  await page.getByLabel('Artwork text', { exact: true }).fill('');
  await expect(downloadButton).toBeDisabled();
  await expect(page.getByText('2 generations available')).toBeVisible();
  expect(paidCalls).toEqual([]);
});

test('a corrupt font cannot appear as a successfully loaded generated preview', async ({ page }) => {
  const id = '10000000-0000-4000-8000-000000000003';
  await page.route('**/api/ai-font/account', route => route.fulfill({ json: {
    user: { email: 'test@example.com' }, credits: 200, orders: [],
    jobs: [{ id, name: 'Broken font', prompt: 'A playful font', status: 'succeeded', created_at: '2026-10-20T00:00:00Z' }],
    services: { auth: true, generation: true, checkout: true },
  } }));
  await page.route(`**/api/ai-font/jobs/${id}/download`, route => route.fulfill({ json: { url: 'http://localhost:3211/broken-font.ttf' } }));
  await page.route('**/broken-font.ttf', route => route.fulfill({ body: 'not a font', contentType: 'font/ttf' }));
  await page.goto('/ai-font-generator');
  await page.getByRole('button', { name: 'Preview & create artwork' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Your font preview could not load' })).toBeVisible();
  await expect(page.getByText('Editing with your generated font:', { exact: false })).toHaveCount(0);
  await expect(page.getByLabel('Reference font artwork preview', { exact: true })).toBeVisible();
});

test('llms.txt describes file validation, private delivery and missing-character warnings', async ({ request }) => {
  const response = await request.get('/llms.txt');
  expect(response.ok()).toBe(true);
  const body = await response.text();
  expect(body).toContain('# Font Generators');
  expect(body).toContain('generated TTF files are checked for table integrity');
  expect(body).toContain('restore its reserved customer credits');
  expect(body).toContain('previews load that same stored file');
  expect(body).toContain('warning for characters absent from its character map');
  expect(body).toContain('Reference previews use existing fonts, not AI-generated results');
  expect(body).toContain('Descriptions are reviewed for sexual content');
  expect(body).toContain('before generation credits are reserved or Mixfont is called');
  expect(body).toContain('New results are previewable and downloadable only after all specimen pages pass');
  expect(body).toContain('no scheduled automatic expiry');
  expect(body).not.toContain('](https://font-generators.org/ai-font-generator)');
});

test('pending prompt moderation reuses the generation intent and does not claim credits were spent', async ({ page }) => {
  const requests: { id: string; prompt: string }[] = [];
  let credits = 300;
  await page.route('**/api/ai-font/account', route => route.fulfill({ json: {
    user: { email: 'test@example.com' }, credits, orders: [], jobs: [],
    services: { auth: true, generation: true, checkout: true },
  } }));
  await page.route('**/api/ai-font/jobs', route => {
    requests.push(route.request().postDataJSON());
    if (requests.length === 1) return route.fulfill({ status: 202, json: { id: requests[0].id, moderation: 'pending' } });
    credits = 200;
    return route.fulfill({ status: 202, json: { id: requests[0].id } });
  });
  await page.goto('/ai-font-generator');
  await page.getByLabel('Font description').fill('A friendly rounded English font');
  await page.getByRole('button', { name: 'Generate font · 100 credits' }).click();
  await expect(page.getByText('Checking your description. No generation credits have been used.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Checking description…' })).toBeDisabled();
  await expect(page.getByText('Ready to create your font.', { exact: true })).toHaveCount(0);
  await expect(page.getByText('3 generations available')).toBeVisible();
  await expect(page.getByText('Your font is on its way.', { exact: false })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('2 generations available')).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[0]).toEqual(requests[1]);
});

test('an unavailable check respects the cooldown and reuses its intent instead of rapidly posting jobs', async ({ page }) => {
  await page.clock.install();
  const requests: { id: string; prompt: string }[] = [];
  await page.route('**/api/ai-font/account', route => route.fulfill({ json: {
    user: { email: 'test@example.com' }, credits: 300, orders: [], jobs: [], services: { auth: true, generation: true, checkout: true },
  } }));
  await page.route('**/api/ai-font/jobs', route => {
    requests.push(route.request().postDataJSON());
    return route.fulfill(requests.length === 1
      ? { status: 503, headers: { 'Retry-After': '60' }, json: { error: 'Safety checks are temporarily unavailable. No generation credits have been used.', code: 'MODERATION_UNAVAILABLE', retryAfterSeconds: 60 } }
      : { status: 202, headers: { 'Retry-After': '60' }, json: { moderation: 'pending', waitingToRetry: true, retryAfterSeconds: 60 } });
  });
  await page.goto('/ai-font-generator');
  await page.getByLabel('Font description').fill('A friendly rounded English font');
  const generate = page.getByRole('button', { name: 'Generate font · 100 credits' });
  await generate.click();
  await expect(generate).toBeDisabled();
  await expect(page.getByRole('status').filter({ hasText: 'Try safety checks again in 60 seconds.' })).toBeVisible();
  await expect(page.getByText('Ready to create your font.', { exact: true })).toHaveCount(0);
  await page.clock.fastForward(10000);
  expect(requests).toHaveLength(1);
  await page.clock.fastForward(50000);
  await expect(generate).toBeEnabled();
  await generate.click();
  await expect(page.getByText('Safety checks are waiting to retry after a temporary failure.', { exact: false })).toBeVisible();
  await page.clock.fastForward(15000);
  expect(requests).toHaveLength(2);
  expect(requests[0]).toEqual(requests[1]);
  await expect(page.getByRole('button', { name: 'Checking description…' })).toHaveCount(0);
  await expect(page.getByText('3 generations available', { exact: false })).toBeVisible();
});

test('an explicitly rejected moderation submission starts a new intent only on a manual retry', async ({ page }) => {
  const ids: string[] = [];
  await page.route('**/api/ai-font/account', route => route.fulfill({ json: {
    user: { email: 'test@example.com' }, credits: 300, orders: [], jobs: [], services: { auth: true, generation: true, checkout: true },
  } }));
  await page.route('**/api/ai-font/jobs', route => {
    ids.push(route.request().postDataJSON().id);
    return route.fulfill({ status: 503, json: { error: 'Safety checks are temporarily unavailable. No generation credits have been used.', code: 'MODERATION_UNAVAILABLE', restartAllowed: true, retryAfterSeconds: 0 } });
  });
  await page.goto('/ai-font-generator');
  await page.getByLabel('Font description').fill('A friendly rounded English font');
  const generate = page.getByRole('button', { name: 'Generate font · 100 credits' });
  await generate.click();
  await expect(page.getByText('Safety checks were unavailable. Try again to continue.')).toBeVisible();
  expect(ids).toHaveLength(1);
  await generate.click();
  await expect(page.getByText('Safety checks were unavailable. Try again to continue.')).toBeVisible();
  await expect.poll(() => ids.length).toBe(2);
  expect(ids[0]).not.toBe(ids[1]);
});

test('a blocked description leaves credits and download availability unchanged', async ({ page }) => {
  let submitted = 0;
  await page.route('**/api/ai-font/account', route => route.fulfill({ json: {
    user: { email: 'test@example.com' }, credits: 300, orders: [], jobs: [],
    services: { auth: true, generation: true, checkout: true },
  } }));
  await page.route('**/api/ai-font/jobs', route => {
    submitted++;
    return route.fulfill({ status: 422, json: { error: 'This description did not pass our safety checks. Please describe another font. No generation credits have been used.' } });
  });
  await page.goto('/ai-font-generator');
  await page.getByLabel('Font description').fill('A description rejected by the mocked safety check');
  await page.getByRole('button', { name: 'Generate font · 100 credits' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'did not pass our safety checks' })).toBeVisible();
  await expect(page.getByText('3 generations available')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download TTF ↓', exact: true })).toHaveCount(0);
  expect(submitted).toBe(1);
});

test('pricing is public, uses the same credit allowance, and links to the studio', async ({ page }) => {
  await page.route('**/api/ai-font/account', route => route.fulfill({ json: {
    user: null, credits: 0, services: { checkout: true, sandbox: false, provider: 'waffo' },
  } }));
  for (const width of [1280, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/pricing');
    await expect(page.getByRole('heading', { name: 'Free to explore. Pay to create a font.' })).toBeVisible();
    await expect(page.getByText('300 credits · 100 per basic English font', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const freeAction = await page.getByRole('link', { name: 'Use free tools', exact: true }).boundingBox();
    const previewLink = await page.getByRole('link', { name: 'Try a style preview', exact: true }).boundingBox();
    expect(previewLink!.y + previewLink!.height).toBeLessThan(freeAction!.y);
    if (width >= 768) {
      const paidAction = await page.getByRole('link', { name: 'Log in to purchase', exact: true }).boundingBox();
      expect(Math.abs(freeAction!.y - paidAction!.y)).toBeLessThanOrEqual(1);
    }
    if (width === 1280) await page.screenshot({ path: '/tmp/font-generator-pricing-aligned.png', fullPage: true });
  }
  await page.getByText('How do credits work?', { exact: true }).click();
  await expect(page.getByText('One basic English font costs 100 credits.', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Log in to purchase', exact: true }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fpricing$/);
  await page.goto('/pricing');
  await page.getByRole('link', { name: 'Use free tools', exact: true }).click();
  await expect(page).toHaveURL('http://localhost:3211/');
});

test('local matching preserves the paid prompt and never starts a generation', async ({ page }) => {
  const paid: string[] = [];
  page.on('request', request => { if (request.method() === 'POST') paid.push(request.url()); });
  await page.goto('/ai-font-generator');
  const draft = 'A custom serif for my book cover';
  await page.getByLabel('Font description', { exact: true }).fill(draft);
  await page.getByText('Find a reference by description', { exact: true }).click();
  await page.getByLabel('Describe a style to try for free').fill('retro pixel game');
  await page.getByRole('button', { name: 'Match a reference style', exact: true }).click();
  await expect(page.getByText('Matched Arcade, an existing reference font.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Arcade', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Font description', { exact: true })).toHaveValue(draft);
  await page.getByLabel('Describe a style to try for free').fill('something utterly different');
  await page.getByRole('button', { name: 'Match a reference style', exact: true }).click();
  await expect(page.getByText('No close match in our reference set.', { exact: false })).toBeVisible();
  expect(paid).toEqual([]);
});

test('partial credits cannot generate; credit history shows charged and restored amounts', async ({ page }) => {
  await page.route('**/api/ai-font/account', route => route.fulfill({ json: {
    user: { email: 'test@example.com' }, credits: 99, jobs: [], orders: [],
    creditEvents: [{ id: 2, kind: 'restore', delta: 100, created_at: '2026-10-06T00:00:00Z' }, { id: 1, kind: 'job', delta: -100, created_at: '2026-10-06T00:00:00Z' }],
    services: { auth: true, generation: true, checkout: true, sandbox: true },
  } }));
  await page.goto('/ai-font-generator');
  await expect(page.getByText('0 generations available', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Generate font · 100 credits' })).toBeDisabled();
  await expect(page.getByRole('link', { name: 'View plans & credits' })).toHaveAttribute('href', '/pricing');
  await page.getByText('Credit activity', { exact: true }).click();
  await expect(page.getByText('+100 credits', { exact: true })).toBeVisible();
  await expect(page.getByText('-100 credits', { exact: true })).toBeVisible();
});

test('account page edits profile and shows credits and subscription cancellation (mocked)', async ({ page }) => {
  let displayName = 'Font User', cancelRequested: string | null = null;
  await page.route('**/api/ai-font/account', route => route.fulfill({ json: {
    user: { email: 'user@example.com', displayName, avatarUrl: null, provider: 'Google', createdAt: '2026-10-01T00:00:00Z' }, credits: 300,
    orders: [], creditEvents: [{ id: 1, kind: 'billing', delta: 300, created_at: '2026-10-01T00:00:00Z' }],
    subscriptions: [{ id: '10000000-0000-4000-8000-000000000001', plan_id: 'Test monthly', status: 'active', billing_interval: 'monthly', credits_per_period: 300, current_period_end: '2026-11-01T00:00:00Z', cancel_requested_at: cancelRequested }],
  } }));
  await page.route('**/api/ai-font/profile', async route => { displayName = route.request().postDataJSON().displayName; await route.fulfill({ json: { ok: true } }); });
  await page.route('**/api/ai-font/subscriptions/cancel', async route => { cancelRequested = new Date().toISOString(); await route.fulfill({ json: { status: 'requested' } }); });
  await page.goto('/account');
  await expect(page.getByText('300 credits', { exact: true })).toBeVisible();
  await page.getByLabel('Display name').fill('New name');
  await page.getByRole('button', { name: 'Save name' }).click();
  await expect(page.getByRole('status')).toHaveText('Display name saved.');
  await page.reload(); await expect(page.getByLabel('Display name')).toHaveValue('New name');
  await page.getByRole('button', { name: 'Cancel subscription', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm cancellation' }).click();
  await expect(page.getByText('Cancellation requested. Refresh to check the latest status.')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: '/tmp/font-account-mobile.png', fullPage: true });
});

test('Waffo checkout uses the selected provider (mocked)', async ({ page }) => {
  await page.route('**/api/ai-font/account', route => route.fulfill({ json: { user: { email: 'test@example.com' }, credits: 0, jobs: [], orders: [], creditEvents: [], subscriptions: [], services: { auth: true, generation: true, checkout: true, provider: 'waffo', sandbox: true } } }));
  await page.route('**/api/ai-font/orders', async route => { expect(route.request().postDataJSON().provider).toBe('waffo'); await route.fulfill({ json: { approvalUrl: 'https://checkout.waffo.ai/test' } }); });
  await page.route('https://checkout.waffo.ai/test', route => route.fulfill({ contentType: 'text/html', body: '<h1>Mock Waffo checkout</h1>' }));
  await page.goto('/pricing'); await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Buy 3 generations with Waffo' }).click();
  await expect(page.getByRole('heading', { name: 'Mock Waffo checkout' })).toBeVisible();
});

test('generator comes first and gates login, credits, service availability and active jobs', async ({ page }) => {
  let state: Record<string, unknown> = {};
  const paidCalls: string[] = [];
  page.on('request', request => { if (request.method() === 'POST' && /\/api\/ai-font\/(jobs|orders)/.test(request.url())) paidCalls.push(request.url()); });
  await page.route('**/api/ai-font/account', route => route.fulfill({ json: { credits: 300, jobs: [], orders: [], creditEvents: [], subscriptions: [], services: { auth: true, generation: true, checkout: true }, ...state } }));
  for (const scenario of [
    { user: null, credits: 300, enabled: false },
    { user: { email: 'test@example.com' }, credits: 0, subscriptions: [{ status: 'active' }], enabled: false },
    { user: { email: 'test@example.com' }, credits: 99, enabled: false },
    { user: { email: 'test@example.com' }, credits: 100, enabled: true },
    { user: { email: 'test@example.com' }, credits: 300, billingRestricted: true, enabled: false },
    { user: { email: 'test@example.com' }, credits: 100, services: { auth: true, generation: false, checkout: true }, enabled: false },
    { user: { email: 'test@example.com' }, credits: 100, jobs: [{ id: 'test', status: 'needs_review', created_at: '2026-10-01' }], enabled: false },
  ]) {
    state = scenario;
    await page.goto('/ai-font-generator');
    const input = page.getByLabel('Font description', { exact: true });
    await input.fill('A friendly rounded typeface for a cafe');
    const generate = page.getByRole('button', { name: 'Generate font · 100 credits' });
    if (scenario.enabled) await expect(generate).toBeEnabled(); else await expect(generate).toBeDisabled();
    await expect(page.getByRole('button', { name: /Buy .* generations/ })).toHaveCount(0);
    const inputBox = await input.boundingBox();
    const tools = await page.getByRole('navigation', { name: 'Font tools' }).boundingBox();
    expect(inputBox!.y + inputBox!.height).toBeLessThan(tools!.y);
    expect(inputBox!.y).toBeLessThan(350);
  }
  state = { user: null };
  await page.goto('/ai-font-generator');
  const login = page.locator('main').getByRole('link', { name: 'Log in', exact: true });
  await expect(login).toHaveAttribute('href', '/login?next=%2Fai-font-generator');
  await login.click();
  await expect(page.getByRole('heading', { name: 'Welcome', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continue with free tools' })).toHaveCount(0);
  expect(paidCalls).toEqual([]);
});

test('billing restrictions pause purchases even with a positive balance', async ({ page }) => {
  const paidCalls: string[] = [];
  page.on('request', request => { if (request.method() === 'POST' && request.url().includes('/api/ai-font/orders')) paidCalls.push(request.url()); });
  await page.route('**/api/ai-font/account', route => route.fulfill({ json: {
    user: { email: 'test@example.com' }, credits: 300, billingRestricted: true,
    services: { checkout: true, sandbox: true, provider: 'waffo' },
  } }));
  await page.goto('/pricing');
  await expect(page.getByRole('button', { name: 'Buy 3 generations with Waffo' })).toBeDisabled();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await expect(page.getByText('Your payment or balance needs review.', { exact: false })).toBeVisible();
  expect(paidCalls).toEqual([]);
});

test('a confirmed checkout under dispute does not promise usable generations', async ({ page }) => {
  await page.route('**/api/ai-font/account', route => route.fulfill({ json: {
    user: { email: 'test@example.com' }, credits: 300, billingRestricted: true, jobs: [], orders: [],
    services: { auth: true, generation: true, checkout: true, provider: 'waffo', sandbox: true },
  } }));
  await page.route('**/api/ai-font/orders/complete', route => route.fulfill({ json: { status: 'paid' } }));
  await page.goto('/ai-font-generator?checkout=return&order=10000000-0000-4000-8000-000000000001');
  await expect(page.getByText('Your payment or balance needs review. Contact support before generating another font.')).toBeVisible();
  await expect(page.getByText(/Your (font )?generations are ready/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Generate font · 100 credits' })).toBeDisabled();
});

test('pricing keeps aligned actions and shows pending payments regardless of account state', async ({ page }) => {
  const scenarios = [
    { checkout: false, user: null, accountError: false },
    { checkout: false, user: { email: 'test@example.com' }, accountError: false },
    { checkout: false, user: null, accountError: true },
    { checkout: true, user: { email: 'test@example.com' }, accountError: false },
  ];
  let scenario = scenarios[0];
  await page.route('**/api/ai-font/account', route => route.fulfill(scenario.accountError
    ? { status: 503, json: { error: 'Account temporarily unavailable' } }
    : { json: { user: scenario.user, credits: 0, services: { checkout: scenario.checkout, sandbox: true, provider: 'waffo' } } }));
  for (const state of scenarios) {
    scenario = state;
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/pricing');
      const buy = page.getByRole('button', { name: state.checkout ? 'Buy 3 generations with Waffo' : 'Payments coming soon' });
      await expect(buy).toBeDisabled();
      if (state.checkout) {
        await page.getByRole('checkbox').check();
        await expect(buy).toBeEnabled();
      } else {
        await expect(page.getByRole('checkbox')).toHaveCount(0);
        await expect(page.getByRole('status')).toContainText('Payments are being set up. Purchases are not available yet.');
        await expect(page.getByRole('link', { name: /Log in (to purchase|again)/ })).toHaveCount(0);
      }
      const freeBounds = await page.getByRole('link', { name: 'Use free tools', exact: true }).boundingBox();
      const buyBounds = await buy.boundingBox();
      expect(freeBounds!.height).toBeLessThanOrEqual(52);
      if (width === 1280) expect(Math.abs(freeBounds!.y + freeBounds!.height - buyBounds!.y - buyBounds!.height)).toBeLessThanOrEqual(1);
    }
  }
});

test('private checkout follows the verified account response and clears access when accounts change', async ({ page }) => {
  let account: { email: string; checkout: boolean } | null = null;
  await page.route('**/api/ai-font/account', route => route.fulfill({ json: {
    user: account ? { email: account.email } : null, credits: 0,
    services: { checkout: account?.checkout ?? false, sandbox: true, provider: 'waffo' },
  } }));
  await page.route('**/api/ai-font/orders', () => { throw new Error('No purchase should be started in this UI test'); });
  await page.goto('/pricing');
  const pending = page.getByRole('button', { name: 'Payments coming soon' });
  const buy = page.getByRole('button', { name: 'Buy 3 generations with Waffo' });
  await expect(pending).toBeDisabled();
  account = { email: 'owner@example.com', checkout: true };
  await page.evaluate(event => window.dispatchEvent(new Event(event)), authChangedEvent);
  await expect(buy).toBeDisabled();
  await page.getByRole('checkbox').check();
  await expect(buy).toBeEnabled();
  account = { email: 'other@example.com', checkout: false };
  await page.evaluate(event => window.dispatchEvent(new Event(event)), authChangedEvent);
  await expect(pending).toBeDisabled();
  await expect(buy).toHaveCount(0);
  await expect(page.getByRole('checkbox')).toHaveCount(0);
});

test('partial account outages preserve the profile and never display a failed wallet as zero', async ({ page }) => {
  await page.route('**/api/ai-font/account', route => route.fulfill({ json: {
    user: { email: 'user@example.com', displayName: 'Font User', avatarUrl: null, provider: 'Google', createdAt: '2026-10-01T00:00:00Z' },
    credits: null, billingUnavailable: true, unavailableSections: ['credits', 'subscriptions', 'purchases'],
    jobs: [], orders: [], subscriptions: [], creditEvents: [], services: { auth: true, generation: false, checkout: false, sandbox: true },
  } }));
  await page.goto('/account');
  await expect(page.getByLabel('Display name')).toHaveValue('Font User');
  await expect(page.getByText('user@example.com', { exact: true })).toBeVisible();
  await expect(page.getByText('Your balance could not load. Please try again.')).toBeVisible();
  await expect(page.getByText('0 credits', { exact: true })).toHaveCount(0);
  await expect(page.getByText('No purchases yet.', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Purchases could not load. Please try again.')).toBeVisible();
  await page.goto('/ai-font-generator');
  await page.getByLabel('Font description').fill('A friendly rounded display font');
  await expect(page.getByRole('button', { name: 'Generate font · 100 credits' })).toBeDisabled();
  await expect(page.getByText('Account services are temporarily unavailable.', { exact: false })).toBeVisible();
  await page.goto('/pricing');
  await expect(page.getByRole('button', { name: 'Payments coming soon' })).toBeDisabled();
  await expect(page.getByText('Your account services could not load.', { exact: false })).toBeVisible();
});

test('the account library link opens a private page with saved fonts, not the generation form', async ({ page, request }) => {
  const id = '10000000-0000-4000-8000-000000000002';
  const paidCalls: string[] = [];
  page.on('request', req => { if (req.method() === 'POST' && /\/api\/ai-font\/(jobs|orders)/.test(req.url())) paidCalls.push(req.url()); });
  await page.route('**/api/ai-font/account', route => route.fulfill({ json: {
    user: { email: 'user@example.com', displayName: 'Font User', avatarUrl: null, provider: 'Google', createdAt: '2026-10-01T00:00:00Z' },
    credits: 300, billingUnavailable: true, unavailableSections: ['billing'], orders: [], subscriptions: [], creditEvents: [],
    jobs: [{ id, name: 'My saved font', prompt: 'A bold display font', status: 'succeeded', created_at: '2026-10-06T00:00:00Z' }],
    services: { auth: true, generation: false, checkout: false, sandbox: true },
  } }));
  await page.route(`**/api/ai-font/jobs/${id}/download`, route => route.fulfill({ json: { url: 'http://localhost:3211/test-font.ttf' } }));
  await page.route('**/test-font.ttf', route => route.fulfill({ path: 'tests/ai-font/fixtures/mixfont-standard.ttf', contentType: 'font/ttf' }));
  await page.goto('/account');
  await page.getByRole('link', { name: 'My fonts & purchases', exact: true }).click();
  await expect(page).toHaveURL(/\/my-fonts$/);
  await expect(page.getByRole('heading', { name: 'My fonts & purchases', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'My saved font', exact: true })).toBeVisible();
  await expect(page.getByLabel('Font description')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Download TTF ↓' })).toBeEnabled();
  await page.getByRole('button', { name: 'Preview & create artwork' }).click();
  await expect(page.getByText('Editing with your generated font:', { exact: false })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  expect(await (await request.get('/sitemap.xml')).text()).not.toContain('/my-fonts');
  expect(paidCalls).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/font-generator-my-fonts.png', fullPage: true });
});

test('the private font library has its own sign-in return path', async ({ page }) => {
  await page.goto('/my-fonts');
  await expect(page.getByRole('link', { name: 'Continue to Google sign-in' })).toHaveAttribute('href', '/login?next=%2Fmy-fonts');
  await expect(page.getByLabel('Font description')).toHaveCount(0);
});

test('account workspace keeps its structure while loading and shares recent data with the font library', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const failed = { id: '10000000-0000-4000-8000-000000000071', name: null, prompt: 'A romantic Roman serif font', status: 'failed', credit_cost: 100, failure_code: 'service_unavailable', created_at: '2026-10-25T12:00:00Z', updated_at: '2026-10-25T12:00:08Z' };
  const fixture = { user: { email: 'jamie@example.com', displayName: 'Jamie Chen', avatarUrl: null, provider: 'Google', createdAt: '2026-10-01T00:00:00Z' }, credits: 300, billingUnavailable: false, unavailableSections: [],
    jobs: [failed, { ...failed, id: '10000000-0000-4000-8000-000000000072', name: 'Sunday Serif', status: 'succeeded', failure_code: null }], orders: [], subscriptions: [],
    creditEvents: [{ id: 1, kind: 'restore', delta: 100, created_at: failed.updated_at }, { id: 2, kind: 'job', delta: -100, created_at: failed.created_at }],
    services: { auth: true, generation: true, checkout: true, sandbox: true } };
  let requests = 0, release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/ai-font/account', async route => { requests++; await gate; await route.fulfill({ json: fixture }); });
  const paid: string[] = [];
  page.on('request', req => { if (req.method() === 'POST' && /\/api\/ai-font\/(jobs|orders)/.test(req.url())) paid.push(req.url()); });
  await page.goto('/account');
  await expect(page.getByRole('navigation', { name: 'Account navigation' })).toBeVisible();
  await expect(page.getByRole('status', { name: 'Loading account' })).toBeVisible();
  await page.screenshot({ path: '/tmp/font-generator-account-loading.png', fullPage: true });
  release();
  await expect(page.getByLabel('Display name')).toHaveValue('Jamie Chen');
  await expect(page.getByRole('heading', { name: 'Your credits', exact: true })).toBeVisible();
  await page.screenshot({ path: '/tmp/font-generator-account-workspace.png', fullPage: true });
  await page.screenshot({ path: '/tmp/font-generator-account-preview.png' });
  await page.getByRole('link', { name: 'My fonts & purchases', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'My fonts & purchases', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sunday Serif', exact: true })).toBeVisible();
  expect(requests).toBe(1);
  await page.screenshot({ path: '/tmp/font-generator-library-preview.png' });
  await page.getByRole('button', { name: 'View details for Custom English font' }).click();
  const details = page.getByRole('dialog');
  await expect(details).toBeVisible();
  await expect(details.getByRole('heading', { name: 'Generation service unavailable' })).toBeVisible();
  await expect(details.getByText('100 credits restored.', { exact: false })).toBeVisible();
  await expect(details.getByText(failed.id, { exact: true })).toBeVisible();
  await page.screenshot({ path: '/tmp/font-generator-task-details.png', fullPage: true });
  await page.screenshot({ path: '/tmp/font-generator-task-details-preview.png' });
  await details.getByRole('button', { name: 'Close task details' }).press('Escape');
  await expect(details).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'View details for Custom English font' })).toBeFocused();
  await page.getByRole('group', { name: 'Filter fonts' }).getByRole('button', { name: 'Failed 1' }).click();
  await expect(page.getByRole('heading', { name: 'Sunday Serif', exact: true })).toHaveCount(0);
  await page.screenshot({ path: '/tmp/font-generator-font-library-workspace.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/font-generator-font-library-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'View details for Custom English font' }).click();
  expect(await details.evaluate(element => element.scrollWidth <= innerWidth)).toBe(true);
  await details.getByRole('button', { name: 'Back to fonts' }).click();
  await page.getByRole('link', { name: 'Account & billing', exact: true }).click();
  await expect(page.getByLabel('Display name')).toHaveValue('Jamie Chen');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/font-generator-account-mobile.png', fullPage: true });
  expect(paid).toEqual([]);
});

test('old failures stay unknown and an uncertain task never claims a refund', async ({ page }) => {
  const base = { id: '10000000-0000-4000-8000-000000000081', name: 'Older attempt', prompt: 'A friendly rounded font', status: 'failed', created_at: '2026-10-24T10:00:00Z' };
  await page.route('**/api/ai-font/account', route => route.fulfill({ json: {
    user: { email: 'user@example.com' }, credits: 200, orders: [], creditEvents: [],
    jobs: [base, { ...base, id: '10000000-0000-4000-8000-000000000082', name: 'Awaiting confirmation', status: 'needs_review', credit_cost: 100 }],
    services: { auth: true, generation: true, checkout: true, sandbox: true },
  } }));
  await page.goto('/my-fonts');
  await page.getByRole('button', { name: 'View details for Older attempt' }).click();
  await expect(page.getByRole('dialog').getByText('A detailed reason was not recorded for this task.')).toBeVisible();
  await page.getByRole('button', { name: 'Close task details' }).click();
  await page.getByRole('button', { name: 'View details for Awaiting confirmation' }).click();
  await expect(page.getByRole('dialog').getByText('Credits remain reserved while the outcome is checked; a refund has not been confirmed.')).toBeVisible();
  await expect(page.getByRole('dialog').getByText('Restored', { exact: false })).toHaveCount(0);
});

test('account loading times out with retry instead of spinning forever', async ({ page }) => {
  await page.route('**/api/ai-font/account', () => {});
  await page.goto('/account');
  await expect(page.getByText('Taking longer than usual.', { exact: false })).toBeVisible({ timeout: 6000 });
  await expect(page.getByRole('alert').filter({ hasText: 'taking longer than expected' })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('status', { name: 'Loading account' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeEnabled();
});

test('account typography stays inside the workspace without changing public pages or shared navigation', async ({ page }) => {
  await page.route('**/api/ai-font/account', route => route.fulfill({ json: {
    user: { email: 'fixture@example.com', displayName: 'Font User' }, credits: 300, jobs: [], orders: [], creditEvents: [], subscriptions: [],
    services: { auth: true, generation: true, checkout: true, sandbox: true },
  } }));
  const sharedTypography = () => page.evaluate(() => ({
    body: getComputedStyle(document.body).fontFamily,
    header: getComputedStyle(document.querySelector('header')!).fontFamily,
    footer: getComputedStyle(document.querySelector('footer')!).fontFamily,
    variables: ['--font-sans','--font-geist-sans','--font-geist-mono'].map(name => getComputedStyle(document.documentElement).getPropertyValue(name).trim()),
  }));
  await page.goto('/');
  const original = await sharedTypography();
  expect(original.body).toBe('Arial, Helvetica, sans-serif');
  expect(original.variables).toEqual(['','','']);
  const hero = await page.getByRole('heading', { level: 1, name: 'Free Font Generator', exact: true }).evaluate(element => {
    const style = getComputedStyle(element);
    return { family: style.fontFamily, weight: style.fontWeight, spacing: style.letterSpacing, size: style.fontSize };
  });
  expect(hero.weight).toBe('500');
  expect(await page.locator('header .brand-gradient-text').evaluate(element => getComputedStyle(element).fontWeight)).toBe('500');
  expect(await page.locator('[data-generator-directory-scroll] a').first().evaluate(element => getComputedStyle(element).fontWeight)).toBe('500');
  for (const target of ['/account','/my-fonts']) {
    await page.goto(target);
    await expect(page.getByRole('navigation', { name: 'Account navigation' })).toBeVisible();
    const workspace = page.getByRole('navigation', { name: 'Account navigation' }).locator('..').locator('..');
    expect(await workspace.evaluate(element => getComputedStyle(element).getPropertyValue('--font-sans').trim())).toBe('ui-sans-serif');
    expect(await workspace.evaluate(element => getComputedStyle(element).fontFamily)).toContain('ui-sans-serif');
    expect(await sharedTypography()).toEqual(original);
  }
  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Home', exact: true }).first().click();
  await expect(page).toHaveURL(/\/$/);
  expect(await sharedTypography()).toEqual(original);
  expect(await page.getByRole('heading', { level: 1, name: 'Free Font Generator', exact: true }).evaluate(element => {
    const style = getComputedStyle(element);
    return { family: style.fontFamily, weight: style.fontWeight, spacing: style.letterSpacing, size: style.fontSize };
  })).toEqual(hero);
  await page.screenshot({ path: '/tmp/font-generator-home-restored.png' });
});
