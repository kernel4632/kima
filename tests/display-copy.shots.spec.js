import { expect, test } from '@playwright/test';

async function open(page, slug) {
  await page.goto(`/#/components/${slug}`, { waitUntil: 'networkidle' });
  const demo = page.locator('.kima-docs__canvas .kima-display-demo');
  await expect(demo).toBeVisible();
  await expect(demo.locator(':scope > header')).toHaveCount(0);
  return demo;
}

for (const [width, theme] of [[1440, 'dark'], [360, 'light']]) {
  test(`展示文案：${width}px/${theme} 精简说明并保留错误、操作和可访问名`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height: 1000 });
    const demo = await open(page, 'alert');
    const switchTheme = page.getByRole('button', { name: theme === 'dark' ? '切换深色' : '切换浅色', exact: true });
    if (await switchTheme.count()) await switchTheme.click();
    await expect(demo.locator('.kima-alert')).toHaveCount(6);
    await expect(demo).not.toContainText('文字和图标共同传达状态');
    await expect(demo).not.toContainText('可以通过键盘访问');
    await expect(demo).not.toContainText('操作次数');
    const error = demo.locator('.kima-alert').filter({ hasText: '同步失败' });
    await expect(error).toHaveAttribute('role', 'alert');
    await expect(error).toContainText('检查网络连接后重试。');
    await expect(demo.locator('output')).toHaveCount(0);
    await demo.getByRole('button', { name: '查看邀请', exact: true }).click();
    await expect(demo.locator('output[role="status"]')).toHaveText('已查看邀请');
    await demo.getByRole('button', { name: '关闭提示', exact: true }).click();
    await expect(demo.getByRole('button', { name: '查看邀请', exact: true })).toBeHidden();
    await demo.getByRole('button', { name: '重新打开提示', exact: true }).click();
    await expect(demo.getByRole('button', { name: '查看邀请', exact: true })).toBeVisible();
    const widths = await demo.locator('.kima-alert:visible').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width));
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1);
    await expect(page.locator('.kima-ripple')).toHaveCount(0);
    await demo.screenshot({ path: `shots/display-copy/alert-${width}-${theme}.png`, scale: 'css' });

    const timeline = await open(page, 'timeline');
    await expect(timeline.getByRole('list', { name: '发布进程' })).toBeVisible();
    await expect(timeline.getByRole('listitem')).toHaveCount(3);
    await expect(timeline).not.toContainText('基础交互与视觉方向已确认');
    await timeline.getByRole('button', { name: '移除最早事件', exact: true }).click();
    await expect(timeline.getByRole('listitem')).toHaveCount(2);
    await timeline.getByRole('button', { name: '恢复事件', exact: true }).click();
    await expect(timeline.getByRole('listitem')).toHaveCount(3);
    await expect(timeline.getByRole('listitem').first()).toContainText('设计完成');
    await expect(timeline.getByRole('listitem').first()).toHaveCSS('opacity', '1');
    await expect(page.locator('.kima-ripple')).toHaveCount(0);
    await timeline.screenshot({ path: `shots/display-copy/timeline-${width}-${theme}.png`, scale: 'css' });

    const result = await open(page, 'result');
    await expect(result).toContainText('项目已发布');
    await expect(result).not.toContainText('所有内容已同步');
    await expect(result.getByRole('button', { name: '查看项目', exact: true })).toBeVisible();
    await expect(result.getByRole('button', { name: '返回列表', exact: true })).toBeVisible();

    const images = await open(page, 'image');
    await expect(images.locator('figcaption')).toHaveCount(0);
    await expect(images.getByRole('img', { name: '旅途中的风景', exact: true })).toBeVisible();
    await expect(images.getByRole('img', { name: '不可用的风景', exact: true })).toBeVisible();
    await expect(images).toContainText('图片加载失败');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}
