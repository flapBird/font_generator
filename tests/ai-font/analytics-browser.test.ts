import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyticsAllowed, checkoutAnalyticsContext, safePageLocation, setAnalyticsConsent, setAnalyticsIdentity, trackEvent, trackLoginResult } from '../../lib/analytics/browser';
import { GA4_MEASUREMENT_ID } from '../../lib/analytics/shared';

test('browser tracking queues gtag correctly, removes sensitive URLs and resets identity on logout', async () => {
  const keys = ['window','document','sessionStorage'] as const;
  const previous = keys.map(key => Object.getOwnPropertyDescriptor(globalThis, key));
  const storage = new Map<string, string>();
  const browser = { location: new URL('https://font-generators.org/pricing?code=secret&email=private%40example.com&utm_source=newsletter#token'), dataLayer: [] as unknown[], gtag: undefined as ((...args: unknown[]) => void) | undefined };
  Object.defineProperty(globalThis, 'window', { value: browser, configurable: true });
  Object.defineProperty(globalThis, 'document', { value: { cookie: '_ga=GA1.1.123.456', referrer: 'https://accounts.google.com/?code=secret' }, configurable: true });
  Object.defineProperty(globalThis, 'sessionStorage', { value: { getItem: (key: string) => storage.get(key), setItem: (key: string, value: string) => storage.set(key, value) }, configurable: true });
  try {
    assert.equal(safePageLocation(), 'https://font-generators.org/pricing?utm_source=newsletter');
    trackEvent('page_view');
    assert.equal(typeof browser.gtag, 'function', 'the external tag must have a callable queue before it loads');
    setAnalyticsIdentity({ userId: 'a'.repeat(64), audienceType: 'internal', checkoutEligible: true, checkoutMode: 'private', paymentProvider: 'waffo', paymentEnvironment: 'test' });
    trackLoginResult({ id: 'login-1', destination: '/pricing' });
    trackLoginResult({ id: 'login-1', destination: '/pricing' });
    trackEvent('checkout_click');
    setAnalyticsIdentity(null);
    const commands = browser.dataLayer.map(item => Array.from(item as ArrayLike<unknown>));
    assert.equal(commands.filter(item => item[1] === 'login').length, 1);
    assert.equal(commands.filter(item => item[1] === 'login_return').length, 1);
    assert.equal((commands.at(-1)?.[2] as { user_id: unknown }).user_id, null);
    assert.ok(!JSON.stringify(commands).includes('secret'));
    assert.ok(!JSON.stringify(commands).includes('private@example.com'));
    const click = commands.find(item => item[1] === 'checkout_click')![2] as Record<string, unknown>;
    assert.equal(click.audience_type, 'internal'); assert.equal(click.value, 4.99);
    assert.equal(click.page_referrer, 'https://accounts.google.com');
    browser.gtag = (...args) => { if (args[0] === 'get') (args[3] as (value: unknown) => void)(args[2] === 'client_id' ? '123.456' : 123456); };
    assert.deepEqual(await checkoutAnalyticsContext(), { client_id: '123.456', session_id: '123456', analytics_storage: 'granted' });
    setAnalyticsConsent(false);
    assert.equal(analyticsAllowed(), false); assert.equal(await checkoutAnalyticsContext(), null);
    setAnalyticsConsent(true);
    browser.location = new URL('http://localhost:3000/pricing');
    assert.equal(analyticsAllowed(), false); assert.equal(await checkoutAnalyticsContext(), null);
    browser.location = new URL('https://font-generators.org/pricing');
    Object.assign(browser, { [`ga-disable-${GA4_MEASUREMENT_ID}`]: true });
    assert.equal(await checkoutAnalyticsContext(), null);
  } finally {
    keys.forEach((key, index) => { if (previous[index]) Object.defineProperty(globalThis, key, previous[index]!); else Reflect.deleteProperty(globalThis, key); });
  }
});
