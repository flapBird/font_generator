import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authReturnPath } from '../../lib/ai-font/auth-navigation';

test('login returns only to safe local pages, never external or API/auth routes', () => {
  for (const path of ['/', '/small-text-generator', '/guides/how-unicode-text-works-guide', '/ai-font-generator', '/my-fonts']) {
    assert.equal(authReturnPath(path), path);
  }
  for (const path of [null, '', 'https://evil.test', '//evil.test', '/\\evil.test', '/%2f%2fevil.test', '/api/ai-font/reconcile', '/login', '/login/', '/ai-font-generator/auth/callback', '/../api/ai-font/reconcile', '/?next=https://evil.test', '/\n/evil.test']) {
    assert.equal(authReturnPath(path), '/ai-font-generator');
  }
});
