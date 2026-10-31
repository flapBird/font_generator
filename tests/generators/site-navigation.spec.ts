import { test, expect } from './fixtures';
import { featuredToolCategories } from '../../lib/tool-navigation';

test('footer has a bounded directory list and keeps help and policies separate', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 }); await page.goto('/');
    const footer = page.locator('footer');
    const tools = footer.getByRole('navigation', { name: 'Font and text tools', exact: true });
    await expect(tools.getByRole('link')).toHaveCount(5);
    for (const href of ['/tools', '/styles', '/visual-art', '/symbols', '/unicode-tools']) await expect(tools.locator(`a[href="${href}"]`)).toHaveCount(1);
    await expect(tools.locator('a[href$="-generator"]')).toHaveCount(0);
    const site = footer.getByRole('navigation', { name: 'Site information', exact: true });
    expect(await site.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href')))).toEqual(['/#top', '/guides', '/about', '/contact']);
    const policies = footer.getByRole('navigation', { name: 'Site policies', exact: true });
    expect(await policies.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href')))).toEqual(['/terms', '/privacy']);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await footer.screenshot({ path: `/tmp/site-footer-${width}.png`, animations: 'disabled' });
    await tools.getByRole('link', { name: 'All tools', exact: true }).click(); await expect(page).toHaveURL(/\/tools$/);
  }
});

test('direct categories replace the Tools menu on phone, tablet and desktop', async ({ page }) => {
  for (const width of [320, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 }); await page.goto('/symbols');
    const main = page.getByRole('navigation', { name: 'Primary navigation', exact: true });
    await expect(main.getByRole('button', { name: 'Tools', exact: true })).toHaveCount(0);
    await expect(page.locator('#desktop-tool-links')).toHaveCount(0);
    let menu = main;
    if (width < 1024) {
      await main.getByRole('button', { name: 'Open menu', exact: true }).click();
      const mobile = page.locator('#mobile-navigation'); await expect.poll(() => mobile.evaluate((element) => element.style.height)).toBe('auto');
      menu = page.getByRole('navigation', { name: 'Mobile tool categories', exact: true });
      await expect(menu.getByRole('link')).toHaveCount(4);
    } else {
      const box = await page.locator('#site-search-desktop').boundingBox();
      expect(Math.abs(box!.x + box!.width / 2 - width / 2)).toBeLessThan(2);
    }
    for (const category of featuredToolCategories) await expect(menu.getByRole('link', { name: category.title, exact: true })).toHaveAttribute('href', category.href);
    await menu.getByRole('link', { name: 'Unicode Tools', exact: true }).click(); await expect(page).toHaveURL(/\/unicode-tools$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('global search finds tools, handles keyboard selection and shares filters with directory', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto('/');
  const search = page.locator('#site-search-desktop');
  await search.fill('character inspector');
  await expect(page.locator('#site-search-desktop-results').getByRole('link', { name: /Unicode Character Inspector/ })).toBeVisible();
  await search.press('ArrowDown'); await search.press('Enter');
  await expect(page).toHaveURL(/\/unicode-character-inspector$/);
  await search.fill('heart'); await search.press('Enter');
  await expect(page).toHaveURL(/\/tools#q=heart$/);
  await expect(page.getByRole('searchbox', { name: 'Search all tools' })).toHaveValue('heart');
  await expect(page.locator('[data-directory-tool="/symbols/heart-symbols"]')).toBeVisible();
  await search.fill('qqqnonexistent');
  await expect(page.locator('#site-search-desktop-results')).toContainText('No matching tools');
  await search.press('Escape'); await expect(page.locator('#site-search-desktop-results')).toHaveCount(0);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto('/symbols');
    const visibleSearch = page.locator(width >= 1024 ? '#site-search-desktop' : '#site-search-mobile');
    await visibleSearch.fill('signature');
    await expect(page.getByRole('link', { name: 'Signature Generator Visual & Art', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `/tmp/site-search-${width}.png`, animations: 'disabled' });
    await visibleSearch.press('Escape');
    await page.screenshot({ path: `/tmp/site-navigation-${width}.png`, animations: 'disabled' });
  }
});

test('theme switch preserves generator input and output, persists and works without storage', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto('/small-text-generator');
  const input = page.locator('#generator-input'); await input.fill('Hello Café 123');
  const results = page.locator('#generated-results article p');
  await expect(results.first()).toContainText(/./);
  const before = await results.allTextContents();
  await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(input).toHaveValue('Hello Café 123'); expect(await results.allTextContents()).toEqual(before);
  await page.screenshot({ path: '/tmp/site-header-dark.png', animations: 'disabled' });
  await page.reload(); await expect(page.locator('html')).toHaveClass(/dark/);
  await page.goto('/symbols'); await expect(page.locator('html')).toHaveClass(/dark/);
  await page.screenshot({ path: '/tmp/site-symbols-dark.png', animations: 'disabled' });
  await page.getByRole('button', { name: 'Switch to light mode', exact: true }).click(); await expect(page.locator('html')).not.toHaveClass(/dark/);
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('blocked', 'SecurityError'); }; });
  await page.reload(); await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).click(); await expect(page.locator('html')).toHaveClass(/dark/);
});
