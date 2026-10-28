// 自动化只验证目视发现的问题不再回归；视觉是否协调仍查看截图。
import { test, expect } from '@playwright/test';

for (const theme of ['dark', 'light']) {
  test(`空间图审回归与局部截图 · ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/#/playground');
    await expect(page.locator('[data-scene]')).toHaveCount(8);
    if (theme === 'light') await page.getByRole('button', { name: '切换明暗主题', exact: true }).click();
    await page.mouse.move(0, 0);
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
    await page.waitForTimeout(350);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(900);

    // 01、02：示例里的完整日期/分类路径必须无需省略。
    for (const selector of ['.kima-date-picker__trigger-label', '.kima-cascader__trigger-label', '[data-scene=create] .kima-select__trigger-label']) {
      const value = page.locator(selector).first();
      await expect(value).toBeVisible();
      expect(await value.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    }
    const titleInput = page.getByRole('textbox', { name: '项目名称', exact: true });
    expect(await titleInput.evaluate(element => {
      const context = document.createElement('canvas').getContext('2d');
      const style = getComputedStyle(element);
      context.font = style.font;
      return context.measureText(element.value).width <= element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) + 1;
    })).toBe(true);

    // 03：编辑区不再只剩一个字；04：版本状态同一行，树叶名称不拆字。
    const tags = page.getByRole('textbox', { name: '团队标签', exact: true });
    expect(await tags.evaluate(element => element.clientWidth / parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(8);
    for (const row of await page.locator('.kima-playground__revision').all()) {
      expect(await row.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    }
    const treeLabel = page.getByRole('treeitem').filter({ hasText: '接入说明' });
    await expect(treeLabel).toBeVisible();
    const labelRects = await treeLabel.evaluate(element => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        if (walker.currentNode.textContent.trim() !== '接入说明') continue;
        const range = document.createRange(); range.selectNodeContents(walker.currentNode);
        return [...range.getClientRects()].filter(rect => rect.width > 0).length;
      }
      return 0;
    });
    expect(labelRects).toBe(1);

    // 05：真正的屏幕字号，不只是SVG内部font-size。图宽改变时重新测量坐标系。
    const plot = page.locator('.kima-chart__plot');
    const chart = await plot.evaluate(element => {
      const matrix = element.getScreenCTM();
      const style = getComputedStyle(element.querySelector('.kima-chart__axis'));
      return { font: parseFloat(style.fontSize) * Math.abs(matrix.d), canvasWidth: element.viewBox.baseVal.width, width: element.getBoundingClientRect().width };
    });
    expect(chart.font).toBeGreaterThanOrEqual(11.9);
    expect(Math.abs(chart.canvasWidth - chart.width)).toBeLessThan(1);
    // 改变容器尺寸后也不回到固定720px画布。
    await plot.evaluate(element => { element.style.width = '250px'; });
    await expect.poll(() => plot.evaluate(element => element.viewBox.baseVal.width)).toBe(250);
    await plot.evaluate(element => { element.style.removeProperty('width'); });
    await expect.poll(() => plot.evaluate(element => Math.abs(element.viewBox.baseVal.width - element.getBoundingClientRect().width))).toBeLessThan(1);
    const firstPoint = page.locator('.kima-chart__point').first();
    await firstPoint.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.kima-chart__point[data-point="0-1"]')).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(900);

    // 06：评分只靠星形表达值，48px热区保留且键盘可用。
    const stars = page.locator('.kima-rating__star');
    expect(await stars.first().evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
    expect((await stars.first().boundingBox()).height).toBeGreaterThanOrEqual(48);
    await page.getByRole('radio', { name: '4 / 5', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: '5 / 5', exact: true })).toBeChecked();

    // 07/08/09：线宽与环的真实几何。
    expect(await page.locator('.kima-slider__input').evaluate(element => getComputedStyle(element).getPropertyValue('--kima-slider-track-height').trim())).toBe('8px');
    const ring = await page.locator('.kima-ring-progress svg').evaluate(element => {
      const circle = element.querySelector('circle');
      return { dimension: element.viewBox.baseVal.width, radius: circle.r.baseVal.value, center: circle.cx.baseVal.value, stroke: parseFloat(getComputedStyle(circle).strokeWidth) };
    });
    expect(ring.dimension).toBe(80);
    expect(ring.center).toBe(40);
    expect(ring.radius + ring.stroke / 2).toBe(40);
    expect(ring.stroke).toBe(6);
    expect((await page.locator('.kima-divider__line').boundingBox()).height).toBe(2);

    // 14：顶栏字段与操作按钮同高，不更改其他64px字段。
    const topField = await page.locator('.kima-playground__tools .kima-select__control').boundingBox();
    const topButton = await page.getByRole('button', { name: '切换明暗主题', exact: true }).boundingBox();
    expect(topField.height).toBe(topButton.height);
    expect((await page.locator('[data-scene=schedule] .kima-date-picker__control').boundingBox()).height).toBe(64);

    // 默认态截图不混入测试中选中的数据点、评分或焦点滚动。
    await page.reload();
    await expect(page.locator('[data-scene]')).toHaveCount(8);
    if (theme === 'light') await page.getByRole('button', { name: '切换明暗主题', exact: true }).click();
    await page.mouse.move(0, 0);
    await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
    await page.waitForTimeout(350);
    for (const scene of ['schedule', 'team', 'files', 'budget', 'preferences', 'tasks']) {
      await page.locator(`[data-scene=${scene}]`).screenshot({ path: `shots/space-audit/verified-${scene}-${theme}.png` });
    }
    await page.screenshot({ path: `shots/space-audit/verified-${theme}.png` });
  });
}
