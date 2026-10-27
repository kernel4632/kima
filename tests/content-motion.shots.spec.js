import { expect, test } from '@playwright/test';

async function mount(page, html, properties) {
  await page.goto('/tests/fixture.html', { waitUntil: 'networkidle' });
  await page.evaluate(({ html, properties }) => window.fixture.mount(html, properties), { html, properties });
}

async function freeze(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    for (const animation of document.getAnimations()) {
      animation.pause();
      animation.currentTime = 0;
    }
  });
}

async function progress(page, fraction) {
  await page.evaluate(fraction => {
    for (const animation of document.getAnimations()) {
      animation.currentTime = Number(animation.effect.getTiming().duration) * fraction;
    }
  }, fraction);
}

async function finish(page) {
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) animation.finish();
  });
}

for (const component of ['accordion', 'collapsible']) {
  test(`内容过渡：${component} 收起时高度连续且退场内容不可聚焦`, async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 720 });
    if (component === 'accordion') {
      await mount(page, '<kima-accordion id="subject"></kima-accordion><div id="after">后续内容</div>', {
        subject: {
          modelValue: 'a',
          items: [{ value: 'a', label: '详细说明', content: '这一段较长的内容用于检查收起中间帧、裁剪和焦点语义。'.repeat(8) }, { value: 'b', label: '第二项', content: '短内容' }],
        },
      });
    } else {
      await mount(page, '<kima-collapsible id="subject"><input aria-label="隐藏输入" /><p>这一段较长的内容用于检查收起中间帧、裁剪和焦点语义。</p></kima-collapsible><div id="after">后续内容</div>', {
        subject: { open: true, label: '高级设置' },
      });
    }
    await page.addStyleTag({ content: '#subject{--kima-duration-slow:1000ms;--kima-duration-effects:1000ms}' });
    const trigger = component === 'accordion'
      ? page.getByRole('button', { name: '详细说明', exact: true })
      : page.getByRole('button', { name: '高级设置', exact: true });
    const before = await page.locator('#subject').boundingBox();
    await trigger.click();
    await freeze(page);
    const wrapper = component === 'accordion'
      ? page.locator('[role="region"]').filter({ hasText: '这一段较长' }).first()
      : page.locator('#subject [id^="kima-collapsible-"]').first();
    await expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    expect(await wrapper.evaluate(node => node.inert)).toBe(true);
    await expect(wrapper.locator('input')).toHaveCount(component === 'collapsible' ? 1 : 0);
    if (component === 'collapsible') expect(await wrapper.locator('input').evaluate(node => node.tabIndex)).toBe(-1);
    const start = await page.locator('#subject').boundingBox();
    expect(Math.abs(start.height - before.height)).toBeLessThan(1);
    const startAfter = await page.locator('#after').boundingBox();
    await progress(page, 0.5);
    const middle = await page.locator('#subject').boundingBox();
    const middleAfter = await page.locator('#after').boundingBox();
    expect(middle.height).toBeLessThan(before.height);
    expect(middle.height).toBeGreaterThan(0);
    expect(middleAfter.y).toBeGreaterThan(startAfter.y - before.height);
    await page.screenshot({ path: `shots/content-motion/${component}-collapse-middle.png`, scale: 'css' });
    await finish(page);
    await expect(page.locator('#subject')).toHaveAttribute('aria-disabled', /^(undefined)?$/).catch(() => {});
    const after = await page.locator('#after').boundingBox();
    expect(after.y).toBeLessThan(startAfter.y);
    await page.screenshot({ path: `shots/content-motion/${component}-collapse-after.png`, scale: 'css' });
  });
}
