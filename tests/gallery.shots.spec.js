import { test, expect } from '@playwright/test';

for (const size of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
  test(`独立组合预览一屏展示 ${size.width}×${size.height}`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize(size);
    await page.goto('/#/gallery');
    await expect(page.getByTestId('playground')).toBeVisible();
    await expect(page.locator('[data-scene]')).toHaveCount(8);
    await expect(page.locator('.kima-docs')).toHaveCount(0);
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(size.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(size.width);
    for (const scene of await page.locator('[data-scene]').all()) {
      const box = await scene.boundingBox();
      expect(box).not.toBeNull();
      expect(box.y + box.height).toBeLessThanOrEqual(size.height);
    }
    await page.screenshot({ path: `shots/playground-${size.width}-dark.png` });
    await page.getByRole('button', { name: '切换明暗主题', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-kima-theme', 'light');
    await page.mouse.move(0, 0);
    await page.waitForTimeout(350);
    await page.screenshot({ path: `shots/playground-${size.width}-light.png` });
    expect(errors).toEqual([]);
  });
}
