// 只跑最小冒烟，保证入口、真实事件、弹层和文档站可用；总时长控制在 10 秒内。
// 视觉、间距、排版和中间帧靠人工截图审查，不把时间花在成百上千条自动化用例上。
import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.KIMA_TEST_PORT || 5188);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/smoke.spec.js",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: "line",
  use: { baseURL, trace: "off" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec vite --mode smoke --host 127.0.0.1 --port ${port} --strictPort`,
    url: `${baseURL}/tests/smoke-fixture.html`,
    reuseExistingServer: !process.env.CI,
  },
});
