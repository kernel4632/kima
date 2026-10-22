/* 把 shots/audit 的逐页截图拼成审阅用图集：每张图 20 个页面，4 列，
 * 便于一次看清整库的实际渲染形态。仅本地排查用，不进入版本库。
 */
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const audit = new URL(`${process.env.KIMA_AUDIT_DIR || 'shots/audit'}/`, root);
const { readFile } = await import('node:fs/promises');
const report = JSON.parse(await readFile(new URL('report.json', audit), 'utf8'));
const slugs = report.map((item) => item.slug);
const size = 20;
const sheets = [];
for (let index = 0; index < slugs.length; index += size) sheets.push(slugs.slice(index, index + size));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
for (const [index, group] of sheets.entries()) {
  const cells = group.map((slug) => `<figure><figcaption>${slug}</figcaption><img src="./${slug}.png" alt="${slug}"></figure>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:#101317;color:#c8ccd2;font:13px/1.4 monospace}
    main{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:14px}
    figure{margin:0;background:#181d23;border-radius:8px;overflow:hidden}
    figcaption{padding:6px 8px;color:#8fa6bf}
    img{display:block;width:100%;height:auto}
  </style><main>${cells}</main>`;
  const file = new URL(`sheet-${index + 1}.html`, audit);
  await writeFile(file, html);
  await page.goto(file.href, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: new URL(`sheet-${index + 1}.png`, audit).pathname.slice(1), fullPage: true });
  console.log(`sheet-${index + 1}: ${group.join(' ')}`);
}
await browser.close();
