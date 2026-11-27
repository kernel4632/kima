/* breadcrumb 截图：dev server 上的 fixture 页。 */
import { chromium } from "@playwright/test";

const port = process.argv[2] || "5275";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(`http://127.0.0.1:${port}/tests/breadcrumb-fixture.html`, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(800);
await page.screenshot({ path: "shots/breadcrumb-fixture.png", fullPage: true });
console.log("shot saved");
await browser.close();
