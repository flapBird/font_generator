import { test, expect } from './fixtures';
import { readFile } from 'node:fs/promises';
import { discoverySlugs, discoveryTextSlugs, discoveryArtSlugs, discoverySamples } from '../../lib/discovery-catalog';
import { discoveryArtPresets } from '../../lib/discovery-art';

test('discovery routes expose canonical metadata, truthful outputs, directories and related links', async ({ page, request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const llms = await (await request.get('/llms.txt')).text();
  for (const slug of discoverySlugs) {
    expect(sitemap).toContain(`https://font-generators.org/${slug}`);
    expect(llms).toContain(`https://font-generators.org/${slug}`);
    await page.goto(`/${slug}`);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://font-generators.org/${slug}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
  }
  expect(llms).toMatch(/neon-font-generator\).*Outputs: PNG\./);
  expect(llms).toMatch(/anime-font-generator\).*Outputs: copyable text, PNG\./);
  expect(llms).toContain('mobile Reddit uses rich text');
  for (const [path, included, excluded] of [['/styles', discoveryTextSlugs, discoveryArtSlugs], ['/visual-art', discoveryArtSlugs, discoveryTextSlugs]] as const) {
    await page.goto(path);
    for (const slug of included) await expect(page.locator(`main a[href="/${slug}"]`).first()).toBeVisible();
    for (const slug of excluded) await expect(page.locator(`main a[href="/${slug}"]`)).toHaveCount(0);
  }
  await page.goto('/goth-font-generator');
  await expect(page.getByRole('navigation', { name: 'More related tools' }).locator('a[href="/old-english-font-generator"]')).toBeVisible();
  await page.goto('/guides/reddit-fancy-text-guide');
  await expect(page.getByRole('link', { name: 'Try the Reddit Font Generator' })).toBeVisible();
});

test('seven text workspaces copy by keyboard, isolate input and retain existing navigation on desktop and mobile', async ({ page, context }) => {
  test.setTimeout(120000);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(`${page.url()}: ${error.stack ?? error.message}`));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 950 });
    for (const slug of discoveryTextSlugs) {
      await page.goto(`/${slug}`);
      await expect(page.locator('#generator-input')).toHaveValue(discoverySamples[slug]);
      const rail = page.getByRole('complementary', { name: 'Generator directory' });
      const current = rail.getByRole('navigation', { name: 'Current generator', exact: true }).filter({ visible: true });
      await expect(current.locator('a')).toHaveAttribute('href', `/${slug}`);
      await expect(current).toContainText('Here');
      await expect(rail.getByRole('navigation', { name: 'Copyable text generators', exact: true }).locator(`a[href="/${slug}"]`)).toHaveCount(0);
      await page.locator('#generator-input').fill('Café 12 👨‍👩‍👧‍👦');
      const card = page.getByRole('button', { name: /^Copy / }).first();
      const output = await card.locator('[aria-label$=" output"]').textContent();
      await card.focus(); await page.keyboard.press('Enter');
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(output);
      if (width === 1440) await expect(page.getByRole('complementary', { name: 'Selected font preview' })).toContainText(output!);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.getByRole('button', { name: 'Clear text', exact: true }).click();
      await expect(card).toBeDisabled();
      await rail.locator('a[href="/small-text-generator"]').filter({ visible: true }).first().click();
      await expect(page).toHaveURL(/\/small-text-generator$/);
      await expect(page.locator('#generator-input')).not.toHaveValue('Café 12 👨‍👩‍👧‍👦');
      await expect(page.getByRole('navigation', { name: 'Current generator', exact: true })).toHaveCount(0);
      await page.goBack();
      await expect(page.locator('#generator-input')).toHaveValue(discoverySamples[slug]);
    }
  }
  expect(errors).toEqual([]);
});

