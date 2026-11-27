// 自动化只验证目视发现的问题不再回归；视觉是否协调仍查看截图。
// 裁员后 gallery 场景收缩为 4 个原语场景（create/team/tasks/preferences）。
import { test, expect } from '@playwright/test';

// Grok 主题深浅跟随系统（colorScheme 驱动，零 JS 切换）：light 用浏览器级 colorScheme 模拟。
for (const theme of ['dark', 'light']) {
  test(`空间图审回归与局部截图 · ${theme}`, async ({ browser }) => {
    const page = await browser.newPage({ colorScheme: theme, viewport: { width: 1440, height: 900 } });
    await page.goto('/#/playground');
    await expect(page.locator('[data-scene]')).toHaveCount(4);
    await page.mouse.move(0, 0);
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
    await page.waitForTimeout(350);

    // 01：字段文字不溢出。
    const titleInput = page.getByRole('textbox', { name: '项目名称', exact: true });
    await expect(titleInput).toBeVisible();
    expect(await titleInput.evaluate(element => {
      const context = document.createElement('canvas').getContext('2d');
      const style = getComputedStyle(element);
      context.font = style.font;
      return context.measureText(element.value).width <= element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) + 1;
    })).toBe(true);

    // 02：滑块 token 真实几何（裁员后仍保留 slider 断言）。
    expect(await page.locator('.kima-slider__input').evaluate(element => getComputedStyle(element).getPropertyValue('--kima-slider-track-height').trim())).toBe('8px');
    expect((await page.locator('.kima-divider__line').boundingBox()).height).toBe(2);

    // 03：顶栏按钮几何对齐官方 Button CVA 档（图标按钮 = shape:square 2xl 44）。
    const iconButton = await page.getByRole('button', { name: '查看文件', exact: true }).boundingBox();
    expect(iconButton.height).toBe(44);

    // 默认态截图。
    await page.reload();
    await expect(page.locator('[data-scene]')).toHaveCount(4);
    await page.mouse.move(0, 0);
    await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
    await page.waitForTimeout(350);
    for (const scene of ['create', 'team', 'tasks', 'preferences']) {
      await page.locator(`[data-scene=${scene}]`).screenshot({ path: `shots/space-audit/verified-${scene}-${theme}.png` });
    }
    await page.screenshot({ path: `shots/space-audit/verified-${theme}.png` });
    await page.close();
  });
}
