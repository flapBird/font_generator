import { test, expect } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';
import { octoberSlugs, octoberTextSlugs, octoberArtSlugs, octoberArtwork } from '../../lib/october-catalog';

test('October pages have canonical URLs, accurate outputs and distinct text/art directory membership', async ({ page, request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const llms = await (await request.get('/llms.txt')).text();
  for (const slug of octoberSlugs) {
    expect(sitemap).toContain(`https://font-generators.org/${slug}`);
    expect(llms).toContain(`https://font-generators.org/${slug}`);
    await page.goto(`/${slug}`);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://font-generators.org/${slug}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
  }
  expect(llms).toContain('whole-line RTL shaping');
  expect(llms).toContain('62 portable Unicode');
  expect(llms).toMatch(/halloween-font-generator\).*Outputs: copyable text, PNG\./);
  expect(llms).toMatch(/arabic-font-generator\).*Outputs: PNG\./);
  for (const [directory, included, excluded] of [['/styles', octoberTextSlugs, octoberArtSlugs], ['/visual-art', octoberArtSlugs, octoberTextSlugs]] as const) {
    await page.goto(directory);
    for (const slug of included) await expect(page.locator(`main a[href="/${slug}"]`).first()).toBeVisible();
    for (const slug of excluded) await expect(page.locator(`main a[href="/${slug}"]`)).toHaveCount(0);
  }
});

test('all five text workspaces preserve drafts, temporary HERE, clipboard, keyboard preview and mobile layout', async ({ page, context }) => {
  test.setTimeout(90000);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 950 });
    for (const slug of octoberTextSlugs) {
      await page.goto(`/${slug}`);
      const rail = page.getByRole('complementary', { name: 'Generator directory' });
      const current = rail.getByRole('navigation', { name: 'Current generator', exact: true }).filter({ visible: true });
      await expect(current.locator('a')).toHaveAttribute('href', `/${slug}`);
      await expect(current).toContainText('Here');
      await page.locator('#generator-input').fill('Hello 12 👨‍👩‍👧‍👦');
      const card = page.getByRole('button', { name: /^Copy / }).nth(slug === 'wingdings-font-generator' ? 0 : 1);
      const output = await card.locator('[aria-label$=" output"]').textContent();
      await card.focus(); await page.keyboard.press('Enter');
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(output);
      if (width === 1440) await expect(page.getByRole('complementary', { name: 'Selected font preview' })).toContainText(output!);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      // Client-side link, then Back: draft and navigation state must survive.
      await page.evaluate(() => { (window as Window & { navigationSentinel?: number }).navigationSentinel = 42; });
      await rail.locator('a[href="/small-text-generator"]').filter({ visible: true }).first().click();
      await expect(page).toHaveURL(/\/small-text-generator$/);
      await expect(page.locator('#generator-input')).toHaveValue('Hello 12 👨‍👩‍👧‍👦');
      await expect(page.getByRole('navigation', { name: 'Current generator', exact: true })).toHaveCount(0);
      expect(await page.evaluate(() => (window as Window & { navigationSentinel?: number }).navigationSentinel)).toBe(42);
      await page.goBack();
      await expect(page.locator('#generator-input')).toHaveValue('Hello 12 👨‍👩‍👧‍👦');
      await page.getByRole('button', { name: 'Clear text', exact: true }).click();
      await expect(page.getByRole('button', { name: /^Copy / }).first()).toBeDisabled();
    }
  }
  expect(errors).toEqual([]);
});

