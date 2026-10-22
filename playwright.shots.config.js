// 截图专用配置：只跑 shots.spec.js，拍完就退出，不参与 pnpm test。
// 用法：pnpm shots
import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.KIMA_TEST_PORT || 5188);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/shots.spec.js",
  outputDir: "shots/test-results",
  fullyParallel: false,
  reporter: "list",
  use: { baseURL, trace: "off" },
  // 3 倍像素密度：截图放大后能看清图标描边的粗细，判断线宽够不够。
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"], deviceScaleFactor: 3 } }],
  webServer: {
    command: `pnpm exec vite --host 127.0.0.1 --port ${port} --strictPort`,
    url: `${baseURL}/tests/fixture.html`,
    reuseExistingServer: false,
  },
});
