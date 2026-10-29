import { readFile } from 'node:fs/promises';
import { test, expect } from './fixtures';
import { signatureFonts } from '../../lib/signature';

test('all six fonts render distinctly and export a cropped transparent PNG', async ({ page }) => {
  await page.goto('/signature-generator');
  const renders = new Set<string>();
  for (const font of signatureFonts) {
    await page.locator(`input[name="signature-font"][value="${font.id}"]`).check();
    await expect(page.getByTestId('signature-status')).toHaveText(`${font.label} is ready.`);
    renders.add(await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()));
  }
  expect(renders.size).toBe(6);
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download transparent PNG', exact: true }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe('signature.png');
  const bytes = await readFile((await download.path())!);
  const dimensions = await page.evaluate(async (base64) => {
    const img = new Image(); img.src = `data:image/png;base64,${base64}`; await img.decode();
    const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, img.width, img.height).data;
    return { width: img.width, height: img.height, corner: data[3], ink: data.some((value, index) => index % 4 === 3 && value > 0) };
  }, bytes.toString('base64'));
  expect(dimensions.ink).toBe(true); expect(dimensions.corner).toBe(0);
  expect(dimensions.width).toBeLessThan(1600); expect(dimensions.height).toBeLessThan(600);
  await page.getByLabel('Your name', { exact: true }).fill('');
  await expect(page.getByRole('button', { name: 'Download transparent PNG', exact: true })).toBeDisabled();
  await page.getByLabel('Your name', { exact: true }).fill('W'.repeat(80));
  await expect(page.getByTestId('signature-status')).toContainText('is ready');
  await page.getByLabel('Your name', { exact: true }).fill('W'.repeat(81));
  await expect(page.getByLabel('Your name', { exact: true })).toHaveValue('W'.repeat(80));
});

test('drawing strokes, undo, clearing and mode switching preserve separate drafts', async ({ page }) => {
  await page.goto('/signature-generator');
  await page.getByLabel('Your name', { exact: true }).fill('Taylor');
  await page.getByRole('tab', { name: 'Draw a signature', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Download transparent PNG', exact: true })).toBeDisabled();
  const canvas = page.getByLabel('Draw your signature here', { exact: true });
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * .2, box.y + box.height * .6); await page.mouse.down();
  await page.mouse.move(box.x + box.width * .4, box.y + box.height * .2, { steps: 12 });
  await page.mouse.move(box.x + box.width * .6, box.y + box.height * .7, { steps: 12 }); await page.mouse.up();
  await expect(page.getByTestId('signature-status')).toHaveText('Ready to download your drawing.');
  const ink = await canvas.evaluate((value: HTMLCanvasElement) => value.toDataURL());
  await page.getByRole('tab', { name: 'Type a signature', exact: true }).click();
  await expect(page.getByLabel('Your name', { exact: true })).toHaveValue('Taylor');
  await page.getByRole('tab', { name: 'Draw a signature', exact: true }).click();
  await expect.poll(() => canvas.evaluate((value: HTMLCanvasElement) => value.toDataURL())).toBe(ink);
  await page.getByRole('button', { name: 'Undo stroke', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Download transparent PNG', exact: true })).toBeDisabled();
  await page.mouse.click(box.x + box.width * .5, box.y + box.height * .5);
  await expect(page.getByRole('button', { name: 'Download transparent PNG', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Clear drawing', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Download transparent PNG', exact: true })).toBeDisabled();
});

test('font failures block stale export and can retry; old tools do not request signature fonts', async ({ page }) => {
  await page.route('**/fonts/signature/allura.woff2', (route) => route.abort());
  await page.goto('/signature-generator');
  await expect(page.getByTestId('signature-status')).toContainText('could not load');
  await expect(page.getByRole('button', { name: 'Download transparent PNG', exact: true })).toBeDisabled();
  await page.unroute('**/fonts/signature/allura.woff2');
  await page.getByRole('button', { name: 'Retry font', exact: true }).click();
  await expect(page.getByTestId('signature-status')).toContainText('Allura is ready');
  const requests: string[] = [];
  page.on('request', (request) => { if (request.url().includes('/fonts/signature/')) requests.push(request.url()); });
  for (const path of ['/', '/handwriting-font-generator', '/cursive-font-generator', '/visual-art']) await page.goto(path);
  expect(requests).toEqual([]);
});

test('signature controls fit phone and desktop and draw mode handles touch pointers', async ({ page }) => {
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto('/signature-generator');
    await expect(page.getByTestId('signature-status')).toContainText('is ready');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('tab', { name: 'Draw a signature', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `/tmp/signature-${width}.png`, animations: 'disabled' });
  }
  // Browser pointer events use CSS coordinates, while the stored canvas uses 1600 × 600.
  const canvas = page.getByLabel('Draw your signature here', { exact: true });
  await canvas.evaluate((element) => {
    const box = element.getBoundingClientRect();
    Object.defineProperty(element, 'setPointerCapture', { configurable: true, value: () => {} });
    for (const [type, ratio] of [['pointerdown', .2], ['pointermove', .5], ['pointerup', .8]] as const) element.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 9, pointerType: 'touch', button: 0, clientX: box.x + box.width * ratio, clientY: box.y + box.height * .5 }));
  });
  await expect(page.getByTestId('signature-status')).toHaveText('Ready to download your drawing.');
});
