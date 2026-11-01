import { test, expect } from './fixtures';
import { writeFile } from 'node:fs/promises';

test('paste, accessible cropping and explicit font preview handle failures and stale results', async ({ page }) => {
  // The real matcher is covered below; isolate these UI states from inference time.
  await page.route('**/font-identifier-worker.js', route => route.fulfill({ contentType: 'text/javascript', body: `self.onmessage = () => self.postMessage({ type: 'results', matches: [{ family: 'Oswald', styleName: 'Regular', weight: 400, style: 'normal' }] });` }));
  await page.goto('/font-identifier');
  await page.getByRole('region', { name: 'Font identifier workspace' }).evaluate(async element => {
    const c = document.createElement('canvas'); c.width = 400; c.height = 100;
    const blob = await new Promise<Blob>(resolve => c.toBlob(blob => resolve(blob!)));
    const transfer = new DataTransfer(); transfer.items.add(new File([blob], 'paste.png', { type: 'image/png' }));
    element.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: transfer }));
  });
  await expect(page.getByLabel('Crop width')).toHaveValue('400');
  const box = (await page.locator('canvas').boundingBox())!;
  await page.mouse.move(box.x + box.width * .1, box.y + box.height * .1);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .8, box.y + box.height * .8);
  await page.mouse.up();
  expect(Number(await page.getByLabel('Crop width').inputValue())).toBeLessThan(400);
  await page.getByLabel('Crop width').fill('1');
  await page.getByRole('button', { name: 'Identify font locally' }).click();
  await expect(page.getByText('Select a crop at least 16 × 16 pixels.')).toBeVisible();
  await page.getByRole('button', { name: 'Use whole image' }).click();
  await page.getByRole('button', { name: 'Identify font locally' }).click();
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.getByRole('button', { name: 'Preview Oswald' }).click();
  await expect(page.getByText('Preview font could not load.', { exact: false })).toBeVisible();
  await expect(page.getByTestId('font-match-preview')).toHaveCount(0);
  await page.unroute('https://fonts.googleapis.com/**');
  const urls: string[] = [];
  await page.route('https://fonts.googleapis.com/**', route => { urls.push(route.request().url()); return route.fulfill({ contentType: 'text/css', body: '@font-face { font-family: "Oswald"; font-style: normal; font-weight: 400; src: url("http://localhost:3212/fonts/discovery/oswald/latin.woff2") format("woff2"); }' }); });
  await page.getByLabel('Text to compare').fill('Private comparison 123');
  await page.getByRole('button', { name: 'Preview Oswald' }).click();
  await expect(page.getByTestId('font-match-preview')).toHaveText('Private comparison 123');
  expect(urls.every(url => !url.includes('text=') && !url.includes('Private'))).toBe(true);
  await page.getByLabel('Crop x', { exact: true }).fill('5');
  await expect(page.getByTestId('font-match-preview')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Preview Oswald' })).toHaveCount(0);
});

