import assert from 'node:assert/strict';
import { test } from 'node:test';
import { trackTextToolEvent } from '../../lib/analytics/text-tools';

test('new tool events use fixed identifiers, omit arbitrary query text and honor analytics opt-out', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const calls: unknown[][] = [];
  const fakeWindow = {
    location: { hostname: 'font-generators.org', href: 'https://font-generators.org/symbols?search=private-words' },
    fontAnalyticsConsent: 'granted', gtag: (...args: unknown[]) => calls.push(args),
  };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: fakeWindow });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { referrer: '' } });
  try {
    trackTextToolEvent('tool_copy_success', 'symbols', 'symbol-2661');
    const event = calls.find((call) => call[0] === 'event');
    assert.deepEqual(event, ['event', 'tool_copy_success', {
      tool_id: 'symbols', item_id: 'symbol-2661', page_location: 'https://font-generators.org/symbols', transport_type: 'beacon',
    }]);
    assert.ok(!JSON.stringify(calls).includes('private-words'));
    const before = calls.length;
    fakeWindow.fontAnalyticsConsent = 'denied';
    trackTextToolEvent('tool_copy_failure', 'invisible-character', 'space');
    assert.equal(calls.length, before);
    fakeWindow.fontAnalyticsConsent = 'granted';
    fakeWindow.gtag = () => { throw new Error('Analytics unavailable'); };
    assert.doesNotThrow(() => trackTextToolEvent('tool_favorite', 'symbols', 'symbol-2661'));
  } finally {
    if (original) Object.defineProperty(globalThis, 'window', original);
    else Reflect.deleteProperty(globalThis, 'window');
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
    else Reflect.deleteProperty(globalThis, 'document');
  }
});
