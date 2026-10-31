import { test, expect } from './fixtures';

test('Category menus support keyboard dismissal, category navigation and returning home through the logo', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto('/small-text-generator');
  const main = page.getByRole('navigation', { name: 'Primary navigation', exact: true });
  const trigger = main.getByRole('button', { name: 'Show Symbols & Emoji tools', exact: true });
  const menu = page.locator('#desktop-symbols-shortcuts');
  await trigger.focus(); await trigger.press('ArrowDown');
  await expect(menu.getByRole('link', { name: 'Heart symbols', exact: true })).toBeFocused();
  await page.keyboard.press('Escape'); await expect(trigger).toBeFocused(); await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.press('Enter'); await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await page.mouse.click(20, 500);
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click(); await menu.getByRole('link', { name: /View all symbols & emoji/ }).click(); await expect(page).toHaveURL(/\/symbols$/);
  await page.getByRole('navigation', { name: 'Symbol collections', exact: true }).getByRole('link', { name: 'Hearts', exact: true }).click();
  await expect(page).toHaveURL(/\/symbols\/heart-symbols$/);
  await main.getByRole('link', { name: 'Font Generators', exact: true }).click(); await expect(page.locator('#generator-input')).toBeVisible();
});

test('mobile categories reach symbol collections and retains FAQ and directory links', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 }); await page.goto('/');
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  const mobile = page.locator('#mobile-navigation');
  await page.getByRole('navigation', { name: 'Mobile tool categories', exact: true }).getByRole('link', { name: 'Symbols & Emoji', exact: true }).click();
  await expect(mobile).toHaveCount(0);
  await page.getByRole('navigation', { name: 'Symbol collections', exact: true }).getByRole('link', { name: 'Emoji combos', exact: true }).click();
  const faq = page.locator('#faq'); await faq.locator('summary').filter({ hasText: 'Does this tool combine emoji into a new image?' }).click();
  await expect(faq.getByText('It copies text sequences', { exact: false })).toBeVisible();
  const hubs = page.getByLabel('More font and text tools', { exact: true });
  await expect(hubs.getByRole('link', { name: /Visual & Art/ })).toHaveAttribute('href', '/visual-art');
  await hubs.getByRole('link', { name: /Font Styles/ }).click(); await expect(page).toHaveURL(/\/styles$/);
});