test('local identifier matches real font crops without uploading and supports cancellation and isolation', async ({ page, request }) => {
  test.setTimeout(180000);
  // Exercise the CPU fallback even on machines with WebGPU support.
  await page.route('**/font-identifier-worker.js', async route => { const response = await route.fetch(); await route.fulfill({ response, body: `Object.defineProperty(self.navigator, 'gpu', { value: undefined });\n${await response.text()}` }); });
  const network: string[] = [];
  page.on('request', req => { if (req.method() === 'POST' || /font-identifier-engine/.test(req.url())) network.push(`${req.method()} ${req.url()}`); });
  await page.goto('/font-identifier');
  expect(network).toEqual([]);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://font-generators.org/font-identifier');
  for (const text of ['What is this font identifier?', 'How to find a font', 'Does my image leave my device?']) expect(await (await request.get('/font-identifier')).text()).toContain(text);
  const cases = [];
  for (const family of ['Anton', 'EB Garamond', 'Luckiest Guy', 'Oswald']) {
    for (const degraded of [false, true]) {
      const data = await page.evaluate(async ({ family, degraded }) => {
        const weight = family === 'Oswald' ? 700 : 400;
        await document.fonts.load(`${weight} 64px "${family}"`);
        const c = document.createElement('canvas'); c.width = 850; c.height = 110;
        const ctx = c.getContext('2d')!; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.fillStyle = '#111'; ctx.font = `${weight} 64px "${family}"`; ctx.fillText('Find these letters', 24, 80);
        return c.toDataURL(degraded ? 'image/jpeg' : 'image/png', .4).split(',')[1];
      }, { family, degraded });
      await page.getByLabel('Image · PNG, JPEG or WebP').setInputFiles({ name: 'sample.png', mimeType: degraded ? 'image/jpeg' : 'image/png', buffer: Buffer.from(data, 'base64') });
      await expect(page.getByRole('status').first()).toContainText('Drag around');
      const start = Date.now();
      await page.getByRole('button', { name: 'Identify font locally', exact: true }).click();
      await expect(page.getByRole('status').first()).toContainText('Closest Google Fonts', { timeout: 65000 });
      const names = await page.locator('ol strong').allTextContents();
      cases.push({ family, degraded, rank: names.indexOf(family) + 1, elapsedMs: Date.now() - start, candidates: names });
      expect(names).toContain(family);
    }
  }
  await writeFile('/tmp/font-identifier-benchmark.json', JSON.stringify(cases, null, 2));
  expect(network.some(url => url.startsWith('POST'))).toBe(false);
  expect(network.filter(url => url.includes('/catalogs/'))).toEqual([]);
  for (const width of [390, 1440]) { await page.setViewportSize({ width, height: 950 }); await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: `/tmp/font-identifier-results-${width}.png`, fullPage: true }); }
  await page.getByRole('button', { name: 'Identify font locally', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('status').first()).toContainText('Cancelled');
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `/tmp/font-identifier-${width}.png`, fullPage: true });
  }
  await page.getByRole('button', { name: 'Clear image', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Identify font locally', exact: true })).toBeDisabled();
  network.length = 0;
  for (const path of ['/', '/small-text-generator', '/cute-font-generator']) await page.goto(path);
  expect(network).toEqual([]);
});

test('identifier handles blank and invalid images, model failures, and directory SEO', async ({ page, request }) => {
  await page.goto('/font-identifier');
  const input = page.getByLabel('Image · PNG, JPEG or WebP');
  await input.setInputFiles({ name: 'bad.png', mimeType: 'image/png', buffer: Buffer.from('not an image') });
  await expect(page.getByRole('region', { name: 'Font identifier workspace' }).getByRole('alert')).toBeVisible();
  const base64 = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 400; c.height = 100; const ctx = c.getContext('2d')!; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 400, 100); return c.toDataURL().split(',')[1]; });
  await input.setInputFiles({ name: 'blank.png', mimeType: 'image/png', buffer: Buffer.from(base64, 'base64') });
  await expect(page.getByRole('status').first()).toContainText('Drag around');
  await page.route('**/font-identifier-engine/**', route => route.abort());
  await page.getByRole('button', { name: 'Identify font locally' }).click();
  await expect(page.getByRole('region', { name: 'Font identifier workspace' }).getByRole('alert')).toBeVisible();
  await page.unroute('**/font-identifier-engine/**');
  await page.getByRole('button', { name: 'Identify font locally' }).click();
  await expect(page.getByRole('status').first()).toContainText('No usable text found', { timeout: 65000 });
  for (const path of ['/sitemap.xml', '/llms.txt', '/tools']) expect(await (await request.get(path)).text()).toContain('/font-identifier');
  await page.goto('/tools');
  await page.getByRole('searchbox', { name: 'Search all tools' }).fill('font detector');
  await expect(page.locator('main a[href="/font-identifier"]')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button', { name: 'Show Font Tools tools' })).toHaveCount(0);
});
