import { expect, test } from '@playwright/test';

const longMessage = '这条通知更新为较长内容，用于检查卡片占位与其他通知是否连续移动。'.repeat(4);
async function mount(page, { position = 'top-right', service = false, reduced = false, standalone = false } = {}) {
  await page.setViewportSize({ width: 420, height: 900 });
  if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/tests/fixture.html', { waitUntil: 'networkidle' });
  await page.evaluate(async ({ position, service, standalone }) => {
    const { applyPalette } = await import('/src/utils/theme.js');
    applyPalette('#61afef', { isDark: !position.startsWith('bottom') });
    document.documentElement.dir = position.startsWith('bottom') ? 'rtl' : 'ltr';
    document.body.style.cssText = 'margin:24px;background:var(--kima-color-surface);color:var(--kima-color-on-surface)';
    const notices = [
      { id: 'changing', heading: '同步状态', message: '短消息', variant: 'info', duration: 0 },
      { id: 'stable', heading: '其他通知', message: '保持在队列中', duration: 0 },
    ];
    let api;
    if (service) {
      const { createNotifications } = await import('/src/utils/notifications.js');
      api = createNotifications();
      for (const item of notices) api.push(item);
    }
    await window.fixture.mount(standalone
      ? '<kima-notification id="subject"></kima-notification>'
      : '<kima-notification-queue id="subject"></kima-notification-queue>', {
      subject: standalone ? { heading: '同步状态', message: '短消息', variant: 'info', duration: 0, open: true, position }
        : service ? { service: api, position } : { items: notices, position },
    });
    const subject = document.getElementById('subject');
    window.noticeChange = message => {
      if (standalone) subject.message = message;
      else if (service) api.update('changing', { message });
      else subject.items = subject.items.map(item => item.id === 'changing' ? { ...item, message } : item);
    };
    window.originalNotices = [...subject.querySelectorAll('.kima-notification')];
    // 在高度动画创建的同一调用栈暂停，不抢短暂退场窗口；保留真实关键帧和 token 时长。
    window.noticeHeightAnimations = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (frames, timing) {
      const animation = animate.call(this, frames, timing);
      if (this.matches('.kima-notification') && animation.effect.getKeyframes().some(frame => frame.height != null)) {
        animation.pause();
        animation.currentTime = 0;
        window.noticeHeightAnimations.push(animation);
      }
      return animation;
    };
  }, { position, service, standalone });
  await page.addStyleTag({ content: '#subject{--kima-duration-effects:800ms}' });
}
async function change(page, message, { reduced = false } = {}) {
  await page.evaluate(async message => {
    window.noticeChange(message);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, message);
  if (!reduced) {
    expect(await page.evaluate(() => window.noticeHeightAnimations.filter(animation => animation.playState !== 'idle').length),
      '更新的卡片有且只有一个高度所有者').toBe(1);
  }
}
async function at(page, time) {
  await page.evaluate(async time => {
    const animation = window.noticeHeightAnimations.at(-1);
    if (!animation || animation.playState === 'idle') throw new Error('高度动画已清理，不能复活旧动画');
    animation.currentTime = time;
    await new Promise(resolve => requestAnimationFrame(resolve));
  }, time);
  return sample(page);
}
async function finish(page) {
  await page.evaluate(async () => {
    window.noticeHeightAnimations.at(-1).finish();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  return sample(page);
}
async function sample(page) {
  return page.locator('#subject').evaluate(subject => {
    const box = node => {
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom };
    };
    const cards = [...subject.querySelectorAll('.kima-notification')];
    const stack = subject.querySelector('.kima-notification-queue__stack');
    return {
      cards: cards.map(box), stack: stack ? box(stack) : null,
      identity: cards.every((node, index) => node === window.originalNotices[index]),
      count: cards.length,
      remainingHeightAnimations: subject.getAnimations({ subtree: true }).filter(animation => animation.effect.getKeyframes().some(frame => frame.height != null)).length,
      inlineHeight: cards[0].style.height,
      overflow: cards[0].style.overflow,
      presence: cards.some(node => [...node.classList].some(name => /-(enter|leave)-active$/.test(name))),
    };
  });
}
function continuous(a, b) {
  for (let i = 0; i < a.cards.length; i++) {
    for (const key of ['x', 'y', 'width', 'height']) expect(Math.abs(a.cards[i][key] - b.cards[i][key]), `卡片${i} ${key} 首帧连续`).toBeLessThan(1);
  }
}
function readable(state, position) {
  expect(state.identity).toBe(true);
  expect(state.presence).toBe(false);
  if (state.stack) {
    expect(state.cards[1].y - state.cards[0].bottom, '卡片间距跟随当前高度，不重叠、不留假空位').toBeCloseTo(12, 0);
    expect(state.stack.height).toBeCloseTo(state.cards[0].height + state.cards[1].height + 12, 0);
    if (position.startsWith('bottom')) expect(state.stack.bottom).toBeCloseTo(884, 0);
    else expect(state.stack.y).toBeCloseTo(16, 0);
  }
}

for (const position of ['top-right', 'bottom-left']) {
  for (const service of [false, true]) {
    test(`通知内容：${position}/${service ? 'service' : 'items'} 长短更新和反向保持卡片高度与队列锚定`, async ({ page }, testInfo) => {
      await mount(page, { position, service });
      const close = page.getByRole('button', { name: '关闭通知', exact: true }).first();
      await close.focus();
      const before = await sample(page);
      await change(page, longMessage);
      const start = await at(page, 0);
      continuous(before, start);
      const middle = await at(page, 400);
      const expanded = await finish(page);
      expect(expanded.cards[0].height).toBeGreaterThan(before.cards[0].height + 40);
      expect(middle.cards[0].height).toBeGreaterThan(before.cards[0].height);
      expect(middle.cards[0].height).toBeLessThan(expanded.cards[0].height);
      for (const state of [start, middle, expanded]) readable(state, position);
      await change(page, '短消息');
      continuous(expanded, await at(page, 0));
      const reversing = await at(page, 300);
      await change(page, longMessage);
      const reversed = await at(page, 0);
      continuous(reversing, reversed);
      for (let time = 0; time < 800; time += 40) readable(await at(page, time), position);
      const final = await finish(page);
      expect(final.cards[0].height).toBeCloseTo(expanded.cards[0].height, 0);
      expect(final.inlineHeight).toBe('');
      expect(final.overflow).toBe('');
      expect(final.remainingHeightAnimations).toBe(0);
      await expect(close).toBeFocused();
      await page.screenshot({ path: `shots/notification-content/${position}-${service ? 'service' : 'items'}-expanded.png`, scale: 'css' });
      await change(page, '短消息');
      const shrinking = await at(page, 400);
      await page.screenshot({ path: `shots/notification-content/${position}-${service ? 'service' : 'items'}-shrink-middle.png`, scale: 'css' });
      const short = await finish(page);
      readable(shrinking, position);
      readable(short, position);
      expect(short.cards[0].height).toBeCloseTo(before.cards[0].height, 0);
      expect(shrinking.cards[0].height).toBeGreaterThan(short.cards[0].height);
      expect(shrinking.cards[0].height).toBeLessThan(final.cards[0].height);
      await testInfo.attach('content-geometry', { body: JSON.stringify({ before, start, middle, expanded, reversing, reversed, final, shrinking, short }, null, 2), contentType: 'application/json' });
    });
  }
}

test('通知内容：独立通知也复用唯一高度所有者', async ({ page }) => {
  await mount(page, { standalone: true });
  const before = await sample(page);
  await change(page, longMessage);
  continuous(before, await at(page, 0));
  const middle = await at(page, 400);
  const final = await finish(page);
  expect(middle.cards[0].height).toBeGreaterThan(before.cards[0].height);
  expect(middle.cards[0].height).toBeLessThan(final.cards[0].height);
  expect(final.inlineHeight).toBe('');
});

test('通知内容：减少动态效果下语义即时更新且不创建高度动画', async ({ page }) => {
  await mount(page, { reduced: true });
  const before = await sample(page);
  await change(page, longMessage, { reduced: true });
  const final = await sample(page);
  expect(final.remainingHeightAnimations).toBe(0);
  expect(final.cards[0].height).toBeGreaterThan(before.cards[0].height + 40);
  expect(final.identity).toBe(true);
  await expect(page.locator('.kima-notification__message').first()).toHaveText(longMessage);
});
