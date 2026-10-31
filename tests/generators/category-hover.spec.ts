import { test, expect } from './fixtures';
import { categoryShortcuts } from '../../lib/tool-navigation';
import { getFontStyleGenerators, getVisualArtGenerators } from '../../lib/generator-registry';

test('centered categories open on mouse hover and retain the earlier ten/seven shortcuts', async ({ page }) => {
  expect(categoryShortcuts['font-styles'].map((item) => item.href)).toEqual(getFontStyleGenerators().slice(0, 10).map((item) => item.canonicalPath));
  expect(categoryShortcuts['visual-art'].map((item) => item.href)).toEqual(getVisualArtGenerators().slice(0, 7).map((item) => item.canonicalPath));
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto('/styles');
    const categories = page.locator('[data-category-menu]:visible');
    if (width >= 1024) {
      const first = await categories.first().boundingBox(); const last = await categories.last().boundingBox();
      expect(Math.abs((first!.x + last!.x + last!.width) / 2 - width / 2)).toBeLessThan(2);
    }
    for (const [id, label] of [['font-styles', 'Font Styles'], ['visual-art', 'Visual & Art'], ['symbols', 'Symbols & Emoji'], ['unicode-tools', 'Unicode Tools']]) {
      const group = categories.filter({ has: page.getByRole('link', { name: label, exact: true }) });
      const panel = page.locator(`#desktop-${id}-shortcuts`);
      await group.getByRole('link', { name: label, exact: true }).hover();
      await expect(panel).toBeVisible();
      await panel.getByRole('link').first().hover();
      await expect(panel).toBeVisible();
      if (id === 'font-styles' || id === 'visual-art') await page.screenshot({ path: `/tmp/category-${id}-${width}.png`, animations: 'disabled' });
      await page.mouse.move(width - 5, 850); await expect(panel).toBeHidden();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 540 });
  await page.getByRole('navigation', { name: 'Primary navigation', exact: true }).getByRole('link', { name: 'Font Styles', exact: true }).hover();
  const shortPanel = page.locator('#desktop-font-styles-shortcuts');
  await shortPanel.getByRole('link', { name: 'View all font styles', exact: false }).scrollIntoViewIfNeeded();
  await expect(shortPanel.getByRole('link').last()).toBeInViewport();
  await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).click();
  await page.getByRole('button', { name: 'Show Font Styles tools', exact: true }).hover();
  await expect(shortPanel).toBeVisible();
  await page.screenshot({ path: '/tmp/category-dark-short.png', animations: 'disabled' });
});

test('phone long categories remain click-operated and scroll to their final shortcuts', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 }); await page.goto('/');
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  const mobile = page.locator('#mobile-navigation');
  await expect.poll(() => mobile.evaluate((element) => element.style.height)).toBe('auto');
  const trigger = mobile.getByRole('button', { name: 'Show Font Styles tools', exact: true });
  await trigger.hover(); await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  const panel = page.locator('#mobile-font-styles-shortcuts');
  await expect(panel.getByRole('link')).toHaveCount(11);
  const horror = panel.getByRole('link', { name: 'Horror', exact: true });
  await horror.scrollIntoViewIfNeeded(); await expect(horror).toBeInViewport();
  await page.screenshot({ path: '/tmp/category-mobile-long.png', animations: 'disabled' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await horror.click(); await expect(page).toHaveURL(/\/horror-font-generator$/);
  await expect(mobile).toHaveCount(0);
});
