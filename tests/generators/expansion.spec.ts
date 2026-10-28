import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const slugs = ['underline-text-generator', 'small-caps-generator', 'double-struck-font-generator', 'vaporwave-font-generator', 'twitter-font-generator', 'twitch-font-generator', 'roblox-font-generator', 'adopt-me-font-generator', 'handwriting-font-generator'];

test('nine pages have canonical metadata, discoverable links, sitemap and accurate llms output', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const slug of slugs) {
    const response = await page.goto(`/${slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://font-generators.org/${slug}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
  }
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const llms = await (await request.get('/llms.txt')).text();
  for (const slug of slugs) {
    expect(sitemap).toContain(`https://font-generators.org/${slug}`);
    expect(llms).toContain(`https://font-generators.org/${slug}`);
  }
  expect(llms).toMatch(/handwriting-font-generator\).*Outputs: copyable text, PNG, SVG/);
  expect(llms).toContain('does not');
  expect(llms).toContain('do not verify in-game acceptance');
  expect(llms).toContain('temporary current-page item marked HERE');
  expect(llms).toContain('Client-side links open each tool with its own input');
  const redirect = await request.get('/x-font-generator', { maxRedirects: 0 });
  expect(redirect.status()).toBe(301);
  expect(redirect.headers().location).toBe('/twitter-font-generator');
  expect(sitemap).not.toContain('https://font-generators.org/x-font-generator');
  await page.goto('/styles');
  for (const slug of slugs.filter((slug) => slug !== 'handwriting-font-generator')) await expect(page.locator(`a[href="/${slug}"]`).first()).toBeVisible();
  await page.goto('/visual-art');
  await expect(page.locator('a[href="/handwriting-font-generator"]').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('four precise styles copy their actual Unicode results', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  for (const [slug, style, input, expected] of [
    ['underline-text-generator', 'Double Underline', 'A1! 👨‍👩‍👧‍👦', 'A̳1̳!̳ 👨‍👩‍👧‍👦'],
    ['small-caps-generator', 'Small Caps — Preserve Uppercase', 'Alice NASA 12', 'Aʟɪᴄᴇ NASA 12'],
    ['double-struck-font-generator', 'Double Struck', 'CHNPQRZ 019', 'ℂℍℕℙℚℝℤ 𝟘𝟙𝟡'],
    ['vaporwave-font-generator', 'Vaporwave Fullwidth', 'Wave 98!\nNext', 'Ｗａｖｅ　９８！\nＮｅｘｔ'],
  ]) {
    await page.goto(`/${slug}`);
    await page.locator('#generator-input').fill(input);
    await page.getByRole('button', { name: `Copy ${style}`, exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
  }
});

test('X preserves entities and counts weighted characters, URLs and emoji', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/twitter-font-generator');
  await page.getByLabel('Your text', { exact: true }).fill('Hi @artist https://example.com #Art 👨‍👩‍👧‍👦');
  await expect(page.getByLabel('Bold Sans output')).toHaveText('𝗛𝗶 @artist https://example.com #Art 👨‍👩‍👧‍👦');
  await page.getByRole('button', { name: 'Copy Bold Sans', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('𝗛𝗶 @artist https://example.com #Art 👨‍👩‍👧‍👦');
  await page.getByLabel('Your text', { exact: true }).fill('a'.repeat(141));
  await expect(page.getByText('282 / 280 — standard post estimate · Over limit; shorten your text').first()).toBeVisible();
  await page.getByRole('button', { name: 'Bio', exact: true }).click();
  await expect(page.getByText('Bios have a 160-character limit. Check the final profile field in X.', { exact: true })).toBeVisible();
  await expect(page.getByText(/282 \/ 280/)).toHaveCount(0);
  await expect(page.getByLabel('Your text', { exact: true })).toHaveValue('a'.repeat(141));
});

test('Roblox and Twitch show field-specific limitations and an original fallback', async ({ page }) => {
  await page.goto('/roblox-font-generator');
  await page.getByLabel('Your text', { exact: true }).fill('Nova 12');
  await page.getByText('Platform tips & compatibility', { exact: true }).click();
  await expect(page.getByText(/Roblox display names and usernames have separate rules/)).toBeVisible();
  await expect(page.getByLabel('Original text output')).toHaveText('Nova 12');
  await page.goto('/twitch-font-generator');
  await page.getByText('Platform tips & compatibility', { exact: true }).click();
  await expect(page.getByText(/display names generally change username capitalization/)).toBeVisible();
  await page.getByLabel('Your text', { exact: true }).fill('Hi @streamer https://example.com');
  await expect(page.getByLabel('Bold Sans output')).toHaveText('𝗛𝗶 @streamer https://example.com');
  await expect(page.getByText(/Channel rules and moderation bots may restrict unusual characters/)).toBeVisible();
});

test('Adopt Me frames affect styled names, preserve original and clear without orphan symbols', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/adopt-me-font-generator');
  await page.getByLabel('Pet name or label', { exact: true }).fill('Luna');
  await page.getByRole('button', { name: 'Hearts', exact: true }).click();
  await expect(page.getByLabel('Small Caps output')).toHaveText('♡ ʟᴜɴᴀ ♡');
  await expect(page.getByLabel('Original text output')).toHaveText('Luna');
  await page.getByRole('button', { name: 'Copy Small Caps', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('♡ ʟᴜɴᴀ ♡');
  await page.getByRole('button', { name: 'No frame', exact: true }).click();
  await expect(page.getByLabel('Small Caps output')).toHaveText('ʟᴜɴᴀ');
  await page.getByRole('button', { name: 'Clear text', exact: true }).click();
  await page.getByRole('button', { name: 'Stars', exact: true }).click();
  await expect(page.getByLabel('Small Caps output')).toHaveText('Type above to see this style');
  await expect(page.getByRole('button', { name: 'Copy Small Caps', exact: true })).toBeDisabled();
});

test('handwriting loads real fonts and exports PNG and distinct SVG formats', async ({ page, request }) => {
  await page.goto('/handwriting-font-generator');
  await page.locator('#visual-text-input').fill('A little note\nMade with care');
  await expect.poll(() => page.evaluate(async () => {
    const faces = await document.fonts.load('400 72px "Caveat"');
    return faces.length > 0 && faces.every((face) => face.status === 'loaded');
  })).toBe(true);
  const pngDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PNG', exact: true }).click();
  const png = await fs.readFile((await (await pngDownload).path())!);
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(png.length).toBeGreaterThan(4000);
  const svgDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download editable SVG', exact: true }).click();
  const svg = await fs.readFile((await (await svgDownload).path())!, 'utf8');
  expect(svg).toContain('Caveat');
  expect(svg).toContain('A little note');
  expect(svg).toContain('Made with care');
  expect(svg).not.toContain('data:image/png');
  const faithfulDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download faithful SVG', exact: true }).click();
  expect(await fs.readFile((await (await faithfulDownload).path())!, 'utf8')).toContain('data:image/png');
  await page.getByRole('button', { name: /Patrick Hand — Print/ }).click();
  await expect.poll(() => page.evaluate(async () => {
    const faces = await document.fonts.load('400 72px "Patrick Hand"');
    return faces.length > 0 && faces.every((face) => face.status === 'loaded');
  })).toBe(true);
  for (const family of ['caveat', 'patrick-hand']) expect(await (await request.get(`/licenses/${family}-OFL.txt`)).text()).toContain('SIL OPEN FONT LICENSE');
  await expect(page.locator('#copyable-styles')).toBeVisible();
  await page.screenshot({ path: '/tmp/handwriting-generator-desktop.png' });
});

test('all nine pages fit mobile and new platform controls stay usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const slug of slugs) {
    await page.goto(`/${slug}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `/tmp/${slug}-expansion-mobile.png` });
  }
});

test('platform cards copy from the preview and keyboard; decorations expose their selection', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/adopt-me-font-generator');
  await page.getByLabel('Pet name or label', { exact: true }).fill('Luna');
  const hearts = page.getByRole('button', { name: 'Hearts', exact: true });
  await expect(hearts).toBeVisible();
  await hearts.click();
  await expect(hearts).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'No frame', exact: true })).toHaveAttribute('aria-pressed', 'false');
  const smallCaps = page.getByRole('button', { name: 'Copy Small Caps', exact: true });
  await page.getByLabel('Small Caps output').click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('♡ ʟᴜɴᴀ ♡');
  await expect(smallCaps).toContainText('Copied!');
  await page.getByLabel('Pet name or label', { exact: true }).fill('Nova');
  await expect(smallCaps).not.toContainText('Copied!');
  await smallCaps.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('♡ ɴᴏᴠᴀ ♡');
  await page.getByRole('button', { name: 'Stars', exact: true }).click();
  await smallCaps.focus();
  await page.keyboard.press('Space');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('✦ ɴᴏᴠᴀ ✦');
  await page.getByRole('button', { name: 'Clear text', exact: true }).click();
  await expect(page.getByLabel('Pet name or label', { exact: true })).toBeFocused();
  await expect(smallCaps).toBeDisabled();
});

test('platform layout exposes input, decoration controls and results on desktop and mobile', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/adopt-me-font-generator');
  await page.getByLabel('Pet name or label', { exact: true }).fill('Luna');
  await page.getByRole('button', { name: 'Hearts', exact: true }).click();
  const firstResult = page.getByRole('button', { name: 'Copy Small Caps', exact: true });
  await expect(firstResult).toBeInViewport();
  await page.screenshot({ path: '/tmp/adopt-me-copy-desktop.png', animations: 'disabled' });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => scrollTo(0, 0));
    await expect(page.getByRole('button', { name: 'Brackets', exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `/tmp/adopt-me-options-${width}.png`, animations: 'disabled' });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Hearts', exact: true })).toBeInViewport();
  await expect(page.getByRole('complementary', { name: 'Generator directory' })).toBeVisible();
  await firstResult.scrollIntoViewIfNeeded();
  await expect(firstResult).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/adopt-me-copy-mobile.png', animations: 'disabled' });
  await page.getByLabel('Small Caps output').click();
  await expect(firstResult).toContainText('Copied!');
  await page.screenshot({ path: '/tmp/adopt-me-copy-feedback-mobile.png', animations: 'disabled' });
  await page.goto('/twitter-font-generator');
  await page.getByLabel('Your text', { exact: true }).fill('Hello @artist #Design');
  await page.getByRole('button', { name: 'Copy Bold Sans', exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Copy Bold Sans', exact: true })).toBeInViewport();
  await page.screenshot({ path: '/tmp/twitter-copy-mobile.png', animations: 'disabled' });
});
