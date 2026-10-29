import { test, expect } from './fixtures';
import { toolDirectoryGroups } from '../../lib/tool-directory';

test('all tools directory is indexable and exposes every canonical tool link in initial HTML', async ({ request }) => {
  const html = await (await request.get('/tools')).text();
  expect(html).toContain('<link rel="canonical" href="https://font-generators.org/tools"');
  expect(html).toContain('name="twitter:title" content="All Font &amp; Text Tools"');
  expect(html).not.toContain('name="robots" content="noindex');
  for (const entry of toolDirectoryGroups.flatMap((group) => group.entries)) expect(html).toContain(`href="${entry.href}"`);
  expect((await (await request.get('/sitemap.xml')).text())).toContain('<loc>https://font-generators.org/tools</loc>');
  const llms = await (await request.get('/llms.txt')).text();
  expect(llms).toContain('https://font-generators.org/tools');
  expect(llms).toContain('Search loads a lightweight public catalog only on focus');
  const catalog = await request.get('/tool-search.json');
  expect(catalog.headers()['x-robots-tag']).toBe('noindex');
  expect(await catalog.json()).toHaveLength(96);
});

test('directory searches, filters, recovers from no results and opens existing tools on phone and desktop', async ({ page }) => {
  for (const width of [320, 390, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 }); await page.goto('/tools');
    const directory = page.getByRole('region', { name: 'Tool directory', exact: true });
    const search = page.getByRole('searchbox', { name: 'Search all tools', exact: true });
    await expect(directory.locator('[data-directory-tool]')).toHaveCount(toolDirectoryGroups.flatMap((group) => group.entries).length);
    await search.fill('Unicode Character Inspector');
    await expect(directory.locator('[data-directory-tool]')).toHaveCount(1);
    await directory.getByRole('button', { name: 'Font Styles', exact: true }).click();
    await expect(directory.getByRole('heading', { name: 'No matching tools', exact: true })).toBeVisible();
    await expect(search).toHaveValue('Unicode Character Inspector');
    await directory.getByRole('button', { name: 'Show all tools', exact: true }).click();
    await expect(search).toHaveValue('');
    await directory.getByRole('button', { name: 'Unicode Tools', exact: true }).click();
    await expect(directory.locator('[data-directory-tool]')).toHaveCount(5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390 || width === 1440) await page.screenshot({ path: `/tmp/tool-directory-${width}.png`, animations: 'disabled' });
    await directory.getByRole('link', { name: 'Unicode Character Inspector', exact: true }).click();
    await expect(page.locator('#unicode-utility-input')).not.toHaveValue('Unicode Character Inspector');
    await expect(page).toHaveURL(/\/unicode-character-inspector$/);
  }
});
