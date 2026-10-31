import { test, expect } from './fixtures';

test('search suggestions, clear, keyboard results and small-screen panels remain usable', async ({ page }) => {
  for (const width of [320, 390, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 1024 ? 568 : 900 }); await page.goto('/');
    const id = width < 1024 ? 'site-search-mobile' : 'site-search-desktop';
    const input = page.locator(`#${id}`); const panel = page.locator(`#${id}-results`);
    await input.focus();
    for (const name of ['Font Styles', 'Visual & Art', 'Symbols & Emoji', 'Unicode Tools']) await expect(panel.getByRole('link', { name, exact: true })).toBeVisible();
    await page.screenshot({ path: `/tmp/search-suggestions-${width}.png`, animations: 'disabled' });
    await input.fill('font'); await expect(panel.getByRole('link', { name: 'See all results', exact: true })).toBeVisible();
    await expect(panel.locator('li')).toHaveCount(7);
    for (let i = 0; i < 7; i++) await input.press('ArrowDown');
    await expect(panel.locator('[aria-current="true"]')).toBeInViewport();
    const bounds = await panel.boundingBox(); expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width); expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(width < 1024 ? 568 : 900);
    await page.screenshot({ path: `/tmp/search-results-${width}.png`, animations: 'disabled' });
    await page.getByRole('button', { name: 'Clear tool search', exact: true }).click(); await expect(input).toHaveValue(''); await expect(input).toBeFocused();
    await expect(panel.getByRole('link', { name: 'Browse all tools', exact: true })).toBeVisible();
    await input.fill('heart'); await input.press('ArrowDown');
    const href = await panel.locator('[aria-current="true"]').getAttribute('href');
    await input.press('Enter'); await expect(page).toHaveURL(new RegExp(`${href}$`));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).click();
  await page.locator('#site-search-desktop').fill('invisible');
  await expect(page.locator('#site-search-desktop-results li').first()).toBeVisible();
  await page.screenshot({ path: '/tmp/search-dark.png', animations: 'disabled' });
});

test('failed search loading still offers the directory and retries on focus', async ({ page }) => {
  await page.route('**/tool-search.json', (route) => route.abort());
  await page.goto('/'); await page.locator('#site-search-desktop').fill('heart');
  const panel = page.locator('#site-search-desktop-results');
  await expect(panel).toContainText('Search is unavailable');
  await expect(panel.getByRole('link', { name: 'See all results', exact: true })).toHaveAttribute('href', '/tools#q=heart');
  await page.unroute('**/tool-search.json'); await page.locator('h1').click(); await page.locator('#site-search-desktop').focus();
  await expect(panel.locator('li').first()).toBeVisible();
});
