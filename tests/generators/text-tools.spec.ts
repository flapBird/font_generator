import { test, expect } from '@playwright/test';

const slugs = ['bold-text-generator', 'strikethrough-text-generator', 'discord-font-generator', 'zalgo-text-generator'];

test('new pages expose canonical URLs, text outputs, sitemap and llms entries', async ({ page, request }) => {
  for (const slug of slugs) {
    const response = await page.goto(`/${slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://font-generators.org/${slug}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
  }
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const llms = await (await request.get('/llms.txt')).text();
  for (const slug of slugs) {
    expect(sitemap).toContain(`https://font-generators.org/${slug}`);
    expect(llms).toMatch(new RegExp(`${slug}\\).*Outputs: copyable text`));
  }
  expect(llms).toContain('independent above/through/below');
  expect(llms).toContain('unique Discord usernames');
  await page.goto('/styles');
  for (const slug of slugs) await expect(page.locator(`a[href="/${slug}"]`).first()).toBeVisible();
});

test('bold and strike copy actual Unicode including digits and preserve emoji', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  for (const [slug, button, expected] of [
    ['bold-text-generator', 'Preview and copy Bold Sans Font result', '𝗔𝗯 𝟭𝟮 👨‍👩‍👧‍👦'],
    ['strikethrough-text-generator', 'Preview and copy Long Strikethrough Font result', 'A̶b̶ 1̶2̶ 👨‍👩‍👧‍👦'],
  ]) {
    await page.goto(`/${slug}`);
    await page.locator('#generator-input').fill('Ab 12 👨‍👩‍👧‍👦');
    await page.getByRole('button', { name: button, exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
  }
});

test('Discord retains input across modes and copies escaped multiline Markdown', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/discord-font-generator');
  await page.getByLabel('Your text', { exact: true }).fill(' A*b \n\nNext');
  await page.getByRole('button', { name: 'Messages (Markdown)', exact: true }).click();
  await page.getByRole('button', { name: 'Underline bold', exact: true }).click();
  const expected = ' __**A\\*b**__ \n\n__**Next**__';
  await expect(page.getByLabel('Discord Markdown output')).toHaveText(expected);
  await page.getByRole('button', { name: 'Copy Discord Markdown', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
  await page.getByRole('button', { name: 'Names & bios (Unicode)', exact: true }).click();
  await expect(page.getByLabel('Your text', { exact: true })).toHaveValue(' A*b \n\nNext');
  await expect(page.getByText('These are not valid for your unique @username.', { exact: false })).toBeVisible();
  await page.getByLabel('Your text', { exact: true }).fill('');
  await expect(page.getByRole('button', { name: 'Copy Bold Sans', exact: true })).toBeDisabled();
});

test('Zalgo controls, clipboard, empty input and clipboard failure work', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/zalgo-text-generator');
  await page.getByLabel('Your text', { exact: true }).fill('Hello\n👨‍👩‍👧‍👦 é');
  const result = page.getByLabel('Zalgo text output');
  const original = await result.textContent();
  await page.getByRole('button', { name: 'Randomize marks' }).click();
  await expect(result).not.toHaveText(original!);
  await page.getByRole('button', { name: 'Copy Zalgo text', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(await result.textContent());
  await page.getByLabel('Above letters', { exact: true }).uncheck();
  await page.getByLabel('Through letters', { exact: true }).uncheck();
  await page.getByLabel('Below letters', { exact: true }).uncheck();
  await expect(result).toHaveText('Hello\n👨‍👩‍👧‍👦 é');
  await page.evaluate(() => Object.defineProperty(navigator.clipboard, 'writeText', { value: () => Promise.reject(new Error('denied')) }));
  await page.getByRole('button', { name: 'Copy Zalgo text', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Text selected');
  await expect(page.getByLabel('Zalgo text manual copy')).toBeFocused();
  await page.getByRole('button', { name: 'Clear text' }).click();
  await expect(result).toHaveText('Type above to see this style');
  await expect(page.getByRole('button', { name: 'Copy Zalgo text', exact: true })).toBeDisabled();
});

test('Zalgo rejects oversized saved drafts without dropping their contents', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('font-generators-text-draft', 'a'.repeat(1001)));
  await page.goto('/zalgo-text-generator');
  await expect(page.getByRole('alert').filter({ hasText: 'This saved draft' })).toContainText('has not been cut');
  await expect(page.getByLabel('Your text', { exact: true })).toHaveValue('a'.repeat(1001));
  await expect(page.getByLabel('Zalgo text output')).toHaveText('Type above to see this style');
});

test('new workspaces stay within mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const slug of slugs) {
    await page.goto(`/${slug}`);
    if (slug === 'zalgo-text-generator') {
      await page.getByLabel('Your text', { exact: true }).fill('CURSED TEXT');
      await page.getByRole('button', { name: 'Extreme', exact: true }).click();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `/tmp/${slug}-mobile.png` });
  }
});

test('dedicated workspaces render on desktop without client errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1080 });
  for (const slug of ['discord-font-generator', 'zalgo-text-generator']) {
    await page.goto(`/${slug}`);
    await page.getByLabel('Your text', { exact: true }).fill('Hello World');
    await page.screenshot({ path: `/tmp/${slug}-desktop.png` });
  }
  expect(errors).toEqual([]);
});
