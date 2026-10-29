import { test, expect } from './fixtures';
import { symbolNavigationLinks } from '../../lib/text-library/navigation-links';

test('symbol dropdown opens by click and keyboard, links to all six pages and preserves old menus', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/small-text-generator');
  const trigger = page.getByRole('button', { name: 'Symbols & Emoji', exact: true });
  const categories = page.getByRole('navigation', { name: 'Symbols and Emoji categories' });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  for (const item of symbolNavigationLinks) {
    await expect(categories.getByRole('link', { name: item.label, exact: true })).toHaveAttribute('href', item.href);
  }
  await page.screenshot({ path: '/tmp/symbol-header-menu.png', animations: 'disabled' });
  await categories.getByRole('link', { name: 'Heart symbols', exact: true }).click();
  await expect(page).toHaveURL(/\/symbols\/heart-symbols$/);
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.focus();
  await trigger.press('ArrowDown');
  await expect(categories.getByRole('link', { name: 'All symbols', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const nav = page.getByRole('navigation', { name: 'Primary navigation', exact: true });
  for (const [label, href] of [['Font Styles', '/styles'], ['Visual & Art', '/visual-art']]) {
    const oldTrigger = nav.getByRole('link', { name: label, exact: true });
    await oldTrigger.focus();
    await expect(oldTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(oldTrigger).toHaveAttribute('href', href);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  }
  await page.goto('/symbols/heart-symbols');
  await page.getByTestId('collection-guide').locator('section').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: '/tmp/symbol-guide-1440.png', animations: 'disabled' });
  await page.getByLabel('More font and text tools', { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: '/tmp/symbol-hubs-1440.png', animations: 'disabled' });
});

test('mobile symbol categories navigate and FAQ answers and tool hubs remain accessible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  const mobile = page.locator('#mobile-navigation');
  await mobile.getByRole('button', { name: 'Symbols & Emoji', exact: true }).click();
  const categories = page.locator('#mobile-symbols-links');
  for (const item of symbolNavigationLinks) await expect(categories.getByRole('link', { name: item.label, exact: true })).toBeVisible();
  // Wait for both menu animations to finish exposing the full list, not just its DOM nodes.
  await expect.poll(async () => {
    const menu = await mobile.boundingBox();
    const first = await categories.getByRole('link', { name: 'All symbols', exact: true }).boundingBox();
    const last = await categories.getByRole('link', { name: 'Emoji combos', exact: true }).boundingBox();
    return !!menu && !!first && !!last && first.y >= menu.y && last.y + last.height <= Math.min(900, menu.y + menu.height) + 1;
  }).toBe(true);
  await page.screenshot({ path: '/tmp/symbol-mobile-menu.png', animations: 'disabled' });
  await categories.getByRole('link', { name: 'Emoji combos', exact: true }).click();
  await expect(page).toHaveURL(/\/emoji-combos$/);
  await expect(mobile).toHaveCount(0);
  const faq = page.locator('#faq');
  await expect(faq.getByText('It copies text sequences', { exact: false })).toBeHidden();
  await faq.locator('summary').filter({ hasText: 'Does this tool combine emoji into a new image?' }).click();
  await expect(faq.getByText('It copies text sequences', { exact: false })).toBeVisible();
  await faq.scrollIntoViewIfNeeded();
  await page.screenshot({ path: '/tmp/symbol-mobile-faq.png', animations: 'disabled' });
  const hubs = page.getByLabel('More font and text tools', { exact: true });
  await expect(hubs.getByRole('link', { name: /Font Styles/ })).toHaveAttribute('href', '/styles');
  await expect(hubs.getByRole('link', { name: /Visual & Art/ })).toHaveAttribute('href', '/visual-art');
  await hubs.scrollIntoViewIfNeeded();
  await page.screenshot({ path: '/tmp/symbol-mobile-hubs.png', animations: 'disabled' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await hubs.getByRole('link', { name: /Font Styles/ }).click();
  await expect(page).toHaveURL(/\/styles$/);
});
