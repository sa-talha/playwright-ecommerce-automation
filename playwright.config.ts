import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT) || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
export const STORAGE_STATE = '.auth/standard_user.json';

/**
 * Projects
 *  - setup:          logs in once through the UI and saves the session (storage state)
 *  - api:            HTTP-level tests, no browser
 *  - chromium/firefox/webkit: UI and accessibility tests, reuse the saved session
 *  - mobile-chrome:  the same UI tests on a Pixel 7 viewport
 *  - visual:         screenshot comparison, Chromium only so baselines stay stable
 */
export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/demo/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' },
  },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: BASE_URL,
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}',

  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'api', testMatch: /tests\/api\/.*\.spec\.ts/ },

    ...[
      { name: 'chromium', device: devices['Desktop Chrome'] },
      { name: 'firefox', device: devices['Desktop Firefox'] },
      { name: 'webkit', device: devices['Desktop Safari'] },
      { name: 'mobile-chrome', device: devices['Pixel 7'] },
    ].map(({ name, device }) => ({
      name,
      testMatch: /tests\/(ui|a11y)\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...device, storageState: STORAGE_STATE },
    })),

    {
      name: 'visual',
      testMatch: /tests\/visual\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, storageState: STORAGE_STATE },
    },
  ],

  webServer: {
    command: 'node app/server.js',
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(PORT) },
    stdout: 'ignore',
  },
});
