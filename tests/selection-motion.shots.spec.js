import { expect, test } from '@playwright/test';

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'BetaBetaBeta' },
  { value: 'c', label: 'Gamma' },
  { value: 'd', label: 'DeltaDelta' },
  { value: 'e', label: 'EpsilonEpsilon' },
];

async function mount(page, { selected, dir = 'ltr', theme = 'dark', width = 280, items = options } = {}) {
  await page.setViewportSize({ width: width + 48, height: 900 });
  await page.goto('/tests/fixture.html', { waitUntil: 'networkidle' });
  await page.evaluate(async ({ selected, dir, theme, options }) => {
    const { applyPalette } = await import('/src/utils/theme.js');
    applyPalette('#61afef', { isDark: theme === 'dark' });
    document.documentElement.dir = dir;
    document.body.style.cssText = 'margin:24px;background:var(--kima-color-surface);color:var(--kima-color-on-surface)';
    await window.fixture.mount('<form id="form"><kima-multi-select id="subject"></kima-multi-select><button type="reset">重置</button></form>', {
      subject: { modelValue: selected, items: options, name: 'topics', label: '选择主题', searchable: true, clearable: true },
    });
  }, { selected, dir, theme, options: items });
  // 等比放慢所有相关时长，固定动画时间采样，保留进退场/移动时序比例。
  await page.addStyleTag({ content: '#subject{--kima-duration-fast:200ms;--kima-duration-effects:300ms;--kima-duration-medium:400ms;--kima-duration-slow:600ms;--kima-duration-slower:1000ms}' });
}

async function freeze(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.selectionAnimations = document.getAnimations().filter(animation => animation.effect.getTiming().iterations !== Infinity);
    for (const animation of window.selectionAnimations) { animation.pause(); animation.currentTime = 0; }
  });
}
async function at(page, time) {
  await page.evaluate(time => {
    for (const animation of window.selectionAnimations) {
      if (animation.playState !== 'idle') animation.currentTime = time;
    }
  }, time);
  return sample(page);
}
async function finish(page) {
  await page.evaluate(() => {
    for (const animation of window.selectionAnimations) {
      if (animation.playState !== 'idle') animation.finish();
    }
  });
  await expect.poll(() => page.locator('#subject [inert]').count()).toBe(0);
}
async function sample(page) {
  return page.locator('#subject').evaluate(host => {
    const rect = node => {
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom };
    };
    return {
      rows: [...host.querySelectorAll('.kima-multi-select__chip')].map(node => ({
        key: node.getAttribute('data-kima-flip-key') || node.textContent.trim(),
        text: node.textContent.trim(), ...rect(node), inert: node.inert,
        textBox: rect(node.querySelector('.kima-chip__text')),
        closeBox: rect(node.querySelector('button')),
        position: getComputedStyle(node).position,
        visibility: getComputedStyle(node).visibility,
        opacity: Number(getComputedStyle(node).opacity) * Number(getComputedStyle(node.firstElementChild).opacity),
        animations: node.getAnimations().map(animation => ({
          type: animation.constructor.name, property: animation.transitionProperty ?? '',
          duration: animation.effect.getTiming().duration, delay: animation.effect.getTiming().delay,
          keyframes: animation.effect.getKeyframes(),
        })),
      })),
      root: rect(host.querySelector('.kima-multi-select')),
      chips: rect(host.querySelector('.kima-multi-select__chip-area') || host.querySelector('.kima-multi-select__chips')),
      control: rect(host.querySelector('.kima-multi-select__control')),
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
    };
  });
}
const find = (state, label) => state.rows.find(row => row.text === label);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function readableLayout(state) {
  const visible = state.rows.filter(row => row.opacity > 0.1 && row.visibility !== 'hidden');
  for (let i = 0; i < visible.length; i++) {
    const a = visible[i];
    for (const b of visible.slice(i + 1)) {
      const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y);
      expect(overlapX > 1 && overlapY > 1, `${a.text} 和 ${b.text} 不应同时占用同一可见区域`).toBe(false);
    }
    expect(a.bottom, '控制区不能穿过还在移动的芯片').toBeLessThanOrEqual(state.control.y + 1);
  }
}

test('选择集合根因：点击路径不叠加第二套 transform', async ({ page }, testInfo) => {
  await mount(page, { selected: ['a', 'b', 'c', 'd'] });
  await page.locator('.kima-multi-select__chip').nth(1).locator('button').evaluate(node => node.click());
  await freeze(page);
  const state = await sample(page);
  await testInfo.attach('click-ownership', { body: JSON.stringify(state, null, 2), contentType: 'application/json' });
  const owners = find(state, 'Gamma').animations.filter(animation => animation.property === 'transform' || animation.keyframes.some(frame => frame.transform));
  expect(owners, '点击与外部赋值必须使用同一套位移执行器').toHaveLength(1);
});

