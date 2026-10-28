import { test as base } from '@playwright/test';

// Functional regressions run locally and do not exercise analytics. Clarity
// 0.8.72 can throw a remote "null.sequence" error during fast history changes.
// Block only that recorder; retain all application error assertions, requests,
// local fonts and production tracking configuration.
export const test = base.extend({
  page: async ({ page }, run) => {
    await page.route(/https:\/\/([^/]+\.)?clarity\.ms\//, (route) => route.abort());
    await run(page);
  },
});

export { expect } from '@playwright/test';
