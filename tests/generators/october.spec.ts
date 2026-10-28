import { test, expect } from './fixtures';
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
  expect(llms).toContain('without a direction selector');
  expect(llms).toContain('compact decoration chips with icons and labels');
  expect(llms).toContain('mobile results appear before the full generator navigation');
  expect(llms).toMatch(/halloween-font-generator\).*Outputs: copyable text, PNG\./);
  expect(llms).toMatch(/arabic-font-generator\).*Outputs: PNG\./);
  for (const [directory, included, excluded] of [['/styles', octoberTextSlugs, octoberArtSlugs], ['/visual-art', octoberArtSlugs, octoberTextSlugs]] as const) {
    await page.goto(directory);
    for (const slug of included) await expect(page.locator(`main a[href="/${slug}"]`).first()).toBeVisible();
    for (const slug of excluded) await expect(page.locator(`main a[href="/${slug}"]`)).toHaveCount(0);
  }
});

test('all five text workspaces isolate inputs and preserve temporary HERE, clipboard, keyboard preview and mobile layout', async ({ page, context }) => {
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
      // Client-side link and Back reset input while preserving client navigation.
      await page.evaluate(() => { (window as Window & { navigationSentinel?: number }).navigationSentinel = 42; });
      await rail.locator('a[href="/small-text-generator"]').filter({ visible: true }).first().click();
      await expect(page).toHaveURL(/\/small-text-generator$/);
      await expect(page.locator('#generator-input')).not.toHaveValue('Hello 12 👨‍👩‍👧‍👦');
      await expect(page.getByRole('navigation', { name: 'Current generator', exact: true })).toHaveCount(0);
      expect(await page.evaluate(() => (window as Window & { navigationSentinel?: number }).navigationSentinel)).toBe(42);
      await page.goBack();
      await expect(page.locator('#generator-input')).not.toHaveValue('Hello 12 👨‍👩‍👧‍👦');
      await page.getByRole('button', { name: 'Clear text', exact: true }).click();
      await expect(page.getByRole('button', { name: /^Copy / }).first()).toBeDisabled();
      if (slug === 'wingdings-font-generator') {
        await expect(page.getByRole('button', { name: 'Copy Symbols → Letters', exact: true })).toBeDisabled();
      }
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
  const encoded = page.getByRole('button', { name: 'Copy Letters → Symbols', exact: true });
  const decoded = page.getByRole('button', { name: 'Copy Symbols → Letters', exact: true });
  await expect(encoded).toBeVisible();
  await expect(decoded).toBeVisible();
  await expect(page.getByRole('button', { name: /^(Letters → Symbols|Symbols → Letters)$/ })).toHaveCount(0);
  const mixed = await page.getByLabel('Letters → Symbols output', { exact: true }).textContent();
  await expect(page.getByLabel('Symbols → Letters output', { exact: true })).toHaveText('Hello');
  await page.getByRole('switch', { name: 'Gaster mode', exact: true }).check();
  await expect(page.getByLabel('Letters → Symbols output', { exact: true })).toHaveText('☟☜☹☹⚐');
  await expect(page.getByLabel('Symbols → Letters output', { exact: true })).toHaveText('Hello');
  await encoded.click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('☟☜☹☹⚐');
  await page.locator('#generator-input').fill(mixed!);
  await expect(page.getByLabel('Symbols → Letters output', { exact: true })).toHaveText('Hello');
  await decoded.focus(); await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('Hello');
  await expect(page.getByRole('complementary', { name: 'Selected font preview' })).toContainText('Hello');
  await page.getByText('Wingdings character chart · 62 characters', { exact: true }).click();
  await page.getByLabel('Find a letter or symbol').fill('A');
  await page.getByRole('button', { name: 'Copy Letter A', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('✌');
});

test('compact controls prioritize results and retain touch targets on desktop and mobile', async ({ page }) => {
  test.setTimeout(90000);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const slug of ['k-pop', 'preppy', 'emoji', 'gaming']) {
      await page.goto(`/${slug}-font-generator`);
      await page.locator('#generator-input').fill('Name');
      const decorations = page.getByRole('group', { name: 'Decoration', exact: true });
      const options = slug === 'gaming'
        ? [['No frame', 'Aa'], ['Clan brackets', '【】'], ['Stars', '✦']]
        : [['No frame', 'Aa'], ['Hearts', '♡'], ['Stars', '✦'], ['Bows', '🎀']];
      await expect(decorations.getByRole('button')).toHaveCount(options.length);
      for (const [label, sample] of options) {
        const button = decorations.getByRole('button', { name: label, exact: true });
        await expect(button.locator('[data-decoration-icon]')).toHaveText(sample);
        const bounds = (await button.boundingBox())!;
        expect(bounds.height).toBeGreaterThanOrEqual(44);
        expect(bounds.height).toBeLessThanOrEqual(48);
        await button.click();
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        await expect(decorations.locator('[aria-pressed="true"]')).toHaveCount(1);
      }
      if (width >= 390) {
        const rows = await decorations.getByRole('button').evaluateAll((buttons) => new Set(buttons.map((button) => Math.round(button.getBoundingClientRect().top))).size);
        expect(rows).toBe(1);
      }
      const tips = page.locator('details').filter({ has: page.getByText('Tips & compatibility', { exact: true }) });
      await expect(tips).not.toHaveAttribute('open', '');
      if (width < 1280) {
        const firstResult = page.getByRole('button', { name: 'Copy Original text', exact: true });
        const resultY = (await firstResult.boundingBox())!.y;
        const navigationY = (await page.getByRole('complementary', { name: 'Generator directory' }).boundingBox())!.y;
        expect(resultY).toBeLessThan(navigationY);
        await page.evaluate(() => scrollTo(0, 0));
        await expect(firstResult).toBeInViewport();
      }
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: `/tmp/font-controls-${slug}-${width}.png`, animations: 'disabled' });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.goto('/wingdings-font-generator');
    await page.locator('#generator-input').fill('Hello');
    const gaster = page.getByRole('switch', { name: 'Gaster mode', exact: true });
    await expect(gaster).not.toBeChecked();
    await expect(gaster).toContainText('Off');
    await gaster.focus(); await page.keyboard.press('Space');
    await expect(gaster).toBeChecked();
    await expect(gaster).toContainText('On');
    await expect(page.getByLabel('Letters → Symbols output', { exact: true })).toHaveText('☟☜☹☹⚐');
    await expect(page.getByLabel('Symbols → Letters output', { exact: true })).toHaveText('Hello');
    const about = page.locator('details').filter({ has: page.getByText('About these symbols', { exact: true }) });
    await expect(about.locator('p')).not.toBeVisible();
    await about.locator('summary').click();
    await expect(about.locator('p')).toContainText('Decoding assumes');
    await about.locator('summary').click();
    await page.evaluate(() => scrollTo(0, 0));
    await expect(page.getByRole('button', { name: 'Copy Letters → Symbols', exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `/tmp/font-controls-wingdings-${width}.png`, animations: 'disabled' });
    if (width === 390) {
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await page.screenshot({ path: '/tmp/font-controls-wingdings-dark-390.png', animations: 'disabled' });
      await page.evaluate(() => document.documentElement.classList.remove('dark'));
    }
  }
  await page.goto('/halloween-font-generator');
  await expect(page.locator('[data-decoration-icon]')).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Copyable text', exact: true })).toBeVisible();
});

