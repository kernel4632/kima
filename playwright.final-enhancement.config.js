import { defineConfig, devices } from '@playwright/test';

const port = 5218;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/final-enhancement.spec.js',
  outputDir: 'test-results/final-enhancement',
  workers: 2,
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
  ],
  webServer: {
    command: `pnpm exec vite --host 127.0.0.1 --port ${port} --strictPort`,
    url: `${baseURL}/tests/fixture.html`,
    reuseExistingServer: false,
  },
});
