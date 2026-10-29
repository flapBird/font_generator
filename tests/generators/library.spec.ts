import { test, expect } from './fixtures';
import { libraryPages } from '../../lib/text-library/catalog';
import { blankCharacters } from '../../lib/text-library/invisible';
import { generatorRegistry } from '../../lib/generator-registry';
import { getCollectionGuide } from '../../lib/text-library/guides';

test('library and Unicode pages contain server-rendered content, exact canonicals and crawlable discovery', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const llms = await (await request.get('/llms.txt')).text();
  for (const definition of libraryPages) {
    const response = await request.get(definition.path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(`<link rel="canonical" href="https://font-generators.org${definition.path}"`);
    expect(html).toContain(definition.title);
    expect(html).toContain('application/ld+json');
    expect(html).not.toContain('name="robots" content="noindex');
    expect(sitemap).toContain(`<loc>https://font-generators.org${definition.path}</loc>`);
    expect(llms).toContain(`https://font-generators.org${definition.path}`);
    if (['symbols', 'hearts', 'stars', 'arrows', 'kaomoji', 'emoji-combos'].includes(definition.id)) {
      expect((html.match(/data-library-item=/g) ?? []).length).toBeGreaterThan(20);
      const guide = getCollectionGuide(definition.id)!;
      expect(html).toContain(guide.heading);
      expect(html).toContain(guide.howToHeading);
      expect(html).toContain('Frequently asked questions');
      expect(html).toContain('"@type":"FAQPage"');
      expect(html).toContain('data-testid="collection-guide"');
      expect(html).not.toContain('https://www.unicode.org/');
      expect(html).not.toContain('Character references:');
      expect(html).not.toContain('Optional usage events record fixed tool');
    }
  }
  for (const generator of generatorRegistry) expect(sitemap).toContain(`https://font-generators.org${generator.canonicalPath}`);
  expect(llms).toContain('261 curated symbol sequences');
  expect(llms).toContain('five page-specific FAQs');
  expect(llms).toContain('without the font generator sidebar or artwork preview');
  expect(llms).toContain('The combination editor is hidden initially');
  expect(llms).toContain('not a complete Unicode inspector or remover');
  expect(llms).toContain('Signature Generator uses an independent image workspace');
  expect((await request.get('/symbols/not-a-collection')).status()).toBe(404);
});

