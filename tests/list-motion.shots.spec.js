import { expect, test } from '@playwright/test';

const items = [
  { id: 'a', title: 'Alpha', description: '第一条内容，包含较长说明。'.repeat(4) },
  { id: 'b', title: 'Beta', description: '第二条内容' },
  { id: 'c', title: 'Gamma', description: '第三条内容' },
];

async function mount(page, component, width) {
  await page.setViewportSize({ width: width + 48, height: 820 });
  await page.goto('/tests/fixture.html', { waitUntil: 'networkidle' });
  await page.evaluate(async ({ component, items }) => {
    const { applyPalette } = await import('/src/utils/theme.js');
    applyPalette('#61afef', { isDark: true });
    document.body.style.cssText = 'margin:24px;background:var(--kima-color-surface);color:var(--kima-color-on-surface)';
    await window.fixture.mount(`<kima-${component} id="subject"></kima-${component}>`, { subject: { items } });
  }, { component, items });
  // 本场景各轨道时长一致：下面按真实毫秒推进，不混用各动画的百分比。
  await page.addStyleTag({ content: '#subject{--kima-duration-fast:1000ms;--kima-duration-medium:1000ms;--kima-duration-slow:1000ms;--kima-duration-effects:1000ms}' });
}

async function pauseAnimations(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.listAnimations = document.getAnimations();
    for (const animation of window.listAnimations) {
      animation.pause();
      animation.currentTime = 0;
    }
  });
}
async function setTime(page, time) {
  await page.evaluate(time => {
    for (const animation of window.listAnimations) {
      if (animation.playState !== 'idle') animation.currentTime = time;
    }
  }, time);
}
async function geometry(rows, root) {
  const [items, container] = await Promise.all([
    rows.evaluateAll(nodes => nodes.map(node => {
      const rect = node.getBoundingClientRect();
      return { text: node.textContent.trim(), x: rect.x, y: rect.y, width: rect.width, height: rect.height, position: getComputedStyle(node).position, opacity: Number(getComputedStyle(node).opacity) };
    })),
    root.evaluate(node => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, alignContent: style.alignContent, tracks: style.gridTemplateRows };
    }),
  ]);
  return { items, container };
}

async function finishAnimations(page) {
  await page.evaluate(() => {
    for (const animation of window.listAnimations) {
      if (animation.playState !== 'idle') animation.finish();
    }
  });
}

for (const component of ['list', 'timeline']) {
  for (const width of [640, 280]) {
    test(`集合回归：${component} ${width}px 删除保留原位退场与存活项移动`, async ({ page }, testInfo) => {
      await mount(page, component, width);
      const host = page.locator('#subject');
      const root = host.locator(component === 'list' ? '.kima-list' : '.kima-timeline');
      const rows = root.locator(component === 'list' ? '.kima-list__item' : '.kima-timeline__item');
      await expect(rows).toHaveCount(3);
      const beforeGeometry = await geometry(rows, root);
      const before = beforeGeometry.items;
      await page.evaluate(() => {
        const host = document.getElementById('subject');
        host.items = host.items.slice(1);
      });
      await pauseAnimations(page);
      const start = await geometry(rows, root);
      expect(start.items).toHaveLength(3);
      const leaving = start.items.find(row => row.text.includes('Alpha'));
      const original = before.find(row => row.text.includes('Alpha'));
      expect(leaving.position).toBe('absolute');
      expect(Math.abs(leaving.x - original.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(leaving.y - original.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(leaving.width - original.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(leaving.height - original.height)).toBeLessThanOrEqual(1);
      for (const row of start.items.filter(row => row !== leaving)) {
        const originalRow = before.find(entry => entry.text === row.text);
        expect(Math.abs(row.y - originalRow.y), '存活项首帧也必须保留旧位置').toBeLessThanOrEqual(1);
        expect(Math.abs(row.height - originalRow.height), '占位高度不能拉伸存活项').toBeLessThanOrEqual(1);
      }
      expect(Math.abs(start.container.height - beforeGeometry.container.height)).toBeLessThanOrEqual(1);
      await setTime(page, component === 'list' ? 1750 : 500);
      const middle = await geometry(rows, root);
      expect(middle.items.filter(row => row.position !== 'absolute')).toHaveLength(2);
      const startSurvivor = start.items.find(row => row.text.includes('Beta'));
      const middleSurvivor = middle.items.find(row => row.text.includes('Beta'));
      expect(Math.abs(middleSurvivor.y - startSurvivor.y)).toBeGreaterThan(1);
      expect(Math.abs(middle.container.height - beforeGeometry.container.height)).toBeGreaterThan(1);
      await page.screenshot({ path: `shots/list-motion/${component}-${width}-middle.png`, scale: 'css' });
      if (component === 'list') {
        for (let time = 0; time <= 2400; time += 100) {
          await setTime(page, time);
          const state = await geometry(rows, root);
          const visible = state.items.filter(row => row.opacity > 0.1);
          for (let i = 0; i < visible.length; i++) {
            const a = visible[i];
            for (const b of visible.slice(i + 1)) {
              const x = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
              const y = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
              expect(x > 1 && y > 1, `${time}ms 可见条目不能互相穿过`).toBe(false);
            }
          }
        }
      }
      await setTime(page, component === 'list' ? 1950 : 950);
      const nearEnd = await geometry(rows, root);
      const nearEndSurvivor = nearEnd.items.find(row => row.text.includes('Beta'));
      await finishAnimations(page);
      await expect(rows).toHaveCount(2);
      const final = await geometry(rows, root);
      await testInfo.attach('fixed-clock-geometry', {
        body: JSON.stringify({ before: beforeGeometry, start, middle, nearEnd, final }, null, 2),
        contentType: 'application/json',
      });
      const finalSurvivor = final.items.find(row => row.text.includes('Beta'));
      const middleDistance = Math.abs(finalSurvivor.y - middleSurvivor.y);
      const nearEndDistance = Math.abs(finalSurvivor.y - nearEndSurvivor.y);
      expect(nearEndDistance).toBeLessThan(middleDistance);
      expect(Math.abs(final.container.height - beforeGeometry.container.height)).toBeGreaterThan(1);
      await finishAnimations(page);
      await expect(rows).toHaveCount(2);
      const after = await rows.evaluateAll(nodes => nodes.map(node => node.textContent.trim()));
      expect(after[0]).toContain('Beta');
      expect(after[1]).toContain('Gamma');
      await page.screenshot({ path: `shots/list-motion/${component}-${width}-after.png`, scale: 'css' });
    });
  }
}