test('page-specific controls preserve language, empty lines, emoji clusters and Wingdings case', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/k-pop-font-generator');
  await page.locator('#generator-input').fill('Hi 사랑해 @artist https://example.com\n\nFan');
  await page.getByRole('button', { name: 'Hearts', exact: true }).click();
  await expect(page.getByLabel('Bold Sans output')).toHaveText('♡ 𝗛𝗶 사랑해 @artist https://example.com ♡\n\n♡ 𝗙𝗮𝗻 ♡');
  await page.goto('/emoji-font-generator');
  await page.locator('#generator-input').fill('DD 👨‍👩‍👧‍👦 👍🏽 1️⃣');
  await expect(page.getByLabel('Emoji letter lookalikes output')).toHaveText('🄳🄳 👨‍👩‍👧‍👦 👍🏽 1️⃣');
  await page.goto('/preppy-font-generator');
  await page.locator('#generator-input').fill('Luna');
  await page.getByRole('button', { name: 'Bows', exact: true }).click();
  await expect(page.getByLabel('Circled Letters output')).toHaveText('🎀 Ⓛⓤⓝⓐ 🎀');
  await page.goto('/gaming-font-generator');
  await page.locator('#generator-input').fill('Nova');
  await page.getByRole('button', { name: 'Clan brackets', exact: true }).click();
  await expect(page.getByLabel('Small Caps output')).toHaveText('【ɴᴏᴠᴀ】');
  await expect(page.getByRole('link', { name: 'Minecraft artwork & codes', exact: true })).toHaveAttribute('href', '/minecraft-font-generator');
  await page.goto('/wingdings-font-generator');
  await page.locator('#generator-input').fill('Hello');
  const mixed = await page.getByLabel('Wingdings symbols output').textContent();
  await page.getByLabel('Gaster mode').check();
  await expect(page.getByLabel('Wingdings symbols output')).toHaveText('☟☜☹☹⚐');
  await page.getByRole('button', { name: 'Symbols → Letters', exact: true }).click();
  await page.locator('#generator-input').fill(mixed!);
  await expect(page.getByLabel('Decoded letters output')).toHaveText('Hello');
  await page.getByText('Wingdings character chart · 62 characters', { exact: true }).click();
  await page.getByLabel('Find a letter or symbol').fill('A');
  await page.getByRole('button', { name: 'Copy Letter A', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('✌');
});

test('all 19 real fonts render, PNG equals the preview, alpha and artwork bounds survive export', async ({ page }) => {
  test.setTimeout(150000);
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  for (const slug of octoberArtSlugs) {
    const config = octoberArtwork[slug];
    await page.goto(`/${slug}`);
    await page.locator('#artwork-input').fill(config.sample);
    for (const font of config.fonts) {
      await page.getByRole('button', { name: new RegExp(`^${font.family}`) }).click();
      await expect(page.getByTestId('artwork-status')).toContainText('Ready to download', { timeout: 20000 });
      expect(await page.evaluate((family) => document.fonts.check(`400 64px "Artwork ${family}"`, (document.querySelector('#artwork-input') as HTMLTextAreaElement).value), font.family)).toBe(true);
      const pixels = await page.locator('canvas').first().evaluate((node) => {
        const canvas = node as HTMLCanvasElement, { width, height } = canvas;
        const data = canvas.getContext('2d')!.getImageData(0, 0, width, height).data;
        let painted = 0, edge = 0;
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[(y * width + x) * 4 + 3]) { painted++; if (x < 20 || x > width - 21 || y < 20 || y > height - 21) edge++; }
        return { painted, edge, area: width * height };
      });
      expect(pixels.painted).toBeGreaterThan(500); expect(pixels.painted).toBeLessThan(pixels.area / 2); expect(pixels.edge).toBe(0);
    }
    const expected = await page.locator('canvas').first().evaluate((node) => (node as HTMLCanvasElement).toDataURL('image/png').split(',')[1]);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PNG', exact: true }).click();
    const download = await downloadPromise;
    const bytes = await readFile((await download.path())!);
    expect(bytes.toString('base64')).toBe(expected);
    expect(bytes.readUInt32BE(16)).toBe(2000); expect(bytes.readUInt32BE(20)).toBe(1000);
    await page.locator('#artwork-input').fill('');
    await expect(page.getByRole('button', { name: 'Download PNG', exact: true })).toBeDisabled();
  }
  expect(errors).toEqual([]);
});

