import { defineConfig } from '@playwright/test';

// Run after npm run build; keep this suite independent of paid AI services.
export default defineConfig({
  testDir: '.', testMatch: '*.spec.ts', workers: 1,
  outputDir: '/tmp/font-generators-text-tests', reporter: 'list',
  use: {
    baseURL: 'http://localhost:3212', browserName: 'chromium', headless: true,
    launchOptions: { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH },
  },
  webServer: {
    command: 'npm run start -- --hostname 127.0.0.1 --port 3212',
    url: 'http://localhost:3212', reuseExistingServer: false,
  },
});
