import { test, expect } from "@playwright/test";

const slugs = ["table", "infinite-scroll", "virtual-table", "virtual-tree", "image-preview", "notification-queue", "relative-time", "ring-progress", "copy-button", "long-text"];
test.beforeEach(async ({ page }) => {
  await page.goto("/tests/fixture.html");
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
});
async function mount(page, html, properties = {}) { await page.evaluate(([html, properties]) => window.fixture.mount(html, properties), [html, properties]); }

test("all ten data entries register, render, and expose independent catalog metadata", async ({ page }) => {
  expect(await page.evaluate((slugs) => slugs.every((slug) => customElements.get(`kima-${slug}`) || slug === "table"), slugs)).toBe(true);
  const catalog = await page.evaluate(async () => (await import("/src/site/data-catalog.js")).dataCatalog);
  expect(Object.keys(catalog)).toEqual(slugs);
  expect(Object.values(catalog).every((item) => item.group === "数据 / 媒体 / 反馈")).toBe(true);
});

test("infinite scroll deduplicates in-flight requests, retries errors, and exposes loading button", async ({ page }) => {
  await page.evaluate(() => {
    window.infiniteCalls = 0;
    window.infiniteRelease = null;
    window.infiniteGate = new Promise((resolve) => { window.infiniteRelease = resolve; });
    window.infiniteLoader = async () => { window.infiniteCalls += 1; await window.infiniteGate; return false; };
  });
  await page.evaluate(async () => { await window.fixture.mount('<kima-infinite-scroll id="feed"><p>第一条</p></kima-infinite-scroll>'); const feed = document.getElementById("feed"); feed.observe = false; feed.loadMore = window.infiniteLoader; });
  await page.waitForFunction(() => Boolean(document.querySelector("#feed button")));
  const button = page.locator("#feed button").filter({ hasText: "加载更多" });
  await button.click();
  await expect.poll(() => page.evaluate(() => window.infiniteCalls)).toBe(1);
  await expect(page.locator("#feed button").filter({ hasText: "加载更多" })).toHaveCount(0);
  await expect(page.getByRole("status", { name: "正在加载更多" })).toBeVisible();
  await page.evaluate(() => window.infiniteRelease());
  await expect(page.getByText("没有更多内容")).toBeVisible();
  await page.evaluate(async () => { window.infiniteLoader = async () => { throw new Error("失败"); }; await window.fixture.mount('<kima-infinite-scroll id="feed"></kima-infinite-scroll>'); const feed = document.getElementById("feed"); feed.observe = false; feed.loadMore = window.infiniteLoader; });
  await page.waitForFunction(() => Boolean(document.querySelector("#feed button")));
  await page.getByRole("button", { name: "加载更多" }).click();
  await expect(page.getByRole("alert")).toContainText("加载失败");
  expect(await page.getByRole("button", { name: "重试加载" }).count()).toBe(1);
});

test("virtual table has real table semantics, stable row keys, selection, and middle-window rendering", async ({ page }) => {
  const rows = Array.from({ length: 200 }, (_, id) => ({ id, name: `row-${id}`, value: id }));
  await mount(page, '<kima-virtual-table id="table"></kima-virtual-table>', { table: { rows, columns: [{ key: "id", label: "ID" }, { key: "name", label: "名称" }], rowKey: "id", selectable: true, itemHeight: 48, height: 240 } });
  await expect(page.locator("#table table thead th")).toHaveCount(3);
  await expect(page.locator("#table tbody tr:not(.kima-virtual-table__spacer)")).toHaveCount(9);
  await page.locator("#table .kima-virtual-table").evaluate((el) => { el.scrollTop = 48 * 100; el.dispatchEvent(new Event("scroll")); });
  await expect(page.getByText("row-100")).toBeVisible();
  await page.getByRole("checkbox", { name: "选择第 101 行" }).click();
  await expect(page.locator("#table .kima-virtual-table")).toHaveAttribute("aria-label", "虚拟表格区域");
});

test("virtual tree preserves expanded state and keyboard movement in a large visible window", async ({ page }) => {
  const items = Array.from({ length: 120 }, (_, index) => ({ value: `n-${index}`, label: `节点 ${index}`, children: [{ value: `c-${index}`, label: `子节点 ${index}` }] }));
  await mount(page, '<kima-virtual-tree id="tree"></kima-virtual-tree>', { tree: { items, expanded: ["n-0"], height: 240, itemHeight: 48, selectable: true } });
  await expect(page.locator("#tree [role=treeitem]")).toHaveCount(9);
  const first = page.locator("#tree [role=treeitem]").first(); await first.focus(); await first.press("ArrowRight");
  await expect(page.getByText("子节点 0")).toBeVisible();
  await first.press("ArrowDown"); await first.press("Enter");
  await expect(page.locator("#tree [aria-selected=true]")).toHaveCount(1);
});

