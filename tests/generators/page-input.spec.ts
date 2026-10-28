import { test, expect } from '@playwright/test';

test('inputs stay local across client navigation and Halloween tabs remain usable on mobile', async ({ page }) => {
  await page.goto('/small-text-generator');
  await page.locator('#generator-input').fill('Private example');
  await page.locator('a[href="/cursive-font-generator"]').filter({ visible: true }).first().click();
  await expect(page.locator('#generator-input')).not.toHaveValue('Private example');
  await page.goto('/halloween-font-generator');
  await expect(page.locator('#halloween-input')).toHaveValue('Happy Halloween');
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator('#halloween-input').fill('Boo');
    await page.getByRole('tab', { name: 'Copyable text', exact: true }).click();
    await expect(page.getByLabel('Pumpkin Blackletter output')).toContainText('𝔅𝔬𝔬');
    await page.getByRole('tab', { name: 'Artwork', exact: true }).click();
    await expect(page.locator('#halloween-input')).toHaveValue('Boo');
    await expect(page.getByRole('button', { name: 'Download Pumpkin Pop PNG' })).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `/tmp/halloween-simple-${width}.png` });
  }
  await expect(page.getByText('Make it spooky.', { exact: true })).toHaveCount(0);
  await expect(page.getByText('About the artwork & font licenses', { exact: true })).toHaveCount(0);
  await page.goto('/arabic-font-generator');
  await expect(page.locator('#artwork-input')).not.toHaveValue('Boo');
  await page.locator('#artwork-input').fill('Hello');
  await expect(page.getByText(/Enter Arabic text to compare/)).toBeVisible();
  await page.locator('#artwork-input').fill('مرحبا');
  await expect(page.getByText(/Enter Arabic text to compare/)).toHaveCount(0);
  await expect(page.getByTestId('artwork-status')).toContainText('Ready to download');
});
