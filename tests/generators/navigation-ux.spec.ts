import { test, expect } from '@playwright/test';
import { generatorRegistry, isFontStyleGenerator } from '../../lib/generator-registry';
import { octoberSlugs } from '../../lib/october-catalog';

const newSlugs = [
  'bold-text-generator', 'strikethrough-text-generator', 'underline-text-generator',
  'small-caps-generator', 'vaporwave-font-generator', 'double-struck-font-generator',
  'roblox-font-generator', 'twitter-font-generator', 'twitch-font-generator',
  'adopt-me-font-generator', 'discord-font-generator', 'zalgo-text-generator', 'handwriting-font-generator',
];

test('original navigation entries, order, search and collection-link placement are restored; only additions are hidden', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/bubble-font-generator']) {
      await page.goto(path);
      const rail = page.getByRole('complementary', { name: 'Generator directory' });
      const hiddenSlugs: string[] = [...newSlugs, ...octoberSlugs];
      const baseline = generatorRegistry.filter((item) => item.kind !== 'directory' && (path !== '/' || item.homepage.enabled) && !hiddenSlugs.includes(item.slug));
      const expected = [...baseline.filter(isFontStyleGenerator), ...baseline.filter((item) => !isFontStyleGenerator(item))].map((item) => item.canonicalPath);
      const actual = await rail.locator('a:visible').evaluateAll((links) => links.map((link) => link.getAttribute('href')).filter((href) => href !== '/styles' && href !== '/visual-art'));
      expect(actual).toEqual(expected);
      expect(actual.length).toBeGreaterThan(12);
      for (const slug of hiddenSlugs) await expect(rail.locator(`a[href="/${slug}"]`)).toHaveCount(0);
      await expect(rail.getByText('Quick links', { exact: true })).toHaveCount(0);
      const search = rail.getByRole('searchbox', { name: 'Search generators' }).filter({ visible: true });
      await search.fill('Serif');
      await expect(rail.locator('a[href="/serif-font-generator"]').filter({ visible: true })).toBeVisible();
      await search.fill('Roblox');
      await expect(rail.getByText('No matching generators').filter({ visible: true })).toBeVisible();
      await search.fill('');
      if (width === 1440) {
        const collection = rail.getByRole('link', { name: /Browse text collection/ });
        await expect(collection).toHaveAttribute('href', '/styles');
        expect(await collection.evaluate((link) => link.previousElementSibling?.tagName)).toBe('UL');
        const artCollection = rail.getByRole('link', { name: /Browse art collection/ });
        expect(await artCollection.evaluate((link) => link.previousElementSibling?.tagName)).toBe('UL');
      } else {
        // The original mobile rail has no injected directory-link block above its chips.
        await expect(rail.locator('a[href="/styles"]')).not.toBeVisible();
      }
      if (path === '/bubble-font-generator') {
        await page.screenshot({ path: `/tmp/restored-navigation-${width}.png`, animations: 'disabled' });
        if (width === 1440) {
          await rail.getByRole('link', { name: /Browse text collection/ }).click();
          await expect(page).toHaveURL(/\/styles$/);
        }
      }
    }
    await page.goto('/styles');
    for (const slug of newSlugs.filter((slug) => slug !== 'handwriting-font-generator')) await expect(page.locator(`a[href="/${slug}"]`).first()).toBeVisible();
    await page.goto('/visual-art');
    await expect(page.locator('a[href="/handwriting-font-generator"]').first()).toBeVisible();
  }
});

