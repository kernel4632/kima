import { expect, test } from '@playwright/test';

async function mount(page, { dir = 'ltr', theme = 'dark', width = 280 } = {}) {
  page.on('pageerror', error => { throw error; });
  await page.setViewportSize({ width: width + 48, height: 820 });
  await page.goto('/tests/fixture.html', { waitUntil: 'networkidle' });
  await page.evaluate(async ({ dir, theme }) => {
    const { applyPalette } = await import('/src/utils/theme.js');
    applyPalette('#61afef', { isDark: theme === 'dark' });
    document.documentElement.dir = dir;
    document.body.style.cssText = 'margin:24px;background:var(--kima-color-surface);color:var(--kima-color-on-surface)';
    await window.fixture.mount('<kima-timeline id="subject"></kima-timeline><button id="after">后续操作</button>', {
      subject: { label: '发布进程', items: [
        { title: '设计完成', description: '第一项较长说明。'.repeat(8), variant: 'success', time: '09:00' },
        { title: '可访问性检查', description: '保留中的节点', time: '10:30' },
        { title: '等待发布', description: '最后一项', variant: 'neutral' },
      ] },
    });
  }, { dir, theme });
  await page.addStyleTag({ content: '#subject{--kima-duration-fast:200ms;--kima-duration-slow:600ms;--kima-duration-medium:400ms}' });
}

async function freeze(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.timelineAnimations = document.getAnimations();
    for (const animation of window.timelineAnimations) { animation.pause(); animation.currentTime = 0; }
  });
}
async function at(page, time) {
  await page.evaluate(async time => {
    for (const animation of window.timelineAnimations) {
      if (animation.playState !== 'idle') animation.currentTime = time;
    }
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, time);
}
async function geometry(page) {
  return page.locator('.kima-timeline__item').evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect();
    return { text: node.querySelector('strong').textContent, x: r.x, y: r.y, width: r.width, height: r.height, opacity: Number(getComputedStyle(node).opacity), inert: node.inert };
  }));
}
function noOverlap(rows) {
  const visible = rows.filter(row => row.opacity > 0.1);
  for (let i = 0; i < visible.length; i++) {
    for (const b of visible.slice(i + 1)) {
      const a = visible[i];
      const x = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const y = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      expect(x > 1 && y > 1, `${a.text} 与 ${b.text} 不应互穿`).toBe(false);
    }
  }
}

// DOM 对象保留在页面中，不用文案相同冒充节点身份相同。
test('时间线根因：列表项直接属于有序列表，无 id 删除保留节点与焦点', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mount(page);
  const list = page.getByRole('list', { name: '发布进程' });
  expect(await list.evaluate(node => [...node.children].every(child => child.tagName === 'LI'))).toBe(true);
  await page.evaluate(() => {
    window.timelineNodes = [...document.querySelectorAll('.kima-timeline__item')];
    const input = document.createElement('input');
    input.setAttribute('aria-label', '时间线节点内输入');
    window.timelineNodes[1].append(input);
    input.focus();
    const subject = document.getElementById('subject');
    subject.items = subject.items.slice(1);
  });
  await expect(page.locator('.kima-timeline__item')).toHaveCount(2);
  expect(await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.kima-timeline__item')];
    return rows[0] === window.timelineNodes[1] && rows[1] === window.timelineNodes[2];
  })).toBe(true);
  await expect(page.getByRole('textbox', { name: '时间线节点内输入' })).toBeFocused();
  expect(await page.locator('.kima-timeline__item').evaluateAll(nodes => nodes.every(node => !node.inert && getComputedStyle(node).position !== 'absolute'))).toBe(true);
});

for (const [dir, theme] of [['ltr', 'dark'], ['rtl', 'light']]) {
  test(`时间线根因：${dir}/${theme} 无 id 删除与反向恢复从当前帧继续且不互穿`, async ({ page }, testInfo) => {
    await mount(page, { dir, theme });
    const before = await geometry(page);
    await page.evaluate(() => {
      const subject = document.getElementById('subject');
      window.timelineItems = subject.items;
      window.timelineNodes = [...document.querySelectorAll('.kima-timeline__item')];
      subject.items = subject.items.slice(1);
    });
    await freeze(page);
    const start = await geometry(page);
    expect(start.map(row => row.text)).toContain('设计完成');
    expect(start.find(row => row.text === '设计完成').inert).toBe(true);
    for (const row of start) {
      const old = before.find(entry => entry.text === row.text);
      expect(Math.hypot(row.x - old.x, row.y - old.y)).toBeLessThan(1);
    }
    for (let time = 0; time <= 520; time += 40) {
      await at(page, time);
      noOverlap(await geometry(page));
    }
    await at(page, 550);
    await page.screenshot({ path: `shots/timeline-motion/${dir}-${theme}-remove-middle.png`, scale: 'css' });
    const midway = await geometry(page);
    await page.evaluate(() => { document.getElementById('subject').items = window.timelineItems; });
    await freeze(page);
    const reversed = await geometry(page);
    for (const row of reversed.filter(row => row.text !== '设计完成')) {
      const old = midway.find(entry => entry.text === row.text);
      expect(Math.hypot(row.x - old.x, row.y - old.y)).toBeLessThan(1);
    }
    for (let time = 0; time <= 1200; time += 40) {
      await at(page, time);
      noOverlap(await geometry(page));
    }
    await page.evaluate(() => {
      for (const animation of window.timelineAnimations) if (animation.playState !== 'idle') animation.finish();
    });
    await expect(page.locator('.kima-timeline__item')).toHaveCount(3);
    const final = await geometry(page);
    expect(final.map(row => row.text)).toEqual(before.map(row => row.text));
    expect(await page.evaluate(() => {
      const rows = [...document.querySelectorAll('.kima-timeline__item')];
      return rows[1] === window.timelineNodes[1] && rows[2] === window.timelineNodes[2];
    })).toBe(true);
    expect(await page.locator('#subject').evaluate(host => host.querySelectorAll('[inert]').length)).toBe(0);
    await testInfo.attach('timeline-geometry', { body: JSON.stringify({ before, start, midway, reversed, final }, null, 2), contentType: 'application/json' });
    await page.screenshot({ path: `shots/timeline-motion/${dir}-${theme}-restored.png`, scale: 'css' });
  });
}
