import { test, expect, type Locator } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { halloweenFonts, halloweenPresets } from '../../lib/halloween-catalog';

async function pixels(canvas: Locator) {
  return canvas.evaluate((node) => {
    const canvas = node as HTMLCanvasElement, { width, height } = canvas;
    const data = canvas.getContext('2d')!.getImageData(0, 0, width, height).data;
    let painted = 0, edge = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[(y * width + x) * 4 + 3]) {
      painted++; if (x < 20 || x >= width - 20 || y < 20 || y >= height - 20) edge++;
    }
    return { painted, edge, width, height };
  });
}

test('all Halloween designs render distinct previews and unclipped transparent artwork with all 12 fonts', async ({ page }) => {
  test.setTimeout(150000);
  await page.setViewportSize({ width: 1440, height: 950 });
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/halloween-font-generator');
  await page.locator('#halloween-input').fill('Happy Halloween');
  await expect(page.locator('[data-halloween-preset]')).toHaveCount(24);
  const images = new Set<string>();
  for (const preset of halloweenPresets) {
    const card = page.locator(`[data-halloween-preset="${preset.id}"]`);
    await card.scrollIntoViewIfNeeded();
    await expect(card.getByRole('button', { name: `Download ${preset.name} PNG` })).toBeEnabled({ timeout: 20000 });
    images.add(createHash('sha256').update(await card.locator('canvas').evaluate((node) => (node as HTMLCanvasElement).toDataURL())).digest('hex'));
    await card.getByRole('button', { name: `Customize ${preset.name}`, exact: true }).click();
    const editor = page.getByRole('dialog');
    await editor.getByRole('button', { name: 'Transparent', exact: true }).click();
    await expect(editor.getByTestId('halloween-editor-status')).toContainText('Ready to download');
    const result = await pixels(editor.locator('canvas'));
    expect(result.painted, preset.name).toBeGreaterThan(500);
    expect(result.painted, preset.name).toBeLessThan(result.width * result.height / 2);
    expect(result.edge, `${preset.name}: lettering stays inside export`).toBe(0);
    await editor.getByRole('button', { name: 'Close artwork editor' }).click();
  }
  expect(images.size).toBe(24);
  await page.getByRole('button', { name: 'Customize Pumpkin Pop', exact: true }).click();
  const longTextEditor = page.getByRole('dialog');
  await longTextEditor.getByRole('button', { name: 'Transparent', exact: true }).click();
  for (const value of ['W'.repeat(120), 'A\n'.repeat(59) + 'B']) {
    await longTextEditor.getByRole('textbox', { name: 'Your text', exact: true }).fill(value);
    await expect(longTextEditor.getByTestId('halloween-editor-status')).toContainText('Ready to download');
    const result = await pixels(longTextEditor.locator('canvas'));
    expect(result.painted).toBeGreaterThan(100); expect(result.edge).toBe(0);
  }
  await longTextEditor.getByRole('textbox', { name: 'Your text', exact: true }).fill('Happy Halloween');
  await longTextEditor.getByRole('button', { name: 'Close artwork editor' }).click();
  await expect(page.getByRole('button', { name: 'Download Pumpkin Pop PNG' })).toBeEnabled();
  for (const font of halloweenFonts) expect(await page.evaluate((family) => document.fonts.check(`400 64px "Artwork ${family}"`, 'Happy Halloween'), font.family)).toBe(true);
  await page.evaluate(() => scrollTo(0, 0));
  await page.getByRole('region', { name: 'Halloween style studio' }).screenshot({ path: '/tmp/halloween-gallery-desktop.png' });
  const categories = page.getByRole('group', { name: 'Artwork categories' });
  await categories.getByRole('button', { name: 'Gothic', exact: true }).click();
  await expect(page.locator('[data-halloween-preset]')).toHaveCount(5);
  await categories.getByRole('button', { name: 'All', exact: true }).click();
  expect(errors).toEqual([]);
});

