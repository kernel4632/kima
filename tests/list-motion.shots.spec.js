import { expect, test } from '@playwright/test';

const items = [
  { id: 'a', title: 'Alpha', description: '第一条内容，包含较长说明。'.repeat(4) },
  { id: 'b', title: 'Beta', description: '第二条内容' },
  { id: 'c', title: 'Gamma', description: '第三条内容' },
];

async function mount(page, component, width) {
  await page.setViewportSize({ width: width + 48, height: 820 });
  await page.goto('/tests/fixture.html', { waitUntil: 'networkidle' });
  await page.evaluate(({ component, items }) => window.fixture.mount(`<kima-${component} id="subject"></kima-${component}>`, { subject: { items } }), { component, items });
}

async function pauseAnimations(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    for (const animation of document.getAnimations()) {
      animation.pause();
      animation.currentTime = 0;
    }
  });
}
async function setProgress(page, fraction) {
  await page.evaluate(fraction => {
    for (const animation of document.getAnimations()) {
      animation.currentTime = Number(animation.effect.getTiming().duration) * fraction;
    }
  }, fraction);
}
async function geometry(rows, root) {
  const [items, container] = await Promise.all([
    rows.evaluateAll(nodes => nodes.map(node => {
      const rect = node.getBoundingClientRect();
      return { text: node.textContent.trim(), x: rect.x, y: rect.y, width: rect.width, height: rect.height, position: getComputedStyle(node).position };
    })),
    root.boundingBox(),
  ]);
  return { items, container };
}

async function finishAnimations(page) {
  await page.evaluate(() => { for (const animation of document.getAnimations()) animation.finish(); });
}

for (const component of ['list', 'timeline']) {
  for (const width of [640, 280]) {
    test(`集合回归：${component} ${width}px 删除保留原位退场与存活项移动`, async ({ page }) => {
      await mount(page, component, width);
      const host = page.locator('#subject');
      const root = host.locator(component === 'list' ? '.kima-list' : '.kima-timeline');
      const rows = root.locator(component === 'list' ? '.kima-list__item' : '.kima-timeline__item');
      await expect(rows).toHaveCount(3);
      const before = await rows.evaluateAll(nodes => nodes.map(node => {
        const rect = node.getBoundingClientRect();
        return { text: node.textContent.trim(), x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      }));
      await page.evaluate(() => {
        const host = document.getElementById('subject');
        host.items = host.items.slice(1);
      });
      const beforeGeometry = { items: before, container: await root.boundingBox() };
      const start = await geometry(rows, root);
      expect(start.items).toHaveLength(3);
      const leaving = start.items.find(row => row.text.includes('Alpha'));
      const original = before.find(row => row.text.includes('Alpha'));
      expect(leaving.position).toBe('absolute');
      expect(Math.abs(leaving.x - original.x)).toBeLessThanOrEqual(3);
      expect(Math.abs(leaving.y - original.y)).toBeLessThanOrEqual(3);
      expect(Math.abs(leaving.width - original.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(leaving.height - original.height)).toBeLessThanOrEqual(1);
      await setProgress(page, 0.5);
      const middle = await geometry(rows, root);
      expect(middle.items).toHaveLength(3);
      const startSurvivor = start.items.find(row => row.text.includes('Beta'));
      const middleSurvivor = middle.items.find(row => row.text.includes('Beta'));
      expect(Math.abs(middleSurvivor.y - startSurvivor.y)).toBeGreaterThan(1);
      expect(Math.abs(middle.container.height - beforeGeometry.container.height)).toBeGreaterThan(1);
      await page.screenshot({ path: `shots/list-motion/${component}-${width}-middle.png`, scale: 'css' });
      await setProgress(page, 0.95);
      const nearEnd = await geometry(rows, root);
      const nearEndSurvivor = nearEnd.items.find(row => row.text.includes('Beta'));
      await finishAnimations(page);
      const final = await geometry(rows, root);
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
