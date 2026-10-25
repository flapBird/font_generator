import { test, expect } from '@playwright/test';

test('Workers returns the requested RSC tree or page segment from the static cache', async ({ request }) => {
  for (const [path, segment, marker] of [
    ['/weird-text-generator', '/_tree', '"tree":'],
    ['/weird-text-generator', '/$d$slug/__PAGE__', 'Weird Text Generator'],
    ['/guides', '/_tree', '"tree":'],
  ]) {
    const response = await request.get(`${path}?_rsc=offline-transport-check`, {
      headers: { RSC: '1', 'Next-Router-Prefetch': '1', 'Next-Router-Segment-Prefetch': segment },
    });
    expect(response.status(), `${path} ${segment}`).toBe(200);
    expect(response.headers()['content-type']).toContain('text/x-component');
    expect(response.headers()['x-nextjs-postponed']).toBe('2');
    const body = await response.text();
    expect(body).toContain(marker);
    expect(body).not.toContain('<!DOCTYPE html>');
  }
});

test('Cloudflare scheduled entry runs safely without AI credentials', async ({ request }) => {
  const response = await request.get('/__scheduled?cron=*/5%20*%20*%20*%20*');
  expect(response.status()).toBe(200);
});

test('legacy URLs keep permanent canonical redirects in Workers', async ({ request }) => {
  for (const [source, target] of [
    ['/style', '/styles'],
    ['/style/small-text-generator', '/small-text-generator'],
    ['/styles/small-text-generator', '/small-text-generator'],
    ['/fandom/minecraft-font-generator', '/minecraft-font-generator'],
  ]) {
    const response = await request.get(source, { maxRedirects: 0 });
    expect(response.status(), source).toBe(301);
    expect(new URL(response.headers().location, response.url()).pathname).toBe(target);
  }
});

test('SEO endpoints, public assets and unknown routes work in Workers', async ({ request }) => {
  for (const [path, content] of [
    ['/sitemap.xml', 'https://font-generators.org/'],
    ['/robots.txt', 'Sitemap:'],
    ['/llms.txt', 'Font Generators'],
    ['/ads.txt', 'google.com'],
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(await response.text()).toContain(content);
  }
  expect((await request.get('/og-font-generators.png')).status()).toBe(200);
  expect((await request.get('/this-generator-does-not-exist')).status()).toBe(404);
});

test('hashed static assets receive immutable browser caching', async ({ request }) => {
  const html = await (await request.get('/')).text();
  const asset = html.match(/(?:src|href)="([^"\s]*\/_next\/static\/[^"\s]+)"/)?.[1];
  expect(asset).toBeTruthy();
  const response = await request.get(asset!);
  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toContain('immutable');
});

test('public tools and optional AI font pages remain available without service credentials', async ({ request }) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('Font Generators');
  for (const path of ['/ai-font-generator', '/login', '/pricing', '/account']) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
  const directory = await (await request.get('/llms.txt')).text();
  expect(directory).toContain('Optional account and AI features');
  expect(directory).toContain('one standard English TTF with 72 glyphs');
});