test('all 16 sibling artwork fonts render, PNG equals the preview, alpha and artwork bounds survive export', async ({ page }) => {
  test.setTimeout(150000);
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  for (const slug of octoberArtSlugs.filter((slug) => slug !== 'halloween-font-generator')) {
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
  for (const slug of ['arabic-font-generator', 'chinese-font-generator', 'graffiti-font-generator']) {
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
  }
});

test('font loading failure blocks stale export and retry recovers', async ({ page }) => {
  await page.route('**/fonts/artwork/rubik-spray-paint/400.css', (route) => route.abort());
  await page.goto('/graffiti-font-generator');
  await expect(page.getByTestId('artwork-status')).toContainText('could not load');
  await expect(page.getByRole('button', { name: 'Download PNG', exact: true })).toBeDisabled();
  await page.unroute('**/fonts/artwork/rubik-spray-paint/400.css');
  await page.getByRole('button', { name: 'Retry font loading', exact: true }).click();
  await expect(page.getByTestId('artwork-status')).toContainText('Ready to download');
  await page.route('**/fonts/artwork/permanent-marker/files/*.woff2', (route) => route.abort());
  await page.getByRole('button', { name: /^Permanent Marker/ }).click();
  await expect(page.getByTestId('artwork-status')).toContainText('could not load');
  await expect(page.getByRole('button', { name: 'Download PNG', exact: true })).toBeDisabled();
  await page.unroute('**/fonts/artwork/permanent-marker/files/*.woff2');
  await page.getByRole('button', { name: 'Retry font loading', exact: true }).click();
  await expect(page.getByTestId('artwork-status')).toContainText('Ready to download');
});

test('new resources never load on existing pages; cross-tool drafts are ignored', async ({ page }) => {
  const chunkFiles = (await readdir('.next/static/chunks')).filter((file) => file.endsWith('.js'));
  const newChunks = new Set((await Promise.all(chunkFiles.map(async (file) => {
    const source = await readFile(`.next/static/chunks/${file}`, 'utf8');
    return source.includes('Font download timed out.') || source.includes('Wingdings character chart') || source.includes('Halloween style studio') ? file : '';
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
  await expect(page.locator('#artwork-input')).not.toHaveValue('A'.repeat(200));
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Download PNG', exact: true })).toBeEnabled();
});
