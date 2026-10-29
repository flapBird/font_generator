import { test, expect } from './fixtures';
import { unicodeNavigationLinks } from '../../lib/text-library/navigation-links';

test('footer keeps tool categories, site information and policies separate while retaining old links', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const footer = page.locator('footer');
    const tools = footer.getByRole('navigation', { name: 'Font and text tools', exact: true });
    const site = footer.getByRole('navigation', { name: 'Site information', exact: true });
    const policies = footer.getByRole('navigation', { name: 'Site policies', exact: true });
    for (const name of ['Font Styles', 'Visual & Art', 'Symbols & Emoji', 'Unicode Tools']) {
      await expect(tools.getByRole('heading', { name, exact: true })).toHaveCount(1);
    }
    for (const href of ['/styles', '/small-text-generator', '/cursive-font-generator', '/bubble-font-generator', '/fraktur-font-generator', '/visual-art', '/big-font-generator', '/fire-font-generator', '/disney-font-generator', '/minecraft-font-generator', '/symbols', '/unicode-tools']) {
      await expect(tools.locator(`a[href="${href}"]`)).toHaveCount(1);
    }
    expect(await site.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href')))).toEqual(['/#top', '/guides', '/about', '/contact']);
    expect(await policies.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href')))).toEqual(['/terms', '/privacy']);
    await expect(tools.locator('a[href="/privacy"], a[href="/terms"], a[href="/about"], a[href="/contact"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await footer.screenshot({ path: `/tmp/site-footer-${width}.png`, animations: 'disabled' });
    await policies.getByRole('link', { name: 'Privacy Policy', exact: true }).click();
    await expect(page).toHaveURL(/\/privacy$/);
  }
});

test('Unicode Tools is a peer menu on desktop and mobile and is absent from symbol category tabs', async ({ page }) => {
  for (const width of [320, 390, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/symbols');
    await expect(page.getByRole('navigation', { name: 'Symbol collections', exact: true }).locator('a[href="/unicode-tools"]')).toHaveCount(0);
    const main = page.getByRole('navigation', { name: 'Primary navigation', exact: true });
    if (width >= 1280) {
      const brand = await main.getByRole('link', { name: 'Font Generators', exact: true }).boundingBox();
      const home = await main.getByRole('link', { name: 'Home', exact: true }).boundingBox();
      expect(brand!.x + brand!.width).toBeLessThanOrEqual(home!.x);
      const symbols = main.getByRole('button', { name: 'Symbols & Emoji', exact: true });
      const unicode = main.getByRole('button', { name: 'Unicode Tools', exact: true });
      await symbols.click();
      await expect(page.locator('#desktop-symbol-links a[href="/unicode-tools"]')).toHaveCount(0);
      await unicode.click();
      await expect(symbols).toHaveAttribute('aria-expanded', 'false');
      await expect(unicode).toHaveAttribute('aria-expanded', 'true');
      const menu = page.getByRole('navigation', { name: 'Unicode tool categories', exact: true });
      for (const item of unicodeNavigationLinks) await expect(menu.getByRole('link', { name: item.label, exact: true })).toHaveAttribute('href', item.href);
      if (width === 1440) await page.screenshot({ path: '/tmp/unicode-primary-menu-1440.png', animations: 'disabled' });
      await unicode.press('Escape');
      await expect(unicode).toHaveAttribute('aria-expanded', 'false');
      await unicode.press('ArrowDown');
      await expect(menu.getByRole('link', { name: 'All Unicode tools', exact: true })).toBeFocused();
      await menu.getByRole('link', { name: 'All Unicode tools', exact: true }).click();
    } else {
      await main.getByRole('button', { name: 'Open menu', exact: true }).click();
      const mobile = page.locator('#mobile-navigation');
      await expect.poll(() => mobile.evaluate((element) => element.style.height)).toBe('auto');
      await expect(mobile.getByRole('button', { name: 'Symbols & Emoji', exact: true })).toBeVisible();
      await mobile.getByRole('button', { name: 'Unicode Tools', exact: true }).click();
      const menu = page.locator('#mobile-unicode-links');
      await expect(menu.getByRole('link')).toHaveCount(5);
      for (const item of unicodeNavigationLinks) await expect(menu.getByRole('link', { name: item.label, exact: true })).toHaveAttribute('href', item.href);
      if (width === 390) {
        await expect.poll(async () => {
          const bounds = await mobile.boundingBox();
          const home = await mobile.getByRole('link', { name: 'Home', exact: true }).boundingBox();
          const last = await menu.getByRole('link', { name: 'Invisible character', exact: true }).boundingBox();
          return !!bounds && !!home && !!last && home.y >= bounds.y && last.y + last.height <= Math.min(1000, bounds.y + bounds.height) + 1;
        }).toBe(true);
        await page.screenshot({ path: '/tmp/unicode-primary-menu-390.png', animations: 'disabled' });
      }
      await menu.getByRole('link', { name: 'All Unicode tools', exact: true }).click();
    }
    await expect(page).toHaveURL(/\/unicode-tools$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
