import { expect, test } from '@playwright/test';

async function mount(page, html, properties) {
  await page.goto('/tests/fixture.html', { waitUntil: 'networkidle' });
  await page.evaluate(({ html, properties }) => window.fixture.mount(html, properties), { html, properties });
}

// 固定 CSS Transition 时间而不是用墙钟猜测动画进度；截图和几何读取的是同一帧。
async function pauseTransitions(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    for (const animation of document.getAnimations()) {
      if (animation instanceof CSSTransition) { animation.pause(); animation.currentTime = 0; }
    }
  });
}
async function frame(page, progress) {
  return page.evaluate(progress => {
    for (const animation of document.getAnimations()) {
      if (animation instanceof CSSTransition) animation.currentTime = Number(animation.effect.getTiming().duration) * progress;
    }
    return [...document.querySelectorAll('.kima-notification-queue__item')].map(node => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        text: node.textContent.trim(), x: rect.x, y: rect.y, width: rect.width, height: rect.height,
        position: style.position, inert: node.inert, hidden: node.getAttribute('aria-hidden'),
        classes: [...node.classList],
        transitions: node.getAnimations().map(animation => animation.transitionProperty),
      };
    });
  }, progress);
}
async function finish(page) {
  await page.evaluate(() => { for (const animation of document.getAnimations()) if (animation instanceof CSSTransition) animation.finish(); });
}
const notices = [
  { id: 'a', heading: '同步完成', message: '第一条', variant: 'success', duration: 0 },
  { id: 'b', heading: '正在保存', message: '第二条包含较长的内容，用来检查多行通知不会挤扁图标或改变退场宽度。'.repeat(2), variant: 'info', duration: 0 },
  { id: 'c', heading: '检查任务', message: '第三条', variant: 'warning', duration: 0 },
];

for (const [position, dir, movingText] of [['top-right', 'ltr', '第三条'], ['bottom-left', 'rtl', '第一条']]) {
  test(`通知回归：${position} ${dir} 退场原位和补位中间帧`, async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 800 });
    await mount(page, `<kima-notification-queue id="queue" dir="${dir}"></kima-notification-queue>`, { queue: { position, items: notices } });
    await page.addStyleTag({ content: '.kima-notification-queue__item{--kima-duration-medium:1000ms;--kima-duration-slower:1000ms}' });
    const before = await frame(page, 0);
    // DOM click 不会等待通知位移完成，保留点击产生的首帧。
    await page.locator('.kima-notification-queue__item').nth(1).locator('button').evaluate(node => node.click());
    await pauseTransitions(page);
    const start = await frame(page, 0);
    const old = before.find(item => item.text.includes('第二条'));
    const leaving = start.find(item => item.text.includes('第二条'));
    expect(leaving.position).toBe('absolute');
    expect(Math.abs(leaving.x - old.x)).toBeLessThan(1);
    expect(Math.abs(leaving.y - old.y)).toBeLessThan(1);
    expect(Math.abs(leaving.width - old.width)).toBeLessThan(1);
    expect(leaving.inert).toBe(true);
    expect(leaving.hidden).toBe('true');
    const survivor = start.find(item => item.text.includes(movingText));
    expect(survivor.classes).toContain('kima-notification-queue-move');
    expect(survivor.transitions).toContain('transform');
    const middle = await frame(page, 0.5);
    await page.screenshot({ path: `shots/notification-motion/${position}-${dir}-middle.png`, scale: 'css' });
    const nearEnd = await frame(page, 0.95);
    const movingY = middle.find(item => item.text.includes(movingText)).y;
    const finalY = nearEnd.find(item => item.text.includes(movingText)).y;
    expect(Math.abs(movingY - survivor.y)).toBeGreaterThan(1);
    expect(Math.abs(finalY - movingY)).toBeGreaterThan(0.1);
    const leavingMid = middle.find(item => item.text.includes('第二条'));
    expect(Math.abs(leavingMid.y - old.y)).toBeLessThan(1);
    if (position.endsWith('right')) expect(leavingMid.x).toBeGreaterThan(old.x);
    else expect(leavingMid.x).toBeLessThan(old.x);
    await finish(page);
    await expect(page.locator('.kima-notification-queue__item')).toHaveCount(2);
    const after = await frame(page, 1);
    expect(after[1].y).toBeGreaterThanOrEqual(after[0].y + after[0].height + 11);
    expect(after.every(item => item.position !== 'absolute' && !item.inert)).toBe(true);
    await page.screenshot({ path: `shots/notification-motion/${position}-${dir}-after.png`, scale: 'css' });
  });
}

