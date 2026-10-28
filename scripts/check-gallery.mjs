// 可复现的全屏预览回归；复用已运行的开发或生产预览服务器。
// KIMA_GALLERY_URL 可指定含部署子路径的完整 URL。
import assert from 'node:assert/strict';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';

const url = process.env.KIMA_GALLERY_URL || 'http://localhost:5173/#/gallery';
const errors = [];
const browser = await chromium.launch();
await mkdir('shots', { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', error => errors.push(error.message));
  async function open() {
    await page.goto(url, { waitUntil: 'networkidle' });
    await expect(page.getByTestId('playground')).toBeVisible();
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
    await expect(page.locator('[data-scene]')).toHaveCount(8);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
  }
  async function desktopLayout() {
    const report = await page.evaluate(() => {
      const scenes = [...document.querySelectorAll('[data-scene]')];
      const outside = scenes.filter(element => {
        const r = element.getBoundingClientRect();
        return r.top < 0 || r.left < 0 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1;
      }).map(element => element.dataset.scene);
      // 仅检查正在参与排版的控件；忽略无障碍辅助节点、原生隐藏输入和已关弹层。
      const clipped = [...document.querySelectorAll('[data-scene] button, [data-scene] input:not([type=hidden]), [data-scene] textarea')].filter(element => {
        if (element.closest('dialog:not([open]), [aria-hidden=true], [inert]')) return false;
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        const r = element.getBoundingClientRect();
        if (r.width <= 1 || r.height <= 1) return false;
        const card = element.closest('[data-scene]').getBoundingClientRect();
        return r.right > card.right + 1 || r.bottom > card.bottom + 1 || r.left < card.left - 1;
      }).map(element => element.getAttribute('aria-label') || element.textContent.trim().slice(0, 30));
      return { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, outside, clipped };
    });
    assert.ok(report.scrollHeight <= report.height + 1, `页面纵向溢出: ${JSON.stringify(report)}`);
    assert.ok(report.scrollWidth <= report.width + 1, `页面横向溢出: ${JSON.stringify(report)}`);
    assert.deepEqual(report.outside, [], '场景必须完整可见');
    assert.deepEqual(report.clipped, [], '控件不能靠容器裁剪伪装为一屏');
    await expect(page.locator('.kima-docs__sidebar')).toHaveCount(0);
    console.log('LAYOUT', JSON.stringify(report));
  }

  await open();
  // 所有 core 目录入口必须确实被用于模板，而非仅导入或写在注释中。
  const source = await readFile('src/site/gallery.vue', 'utf8');
  const template = source.slice(source.indexOf('<template>'), source.indexOf('<style'));
  const core = (await readdir('src/components/core')).filter(name => name.endsWith('.ce.vue'));
  const missing = core.filter(file => {
    const name = 'Kima' + file.replace('.ce.vue', '').split('-').map(word => word[0].toUpperCase() + word.slice(1)).join('');
    return !new RegExp(`<${name}(?:\\s|>)`).test(template);
  });
  assert.deepEqual(missing, [], '基础组件不能通过删除示例来凑一屏');
  console.log(`CORE COVERAGE ${core.length}/${core.length}`);
  await desktopLayout();
  await page.screenshot({ path: 'shots/playground-dark-1440.png' });

  // 共享数据：滑块、预算进度和代码同时改变。
  const slider = page.getByRole('slider', { name: '本期预算', exact: true });
  await slider.fill('72');
  await expect(page.locator('[data-scene=files] code')).toContainText('budget = 72');
  await expect(page.getByRole('progressbar', { name: '预算进度', exact: true })).toHaveAttribute('value', '72');

  const taskScene = page.locator('[data-scene=tasks]');
  await taskScene.getByRole('tab', { name: '已完成', exact: true }).click();
  await expect(taskScene.locator('tbody:visible tr')).toHaveCount(1);
  await taskScene.getByRole('tab', { name: '全部任务', exact: true }).click();
  await expect(taskScene.locator('tbody:visible tr')).toHaveCount(2);

  // 对话框：通过文件新增入口打开，使用真正的 footer 按钮关闭。
  await page.getByRole('button', { name: '新增文件', exact: true }).click();
  const dialog = page.locator('dialog.kima-dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox', { name: '新项目名称', exact: true }).fill('浏览器回归项目');
  await dialog.getByRole('button', { name: '保存项目', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(taskScene).toContainText('浏览器回归项目');
  await expect(page.locator('.kima-notification')).toBeVisible();

  // 抽屉：验证真正打开，再通过操作按钮关闭。
  await page.getByRole('button', { name: '邀请成员', exact: true }).click();
  const drawer = page.locator('dialog.kima-drawer');
  await expect(drawer).toBeVisible();
  await drawer.getByRole('button', { name: '发送邀请', exact: true }).click();
  await expect(drawer).not.toBeVisible();

  await page.keyboard.press('Control+k');
  const command = page.locator('dialog.kima-command__dialog');
  await expect(command).toBeVisible();
  await command.getByRole('combobox').fill('创建项目');
  await command.getByRole('option', { name: '创建项目', exact: true }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await expect(dialog).not.toBeVisible();

  await page.getByRole('button', { name: '切换明暗主题', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-kima-theme', 'light');
  await page.waitForTimeout(300);
  await desktopLayout();
  await page.screenshot({ path: 'shots/playground-light-1440.png' });

  // 1080p 仍保持同一页；手机允许自然纵向排版，但不能横向溢出。
  await page.setViewportSize({ width: 1920, height: 1080 });
  await open();
  await desktopLayout();
  await page.screenshot({ path: 'shots/playground-desktop-1920.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await open();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '手机不应横向溢出');
  await page.screenshot({ path: 'shots/playground-mobile.png', fullPage: true });

  // 兼容入口可直达、刷新；从独立预览返回文档不会遗留壳。
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url.replace(/#.*$/, '#/playground'), { waitUntil: 'networkidle' });
  await expect(page.getByTestId('playground')).toBeVisible();
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByTestId('playground')).toBeVisible();
  await page.getByRole('link', { name: '文档', exact: true }).click();
  await expect(page.locator('.kima-docs')).toBeVisible();
  assert.deepEqual(errors, [], '不允许浏览器未捕获异常');
  console.log('PASS: 桌面无页面滚动 / 基础组件覆盖 / 数据联动 / 弹层与键盘 / 明暗 / 窄屏 / 路由');
} finally {
  await browser.close();
}