test('选择集合所有权：无关属性更新不取消或重启动画', async ({ page }) => {
  await mount(page, { selected: ['a', 'b', 'c', 'd'] });
  await page.evaluate(() => { document.getElementById('subject').modelValue = ['a', 'c', 'd']; });
  await freeze(page);
  const before = await at(page, 400);
  await page.evaluate(async () => {
    document.getElementById('subject').label = '更新后的可访问名称';
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  const after = await sample(page);
  for (const row of before.rows.filter(row => !row.inert)) {
    expect(distance(row, after.rows.find(entry => entry.key === row.key))).toBeLessThan(1);
  }
  expect(await page.evaluate(() => {
    const active = document.getAnimations();
    return window.selectionAnimations.every(animation => animation.playState === 'idle' || active.includes(animation));
  })).toBe(true);
  // 真正仍在移动的节点必须保留同一批暂停动画，而非取消后创建另一批。
  expect(await page.evaluate(() => document.getAnimations().filter(animation =>
    animation.effect.target?.matches('.kima-multi-select__chip') && animation.constructor.name === 'Animation',
  ).every(animation => window.selectionAnimations.includes(animation)))).toBe(true);
  await finish(page);
});

for (const [dir, theme] of [['ltr', 'dark'], ['rtl', 'light']]) {
  test(`选择集合边界：${dir}/${theme} 快速反向从当前占位高度继续`, async ({ page }) => {
    await mount(page, { selected: ['a', 'b', 'c', 'd'], dir, theme });
    await page.evaluate(() => { document.getElementById('subject').modelValue = ['a', 'c', 'd']; });
    await freeze(page);
    const midway = await at(page, 400);
    await page.evaluate(() => { document.getElementById('subject').modelValue = ['a', 'b', 'c', 'd']; });
    await freeze(page);
    const reversed = await at(page, 0);
    expect(Math.abs(reversed.control.y - midway.control.y)).toBeLessThan(1);
    for (const row of reversed.rows.filter(row => !row.inert)) {
      const previous = midway.rows.find(entry => entry.key === row.key && !entry.inert);
      if (previous) expect(distance(previous, row), `${row.text} 反向首帧应保留当前视觉位置`).toBeLessThan(1);
      const owners = row.animations.filter(animation => animation.property === 'transform' || animation.keyframes.some(frame => frame.transform));
      expect(owners.length).toBeLessThanOrEqual(1);
    }
    await at(page, 850);
    await finish(page);
    const final = await sample(page);
    expect(final.rows).toHaveLength(4);
    expect(final.rows.every(row => !row.inert && row.position !== 'absolute')).toBe(true);
    readableLayout(final);
    await page.screenshot({ path: `shots/selection-motion/reverse-${dir}-${theme}.png`, scale: 'css' });
  });
}

test('选择集合边界：清空和首次新增有连续占位，表单即时同步', async ({ page }) => {
  await mount(page, { selected: ['a'] });
  const before = await sample(page);
  await page.getByRole('button', { name: '清除选择', exact: true }).evaluate(node => node.click());
  expect(await page.evaluate(() => new FormData(document.getElementById('form')).getAll('topics'))).toEqual([]);
  await freeze(page);
  expect(Math.abs((await sample(page)).control.y - before.control.y)).toBeLessThan(1);
  await at(page, 1000);
  await finish(page);
  const empty = await sample(page);
  expect(empty.chips.height).toBe(0);
  await page.evaluate(() => { document.getElementById('subject').modelValue = ['c']; });
  await freeze(page);
  expect(Math.abs((await sample(page)).control.y - empty.control.y)).toBeLessThan(1);
  expect(await page.evaluate(() => new FormData(document.getElementById('form')).getAll('topics'))).toEqual(['c']);
  await at(page, 1000);
  await finish(page);
  readableLayout(await sample(page));
});

test('选择集合边界：弹层搜索选择不重开，焦点与表单保持，减少动态效果即时完成', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mount(page, { selected: ['a', 'c'] });
  const trigger = page.getByRole('button', { name: '选择主题', exact: true });
  await trigger.click();
  const search = page.getByRole('combobox', { name: '搜索选项' });
  await expect(search).toBeFocused();
  await search.fill('Beta');
  await page.getByRole('option', { name: 'BetaBetaBeta', exact: true }).click();
  await expect(search).toBeFocused();
  expect(await page.evaluate(() => new FormData(document.getElementById('form')).getAll('topics'))).toEqual(['a', 'b', 'c']);
  await expect(page.locator('.kima-multi-select__chip')).toHaveCount(3);
  expect(await page.locator('.kima-multi-select__chip-area').evaluate(node => node.getAnimations().length)).toBe(0);
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await page.getByRole('button', { name: '重置', exact: true }).click();
  await expect.poll(() => page.evaluate(() => new FormData(document.getElementById('form')).getAll('topics'))).toEqual(['a', 'c']);
});

for (const width of [280, 480]) {
  for (const dir of ['ltr', 'rtl']) {
    for (const operation of ['remove-many', 'add-many']) {
      test(`选择集合路径：${width}px/${dir}/${operation} 不同宽度标签不互穿`, async ({ page }, testInfo) => {
        const all = ['a', 'b', 'c', 'd', 'e'];
        const partial = ['a', 'c', 'e'];
        const initial = operation === 'remove-many' ? all : partial;
        const target = operation === 'remove-many' ? partial : all;
        await mount(page, { selected: initial, width, dir, theme: dir === 'rtl' ? 'light' : 'dark' });
        const before = await sample(page);
        await page.evaluate(value => { document.getElementById('subject').modelValue = value; }, target);
        await freeze(page);
        const start = await at(page, 0);
        for (const row of start.rows.filter(row => !row.inert)) {
          const previous = before.rows.find(entry => entry.key === row.key);
          if (previous) expect(distance(previous, row)).toBeLessThan(1);
        }
        for (let time = 0; time <= 1200; time += 40) {
          const state = await at(page, time);
          try { readableLayout(state); }
          catch (error) {
            await testInfo.attach(`collision-${time}ms`, { body: JSON.stringify(state, null, 2), contentType: 'application/json' });
            throw error;
          }
        }
        await finish(page);
        const final = await sample(page);
        expect(final.rows.map(row => row.key)).toEqual(target);
        expect(final.pageWidth).toBeLessThanOrEqual(final.viewportWidth);
        readableLayout(final);
      });
    }
  }
}

for (const operation of ['remove', 'add']) {
  test(`选择集合根因：MultiSelect ${operation} 单一位移所有者和占位连续`, async ({ page }, testInfo) => {
    const initial = operation === 'remove' ? ['a', 'b', 'c', 'd'] : ['a', 'c', 'd'];
    await mount(page, { selected: initial });
    const before = await sample(page);
    // 直接通过公开属性更新排除弹层开关干扰，也覆盖非点击路径。
    await page.evaluate(operation => {
      document.getElementById('subject').modelValue = operation === 'remove' ? ['a', 'c', 'd'] : ['a', 'b', 'c', 'd'];
    }, operation);
    await freeze(page);
    const start = await at(page, 0);
    const middle = await at(page, 300);
    await page.screenshot({ path: `shots/selection-motion/${operation}-middle.png`, scale: 'css' });
    const late = await at(page, 550);
    for (let time = 0; time <= 1000; time += 40) {
      const state = await at(page, time);
      try { readableLayout(state); }
      catch (error) {
        await testInfo.attach(`collision-${time}ms`, { body: JSON.stringify(state, null, 2), contentType: 'application/json' });
        throw error;
      }
    }
    await finish(page);
    const after = await sample(page);
    await testInfo.attach('geometry-and-ownership', { body: JSON.stringify({ before, start, middle, late, after }, null, 2), contentType: 'application/json' });
    const moving = find(start, 'Gamma');
    const owners = moving.animations.filter(animation => animation.property === 'transform' || animation.keyframes.some(frame => frame.transform));
    expect(owners, '同一存活节点不能同时由 Vue move 和自定义 FLIP 写 transform').toHaveLength(1);
    expect(distance(find(before, 'Gamma'), moving), '首帧须保持旧视觉位置').toBeLessThan(1);
    expect(Math.abs(start.control.y - before.control.y), '内部控制区不能先跳到目标行高').toBeLessThan(1);
    expect(distance(find(middle, 'Gamma'), find(after, 'Gamma'))).toBeLessThan(distance(moving, find(after, 'Gamma')));
    expect(distance(find(late, 'Gamma'), find(after, 'Gamma'))).toBeLessThan(distance(find(middle, 'Gamma'), find(after, 'Gamma')));
    const heightFrame = operation === 'remove' ? late : middle;
    expect(heightFrame.control.y).toBeGreaterThan(Math.min(before.control.y, after.control.y));
    expect(heightFrame.control.y).toBeLessThan(Math.max(before.control.y, after.control.y));
    expect(Math.abs(middle.control.y - middle.chips.bottom)).toBeLessThan(1);
    if (operation === 'add') expect(find(middle, 'BetaBetaBeta').opacity, '新增文字应在存活项让出目标位置后呈现').toBeLessThan(0.01);
    expect(after.rows.map(row => row.text)).toEqual(operation === 'remove' ? ['Alpha', 'Gamma', 'DeltaDelta'] : ['Alpha', 'BetaBetaBeta', 'Gamma', 'DeltaDelta']);
    expect(after.pageWidth).toBeLessThanOrEqual(after.viewportWidth);
    readableLayout(after);
    await page.screenshot({ path: `shots/selection-motion/${operation}-after.png`, scale: 'css' });
  });
}
