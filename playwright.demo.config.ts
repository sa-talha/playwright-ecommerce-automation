import { defineConfig, devices } from '@playwright/test';
import baseConfig, { STORAGE_STATE } from './playwright.config';

/**
 * Records the demo flows in tests/demo as videos (docs/media/videos),
 * which scripts/make-gifs.mjs turns into the GIFs used in the README.
 *
 *   npm run record:demos
 */
export default defineConfig({
  ...baseConfig,
  testIgnore: [],
  reporter: [['list']],
  retries: 0,
  workers: 1,
  outputDir: 'test-results-demo',
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'demo',
      testMatch: /tests\/demo\/.*\.demo\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        storageState: STORAGE_STATE,
        video: { mode: 'on', size: { width: 1280, height: 800 } },
        launchOptions: { slowMo: 60 },
      },
    },
  ],
});
