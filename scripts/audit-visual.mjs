/* 视觉审查：逐页打开正式文档站，量取演示区几何、溢出、零尺寸与重叠，
 * 并把当前渲染结果截图到 shots/audit/，供人工核对。不修改任何组件。
 * 用法：node scripts/audit-visual.mjs [baseURL]
 */
import { chromium } from '@playwright/test';
import { mkdir, readdir, writeFile } from 'node:fs/promises';

const base = process.argv[2] || process.env.KIMA_AUDIT_BASE || 'http://127.0.0.1:5188';
const root = new URL('../', import.meta.url);
const output = new URL('shots/audit/', root);
await mkdir(output, { recursive: true });

const slugs = (await readdir(new URL('src/components/', root)))
  .filter((name) => name.endsWith('.ce.vue'))
  .map((name) => name.replace('.ce.vue', ''))
  .sort();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const report = [];

async function measure() {
  return page.evaluate(() => {
    const canvas = document.querySelector('.kima-docs__canvas');
    const demo = [...(canvas?.querySelectorAll('.kima-gallery__demo') || [])].find((element) => element.offsetParent !== null);
    if (!canvas || !demo) return { missing: true };
    const box = (element) => {
      const rect = element.getBoundingClientRect();
      return { x: +rect.x.toFixed(1), y: +rect.y.toFixed(1), width: +rect.width.toFixed(1), height: +rect.height.toFixed(1), right: +rect.right.toFixed(1), bottom: +rect.bottom.toFixed(1) };
    };
    const name = (element) => {
      const tag = element.tagName.toLowerCase();
      const cls = typeof element.className === 'string' ? element.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
      return cls ? `${tag}.${cls}` : tag;
    };
    const all = [...demo.querySelectorAll('*')];
    const visible = all.filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    });
    const demoRect = demo.getBoundingClientRect();
    const clipped = (element) => {
      for (let node = element.parentElement; node && node !== demo; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX)) return true;
      }
      return false;
    };
    const overflow = visible
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        if (clipped(element)) return false;
        return rect.right > demoRect.right + 1.5 || rect.left < demoRect.left - 1.5;
      })
      .slice(0, 8)
      .map((element) => ({ el: name(element), ...box(element) }));
    const zeroCustom = [...demo.querySelectorAll('*')]
      .filter((element) => element.tagName.includes('-'))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width === 0 || rect.height === 0;
      })
      .map((element) => name(element))
      .slice(0, 8);
    const hostStyle = getComputedStyle(demo);
    return {
      missing: false,
      demo: box(demo),
      canvas: box(canvas),
      demoDisplay: hostStyle.display,
      demoGap: hostStyle.rowGap,
      scroll: { x: demo.scrollWidth - demo.clientWidth, y: demo.scrollHeight - demo.clientHeight },
      children: demo.children.length,
      visibleCount: visible.length,
      text: (demo.innerText || '').replace(/\s+/g, ' ').slice(0, 120),
      overflow,
      zeroCustom,
    };
  });
}

for (const slug of slugs) {
  const errors = [];
  const onError = (error) => errors.push(String(error));
  page.on('pageerror', onError);
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  try {
    await page.goto(`${base}/#/components/${slug}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.kima-docs__canvas .kima-gallery__demo', { timeout: 8000 }).catch(() => {});
    await page.addStyleTag({ content: '.kima-docs__top { display: none !important; }' }).catch(() => {});
    await page.waitForTimeout(450);
    const result = await measure();
    const canvas = page.locator('.kima-docs__canvas').first();
    if (await canvas.count()) await canvas.screenshot({ path: new URL(`${slug}.png`, output).pathname.slice(1), timeout: 8000 }).catch((error) => errors.push(`shot: ${error.message}`));
    report.push({ slug, ...result, errors });
  } catch (error) {
    report.push({ slug, fatal: String(error), errors });
  }
  page.off('pageerror', onError);
}

await writeFile(new URL('report.json', output), JSON.stringify(report, null, 2));
await browser.close();

const flagged = report.filter((item) => item.fatal || item.missing || (item.scroll && item.scroll.x > 1) || (item.overflow && item.overflow.length) || (item.zeroCustom && item.zeroCustom.length) || item.errors.length);
console.log(`pages=${report.length} flagged=${flagged.length}`);
for (const item of flagged) {
  console.log(JSON.stringify(item));
}
