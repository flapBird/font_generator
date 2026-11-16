import { readFile } from 'node:fs/promises';
import { test, expect } from './fixtures';

const paths = ['/cursed-text-generator', '/letters-in-different-fonts', '/hieroglyphics-translator', '/sonic-font-generator', '/spiderman-font-generator'];

test('keyword tools have canonical pages, server-rendered help and public discovery', async ({ request }) => {
  const [sitemap, llms, search] = await Promise.all([
    request.get('/sitemap.xml').then((response) => response.text()),
    request.get('/llms.txt').then((response) => response.text()),
    request.get('/tool-search.json').then((response) => response.json()),
  ]);
  for (const path of paths) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    const html = await response.text();
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    expect(html).toContain(`rel="canonical" href="https://font-generators.org${path}"`);
    expect(html).toMatch(/<h2[^>]*>What is the /i);
    expect(html).toMatch(/<h2[^>]*>How to /i);
    expect(html).toMatch(/<h2[^>]*>Frequently asked questions/i);
    expect(sitemap).toContain(`<loc>https://font-generators.org${path}</loc>`);
    expect(llms).toContain(`](https://font-generators.org${path})`);
    expect(search.filter((entry: { href: string }) => entry.href === path)).toHaveLength(1);
  }
  expect(llms).toMatch(/cursed-text-generator\).*Outputs: copyable text\./);
  expect(llms).toMatch(/letters-in-different-fonts\).*Outputs: copyable text\./);
  expect(llms).toMatch(/sonic-font-generator\).*Outputs: PNG\./);
  expect(llms).toMatch(/spiderman-font-generator\).*Outputs: PNG\./);
  expect(llms).toContain('Web texture on letters works with either background mode.');
  expect(llms).toContain('The sign breakdown shows each matched spelling unit, Gardiner number and code point.');

  const directoryLinks = {
    '/': [paths[1]], '/tools': paths, '/styles': paths.slice(0, 2), '/unicode-tools': [paths[2]],
    '/fandom': paths.slice(3), '/visual-art': paths.slice(3), '/zalgo-text-generator': [paths[0]],
    '/sonic-font-generator': [paths[4]],
  };
  for (const [directory, links] of Object.entries(directoryLinks)) {
    const html = await (await request.get(directory)).text();
    for (const path of links) expect(html).toContain(`href="${path}"`);
  }
  for (const path of paths.slice(3)) {
    const redirect = await request.get('/fandom' + path, { maxRedirects: 0 });
    expect(redirect.status()).toBe(301);
    expect(redirect.headers().location).toBe(path);
  }
});

