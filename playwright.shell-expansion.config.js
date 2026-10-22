import { defineConfig, devices } from '@playwright/test';
const baseURL = 'http://127.0.0.1:5221';
export default defineConfig({
  testDir: './tests', testMatch: ['**/shell-expansion.spec.js', '**/components.spec.js', '**/interaction-expansion.spec.js', '**/navigation-expansion.spec.js'], outputDir: 'test-results/shell-expansion', workers: 2, fullyParallel: true, reporter: 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [{ name: 'desktop', use: {...devices['Desktop Chrome']} }, { name: 'mobile', use: {...devices['Pixel 7'], browserName: 'chromium'} }],
  webServer: { command: 'pnpm exec vite --host 127.0.0.1 --port 5221 --strictPort', url: `${baseURL}/tests/shell-fixture.html`, reuseExistingServer: false },
});