test('通知回归：独立通知定位不受页面排版和滚动影响', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 700 });
  await mount(page, '<kima-notification id="notice"></kima-notification>', { notice: { open: true, heading: '独立通知', message: '固定在视口内', duration: 0, variant: 'success' } });
  await page.addStyleTag({ content: 'body { min-height: 2000px; }' });
  for (const position of ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']) {
    await page.evaluate(position => { document.getElementById('notice').position = position; window.scrollTo(0, 500); }, position);
    const box = await page.locator('.kima-notification').evaluate(node => {
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, position: getComputedStyle(node).position };
    });
    expect(box.position).toBe('fixed');
    if (position.endsWith('left')) expect(box.x).toBeCloseTo(16, 0);
    else if (position.endsWith('right')) expect(box.x + box.width).toBeCloseTo(784, 0);
    else expect(box.x + box.width / 2).toBeCloseTo(400, 0);
    if (position.startsWith('top')) expect(box.y).toBeCloseTo(16, 0);
    else expect(box.y + box.height).toBeCloseTo(684, 0);
  }
  await page.screenshot({ path: 'shots/notification-motion/standalone.png', scale: 'css' });
});

test('通知回归：受控无 id 对象删除保留存活节点身份', async ({ page }) => {
  const controlledItems = notices.map(({ id, ...item }) => item);
  await mount(page, '<kima-notification-queue id="queue"></kima-notification-queue>', { queue: { items: controlledItems } });
  await page.addStyleTag({ content: '.kima-notification-queue__item{--kima-duration-medium:1000ms;--kima-duration-slower:1000ms}' });
  const items = page.locator('.kima-notification-queue__item');
  const first = await items.nth(0).elementHandle();
  const second = await items.nth(1).elementHandle();
  const third = await items.nth(2).elementHandle();
  const originalBoxes = await items.evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }));
  await items.nth(1).locator('button').evaluate(node => node.click());
  await pauseTransitions(page);
  const leavingFrame = await frame(page, 0);
  const leaving = leavingFrame.find(item => item.text.includes('第二条'));
  expect(leaving.position).toBe('absolute');
  expect(leaving.x).toBeCloseTo(originalBoxes[1].x, 0);
  expect(leaving.y).toBeCloseTo(originalBoxes[1].y, 0);
  expect(leaving.width).toBeCloseTo(originalBoxes[1].width, 0);
  await frame(page, 0.5);
  await expect(items).toHaveCount(3);
  await finish(page);
  await expect(items).toHaveCount(2);
  expect(await first.evaluate(node => node.isConnected && node.textContent.includes('第一条'))).toBe(true);
  expect(await third.evaluate(node => node.isConnected && node.textContent.includes('第三条'))).toBe(true);
  expect(await second.evaluate(node => node.isConnected)).toBe(false);
});

test('通知回归：原始值 items 仍能渲染和删除', async ({ page }) => {
  await mount(page, '<kima-notification-queue id="queue"></kima-notification-queue>', { queue: { items: ['第一条', '第二条'] } });
  const items = page.locator('.kima-notification-queue__item');
  await expect(items).toHaveCount(2);
  await expect(items.nth(0)).toContainText('第一条');
  await items.nth(0).locator('button').click();
  await expect(items).toHaveCount(1);
  await expect(items.first()).toContainText('第二条');
});

test('通知回归：减少动态效果不保留屏外位移', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mount(page, '<kima-notification-queue id="queue"></kima-notification-queue>', { queue: { items: notices.slice(0, 1) } });
  const transform = await page.locator('.kima-notification-queue__item').evaluate(node => {
    node.classList.add('kima-notification-queue-enter-from');
    const value = getComputedStyle(node).transform;
    node.classList.remove('kima-notification-queue-enter-from');
    return value;
  });
  expect(transform).toBe('none');
  await page.locator('.kima-notification__close').click();
  await expect(page.locator('.kima-notification-queue__item')).toHaveCount(0);
});

test('通知回归：悬停和焦点暂停剩余计时且只关闭一次', async ({ page }) => {
  await page.clock.install();
  await mount(page, '<kima-notification-queue id="queue"></kima-notification-queue>', { queue: { items: [{ id: 'timer', heading: '计时通知', message: '暂停后继续剩余时间', duration: 2000 }] } });
  const notice = page.locator('.kima-notification');
  await page.clock.runFor(300);
  await notice.hover();
  await page.clock.runFor(2500);
  await expect(notice).toHaveCount(1);
  await notice.locator('button').focus();
  await page.mouse.move(0, 0);
  await page.clock.runFor(2500);
  await expect(notice).toHaveCount(1);
  await notice.locator('button').evaluate(node => node.blur());
  await page.clock.runFor(2200);
  await expect(page.locator('.kima-notification-queue__item')).toHaveCount(0);
  const events = await page.evaluate(() => window.fixture.events.filter(event => event.id === 'queue' && event.type === 'close'));
  expect(events).toHaveLength(1);
  expect(events[0].detail[1]).toBe('timeout');
});