test('search, filters, keyboard copy and joined emoji preserve exact characters', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/symbols/heart-symbols');
  await page.getByLabel('Search this collection').fill('U+2661');
  await expect(page.locator('[data-library-item]')).toHaveCount(1);
  const copy = page.getByRole('button', { name: 'Copy White heart suit', exact: true });
  const initialCard = await page.locator('[data-library-item]').boundingBox();
  await copy.focus(); await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('♡');
  await expect(page.getByText('Copied', { exact: true })).toBeVisible();
  const copiedCard = await page.locator('[data-library-item]').boundingBox();
  expect(copiedCard!.height).toBe(initialCard!.height);
  const notice = await page.getByText('Copied', { exact: true }).boundingBox();
  const add = await page.getByRole('button', { name: 'Add White heart suit to combination', exact: true }).boundingBox();
  expect(notice!.y + notice!.height).toBeLessThan(add!.y);
  await page.getByLabel('Search this collection').fill('');
  await page.getByLabel('Category', { exact: true }).selectOption('Emoji hearts');
  await page.getByRole('button', { name: 'Copy Heart on fire', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('❤️‍🔥');
  await page.getByLabel('Search this collection').fill('nothing-here');
  await expect(page.getByRole('heading', { name: 'No matching items' })).toBeVisible();
  await page.getByRole('button', { name: 'Show all items', exact: true }).click();
  await expect(page.locator('[data-library-item]')).toHaveCount(30);
});

test('combination pieces reorder, remove and edit without corrupting text or exceeding limits', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/symbols/heart-symbols');
  await expect(page.locator('#combination-editor')).toBeHidden();
  await expect(page.getByText('Small details. Your expression.', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Add White heart suit to combination', exact: true }).click();
  await page.getByRole('button', { name: 'Add Heart on fire to combination', exact: true }).click();
  await expect(page.getByLabel('Edit your combination')).toHaveValue('♡ ❤️‍🔥');
  await page.getByText(/Arrange pieces & spacing/).click();
  await page.getByRole('button', { name: 'Move piece 2 earlier' }).click();
  await page.getByLabel('Between pieces').selectOption('\n');
  await expect(page.getByLabel('Edit your combination')).toHaveValue('❤️‍🔥\n♡');
  await page.getByRole('button', { name: 'Copy combination', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('❤️‍🔥\n♡');
  await page.getByRole('button', { name: 'Remove piece 2' }).click();
  await expect(page.getByLabel('Edit your combination')).toHaveValue('❤️‍🔥');
  await page.getByLabel('Edit your combination').fill('My own words 👨‍👩‍👧‍👦');
  await expect(page.getByRole('list', { name: 'Combination pieces' }).locator('li')).toHaveCount(1);
  await page.getByLabel('Edit your combination').fill('x'.repeat(1000));
  await page.getByRole('button', { name: 'Add White heart suit to combination', exact: true }).click();
  await expect(page.getByLabel('Edit your combination')).toHaveValue('x'.repeat(1000));
  await expect(page.getByText(/Nothing was added or removed/)).toBeVisible();
  await page.getByRole('button', { name: 'Clear combination', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Copy combination', exact: true })).toBeDisabled();
  await page.getByLabel('Edit your combination').fill('♡ Alex ✦');
  await page.getByLabel('Edit your combination').press('Escape');
  await expect(page.locator('#combination-editor')).toBeHidden();
  await expect(page.locator('#open-combination')).toBeFocused();
  await page.locator('#open-combination').click();
  await expect(page.getByLabel('Edit your combination')).toHaveValue('♡ Alex ✦');
});

test('favorites persist by ID, recent copies require success, and clearing spans collections', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/symbols/heart-symbols');
  await page.getByRole('button', { name: 'Favorite White heart suit', exact: true }).click();
  await page.getByRole('button', { name: 'Copy White heart suit', exact: true }).click();
  // Clipboard writes are asynchronous; leave the page only after a confirmed copy.
  await expect(page.getByText('Copied', { exact: true })).toBeVisible();
  await page.goto('/symbols');
  await page.getByRole('button', { name: 'Favorites', exact: true }).click();
  await expect(page.locator('[data-library-item]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Recently copied', exact: true }).click();
  await expect(page.locator('[data-library-item]')).toHaveCount(1);
  const record = await page.evaluate(() => localStorage.getItem('font-generators:text-library:v1'));
  expect(record).toContain('symbol-2661');
  expect(record).not.toContain('♡');
  await page.getByRole('button', { name: 'Clear saved items', exact: true }).click();
  await expect(page.locator('[data-library-item]')).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Favorites', exact: true }).click();
  await expect(page.locator('[data-library-item]')).toHaveCount(0);
});

test('clipboard denial provides selected manual text and never claims a successful recent copy', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied'); } } }));
  await page.goto('/symbols/heart-symbols');
  await page.getByRole('button', { name: 'Copy Heart on fire', exact: true }).click();
  const fallback = page.getByLabel('Manual copy: Copy Heart on fire', { exact: true });
  await expect(fallback).toHaveValue('❤️‍🔥');
  await expect(fallback).toBeFocused();
  expect(await fallback.evaluate((element: HTMLTextAreaElement) => element.selectionEnd - element.selectionStart)).toBe('❤️‍🔥'.length);
  await expect(page.getByText('Copied to clipboard.', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Recently copied', exact: true }).click();
  await expect(page.locator('[data-library-item]')).toHaveCount(0);
  await page.goto('/invisible-character');
  await page.getByLabel('Character type').selectOption('space');
  await page.getByRole('button', { name: 'Copy invisible text', exact: true }).click();
  await expect(page.getByLabel('Manual copy: Copy invisible text', { exact: true })).toHaveValue(' ');
});

test('disabled local storage still supports session favorites', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage disabled'); };
    Storage.prototype.setItem = () => { throw new Error('Storage disabled'); };
  });
  await page.goto('/kaomoji');
  await page.getByRole('button', { name: 'Favorite Bright smile', exact: true }).click();
  await page.getByRole('button', { name: 'Favorites', exact: true }).click();
  await expect(page.locator('[data-library-item]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Clear saved items', exact: true }).click();
  await expect(page.locator('[data-library-item]')).toHaveCount(0);
});

test('all blank types copy exactly, invalid counts are rejected and inspection preserves emoji', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/invisible-character');
  await page.getByLabel('Repeat count (1–100)').fill('3');
  for (const entry of blankCharacters) {
    await page.getByLabel('Character type').selectOption(entry.id);
    await page.getByRole('button', { name: 'Copy invisible text', exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(entry.text.repeat(3));
  }
  for (const count of ['', '0', '101', '1.5']) {
    await page.getByLabel('Repeat count (1–100)').fill(count);
    await expect(page.getByRole('button', { name: 'Copy invisible text', exact: true })).toBeDisabled();
  }
  const pasted = '👨‍👩‍👧‍👦\u200b\u00a0';
  await page.locator('#blank-inspector').fill(pasted);
  await expect(page.getByTestId('blank-counts')).toHaveText('9 code points · 3 grapheme clusters · 13 UTF-16 units');
  await expect(page.getByRole('list', { name: 'Detected characters' })).toContainText('U+200D · 3 occurrences');
  await page.locator('#blank-inspector').fill('x'.repeat(2001));
  await expect(page.locator('#blank-inspector')).toHaveValue(pasted);
  await expect(page.getByText(/nothing was truncated/)).toBeVisible();
  await page.getByRole('button', { name: 'Clear checker', exact: true }).click();
  await expect(page.getByTestId('blank-counts')).toHaveText('0 code points · 0 grapheme clusters · 0 UTF-16 units');
});

test('invisible character uses utility navigation and leaves old generator inputs independent', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/invisible-character');
  await page.evaluate(() => { (window as unknown as Record<string, unknown>).libraryNavigationMarker = true; });
  const navigation = page.getByRole('navigation', { name: 'Unicode tool navigation', exact: true });
  await expect(navigation.locator('a[aria-current="page"]')).toHaveAttribute('href', '/invisible-character');
  await expect(page.getByRole('navigation', { name: 'Current generator', exact: true })).toHaveCount(0);
  await expect(page.getByPlaceholder('Search generators...')).toHaveCount(0);
  await page.locator('#blank-inspector').fill('Private test input');
  await navigation.locator('a[href="/unicode-character-inspector"]').click();
  await expect(page.locator('#unicode-utility-input')).not.toHaveValue('Private test input');
  await page.getByRole('navigation', { name: 'Primary navigation', exact: true }).getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.locator('#generator-input')).not.toHaveValue('Private test input');
  await expect(page.getByRole('navigation', { name: 'Current generator', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).libraryNavigationMarker)).toBe(true);
  await page.locator('footer').getByRole('link', { name: 'All Unicode tools', exact: true }).click();
  await page.getByRole('navigation', { name: 'Unicode tool navigation', exact: true }).locator('a[href="/invisible-character"]').click();
  await expect(page.locator('#blank-inspector')).toHaveValue('');
  await expect(page.getByLabel('Repeat count (1–100)')).toHaveValue('1');
});

test('mobile and desktop layouts stay within viewport and directory links remain accessible', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const width of [320, 390, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/symbols', '/symbols/heart-symbols', '/kaomoji', '/invisible-character', '/unicode-tools', '/']) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${path} at ${width}`).toBe(true);
      if (path === '/symbols' && width === 390) {
        await expect(page.getByRole('button', { name: 'Combine symbols', exact: true })).toBeVisible();
        await expect(page.locator('#combination-editor')).toBeHidden();
        const firstCard = await page.locator('[data-library-item]').first().boundingBox();
        expect(firstCard!.y).toBeLessThan(550);
      }
      if (path === '/' && width === 1024) {
        const nav = page.getByRole('navigation', { name: 'Primary navigation', exact: true });
        const brand = await nav.getByRole('link', { name: 'Font Generators', exact: true }).boundingBox();
        const menu = await nav.getByRole('button', { name: 'Open menu', exact: true }).boundingBox();
        expect(brand!.x + brand!.width).toBeLessThanOrEqual(menu!.x);
      }
      if (width === 390 || width === 1440) await page.screenshot({ path: `/tmp/text-library-${path.replace(/\//g, '-') || 'home'}-${width}.png`, animations: 'disabled' });
      if (path === '/symbols/heart-symbols') {
        await page.getByRole('button', { name: 'Add White heart suit to combination', exact: true }).click();
        await expect(page.getByLabel('Edit your combination')).toHaveValue('♡');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const panel = await page.locator('#combination-editor').boundingBox();
        expect(panel!.y).toBeGreaterThanOrEqual(0);
        expect(panel!.x + panel!.width).toBeLessThanOrEqual(width);
        if (width === 390 || width === 1440) await page.screenshot({ path: `/tmp/symbol-combination-${width}.png`, animations: 'disabled' });
        await page.getByRole('button', { name: 'Close editor', exact: true }).click();
        await expect(page.locator('#combination-editor')).toBeHidden();
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.locator('#mobile-navigation').getByRole('button', { name: 'Symbols & Emoji', exact: true }).click();
  await page.locator('#mobile-symbols-links').getByRole('link', { name: 'All symbols', exact: true }).click();
  await expect(page).toHaveURL(/\/symbols$/);
  await expect(page.getByRole('button', { name: 'Open menu', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('old homepage and generator chunks do not load the new library workspace', async ({ page }) => {
  for (const path of ['/', '/small-text-generator', '/cursive-font-generator']) {
    const scriptBodies: Promise<string>[] = [];
    const onResponse = (response: import('@playwright/test').Response) => {
      if (response.url().includes('/_next/static/') && response.url().endsWith('.js')) scriptBodies.push(response.text().catch(() => ''));
    };
    page.on('response', onResponse);
    await page.goto(path);
    await expect(page.locator('#generator-input')).toBeVisible();
    page.off('response', onResponse);
    const scripts = (await Promise.all(scriptBodies)).join('\n');
    expect(scripts).not.toContain('data-library-item');
    expect(scripts).not.toContain('font-generators:text-library:v1');
    expect(scripts).not.toContain('Check what you pasted');
  }
});
