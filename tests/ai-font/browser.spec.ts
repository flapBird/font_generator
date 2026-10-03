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
  expect(paidCalls).toEqual([]);
  expect(await page.locator('script[src*="supabase"],script[src*="paypal.com/sdk"]').count()).toBe(0);
  await page.screenshot({ path: '/tmp/font-generator-ai-font-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel('Font description')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/font-generator-ai-font-mobile.png', fullPage: true });
});

test('existing tools remain public and do not load the new account API', async ({ page }) => {
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

test('paid routes reject unauthenticated and cross-origin requests', async ({ request }) => {
  const account = await request.get('/api/ai-font/account');
  expect(account.status()).toBe(200);
  expect((await account.json()).user).toBeNull();
  expect(account.headers()['cache-control']).toContain('no-store');
  for (const path of ['jobs', 'orders', 'orders/complete']) {
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
  credits = 3;
  await page.route('**/api/ai-font/orders/complete', (route) => route.fulfill({ json: { status: 'paid' } }));
  await page.route('**/api/ai-font/jobs', async (route) => {
    submitted = route.request().postDataJSON(); credits = 2;
    await route.fulfill({ status: 202, json: { id: submitted?.id } });
  });
  await page.goto('/ai-font-generator?checkout=return&order=10000000-0000-4000-8000-000000000001');
  await expect(page.getByText('3 generations available')).toBeVisible();
  expect(submitted).toBeUndefined();
  await page.getByLabel('Font description').fill('A friendly rounded display font for a cafe');
  await page.getByRole('button', { name: 'Generate font · 1 generation' }).click();
  await expect(page.getByText('2 generations available')).toBeVisible();
  expect(submitted?.prompt).toBe('A friendly rounded display font for a cafe');
  expect(submitted?.id).toMatch(/^[a-f0-9-]{36}$/);
});
