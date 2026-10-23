/* 原生控件审查：逐页检查演示区里有没有“长得还是浏览器默认”的控件。
 * 判据：checkbox / radio / select / progress 是否可见，且没有用 appearance:none、
 * 透明覆盖或视觉隐藏类遮住——这些位置应该换成 KIMA 自己的组件或自己画的外观。
 * 用法：node scripts/audit-native.mjs [baseURL]
 */
import { chromium } from '@playwright/test';
import { componentPaths } from '../src/component-paths.js';
import { componentTiers } from '../src/component-tiers.js';

const base = process.argv[2] || 'http://127.0.0.1:5188';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const findings = [];
const tier = process.env.KIMA_AUDIT_TIER;
const slugs = (tier && componentTiers[tier] ? componentTiers[tier] : Object.keys(componentPaths)).sort();

for (const slug of slugs) {
  await page.goto(`${base}/#/components/${slug}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForSelector('.kima-docs__canvas .kima-gallery__demo', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(200);
  const hits = await page.evaluate(() => {
    const demo = [...document.querySelectorAll('.kima-docs__canvas .kima-gallery__demo')].find((element) => element.offsetParent !== null);
    if (!demo) return [];
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 1 && rect.height > 1 && style.visibility !== 'hidden' && style.display !== 'none'
        && Number(style.opacity) > 0.05 && style.clipPath === 'none' && !String(element.className).includes('visually-hidden');
    };
    return [...demo.querySelectorAll('input, select, progress')]
      .filter(visible)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        type: element.getAttribute('type') || '',
        appearance: getComputedStyle(element).appearance,
        width: Math.round(element.getBoundingClientRect().width),
        cls: String(element.className || '').split(/\s+/)[0],
      }))
      // 只认浏览器自己画外观的控件：文本框/数字框表面是我们画的，不算。
      .filter((item) => {
        if (item.appearance === 'none') return false;
        if (item.tag === 'select') return true;
        if (item.tag === 'progress') return true;
        return ['checkbox', 'radio', 'color', 'date', 'time', 'datetime-local', 'month', 'week', 'file', 'range', 'image'].includes(item.type);
      });
  });
  if (hits.length) findings.push({ slug, hits });
}

await browser.close();
console.log(`pages=${slugs.length} flagged=${findings.length}`);
for (const item of findings) console.log(item.slug.padEnd(24), JSON.stringify(item.hits));
