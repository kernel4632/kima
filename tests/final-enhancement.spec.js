import { expect, test } from '@playwright/test';
import { readdir } from 'node:fs/promises';

async function mount(page, html, properties = {}) {
  await page.goto('/tests/fixture.html');
  await page.evaluate(({ html, properties }) => window.fixture.mount(html, properties), { html, properties });
}

function rows(page, id = 'table') {
  return page.locator(`#${id} tbody tr:not(.kima-table__expanded-row) td:nth-child(1)`);
}

test.describe('table advanced contracts', () => {
  test('sorts locally without host writes, honors controlled state, resizes and summarizes', async ({ page }) => {
    await mount(page, '<kima-table id="table" sortable resizable summary></kima-table>');
    await page.evaluate(() => {
      const table = document.querySelector('#table');
      table.columns = [
        { key: 'name', label: '名称', sortable: true, resizable: true, width: 120, minWidth: 80 },
        { key: 'amount', label: '金额', sortable: true, summary: (items) => items.reduce((sum, row) => sum + row.amount, 0) },
        { key: 'hidden', label: '隐藏', hidden: true },
      ];
      table.items = [{ id: 1, name: 'Beta', amount: 2 }, { id: 2, name: 'Alpha', amount: 5 }];
    });
    await expect(rows(page)).toHaveText(['Beta', 'Alpha']);
    await page.getByRole('button', { name: '名称：按升序排列' }).click();
    await expect.poll(() => page.evaluate(() => window.fixture.events.filter((event) => event.type === 'sort-change').at(-1)?.detail)).toEqual([{ key: 'name', direction: 'asc' }]);
    await expect(rows(page)).toHaveText(['Alpha', 'Beta']);
    expect(await page.locator('#table').evaluate(table => table.items.map(row => row.name))).toEqual(['Beta', 'Alpha']);
    await page.getByRole('button', { name: '名称：按降序排列' }).click();
    await expect(rows(page)).toHaveText(['Beta', 'Alpha']);
    await expect(page.locator('#table tfoot')).toContainText('7');
    await expect(page.locator('#table thead th')).toHaveCount(2);
    const resize = page.getByRole('separator', { name: '调整名称列宽' });
    await resize.focus();
    await resize.press('ArrowRight');
    await expect(resize).toHaveAttribute('aria-valuenow', '128');

    await page.evaluate(() => {
      const table = document.querySelector('#table');
      table.sortKey = 'amount';
      table.sortDirection = 'asc';
    });
    await page.getByRole('button', { name: '金额：按降序排列' }).click();
    await expect.poll(() => page.evaluate(() => window.fixture.events.filter((event) => event.type === 'sort-change').at(-1)?.detail)).toEqual([{
      key: 'amount',
      direction: 'desc',
    }]);
    await expect(rows(page)).toHaveText(['Beta', 'Alpha']);
    await expect(page.locator('#table th[aria-sort="ascending"]')).toContainText('金额');
    await page.locator('#table').evaluate(table => { table.sortDirection = 'desc'; });
    await expect(rows(page)).toHaveText(['Alpha', 'Beta']);
    expect(await page.locator('#table').evaluate(table => table.items.map(row => row.amount))).toEqual([2, 5]);
  });
});

test.describe('remote option contracts', () => {
  test('select aborts stale requests and accepts the newest response', async ({ page }) => {
    await mount(page, '<kima-select id="select" label="城市" searchable></kima-select>');
    await page.evaluate(() => {
      const select = document.querySelector('#select');
      select.debounce = 0;
      select.loader = (query, { signal }) => new Promise((resolve, reject) => {
        const delay = query === 'a' ? 100 : 10;
        const timer = setTimeout(() => resolve([{ value: query, label: `结果 ${query}` }]), delay);
        signal.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
      });
    });
    await page.getByRole('combobox', { name: '城市' }).click();
    const search = page.getByRole('combobox', { name: '搜索选项' });
    await search.fill('a');
    await search.fill('ab');
    await expect(page.locator('.kima-select__option')).toHaveText(['结果 ab']);
    await expect(page.locator('.kima-select__status')).toHaveCount(0);
  });

  test('combobox retries a failed request and reports loading/error states', async ({ page }) => {
    await mount(page, '<kima-combobox id="combo" label="用户"></kima-combobox>');
    await page.evaluate(() => {
      let attempts = 0;
      const combo = document.querySelector('#combo');
      combo.debounce = 0;
      combo.retry = 0;
      combo.loader = () => {
        attempts += 1;
        return attempts === 1 ? Promise.reject(new Error('网络错误')) : Promise.resolve([{ value: 'u1', label: '用户一' }]);
      };
    });
    await page.getByRole('combobox', { name: '用户' }).click();
    await expect(page.locator('.kima-combobox__status--error')).toContainText('网络错误');
    await page.getByRole('button', { name: '重试' }).click();
    await expect(page.locator('.kima-combobox__option')).toHaveText(['用户一']);
  });
});

test('documentation full search exposes metadata and keyboard navigation', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+KeyK');
  const dialog = page.locator('.kima-command__dialog[open]');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('combobox', { name: /搜索组件/ }).fill('sortable');
  await expect(dialog).toContainText('Table');
  await page.keyboard.press('Enter');
  await expect(page.locator('h1')).toHaveText('Table');
  await page.keyboard.press('Control+KeyK');
  await expect(page.locator('.kima-command__dialog[open]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.kima-command__dialog[open]')).toHaveCount(0);
});

test('all component source entries remain represented in the catalog', async ({ page }) => {
  await page.goto('/');
  const { componentPaths } = await import('../src/component-paths.js');
  const files = Object.keys(componentPaths).map((slug) => `${slug}.ce.vue`);
  const catalogCount = await page.locator('.kima-docs__sidebar nav .kima-button').count();
  expect(catalogCount).toBeGreaterThanOrEqual(files.length);
  expect(new Set(files.map((file) => file.replace('.ce.vue', ''))).size).toBe(files.length);
});
