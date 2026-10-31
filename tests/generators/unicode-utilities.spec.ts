import { test, expect } from './fixtures';

test('inspector reports joined emoji, encoding and exact offsets with bounded output', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/unicode-character-inspector');
  await page.locator('#unicode-utility-input').fill('A👋e\u0301\u200b');
  await expect(page.getByTestId('unicode-counts')).toHaveText('5 code points · 4 grapheme clusters · 6 UTF-16 units');
  await expect(page.getByRole('list', { name: 'Inspected code points' })).toContainText('F0 9F 91 8B');
  await page.getByRole('button', { name: 'Copy character report', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('2\t1\tU+1F44B\tSymbol');
  await page.locator('#unicode-utility-input').fill('a'.repeat(100));
  await expect(page.getByRole('list', { name: 'Inspected code points' }).locator('li')).toHaveCount(80);
  await page.getByRole('button', { name: 'Show next 80 code points' }).click();
  await expect(page.getByRole('list', { name: 'Inspected code points' }).locator('li')).toHaveCount(100);
  await page.locator('#unicode-utility-input').fill('a'.repeat(2001));
  await expect(page.locator('#unicode-utility-input')).toHaveValue('a'.repeat(100));
  await expect(page.getByText(/nothing was truncated/)).toBeVisible();
});

test('remover changes only selected types, keeps the original and copies the actual result', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/invisible-character-remover');
  const original = 'A\u200b\u00a0👨‍👩‍👧‍👦 e\u0301';
  await page.locator('#unicode-utility-input').fill(original);
  await expect(page.getByTestId('unicode-result')).toHaveText(original);
  await page.getByRole('checkbox', { name: /Zero-width spaces, BOM/ }).check();
  await page.getByRole('checkbox', { name: /Replace special spaces/ }).check();
  await page.getByRole('button', { name: 'Copy result', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('A 👨‍👩‍👧‍👦 e\u0301');
  await expect(page.locator('#unicode-utility-input')).toHaveValue(original);
  await page.getByRole('checkbox', { name: /Remove joiners and non-joiners/ }).check();
  await expect(page.getByTestId('unicode-result')).toHaveText('A 👨👩👧👦 e\u0301');
  await page.getByRole('checkbox', { name: /Remove joiners and non-joiners/ }).uncheck();
  await expect(page.getByTestId('unicode-result')).toHaveText('A 👨‍👩‍👧‍👦 e\u0301');
});

test('normalization preserves unsupported text, accents and emoji; options keep page-local input', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/fancy-text-to-normal-text');
  const text = '𝐇𝐢 Ａ！ ᴀʙᴄ a\u0336 e\u0301 1️⃣ 👨‍👩‍👧‍👦 中文';
  await page.locator('#unicode-utility-input').fill(text);
  await page.getByRole('checkbox', { name: 'Restore supported small caps as lowercase' }).check();
  await page.getByRole('checkbox', { name: 'Remove combining underline and overlay marks' }).check();
  await page.getByRole('button', { name: 'Copy result', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('Hi A! abc a e\u0301 1️⃣ 👨‍👩‍👧‍👦 中文');
  await expect(page.locator('#unicode-utility-input')).toHaveValue(text);
  await page.getByRole('button', { name: 'Clear input', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Copy result', exact: true })).toBeDisabled();
});

test('Unicode workspaces have their own navigation, keep inputs separate and fit phone and desktop', async ({ page }) => {
  const paths = ['/unicode-character-inspector', '/invisible-character-remover', '/fancy-text-to-normal-text'];
  for (const path of paths) {
    for (const width of [320, 390, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const navigation = page.getByRole('navigation', { name: 'Unicode tool navigation', exact: true });
      if (width < 640) await navigation.locator('summary').click();
      await expect(navigation.locator('a[aria-current="page"]:visible')).toHaveAttribute('href', path);
      await expect(navigation.getByRole('link')).toHaveCount(5);
      await expect(page.getByRole('navigation', { name: 'Current generator', exact: true })).toHaveCount(0);
      await expect(page.getByPlaceholder('Search generators...')).toHaveCount(0);
      await expect(page.getByText('Font studio', { exact: true })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.locator('#unicode-utility-input').fill('Only this page');
      const next = paths[(paths.indexOf(path) + 1) % paths.length];
      await page.evaluate(() => { (window as unknown as Record<string, unknown>).unicodeNavigationMarker = true; });
      await navigation.locator(`a[href="${next}"]:visible`).click();
      await expect(page.locator('#unicode-utility-input')).not.toHaveValue('Only this page');
      expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).unicodeNavigationMarker)).toBe(true);
      await page.getByRole('button', { name: 'Clear input', exact: true }).click();
      if (width === 390 || width === 1440) {
        await page.goto(path);
        await page.screenshot({ path: `/tmp/unicode-workspace-${path.slice(1)}-${width}.png`, animations: 'disabled' });
      }
    }
  }
  await page.goto('/unicode-character-inspector');
  await page.locator('#unicode-utility-input').fill('Only Unicode');
  await page.getByRole('navigation', { name: 'Primary navigation', exact: true }).getByRole('link', { name: 'Font Generators', exact: true }).click();
  await expect(page.locator('#generator-input')).not.toHaveValue('Only Unicode');
});
