import { defineConfig } from '@playwright/test';
import aiFontConfig from '../ai-font/playwright.config';

// Run the existing public-tool/auth/payment UI checks in workerd too.
export default defineConfig({
  ...aiFontConfig,
  testDir: '..',
  testMatch: /(?:ai-font\/browser|cloudflare\/http)\.spec\.ts$/,
  outputDir: '/tmp/font-generator-cloudflare-test-results',
  webServer: {
    ...aiFontConfig.webServer,
    // Wrangler variables must be passed as bindings, not only shell env values.
    command: 'npm run preview:cloudflare -- --port 3211 --ip 127.0.0.1 --test-scheduled --var AI_FONT_APP_URL:http://localhost:3211',
    url: 'http://localhost:3211',
    timeout: 120000,
  },
});
