import { test, expect } from './fixtures';

test('homepage switches between grid and list without changing text, results or copying', async ({ page, context, request }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const input = page.getByLabel('Enter your text', { exact: true });
  const results = page.locator('#generated-results');
  const cards = results.getByRole('button');
  const grid = page.getByRole('button', { name: 'Grid', exact: true });
  const list = page.getByRole('button', { name: 'List', exact: true });
  await expect(grid).toHaveAttribute('aria-pressed', 'true');
  expect((await cards.nth(0).boundingBox())!.y).toBe((await cards.nth(1).boundingBox())!.y);
  await page.screenshot({ path: '/tmp/home-result-grid.png', animations: 'disabled' });
  const text = 'Ab 👩‍💻 e\u0301\n' + 'x'.repeat(180);
  await input.fill(text);
  const outputs = await cards.locator('p').allTextContents();
  await list.focus(); await page.keyboard.press('Enter');
  await expect(list).toHaveAttribute('aria-pressed', 'true');
  await expect(grid).toHaveAttribute('aria-pressed', 'false');
  await expect(input).toHaveValue(text);
  expect(await cards.locator('p').allTextContents()).toEqual(outputs);
  expect((await cards.nth(1).boundingBox())!.y).toBeGreaterThan((await cards.nth(0).boundingBox())!.y);
  await cards.first().focus(); await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(outputs[0]);
  await grid.click();
  await expect(input).toHaveValue(text);
  expect(await cards.locator('p').allTextContents()).toEqual(outputs);
  const boxes = await cards.locator('p').evaluateAll(elements => elements.map(el => ({ width: el.clientWidth, scrollWidth: el.scrollWidth, height: el.clientHeight, scrollHeight: el.scrollHeight })));
  expect(boxes.every(box => box.scrollWidth <= box.width && box.scrollHeight <= box.height + 1)).toBe(true);
  await page.getByRole('button', { name: 'Clear input', exact: true }).click();
  await expect(grid).toHaveAttribute('aria-pressed', 'true');
  await expect(input).toHaveValue('');
  const llms = await (await request.get('/llms.txt')).text();
  expect(llms).toContain('Homepage results default to two columns');
});

test('homepage uses one column on narrow screens and retains desktop layout choice through resize', async ({ page }) => {
  await page.goto('/');
  for (const width of [320, 390, 767, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const cards = page.locator('#generated-results').getByRole('button');
    const first = (await cards.nth(0).boundingBox())!, second = (await cards.nth(1).boundingBox())!;
    expect(second.y === first.y).toBe(width >= 768);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width < 768) await expect(page.getByRole('group', { name: 'Results layout' })).toBeHidden();
    if (width === 390) await page.screenshot({ path: '/tmp/home-result-mobile.png', animations: 'disabled' });
  }
  await page.getByRole('button', { name: 'List', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.getByRole('button', { name: 'List', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('individual generator result layouts remain unchanged', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const path of ['/small-text-generator', '/bold-text-generator', '/zalgo-text-generator']) {
    await page.goto(path);
    await expect(page.getByRole('group', { name: 'Results layout' })).toHaveCount(0);
    const cards = page.getByRole('button', { name: /^Copy / });
    const first = (await cards.nth(0).boundingBox())!, second = (await cards.nth(1).boundingBox())!;
    expect(second.y).toBeGreaterThan(first.y);
    expect(second.x).toBe(first.x);
  }
});
