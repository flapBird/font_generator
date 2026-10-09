import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'http.spec.ts',
  outputDir: '/tmp/font-generator-cf-only-test-results',
  reporter: 'list',
  use: { baseURL: 'http://localhost:3212' },
  webServer: {
    command: 'npm run preview:cloudflare -- --port 3212 --ip 127.0.0.1',
    url: 'http://localhost:3212',
    cwd: process.cwd(),
    reuseExistingServer: false,
    timeout: 120000,
  },
});
