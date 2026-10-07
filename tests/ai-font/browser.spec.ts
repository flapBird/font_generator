import { test, expect } from '@playwright/test';

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
  await expect(page.getByRole('button', { name: 'Paid generation coming soon' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Download PNG', exact: true })).toBeEnabled();
  const freeExport = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PNG', exact: true }).click();
  expect((await freeExport).suggestedFilename()).toBe('Arcade-square.png');
  expect(paidCalls).toEqual([]);
  expect(await page.locator('script[src*="supabase"],script[src*="paypal.com/sdk"]').count()).toBe(0);
  await page.screenshot({ path: '/tmp/font-generator-ai-font-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel('Font description')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/font-generator-ai-font-mobile.png', fullPage: true });
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
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeDisabled();
    await expect(page.getByText('Google sign-in is not available yet.', { exact: false })).toBeVisible();
    await page.getByRole('link', { name: 'Continue with free tools' }).click();
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
  await page.goto('/ai-font-generator');
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
  await page.route(`**/api/ai-font/jobs/${id}/download`, route => route.fulfill({ json: { url: 'http://localhost:3211/test-font.woff2' } }));
  await page.route('**/test-font.woff2', route => route.fulfill({ path: 'node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2', contentType: 'font/woff2' }));
  await page.goto('/ai-font-generator');
  await expect(page.getByRole('button', { name: 'Download PNG', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Preview & create artwork' }).click();
  await expect(page.getByText('Editing with your generated font:', { exact: false })).toBeVisible();
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

test('pricing is public, uses the same credit allowance, and links to the studio', async ({ page }) => {
  for (const width of [1280, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/pricing');
    await expect(page.getByRole('heading', { name: 'Free to explore. Pay to create a font.' })).toBeVisible();
    await expect(page.getByText('300 credits · 100 per basic English font', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByText('How do credits work?', { exact: true }).click();
  await expect(page.getByText('One basic English font costs 100 credits.', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Explore AI Font Studio', exact: true }).click();
  await expect(page).toHaveURL(/\/ai-font-generator#create-title$/);
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
  await expect(page.getByText('0 generations available', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Generate font · 100 credits' })).toHaveCount(0);
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
  await page.goto('/ai-font-generator'); await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Buy 3 generations with Waffo' }).click();
  await expect(page.getByRole('heading', { name: 'Mock Waffo checkout' })).toBeVisible();
});
