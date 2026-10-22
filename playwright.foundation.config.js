import { defineConfig, devices } from '@playwright/test';
const port = 5219;
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: './tests',
  testMatch: '**/foundation-expansion.spec.js',
  outputDir: 'test-results/foundation-expansion',
  workers: 2,
  fullyParallel: true,
  reporter: 'list',
  timeout: 30000,
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
  ],
  webServer: {
    command: `pnpm exec vite --host 127.0.0.1 --port ${port} --strictPort`,
    url: `${baseURL}/tests/foundation-fixture.html`,
    reuseExistingServer: false,
  },
});