test('Arabic shapes whole lines; CJK mixed input and art controls work on desktop/mobile', async ({ page }) => {
  test.setTimeout(90000);
  for (const slug of ['arabic-font-generator', 'chinese-font-generator', 'graffiti-font-generator', 'halloween-font-generator']) {
    await page.goto(`/${slug}`);
    await page.locator('#artwork-input').fill(slug.startsWith('arabic') ? 'السَّلَامُ عَلَيْكُمْ 2026\nHello مرحباً' : slug.startsWith('chinese') ? '春风得意 歲月靜好\nHello 123' : 'A Long Title\nSecond line');
    await expect(page.getByTestId('artwork-status')).toContainText('Ready to download');
    if (slug.startsWith('arabic')) {
      expect(await page.locator('canvas').evaluate((node) => (node as HTMLCanvasElement).getContext('2d')!.direction)).toBe('rtl');
      await expect(page.getByLabel('Alignment', { exact: true })).toHaveValue('right');
      await expect(page.getByText('Outline, gradient & shadow', { exact: true })).toHaveCount(0);
    }
    if (slug.startsWith('graffiti')) {
      await page.getByText('Outline, gradient & shadow', { exact: true }).click();
      await page.getByLabel('Gradient fill').check(); await page.getByLabel('Drop shadow').check();
    }
    await page.getByLabel('Canvas', { exact: true }).selectOption('square');
    await page.getByLabel('Transparent background').uncheck();
    await expect(page.getByTestId('artwork-status')).toContainText('Ready to download');
    expect(await page.locator('canvas').first().evaluate((node) => (node as HTMLCanvasElement).getContext('2d')!.getImageData(0, 0, 1, 1).data[3])).toBe(255);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => scrollTo(0, 0));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `/tmp/october-${slug}-${width}.png`, animations: 'disabled' });
    }
    await page.locator('canvas').first().screenshot({ path: `/tmp/october-${slug}-artwork.png` });
    if (slug.startsWith('halloween')) {
      await expect(page.locator('#copyable-styles')).toBeVisible();
      await page.getByRole('button', { name: 'Pumpkins', exact: true }).click();
      await expect(page.getByLabel('Classic Fraktur output')).toContainText('🎃');
    }
  }
});

test('font loading failure blocks stale export and retry recovers', async ({ page }) => {
  await page.route('**/fonts/artwork/creepster/400.css', (route) => route.abort());
  await page.goto('/halloween-font-generator');
  await expect(page.getByTestId('artwork-status')).toContainText('could not load');
  await expect(page.getByRole('button', { name: 'Download PNG', exact: true })).toBeDisabled();
  await page.unroute('**/fonts/artwork/creepster/400.css');
  await page.getByRole('button', { name: 'Retry font loading', exact: true }).click();
  await expect(page.getByTestId('artwork-status')).toContainText('Ready to download');
  await page.route('**/fonts/artwork/nosifer/files/*.woff2', (route) => route.abort());
  await page.getByRole('button', { name: /^Nosifer/ }).click();
  await expect(page.getByTestId('artwork-status')).toContainText('could not load');
  await expect(page.getByRole('button', { name: 'Download PNG', exact: true })).toBeDisabled();
  await page.unroute('**/fonts/artwork/nosifer/files/*.woff2');
  await page.getByRole('button', { name: 'Retry font loading', exact: true }).click();
  await expect(page.getByTestId('artwork-status')).toContainText('Ready to download');
});

test('new resources never load on existing pages; oversized drafts are preserved', async ({ page }) => {
  const chunkFiles = (await readdir('.next/static/chunks')).filter((file) => file.endsWith('.js'));
  const newChunks = new Set((await Promise.all(chunkFiles.map(async (file) => {
    const source = await readFile(`.next/static/chunks/${file}`, 'utf8');
    return source.includes('Font download timed out.') || source.includes('Wingdings character chart') ? file : '';
  }))).filter(Boolean));
  expect(newChunks.size).toBeGreaterThan(0);
  const newRequests: string[] = []; page.on('request', (request) => {
    if (request.url().includes('/fonts/artwork/') || newChunks.has(new URL(request.url()).pathname.split('/').at(-1)!)) newRequests.push(request.url());
  });
  for (const path of ['/', '/horror-font-generator', '/handwriting-font-generator', '/minecraft-font-generator']) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
  }
  expect(newRequests).toEqual([]);
  await page.goto('/k-pop-font-generator');
  await page.locator('#generator-input').fill('A'.repeat(200));
  await page.goto('/korean-font-generator');
  await expect(page.locator('#artwork-input')).toHaveValue('A'.repeat(200));
  await expect(page.locator('main').getByRole('alert')).toContainText('longer than 120');
  await expect(page.getByRole('button', { name: 'Download PNG', exact: true })).toBeDisabled();
});
