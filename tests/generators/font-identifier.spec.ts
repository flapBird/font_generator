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
  await page.getByText('Adjust crop coordinates', { exact: true }).click();
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
  await page.route('https://fonts.googleapis.com/**', route => { urls.push(route.request().url()); return route.fulfill({ contentType: 'text/css', body: `@font-face { font-family: "Oswald"; font-style: normal; font-weight: 400; src: url("${new URL('/fonts/discovery/oswald/latin.woff2', page.url()).href}") format("woff2"); }` }); });
  await page.getByLabel('Text to compare').fill('Private comparison 123');
  await page.getByRole('button', { name: 'Preview Oswald' }).click();
  await expect(page.getByTestId('font-match-preview')).toHaveText('Private comparison 123');
  expect(urls.every(url => !url.includes('text=') && !url.includes('Private'))).toBe(true);
  await page.getByRole('button', { name: 'Adjust crop', exact: true }).click();
  await page.getByText('Adjust crop coordinates', { exact: true }).click();
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
      const showAll = page.getByRole('button', { name: /Show all \d+ candidates/ });
      if (await showAll.count()) await showAll.click();
      const names = await page.getByRole('complementary', { name: 'Font candidates' }).locator('ol strong').allTextContents();
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
  await expect(page.getByRole('heading', { name: 'Find the font in your image.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Identify font locally', exact: true })).toHaveCount(0);
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
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button', { name: 'Show Font Tools tools' })).toBeVisible();
});

test('sample flow reveals all real results, loads fonts on request, and keeps comparison usable on phones', async ({ page, request }) => {
  const matches = ['Oswald', 'Caveat', 'Bebas Neue', 'Anton', 'Roboto', 'EB Garamond', 'Luckiest Guy', 'Poppins', 'Montserrat', 'Berkshire Swash']
    .map(family => ({ family, styleName: 'Regular', weight: 400, style: 'normal' }));
  await page.route('**/font-identifier-worker.js', route => route.fulfill({
    contentType: 'text/javascript',
    body: 'self.onmessage = () => self.postMessage({ type: "results", matches: ' + JSON.stringify(matches) + ' });',
  }));
  const fontRequests: string[] = [];
  await page.route('https://fonts.googleapis.com/**', route => {
    const url = route.request().url(); fontRequests.push(url);
    const family = new URL(url).searchParams.get('family')!.split(':')[0];
    const slug = ({ Oswald: 'oswald', Caveat: 'caveat', 'Bebas Neue': 'bebas-neue' } as Record<string, string>)[family];
    return route.fulfill({ contentType: 'text/css', body: '@font-face { font-family: "' + family + '"; font-style: normal; font-weight: 400; src: url("' + new URL('/fonts/discovery/' + slug + '/latin.woff2', page.url()).href + '") format("woff2"); }' });
  });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/font-identifier');
  await page.screenshot({ path: '/tmp/font-identifier-design-upload-desktop.png', fullPage: true });
  expect(fontRequests).toEqual([]);
  await page.getByRole('button', { name: /Identify this sample/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Choose one clear line.');
  await expect(page.locator('canvas')).toHaveJSProperty('width', 1100);
  await page.screenshot({ path: '/tmp/font-identifier-design-crop-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Identify font locally', exact: true }).click();
  const candidates = page.getByRole('complementary', { name: 'Font candidates' });
  await expect(candidates.locator('ol li')).toHaveCount(3);
  expect(fontRequests).toEqual([]);
  await expect(page.getByTestId('font-match-preview')).toHaveCount(0);
  await page.getByRole('button', { name: 'Load candidate previews', exact: true }).click();
  await expect(page.getByTestId('font-match-preview')).toHaveText('A little more human.');
  await expect(candidates.getByText('Aa', { exact: true })).toHaveCount(3);
  expect(fontRequests).toHaveLength(3);
  await page.getByLabel('Text to compare').fill('Private 字体 👋 123');
  await page.getByLabel('Size', { exact: true }).focus();
  await page.keyboard.press('End');
  await page.getByRole('button', { name: 'Preview Caveat Regular', exact: true }).click();
  await expect(page.getByTestId('font-match-preview')).toHaveText('Private 字体 👋 123');
  await expect(page.getByTestId('font-match-preview')).toHaveCSS('font-size', '76px');
  await expect(page.getByTestId('font-match-preview')).toHaveCSS('font-family', /Caveat/);
  await expect(page.getByRole('link', { name: 'Open Caveat', exact: false })).toHaveAttribute('href', 'https://fonts.google.com/specimen/Caveat');
  expect(fontRequests).toHaveLength(3);
  expect(fontRequests.every(url => !url.includes('text=') && !url.includes('Private'))).toBe(true);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 950 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const image = (await page.getByLabel('Your selected image', { exact: true }).boundingBox())!;
    const preview = (await page.getByTestId('font-match-preview').boundingBox())!;
    expect(preview.y - image.y - image.height).toBeLessThan(130);
    await page.screenshot({ path: '/tmp/font-identifier-design-results-' + width + '.png', fullPage: true });
  }
  await page.getByRole('button', { name: 'Preview Oswald Regular', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('font-match-preview')).toHaveCSS('font-family', /Oswald/);
  await page.getByRole('button', { name: 'Show all 10 candidates' }).click();
  await expect(candidates.locator('ol li')).toHaveCount(10);
  expect(fontRequests).toHaveLength(3);
  await page.getByRole('button', { name: 'Adjust crop', exact: true }).click();
  await expect(candidates).toHaveCount(0);
  await expect(page.getByTestId('font-match-preview')).toHaveCount(0);
  await page.getByText('Adjust crop coordinates', { exact: true }).click();
  await page.getByLabel('Crop width').fill('800');
  await page.getByRole('button', { name: 'Clear image', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find the font in your image.');
  await page.screenshot({ path: '/tmp/font-identifier-design-upload-mobile.png', fullPage: true });
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.screenshot({ path: '/tmp/font-identifier-design-upload-dark.png', fullPage: true });
  const llms = await (await request.get('/llms.txt')).text();
  expect(llms).toContain('initially showing three');
  expect(llms).toContain('only after user action');
  expect(errors).toEqual([]);
});

test('matching status, cancellation, timeout and retry preserve the crop', async ({ page }) => {
  await page.route('**/font-identifier-worker.js', route => route.fulfill({
    contentType: 'text/javascript',
    body: 'self.onmessage = () => self.postMessage({ type: "status", message: "Comparing letter shapes on your device…" });',
  }));
  await page.goto('/font-identifier');
  await page.getByRole('button', { name: /Identify this sample/ }).click();
  await page.getByRole('button', { name: 'Identify font locally', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Looking for similar fonts…' })).toBeVisible();
  await page.screenshot({ path: '/tmp/font-identifier-design-loading-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Choose one clear line.');
  await expect(page.locator('canvas')).toHaveJSProperty('width', 1100);
  await page.clock.install();
  await page.getByRole('button', { name: 'Identify font locally', exact: true }).click();
  await page.clock.fastForward(60001);
  await expect(page.getByRole('region', { name: 'Font identifier workspace' }).getByRole('alert')).toContainText('Matching took too long');
  await page.screenshot({ path: '/tmp/font-identifier-design-error-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Adjust selection', exact: true }).click();
  await expect(page.locator('canvas')).toHaveJSProperty('width', 1100);
  await page.getByRole('button', { name: 'Identify font locally', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.clock.fastForward(60001);
  await expect(page.getByRole('region', { name: 'Font identifier workspace' }).getByRole('alert')).toHaveCount(0);
});
