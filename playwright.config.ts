// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './packages/testing/e2e', fullyParallel: false, workers: 1,
  retries: 0, timeout: 30000, reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:3211', browserName: 'chromium', trace: 'retain-on-failure' },
  globalSetup: './packages/testing/e2e/setup.ts',
  globalTeardown: './packages/testing/e2e/teardown.ts',
  webServer: [
    { command: 'pnpm admin:start', url: 'http://127.0.0.1:3212', env: { APP_ORIGIN: 'http://127.0.0.1:3212' }, reuseExistingServer: false, timeout: 60000 },
    { command: 'pnpm proof:start', url: 'http://127.0.0.1:3211', reuseExistingServer: false, timeout: 60000 },
    { command: 'pnpm dev', url: 'http://127.0.0.1:3210/api/health', env: { APP_ORIGIN: 'http://127.0.0.1:3210' }, reuseExistingServer: false, timeout: 60000 },
  ],
});
