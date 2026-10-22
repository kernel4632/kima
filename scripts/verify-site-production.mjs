import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';

const port = Number(process.env.KIMA_SITE_PORT || 5225);
const base = `http://127.0.0.1:${port}`;
const components = (await readdir(new URL('../src/components/', import.meta.url)))
  .filter((file) => file.endsWith('.ce.vue'))
  .map((file) => file.replace('.ce.vue', ''));
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push({ url: page.url(), message: error.message }));
let checked = 0;
try {
  const response = await page.goto(base, { waitUntil: 'networkidle' });
  assert.equal(response?.status(), 200, 'production document response');
  for (const slug of components) {
    await page.goto(`${base}/#/components/${slug}`, { waitUntil: 'networkidle' });
    await page.locator('.kima-docs__canvas').waitFor({ state: 'visible' });
    await expect(page.locator('.kima-docs__heading h1')).toHaveText(slug.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(''));
    const demo = page.locator('.kima-examples .kima-gallery__demo:visible');
    if (slug === 'icon') await page.locator('.kima-examples .kima-icon').first().waitFor({ state: 'visible' });
    else await expect(demo).toHaveCount(1, { timeout: 10000 });
    await page.locator('#properties').waitFor({ state: 'visible' });
    checked++;
  }
  assert.deepEqual(errors, [], 'production site runtime errors');
  console.log(JSON.stringify({ exitCode: 0, checked, total: components.length, failed: 0, pageErrors: errors, base }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ exitCode: 1, checked, total: components.length, pageErrors: errors, failure: error.message, base }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