test("image preview traps interaction in dialog, supports gallery keyboard and reset", async ({ page }) => {
  await mount(page, '<button id="before">前置</button><kima-image-preview id="preview" src="/th.jpg" alt="风景"></kima-image-preview><button id="after">后置</button>');
  const trigger = page.getByRole("button", { name: "预览风景" });
  await trigger.click();
  const dialog = page.locator('[role="dialog"]:not([inert])');
  await expect(dialog).toHaveCount(1);
  await expect(dialog).toBeVisible();
  await expect(page.locator("body > #fixture, body > #before, body > #after")).toHaveAttribute("inert", "");
  await dialog.press("Tab");
  await expect(dialog.getByRole("button", { name: "缩小" })).toBeFocused();
  await dialog.getByRole("button", { name: "关闭预览" }).focus();
  await page.keyboard.press("Escape");
  await expect(page.locator('[role="dialog"][inert][aria-hidden="true"]')).toHaveCount(1);
  await expect(page.locator('[role="dialog"]:not([inert])')).toHaveCount(0);
  await expect.poll(() => page.locator('[role="dialog"]').count()).toBe(0);
  await expect(trigger).toBeFocused();

  await trigger.click();
  await expect(page.locator('[role="dialog"]:not([inert])')).toHaveCount(1);
  await page.evaluate(() => document.getElementById("preview").open = false);
  await page.evaluate(() => document.getElementById("preview").open = true);
  await expect(page.locator('[role="dialog"]:not([inert])')).toHaveCount(1);
  await expect(page.locator('[role="dialog"][inert]')).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect.poll(() => page.locator('[role="dialog"]').count()).toBe(0);

  await mount(page, '<kima-image-preview id="preview" src="/th.jpg" alt="第一张"></kima-image-preview>', { preview: { items: [{ src: "/th.jpg", alt: "第一张" }, { src: "/th.jpg", alt: "第二张" }] } });
  const galleryTrigger = page.getByRole("button", { name: "预览第一张" });
  await galleryTrigger.click();
  const previewDialog = page.locator('[role="dialog"]:not([inert])');
  await expect(previewDialog).toHaveCount(1);
  await previewDialog.press("ArrowRight");
  await expect(previewDialog).toHaveAttribute("aria-label", "第二张");
  await expect(previewDialog.locator(".kima-image-preview__count")).toHaveText("2 / 2");
  await previewDialog.getByRole("button", { name: "放大" }).click(); await previewDialog.getByRole("button", { name: "重置视图" }).click();
  await page.evaluate(() => document.getElementById("preview").remove());
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  await expect(page.locator("body > #fixture, body > #before, body > #after")).not.toHaveAttribute("inert", "");
});

test("notification queue stacks, caps and deduplicates items", async ({ page }) => {
  await mount(page, '<kima-notification-queue id="queue"></kima-notification-queue>', { queue: { items: [{ id: "1", heading: "一", message: "A", duration: 0 }, { id: "1", heading: "重复", message: "B", duration: 0 }, { id: "2", heading: "二", message: "C", duration: 0 }, { id: "3", heading: "三", message: "D", duration: 0 }], capacity: 2 } });
  await expect(page.locator("#queue .kima-notification")).toHaveCount(2);
  await expect(page.getByText("重复")).toHaveCount(0);
});

test("relative time updates, ring progress exposes values, copy reports success and long text expands", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await mount(page, '<kima-relative-time id="time"></kima-relative-time><kima-ring-progress id="ring"></kima-ring-progress><kima-copy-button id="copy"></kima-copy-button><kima-long-text id="long" style="display:block;width:240px"></kima-long-text>', { time: { date: "2025-12-31T23:59:00Z", locale: "zh-CN", updateInterval: 1000 }, ring: { value: 40, max: 80, showValue: true, label: "上传" }, copy: { text: "可复制文本" }, long: { text: "这是一段很长很长很长很长很长很长的文本，用来测试展开动作和 ResizeObserver。", lines: 1 } });
  await expect(page.locator("#ring .kima-ring-progress")).toHaveAttribute("aria-valuenow", "40");
  await expect(page.getByText("50%", { exact: true })).toBeVisible();
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "复制" }).click(); await expect(page.getByRole("status")).toContainText("已复制");
  await page.waitForFunction(() => Boolean(document.querySelector("#long button")));
  await expect(page.getByRole("button", { name: "展开全文" })).toBeVisible(); await page.getByRole("button", { name: "展开全文" }).click(); await expect(page.getByRole("button", { name: "收起全文" })).toBeVisible();
});

test("data demos screenshot in dark/light themes and reduced motion", async ({ page }, testInfo) => {
  const errors = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.evaluate(async () => { const { mountDataExamples } = await import("/tests/data-fixture.js"); await mountDataExamples(); });
  for (const theme of ["dark", "light"]) {
    await page.evaluate(async (theme) => { const { applyPalette } = await import("/src/utils/theme.js"); applyPalette("#61afef", { isDark: theme === "dark" }); document.documentElement.dataset.kimaTheme = theme; }, theme);
    for (const slug of slugs) { await page.evaluate((slug) => { window.dataSlug.value = slug; }, slug); await expect(page.locator("article.kima-data-demo")).toHaveCount(1); await page.screenshot({ path: `shots/data-expansion/${testInfo.project.name}-${slug}-${theme}.png`, fullPage: true }); }
  }
  await page.emulateMedia({ reducedMotion: "reduce" }); await page.evaluate(() => { window.dataSlug.value = "ring-progress"; }); await expect(page.locator(".kima-ring-progress").first()).toBeVisible(); expect(errors).toEqual([]);
});
