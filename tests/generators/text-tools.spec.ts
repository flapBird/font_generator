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
  expect(llms).toContain('six copyable result cards');
  expect(llms).toContain('five simultaneous result cards');
  await page.goto('/styles');
  for (const slug of slugs) await expect(page.locator(`a[href="/${slug}"]`).first()).toBeVisible();
});

test('bold and strike copy actual Unicode including digits and preserve emoji', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  for (const [slug, button, expected] of [
    ['bold-text-generator', 'Copy Bold Sans', '𝗔𝗯 𝟭𝟮 👨‍👩‍👧‍👦'],
    ['strikethrough-text-generator', 'Copy Long Strikethrough', 'A̶b̶ 1̶2̶ 👨‍👩‍👧‍👦'],
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
  await expect(page.getByRole('group', { name: 'Message format', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Copy .*\(Markdown\)$/ })).toHaveCount(6);
  const expected = ' __**A\\*b**__ \n\n__**Next**__';
  await expect(page.getByLabel('Underline bold (Markdown) output')).toHaveText(expected);
  await page.getByRole('button', { name: 'Copy Underline bold (Markdown)', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
  await page.getByLabel('Your text', { exact: true }).fill('Hello');
  for (const [format, source] of [['Bold', '**Hello**'], ['Italic', '*Hello*'], ['Bold italic', '***Hello***'], ['Underline', '__Hello__'], ['Underline bold', '__**Hello**__'], ['Strikethrough', '~~Hello~~']]) {
    await expect(page.getByLabel(`${format} (Markdown) formatting preview`, { exact: true })).toHaveText('Hello');
    const card = page.getByRole('button', { name: `Copy ${format} (Markdown)`, exact: true });
    await card.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(source);
    await expect(page.getByRole('complementary', { name: 'Selected font preview' })).toContainText(source);
  }
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => scrollTo(0, 0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('button', { name: /^Copy .*\(Markdown\)$/ })).toHaveCount(6);
    await page.screenshot({ path: `/tmp/discord-all-formats-${width}.png`, animations: 'disabled' });
  }
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.getByLabel('Your text', { exact: true }).fill(' A*b \n\nNext');
  await page.getByRole('button', { name: 'Names & bios (Unicode)', exact: true }).click();
  await expect(page.getByLabel('Your text', { exact: true })).toHaveValue(' A*b \n\nNext');
  await expect(page.getByText('These are not valid for your unique @username.', { exact: false })).toBeVisible();
  await page.getByLabel('Your text', { exact: true }).fill('');
  await expect(page.getByRole('button', { name: 'Copy Bold Sans', exact: true })).toBeDisabled();
});

test('Zalgo lists five strengths and preserves custom controls, clipboard and empty behavior', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/zalgo-text-generator');
  await page.getByLabel('Your text', { exact: true }).fill('Hello\n👨‍👩‍👧‍👦 é');
  await expect(page.getByRole('group', { name: 'Effect strength', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Copy Zalgo/ })).toHaveCount(5);
  await expect(page.getByLabel('Zalgo — None output', { exact: true })).toHaveText('Hello\n👨‍👩‍👧‍👦 é');
  const lengths: number[] = [];
  for (const name of ['None', 'Mild', 'Medium', 'Strong', 'Extreme']) {
    const output = await page.getByLabel(`Zalgo — ${name} output`, { exact: true }).textContent();
    lengths.push(output!.length);
    expect(output).toContain('👨‍👩‍👧‍👦');
    await page.getByRole('button', { name: `Copy Zalgo — ${name}`, exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(output);
  }
  expect(lengths.every((length, i) => i === 0 || length > lengths[i - 1])).toBe(true);
  const result = page.getByLabel('Zalgo — Medium output', { exact: true });
  const original = await result.textContent();
  await page.getByRole('button', { name: 'Randomize marks' }).click();
  await expect(result).not.toHaveText(original!);
  await page.getByRole('button', { name: 'Copy Zalgo — Medium', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(await result.textContent());
  await page.getByText('Advanced settings', { exact: true }).click();
  const presetBeforeCustom = await result.textContent();
  const slider = page.getByRole('slider');
  await slider.focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('2');
  await expect(result).toHaveText(presetBeforeCustom!);
  await page.getByRole('button', { name: 'Copy Zalgo — Custom', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(await page.getByLabel('Zalgo — Custom output', { exact: true }).textContent());
  await page.getByLabel('Above letters', { exact: true }).uncheck();
  await page.getByLabel('Through letters', { exact: true }).uncheck();
  await page.getByLabel('Below letters', { exact: true }).uncheck();
  await expect(result).toHaveText('Hello\n👨‍👩‍👧‍👦 é');
  await page.evaluate(() => Object.defineProperty(navigator.clipboard, 'writeText', { value: () => Promise.reject(new Error('denied')) }));
  await page.getByRole('button', { name: 'Copy Zalgo — Medium', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Text selected' })).toHaveCount(1);
  await expect(page.getByLabel('Zalgo — Medium manual copy')).toBeFocused();
  await page.getByRole('button', { name: 'Clear text' }).click();
  await expect(result).toHaveText('Type above to see this style');
  await expect(page.getByRole('button', { name: 'Copy Zalgo — Medium', exact: true })).toBeDisabled();
});

test('Zalgo rejects oversized saved drafts without dropping their contents', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('font-generators-text-draft', 'a'.repeat(1001)));
  await page.goto('/zalgo-text-generator');
  await expect(page.getByRole('alert').filter({ hasText: 'This saved draft' })).toContainText('has not been cut');
  await expect(page.getByLabel('Your text', { exact: true })).toHaveValue('a'.repeat(1001));
  await expect(page.getByLabel('Zalgo — Medium output')).toHaveText('Type above to see this style');
});

test('new workspaces stay within mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const slug of slugs) {
    await page.goto(`/${slug}`);
    if (slug === 'zalgo-text-generator') {
      await page.getByLabel('Your text', { exact: true }).fill('CURSED TEXT');
      await expect(page.getByRole('button', { name: 'Copy Zalgo — Extreme', exact: true })).toBeVisible();
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
