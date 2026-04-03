import { defineConfig, devices } from '@playwright/test';

/**
 * playwright.config.ts — Task 5.9 — Agent_Infra
 *
 * End-to-end test configuration for zktheory.org.
 *
 * Test files live in ./e2e/ (separate from Vitest unit tests in src/).
 * The webServer block uses `npx serve dist --listen 4321` because the project
 * uses the @astrojs/netlify adapter which does not support `astro preview`.
 * Run `npm run build` before executing tests (handled automatically by
 * `npm run test:e2e`); in local development `reuseExistingServer: true` skips
 * the rebuild if a server is already running on port 4321.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',

  /* Fail the run if .only is accidentally committed in CI */
  forbidOnly: !!process.env.CI,

  /* Allow one retry on CI to handle transient flakiness */
  retries: process.env.CI ? 1 : 0,

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },

  /* Serve the pre-built dist/ folder. Playwright waits for the URL to respond
     before launching tests. */
  webServer: {
    command: 'npx serve dist --listen 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