test('dedicated text controls preserve drafts and distinguish platform source from preview', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/whatsapp-font-generator');
  await page.locator('#generator-input').fill('Hello\n\nWorld');
  await page.getByRole('button', { name: 'Message formatting', exact: true }).click();
  await expect(page.getByLabel('Bold source output', { exact: true })).toHaveText('*Hello*\n\n*World*');
  await expect(page.getByTestId('message-preview')).toHaveText('Hello\n\nWorld');
  await page.getByRole('button', { name: 'Copy Bold source', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('*Hello*\n\n*World*');
  await page.locator('#generator-input').fill('a*b');
  await expect(page.getByRole('button', { name: 'Copy Bold source', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Fancy text', exact: true }).click();
  await expect(page.locator('#generator-input')).toHaveValue('a*b');
  await page.goto('/reddit-font-generator');
  await page.locator('#generator-input').fill('Hi u/Alice r/fonts https://example.com');
  await expect(page.getByLabel('Bold Sans output', { exact: true })).toContainText('u/Alice r/fonts https://example.com');
  await page.getByRole('button', { name: 'Desktop Markdown', exact: true }).click();
  await expect(page.getByText('For desktop Markdown editors. On mobile, use Reddit’s rich text controls.')).toBeVisible();
  await page.goto('/square-text-generator');
  await page.locator('#generator-input').fill('Hi 12');
  await page.getByLabel('Add space between letters').check();
  await expect(page.getByLabel('Outline squares output', { exact: true })).toHaveText('🄷 🄸 12');
  await page.goto('/sad-font-generator');
  await page.locator('#generator-input').fill('A\n\nB');
  await page.getByRole('button', { name: /Broken heart/ }).click();
  await expect(page.getByLabel('Italic Serif output', { exact: true })).toHaveText('💔 𝐴 💔\n\n💔 𝐵 💔');
  await page.goto('/snapchat-font-generator');
  await page.locator('#generator-input').fill('A'.repeat(31));
  await expect(page.getByText(/31 \/ 30 visible characters/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Chat', exact: true }).click();
  await expect(page.getByText(/31 \/ 30 visible characters/)).toHaveCount(0);
});

test('artwork presets render distinct images and export the exact transparent banner or square', async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(`${page.url()}: ${error.stack ?? error.message}`));
  for (const slug of discoveryArtSlugs) {
    await page.goto(`/${slug}`);
    await page.locator('#discovery-art-input').fill('HELLO\nWorld');
    const hashes = new Set<string>();
    for (const preset of discoveryArtPresets[slug]) {
      await page.getByRole('button', { name: `Choose ${preset.name}`, exact: true }).click();
      await expect(page.getByTestId('discovery-status')).toContainText('Ready');
      hashes.add(await page.getByTestId('discovery-canvas').evaluate((element) => (element as HTMLCanvasElement).toDataURL()));
    }
    expect(hashes.size).toBe(4);
    await page.getByLabel('Transparent background').check();
    for (const format of ['banner', 'square']) {
      await page.getByLabel('Canvas', { exact: true }).selectOption(format);
      await expect(page.getByTestId('discovery-status')).toContainText('Ready');
      const pixelInfo = await page.getByTestId('discovery-canvas').evaluate((element) => {
        const c = element as HTMLCanvasElement, ctx = c.getContext('2d')!;
        const pixels = ctx.getImageData(0, 0, c.width, c.height).data;
        let ink = 0, edgeInk = 0;
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (pixels[(y * c.width + x) * 4 + 3] > 0) {
          ink++;
          if (x < 4 || y < 4 || x >= c.width - 4 || y >= c.height - 4) edgeInk++;
        }
        return { corner: pixels[3], ink, edgeInk, url: c.toDataURL(), width: c.width, height: c.height };
      });
      expect(pixelInfo.corner).toBe(0); expect(pixelInfo.ink).toBeGreaterThan(1000);
      expect(pixelInfo.edgeInk).toBe(0);
      const downloaded = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Download PNG', exact: true }).click();
      const download = await downloaded; const saved = `/tmp/${slug}-${format}.png`;
      await download.saveAs(saved);
      const png = await readFile(saved);
      expect(png.readUInt32BE(16)).toBe(format === 'banner' ? 2000 : 1600);
      expect(png.readUInt32BE(20)).toBe(format === 'banner' ? 1000 : 1600);
      expect(`data:image/png;base64,${png.toString('base64')}`).toBe(pixelInfo.url);
    }
    await page.getByLabel('Canvas', { exact: true }).selectOption('banner');
    await page.getByLabel('Transparent background').uncheck();
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 950 });
      await expect(page.getByTestId('discovery-status')).toContainText('Ready');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width < 1024) expect((await page.getByTestId('discovery-canvas').boundingBox())!.y).toBeLessThan((await page.getByLabel('Text size', { exact: true }).boundingBox())!.y);
      await page.locator('#generator').screenshot({ path: `/tmp/${slug}-${width}.png` });
    }
    await page.getByRole('button', { name: 'Clear text', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Download PNG', exact: true })).toBeDisabled();
  }
  expect(errors).toEqual([]);
});

test('hybrid modes keep text, reject oversized artwork without truncation and preserve special characters', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  for (const slug of ['cyberpunk-font-generator', 'anime-font-generator']) {
    await page.goto(`/${slug}`);
    await page.getByRole('tab', { name: 'Copyable text', exact: true }).click();
    const text = 'A'.repeat(121) + ' 中文 👨‍👩‍👧‍👦';
    await page.locator('#discovery-art-input').fill(text);
    await page.getByRole('button', { name: 'Copy Original text', exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(text);
    await page.getByRole('tab', { name: 'Artwork', exact: true }).click();
    await expect(page.locator('#discovery-art-input')).toHaveValue(text);
    await expect(page.locator('#generator').getByRole('alert')).toContainText('120 characters');
    await expect(page.getByRole('button', { name: 'Download PNG', exact: true })).toBeDisabled();
    await page.getByRole('tab', { name: 'Copyable text', exact: true }).click();
    await expect(page.locator('#discovery-art-input')).toHaveValue(text);
  }
});

test('failed fonts block export and retry succeeds; older routes do not request discovery fonts', async ({ page }) => {
  await page.route('**/fonts/discovery/**', (route) => route.abort());
  await page.goto('/neon-font-generator');
  await expect(page.getByTestId('discovery-status')).toContainText('could not load');
  await expect(page.getByRole('button', { name: 'Download PNG', exact: true })).toBeDisabled();
  await page.unroute('**/fonts/discovery/**');
  await page.getByRole('button', { name: 'Retry preview' }).click();
  await expect(page.getByTestId('discovery-status')).toContainText('Ready');
  const fonts: string[] = [];
  page.on('request', (request) => { if (request.url().includes('/fonts/discovery/')) fonts.push(request.url()); });
  for (const path of ['/', '/fraktur-font-generator', '/fire-font-generator', '/halloween-font-generator']) {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
  }
  expect(fonts).toEqual([]);
});