test('new text tools share the workspace with a temporary current item; handwriting retains artwork and script sections', async ({ page, context }) => {
  test.setTimeout(120000);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const slug of newSlugs) {
      await page.goto(`/${slug}`);
      const rail = page.getByRole('complementary', { name: 'Generator directory' });
      if (slug === 'handwriting-font-generator') {
        await expect(rail).toHaveCount(0);
      } else {
        await expect(rail).toBeVisible();
        const current = rail.getByRole('navigation', { name: 'Current generator', exact: true }).filter({ visible: true });
        await expect(current.locator('a[aria-current="page"]')).toHaveAttribute('href', `/${slug}`);
        await expect(current).toContainText('Here');
        // Temporary current item is separate from the unchanged persistent list.
        await expect(rail.getByRole('navigation', { name: 'Copyable text generators', exact: true }).locator(`a[href="/${slug}"]`)).toHaveCount(0);
        for (const other of newSlugs.filter((item) => item !== slug)) await expect(rail.locator(`a[href="/${other}"]`)).toHaveCount(0);
      }
      const input = page.locator(slug === 'handwriting-font-generator' ? '#copyable-styles textarea' : 'main textarea').first();
      await input.fill('Ab 12!');
      const copy = page.getByRole('button', { name: /^Copy / }).first();
      const expected = await copy.locator('[aria-label$=" output"]').textContent();
      await copy.click();
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
      await expect(copy).toContainText('Copied!');
      if (width === 1440 && slug !== 'handwriting-font-generator') {
        const preview = page.getByRole('complementary', { name: 'Selected font preview' });
        await expect(preview).toContainText(expected!);
        const cards = page.getByRole('button', { name: /^Copy / });
        if (await cards.count() > 1) {
          const another = cards.nth(1);
          const anotherOutput = await another.locator('[aria-label$=" output"]').textContent();
          await another.focus();
          await expect(preview).toContainText(anotherOutput!);
          await page.keyboard.press('Enter');
          await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(anotherOutput);
          await copy.click();
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (slug !== 'handwriting-font-generator') await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: `/tmp/${slug}-${width}-unified.png`, animations: 'disabled' });
    }
  }
  expect(errors).toEqual([]);
});

test('existing homepage, small text and cursive output and clearing behavior remain intact', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  for (const [path, name, expected] of [
    ['/', 'Preview and copy Bold Sans Font result', '𝗔𝗯 𝟭𝟮'],
    ['/small-text-generator', 'Preview and copy Superscript Font result', 'ᴬᵇ ¹²'],
    ['/cursive-font-generator', 'Preview and copy Elegant Script Font result', '𝒜𝒷 12'],
  ]) {
    await page.goto(path);
    await page.locator('#generator-input').fill('Ab 12');
    await page.getByRole('button', { name, exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
    await page.getByRole('button', { name: 'Clear input', exact: true }).click();
    await expect(page.locator('#generator-input')).toHaveValue('');
  }
});

test('handwriting opts into prominent presets while an existing visual tool keeps its selector and PNG export', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/handwriting-font-generator');
  await expect(page.getByRole('heading', { name: 'Choose handwriting', exact: true })).toBeVisible();
  await expect(page.locator('#visual-preset')).toHaveCount(0);
  await page.getByRole('button', { name: /Patrick Hand — Print/ }).click();
  await expect(page.getByRole('button', { name: /Patrick Hand — Print/ })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#visual-text-input').fill('A little note');
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: '/tmp/handwriting-presets-mobile.png', animations: 'disabled' });
  await page.getByRole('link', { name: /Jump to script styles/ }).click();
  await expect(page.locator('#copyable-styles')).toBeInViewport();
  await page.goto('/impact-font-generator');
  await expect(page.getByLabel('Style preset', { exact: true })).toBeVisible();
  await page.locator('#visual-text-input').fill('Existing artwork');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PNG', exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.png$/);
});


test('client-side switching keeps drafts, old HERE behavior and independent canonical pages', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/bold-text-generator');
    await page.locator('#generator-input').fill('Keep my words 12');
    await page.evaluate(() => { (window as unknown as Record<string, unknown>).__workspaceNavigation = 'same-document'; });
    let rail = page.getByRole('complementary', { name: 'Generator directory' });
    await rail.locator('a[href="/italics-font-generator"]').filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/italics-font-generator$/);
    await expect(page.locator('#generator-input')).toHaveValue('Keep my words 12');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://font-generators.org/italics-font-generator');
    rail = page.getByRole('complementary', { name: 'Generator directory' });
    await expect(rail.getByRole('navigation', { name: 'Current generator', exact: true })).toHaveCount(0);
    await expect(rail.locator('a[aria-current="page"]').filter({ visible: true })).toHaveAttribute('href', '/italics-font-generator');
    await expect(rail.locator('a[href="/bold-text-generator"]')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).__workspaceNavigation)).toBe('same-document');
    await page.goBack();
    await expect(page).toHaveURL(/\/bold-text-generator$/);
    await expect(page.locator('#generator-input')).toHaveValue('Keep my words 12');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://font-generators.org/bold-text-generator');
    await expect(page.getByRole('navigation', { name: 'Current generator', exact: true }).filter({ visible: true })).toContainText('Bold');
    expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).__workspaceNavigation)).toBe('same-document');
    await page.getByRole('button', { name: 'Clear text', exact: true }).click();
    await expect(page.locator('#generator-input')).toHaveValue('');
  }
});
