/* 宽度审查：逐页量取文档站演示区里组件根的宽度与舞台宽度的比例。
 * 宽度明显小于舞台、且内容会增减的组件，收起内容时会出现"瞬间变窄"，
 * 需要给它们补 width: 100%（kima-block-host）。
 * 用法：node scripts/audit-width.mjs [baseURL]
 */
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { componentPaths } from '../src/component-paths.js';

const base = process.argv[2] || process.env.KIMA_AUDIT_BASE || 'http://127.0.0.1:5188';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const rows = [];

for (const slug of Object.keys(componentPaths).sort()) {
  await page.goto(`${base}/#/components/${slug}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForSelector('.kima-docs__canvas .kima-gallery__demo', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(220);
  const row = await page.evaluate(() => {
    const demo = [...document.querySelectorAll('.kima-docs__canvas .kima-gallery__demo')].find((element) => element.offsetParent !== null);
    if (!demo) return null;
    const stage = Math.round(demo.getBoundingClientRect().width);
    return {
      stage,
      roots: [...demo.children]
        .filter((element) => /^kima-/.test(String(element.className || '')))
        .map((element) => ({
          cls: String(element.className).split(/\s+/)[0],
          width: Math.round(element.getBoundingClientRect().width),
          height: Math.round(element.getBoundingClientRect().height),
        })),
    };
  });
  if (row) rows.push({ slug, ...row });
}

await writeFile(new URL('../shots/audit/width-report.json', import.meta.url), JSON.stringify(rows, null, 2));
await browser.close();

for (const row of rows) {
  const parts = row.roots.map((root) => `${root.cls}=${root.width}/${row.stage}${root.width < row.stage * 0.9 ? '*' : ''}`);
  if (parts.length) console.log(`${row.slug.padEnd(24)} ${parts.join(' ')}`);
}
