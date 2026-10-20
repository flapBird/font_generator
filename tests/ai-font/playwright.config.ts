import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.', testMatch: '*.spec.ts', fullyParallel: false,
  outputDir: '/tmp/font-generator-ai-font-test-results', reporter: 'list',
  use: { baseURL: 'http://localhost:3211', browserName: 'chromium', headless: true,
    launchOptions: { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH },
  },
  webServer: {
    // NEXT_PUBLIC_* values are inlined at build time. Build with this same
    // unconfigured environment so a local .env file cannot enable live auth.
    command: 'npm run build && npm run start -- --hostname 127.0.0.1 --port 3211', url: 'http://localhost:3211', reuseExistingServer: false,
    cwd: process.cwd(), timeout: 180000,
    env: { NEXT_PUBLIC_SUPABASE_URL: '', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '', SUPABASE_SERVICE_ROLE_KEY: '', MIXFONT_API_KEY: '', AI_FONT_APP_URL: 'http://localhost:3211' },
  },
});