test('Cursed creates distinct styles and cleans pasted output while keeping the creation draft', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 950 });
    await page.goto(paths[0]);
    const rail = page.getByRole('complementary', { name: 'Generator directory' });
    const here = rail.getByRole('navigation', { name: 'Current generator' }).filter({ visible: true });
    await expect(here.locator('a')).toHaveAttribute('href', paths[0]);
    await expect(here).toContainText('Here');
    const text = 'Café 12 👨‍👩‍👧‍👦';
    const input = page.getByLabel('Your text', { exact: true });
    await input.fill(text);
    const output = page.getByLabel('Haunted output', { exact: true });
    const before = await output.textContent();
    await page.getByRole('button', { name: 'Shuffle marks' }).click();
    await expect(output).not.toHaveText(before!);
    const effect = await output.textContent();
    const copy = page.getByRole('button', { name: 'Copy Haunted', exact: true });
    await copy.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(effect);
    await expect(page.getByRole('complementary', { name: 'Selected font preview' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Clean text', exact: true }).click();
    await page.getByLabel('Text to clean', { exact: true }).fill(effect!);
    await expect(page.getByLabel('Cleaned text output', { exact: true })).toHaveText(text);
    await page.getByRole('button', { name: 'Copy Cleaned text', exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(text);
    await page.getByRole('button', { name: 'Create cursed text', exact: true }).click();
    await expect(input).toHaveValue(text);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Clear text', exact: true }).click();
    await expect(copy).toBeDisabled();
    await input.fill(text);
    await rail.locator('a[href="/small-text-generator"]').filter({ visible: true }).first().click();
    await expect(page).toHaveURL(/\/small-text-generator$/);
    await expect(page.getByRole('navigation', { name: 'Current generator' })).toHaveCount(0);
    await expect(page.locator('#generator-input')).not.toHaveValue(text);
  }
});

test('A–Z copies an individual letter and its matching alphabet', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(paths[1]);
  await page.getByLabel('Choose a letter').selectOption('Z');
  await expect(page.getByLabel('Squared Capitals output')).toHaveText('🅉');
  await page.getByRole('button', { name: 'Copy Squared Capitals', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('🅉');
  await page.getByRole('button', { name: 'Lowercase', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Copy Squared Capitals', exact: true })).toHaveCount(0);
  await page.getByLabel('Alphabet style').selectOption('circled');
  await page.getByRole('button', { name: 'Copy Full alphabet', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(Array.from('ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ').join(' '));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('hieroglyphs show sign codes, load a page-local font and copy exact text', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const fontRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/fonts/hieroglyphics/')) fontRequests.push(request.url());
  });
  await page.goto('/');
  expect(fontRequests).toEqual([]);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(paths[2]);
  await expect(page.getByLabel('Hieroglyphs output')).toHaveText('𓋴𓄿𓅓');
  await expect(page.getByText('G17 · U+13153')).toBeVisible();
  expect(await page.evaluate(async () => {
    const faces = await document.fonts.load('24px "Noto Sans Egyptian Hieroglyphs"', '𓋴𓄿𓅓');
    return faces.some((face) => face.status === 'loaded');
  })).toBe(true);
  expect(fontRequests.some((url) => url.endsWith('/egyptian.woff2'))).toBe(true);
  const samples = page.getByRole('group', { name: 'Try a name', exact: true });
  await expect(samples.getByRole('button', { name: 'Sam', pressed: true })).toBeVisible();
  const sharon = samples.getByRole('button', { name: 'Sharon' });
  await sharon.press('Space');
  await expect(sharon).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Name or short word')).toHaveValue('Sharon');
  await expect(page.getByLabel('Hieroglyphs output')).toHaveText('𓈙𓄿𓂋𓍯𓈖');
  await page.getByLabel('Name or short word').fill('Sh x 12! 中文');
  await expect(samples.getByRole('button', { pressed: true })).toHaveCount(0);
  await expect(page.getByText('N37 · U+13219')).toBeVisible();
  await expect(page.getByText('Letters outside the supported Latin mapping are shown as entered.')).toBeVisible();
  await page.getByRole('button', { name: 'Copy Hieroglyphs', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('𓈙 𓎡𓋴 12! 中文');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Sonic exports the current preview and allows retry when its font fails', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  const font = '**/fonts/discovery/luckiest-guy/latin.woff2';
  await page.route(font, (route) => route.abort());
  await page.goto(paths[3]);
  const downloadButton = page.getByRole('button', { name: 'Download PNG', exact: true });
  await expect(downloadButton).toBeDisabled();
  const retry = page.getByRole('button', { name: 'Retry preview' });
  await expect(retry).toBeVisible();
  await page.unroute(font);
  await retry.click();
  await expect(downloadButton).toBeEnabled();
  const input = page.getByLabel('Your title', { exact: true });
  await input.fill('RING DASH\nFINISH LINE');
  const canvas = page.getByLabel('Sonic title preview');
  const previews = new Set<string>();
  for (const preset of ['Arcade Gold', 'Blue Boost', 'Sunset Sprint']) {
    await page.getByRole('button', { name: preset, exact: true }).click();
    await expect(downloadButton).toBeEnabled();
    previews.add(await canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL()));
  }
  expect(previews.size).toBe(3);
  await page.getByLabel('fill', { exact: true }).fill('#1abc9c');
  await page.getByLabel('Canvas format').selectOption('square');
  await expect(page.getByRole('status')).toHaveText('1600 × 1600 PNG ready');
  const pixels = await canvas.evaluate((node: HTMLCanvasElement) => {
    const pixels = node.getContext('2d')!.getImageData(0, 0, node.width, node.height).data;
    const hasChosenFill = pixels.some((red, index) => index % 4 === 0 && red === 26 && pixels[index + 1] === 188 && pixels[index + 2] === 156 && pixels[index + 3] === 255);
    return { transparentCorner: pixels[3] === 0, hasChosenFill, png: node.toDataURL().split(',')[1] };
  });
  expect(pixels.transparentCorner && pixels.hasChosenFill).toBe(true);
  const downloaded = page.waitForEvent('download');
  await downloadButton.click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe('sonic-sunset-sprint.png');
  expect((await readFile((await download.path())!)).toString('base64')).toBe(pixels.png);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 950 });
  const controls = page.getByRole('group', { name: 'Artwork controls' });
  const previewPanel = page.getByRole('region', { name: 'Preview and download' });
  for (const [format, ratio] of [['square', 1], ['banner', 2]] as const) {
    await page.getByLabel('Canvas format').selectOption(format);
    await expect(downloadButton).toBeEnabled();
    const controlBox = (await controls.boundingBox())!;
    const previewBox = (await previewPanel.boundingBox())!;
    const canvasBox = (await canvas.boundingBox())!;
    expect(previewBox.y).toBeCloseTo(controlBox.y, 0);
    expect(previewBox.height).toBeCloseTo(controlBox.height, 0);
    expect(canvasBox.width / canvasBox.height).toBeCloseTo(ratio, 2);
  }
  await page.getByRole('button', { name: 'Clear text', exact: true }).click();
  await expect(downloadButton).toBeDisabled();
});

test('Spider-Man masks optional webs to the lettering and exports the current PNG', async ({ page, request }) => {
  const fontPath = '/fonts/spiderman/bangers-latin.woff2';
  const requestedFonts: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === fontPath) requestedFonts.push(request.url());
  });
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto('/');
  const search = page.locator('#site-search-desktop');
  for (const query of ['Spider-Man', 'spider man', 'spiderman font generator']) {
    await search.fill(query);
    await expect(page.locator('#site-search-desktop-results a[href="/spiderman-font-generator"]')).toBeVisible();
  }
  await page.goto('/sonic-font-generator');
  await expect(page.getByRole('button', { name: 'Download PNG', exact: true })).toBeEnabled();
  expect(requestedFonts).toEqual([]);

  await page.route('**' + fontPath, (route) => route.abort());
  await page.goto('/spiderman-font-generator');
  const download = page.getByRole('button', { name: 'Download PNG', exact: true });
  const retry = page.getByRole('button', { name: 'Retry preview' });
  await expect(retry).toBeVisible();
  await expect(download).toBeDisabled();
  await page.unroute('**' + fontPath);
  await retry.click();
  await expect(download).toBeEnabled();
  expect(requestedFonts.length).toBeGreaterThan(0);
  const license = await request.get('/fonts/spiderman/OFL.txt');
  expect(license.ok()).toBe(true);
  expect(await license.text()).toContain('SIL OPEN FONT LICENSE Version 1.1');

  const input = page.getByLabel('Your title', { exact: true });
  const canvas = page.getByLabel('Spider-Man title preview', { exact: true });
  const web = page.getByLabel('Web texture on letters', { exact: true });
  const transparent = page.getByLabel('Transparent background', { exact: true });
  await expect(input).toHaveValue('WEB SLINGER');
  await expect(web).toBeChecked();
  await expect(transparent).toBeChecked();
  await input.fill('WEB SLINGER\nCafé 12 👩🏽‍🚀');
  const artwork = () => canvas.evaluate((node: HTMLCanvasElement) => {
    const pixels = node.getContext('2d')!.getImageData(0, 0, node.width, node.height).data;
    let ink = 0, borderInk = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (!pixels[i]) continue;
      ink++;
      const point = (i - 3) / 4;
      const x = point % node.width, y = Math.floor(point / node.width);
      if (x < 4 || y < 4 || x >= node.width - 4 || y >= node.height - 4) borderInk++;
    }
    return { png: node.toDataURL().split(',')[1], ink, borderInk, corner: pixels[3], width: node.width, height: node.height };
  });
  await expect(download).toBeEnabled();
  const withWeb = await artwork();
  await web.uncheck();
  await expect(download).toBeEnabled();
  const withoutWeb = await artwork();
  expect(withWeb.png).not.toBe(withoutWeb.png);
  expect(withWeb.ink).toBe(withoutWeb.ink);
  expect(withWeb.ink).toBeGreaterThan(1000);
  expect(withWeb.borderInk).toBe(0);
  expect(withWeb.corner).toBe(0);
  expect([withWeb.width, withWeb.height]).toEqual([2000, 1000]);

  const presets = new Set<string>();
  for (const name of ['Classic Cover', 'Midnight Web', 'Retro Issue']) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(download).toBeEnabled();
    presets.add((await artwork()).png);
  }
  expect(presets.size).toBe(3);
  await expect(input).toHaveValue('WEB SLINGER\nCafé 12 👩🏽‍🚀');
  await expect(web).not.toBeChecked();
  await transparent.uncheck();
  await expect(download).toBeEnabled();
  expect((await artwork()).corner).toBe(255);
  await transparent.check();
  await web.check();
  await page.getByLabel('Canvas format').selectOption('square');
  await expect(page.getByText('1600 × 1600 PNG ready', { exact: true })).toBeVisible();
  const expected = await artwork();
  expect(expected.corner).toBe(0);
  expect([expected.width, expected.height]).toEqual([1600, 1600]);
  const event = page.waitForEvent('download');
  await download.click();
  const file = await event;
  expect(file.suggestedFilename()).toBe('spiderman-retro-issue.png');
  expect((await readFile((await file.path())!)).toString('base64')).toBe(expected.png);

  const controls = page.getByRole('group', { name: 'Artwork controls' });
  const panel = page.getByRole('region', { name: 'Preview and download' });
  expect((await panel.boundingBox())!.height).toBeCloseTo((await controls.boundingBox())!.height, 0);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await panel.boundingBox())!.y).toBeLessThan((await web.boundingBox())!.y);
  }
  await page.getByRole('button', { name: 'Clear text', exact: true }).click();
  await expect(download).toBeDisabled();
  await expect(canvas).toBeHidden();
});