test('Halloween editor exports the exact preview, responsive square/transparent settings and keyboard close', async ({ page }) => {
  test.setTimeout(90000);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/halloween-font-generator');
    await page.locator('#halloween-input').fill('Trick or Treat');
    await expect(page.getByRole('button', { name: 'Download Pumpkin Pop PNG' })).toBeEnabled();
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `/tmp/halloween-page-${width}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const firstCard = page.locator('[data-halloween-preset="pumpkin-pop"]');
    const cardBox = (await firstCard.boundingBox())!;
    for (const button of await firstCard.getByRole('button').all()) {
      const box = (await button.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(cardBox.x);
      expect(box.x + box.width).toBeLessThanOrEqual(cardBox.x + cardBox.width);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    const directDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Pumpkin Pop PNG', exact: true }).click();
    const directBytes = await readFile((await (await directDownload).path())!);
    expect(directBytes.readUInt32BE(16)).toBe(2000); expect(directBytes.readUInt32BE(20)).toBe(1000);
    const trigger = page.getByRole('button', { name: 'Customize Haunted Moon', exact: true });
    await trigger.click();
    const editor = page.getByRole('dialog');
    await expect(editor.getByTestId('halloween-editor-status')).toContainText('Ready to download');
    expect((await pixels(editor.locator('canvas'))).painted).toBe(2000000);
    await editor.getByRole('button', { name: 'Transparent', exact: true }).click();
    await editor.getByRole('combobox', { name: 'Canvas', exact: true }).selectOption('square');
    await editor.getByText('Colors & layout', { exact: true }).click();
    await editor.getByRole('textbox', { name: 'Your text', exact: true }).fill('Spooky Night\n2026 👻');
    await editor.getByLabel('Text color', { exact: true }).fill('#ff9911');
    await editor.getByRole('combobox', { name: 'Alignment', exact: true }).selectOption('left');
    await editor.getByLabel('Extra depth', { exact: true }).uncheck();
    await expect(editor.getByTestId('halloween-editor-status')).toContainText('Ready to download · 1600 × 1600');
    expect((await pixels(editor.locator('canvas'))).edge).toBe(0);
    expect(await editor.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    const expected = await editor.locator('canvas').evaluate((node) => (node as HTMLCanvasElement).toDataURL('image/png').split(',')[1]);
    const downloading = page.waitForEvent('download');
    await editor.getByRole('button', { name: 'Download PNG', exact: true }).click();
    const download = await downloading, bytes = await readFile((await download.path())!);
    expect(bytes.toString('base64')).toBe(expected);
    expect(bytes.readUInt32BE(16)).toBe(1600); expect(bytes.readUInt32BE(20)).toBe(1600);
    await editor.getByTestId('halloween-editor-controls').evaluate((node) => node.scrollTop = 0);
    await expect(editor.getByRole('button', { name: 'Download PNG', exact: true })).toBeInViewport();
    await page.screenshot({ path: `/tmp/halloween-editor-${width}.png` });
    await page.keyboard.press('Escape');
    await expect(editor).toHaveCount(0); await expect(trigger).toBeFocused();
    await expect(page.locator('#halloween-input')).toHaveValue('Spooky Night\n2026 👻');
    if (width === 390) {
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await page.screenshot({ path: '/tmp/halloween-dark-390.png' });
    }
  }
});

test('Halloween text copying, filters, empty input and oversized drafts remain usable across tabs and tools', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/halloween-font-generator');
  await page.locator('#halloween-input').fill('Boo\n\n中文 👨‍👩‍👧‍👦');
  await page.getByRole('tab', { name: '🎨 Artwork · 24', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Aa Copyable text · 24' })).toBeFocused();
  await expect(page.getByRole('button', { name: /^Copy / })).toHaveCount(24);
  const output = '🎃 𝔅𝔬𝔬 🎃\n\n🎃 中文 👨‍👩‍👧‍👦 🎃';
  await expect(page.getByLabel('Pumpkin Blackletter output', { exact: true })).toHaveText(output);
  await page.getByRole('button', { name: 'Copy Pumpkin Blackletter', exact: true }).focus(); await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(output);
  await page.getByRole('group', { name: 'Text categories' }).getByRole('button', { name: 'Glitch', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Copy / })).toHaveCount(4);
  await page.locator('#halloween-input').fill('A'.repeat(200));
  await page.getByRole('tab', { name: '🎨 Artwork · 24', exact: true }).click();
  await expect(page.locator('#halloween-input')).toHaveValue('A'.repeat(200));
  await expect(page.locator('main').getByRole('alert')).toContainText('nothing has been truncated');
  await expect(page.getByRole('button', { name: 'Download Pumpkin Pop PNG' })).toBeDisabled();
  await page.goto('/small-text-generator');
  await expect(page.locator('#generator-input')).toHaveValue('A'.repeat(200));
  await page.goBack(); await expect(page.locator('#halloween-input')).toHaveValue('A'.repeat(200));
  await page.getByRole('button', { name: 'Clear text', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Download Pumpkin Pop PNG' })).toBeDisabled();
  await page.getByRole('tab', { name: 'Aa Copyable text · 24' }).click();
  await expect(page.getByRole('button', { name: /^Copy / }).first()).toBeDisabled();
});

test('Halloween CSS and font failures block downloads and recover without stale previews', async ({ page }) => {
  await page.route('**/fonts/artwork/creepster/400.css', (route) => route.abort());
  await page.route('**/fonts/artwork/nosifer/files/*.woff2', (route) => route.abort());
  await page.goto('/halloween-font-generator');
  const pumpkin = page.locator('[data-halloween-preset="pumpkin-pop"]'), blood = page.locator('[data-halloween-preset="blood-drip"]');
  await expect(pumpkin.getByText('Font unavailable')).toBeVisible();
  await expect(pumpkin.getByRole('button', { name: 'Download Pumpkin Pop PNG' })).toBeDisabled();
  await page.unroute('**/fonts/artwork/creepster/400.css');
  await pumpkin.getByRole('button', { name: 'Retry font loading' }).click();
  await expect(pumpkin.getByRole('button', { name: 'Download Pumpkin Pop PNG' })).toBeEnabled();
  await expect(blood.getByText('Font unavailable')).toBeVisible();
  await page.unroute('**/fonts/artwork/nosifer/files/*.woff2');
  await blood.getByRole('button', { name: 'Retry font loading' }).click();
  await expect(blood.getByRole('button', { name: 'Download Blood Drip PNG' })).toBeEnabled();
  await pumpkin.getByRole('button', { name: 'Customize Pumpkin Pop', exact: true }).click();
  const editor = page.getByRole('dialog');
  await expect(editor.getByTestId('halloween-editor-status')).toContainText('Ready to download');
  const before = await editor.locator('canvas').evaluate((node) => (node as HTMLCanvasElement).toDataURL());
  await editor.getByRole('textbox', { name: 'Your text', exact: true }).fill('Fresh draft');
  await expect(editor.getByTestId('halloween-editor-status')).toContainText('Ready to download');
  expect(await editor.locator('canvas').evaluate((node) => (node as HTMLCanvasElement).toDataURL())).not.toBe(before);
});

test('Halloween additions stay off sibling pages and llms.txt describes only implemented outputs', async ({ page, request }) => {
  const files = (await readdir('.next/static/chunks')).filter((file) => file.endsWith('.js'));
  const chunks = new Set((await Promise.all(files.map(async (file) => (await readFile(`.next/static/chunks/${file}`, 'utf8')).includes('Halloween style studio') ? file : ''))).filter(Boolean));
  expect(chunks.size).toBeGreaterThan(0);
  const requests: string[] = [];
  const extraFonts = halloweenFonts.slice(3).map((font) => `/fonts/artwork/${font.id}/`);
  page.on('request', (request) => { if (chunks.has(request.url().split('/').at(-1)!) || extraFonts.some((font) => request.url().includes(font))) requests.push(request.url()); });
  for (const slug of ['graffiti', 'korean', 'chinese', 'arabic', 'horror', 'k-pop', 'adopt-me']) {
    await page.goto(`/${slug}-font-generator`); await expect(page.locator('h1')).toBeVisible();
    if (['graffiti', 'korean', 'chinese', 'arabic'].includes(slug)) await expect(page.getByTestId('artwork-status')).toContainText('Ready to download');
  }
  expect(requests).toEqual([]);
  const llms = await (await request.get('/llms.txt')).text();
  expect(llms).toContain('24 PNG artwork presets'); expect(llms).toContain('24 copyable');
  expect(llms).toContain('Twelve locally hosted open-source typefaces');
  expect(llms).not.toContain('Halloween offers Creepster, Nosifer and Eater artwork');
});
