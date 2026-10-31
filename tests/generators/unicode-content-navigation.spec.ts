import { test, expect } from './fixtures';
import { unicodeGuides } from '../../lib/text-library/unicode-guides';
import { categoryShortcuts, toolCategories } from '../../lib/tool-navigation';

test('all five Unicode pages render distinct What, How to and matching FAQ content in initial HTML', async ({ request, page }) => {
  for (const [id, guide] of Object.entries(unicodeGuides)) {
    const html = await (await request.get(`/${id}`)).text();
    expect(html).toContain(guide.heading);
    expect(html).toContain(guide.howToHeading);
    expect(html).toContain('https://font-generators.org/' + id);
    await page.goto(`/${id}`);
    const content = page.getByTestId('collection-guide');
    await expect(content.getByRole('heading', { name: guide.heading, exact: true })).toBeVisible();
    await expect(content.locator('ol > li')).toHaveCount(3);
    await expect(content.locator('#faq details')).toHaveCount(5);
    const schema = JSON.parse(await content.locator('script[type="application/ld+json"]').textContent() || '{}');
    expect(schema.mainEntity.map((item: { name: string; acceptedAnswer: { text: string } }) => [item.name, item.acceptedAnswer.text])).toEqual(guide.faq.map((item) => [item.question, item.answer]));
    for (const faq of guide.faq) expect(html).toContain(faq.question);
    await content.locator('#faq summary').first().click();
    await expect(content.locator('#faq details').first()).toHaveAttribute('open', '');
  }
});

test('desktop category shortcuts support keyboard, single expansion, outside dismissal and direct links', async ({ page }) => {
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto('/unicode-tools');
    const nav = page.getByRole('navigation', { name: 'Primary navigation', exact: true });
    for (const category of toolCategories) {
      const trigger = nav.getByRole('button', { name: `Show ${category.title} tools`, exact: true });
      await trigger.focus(); await trigger.press('ArrowDown');
      const panel = page.locator(`#desktop-${category.id}-shortcuts`);
      await expect(panel.getByRole('link').first()).toBeFocused();
      await expect(panel.getByRole('link')).toHaveCount(categoryShortcuts[category.id].length + 1);
      const bounds = await panel.boundingBox(); expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      await page.keyboard.press('Escape'); await expect(trigger).toBeFocused(); await expect(panel).toBeHidden();
    }
    await nav.getByRole('button', { name: 'Show Font Styles tools', exact: true }).click();
    await nav.getByRole('button', { name: 'Show Unicode Tools tools', exact: true }).click();
    await expect(page.locator('#desktop-font-styles-shortcuts')).toBeHidden();
    await page.screenshot({ path: `/tmp/unicode-submenu-${width}.png`, animations: 'disabled' });
    await page.locator('#desktop-unicode-tools-shortcuts').getByRole('link', { name: 'Character inspector', exact: true }).click();
    await expect(page).toHaveURL(/\/unicode-character-inspector$/);
    await nav.getByRole('button', { name: 'Show Unicode Tools tools', exact: true }).click();
    await page.mouse.click(20, 500); await expect(page.locator('#desktop-unicode-tools-shortcuts')).toBeHidden();
    await nav.getByRole('link', { name: 'Unicode Tools', exact: true }).click(); await expect(page).toHaveURL(/\/unicode-tools$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('phone category accordions and local tool switcher fit and navigate without hover', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 }); await page.goto('/unicode-tools');
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    const mobile = page.locator('#mobile-navigation');
    await mobile.getByRole('button', { name: 'Show Unicode Tools tools', exact: true }).click();
    const panel = page.locator('#mobile-unicode-tools-shortcuts');
    await expect(panel.getByRole('link')).toHaveCount(5);
    await expect.poll(async () => {
      const menuBounds = await mobile.boundingBox();
      const lastLink = await panel.getByRole('link').last().boundingBox();
      return !!menuBounds && !!lastLink && lastLink.y >= menuBounds.y && lastLink.y + lastLink.height <= menuBounds.y + menuBounds.height;
    }).toBe(true);
    await mobile.locator('.overflow-y-auto').evaluate((element) => { element.scrollTop = 0; });
    await page.screenshot({ path: `/tmp/unicode-mobile-menu-${width}.png`, animations: 'disabled' });
    await panel.getByRole('link', { name: 'Character inspector', exact: true }).click();
    await expect(page).toHaveURL(/\/unicode-character-inspector$/); await expect(mobile).toHaveCount(0);
    const local = page.getByRole('navigation', { name: 'Unicode tool navigation', exact: true });
    await local.locator('summary').click();
    await local.getByRole('link', { name: 'Fancy to normal', exact: true }).click();
    await expect(page).toHaveURL(/\/fancy-text-to-normal-text$/);
    await expect(local.locator('details')).not.toHaveAttribute('open', '');
    await page.getByRole('heading', { name: 'What is Fancy Text to Normal Text?', exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/unicode-content-${width}.png`, animations: 'disabled' });
    await page.locator('#faq summary').first().click(); await expect(page.locator('#faq details').first()).toHaveAttribute('open', '');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
