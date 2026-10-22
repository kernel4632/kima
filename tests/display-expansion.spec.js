import { test, expect } from "@playwright/test";

const slugs = ["avatar", "avatar-group", "image", "skeleton", "spinner", "alert", "result", "descriptions", "list", "timeline", "statistic", "countdown", "kbd", "blockquote", "highlight", "aspect-ratio"];
test.beforeEach(async ({ page }) => {
  await page.goto("/tests/fixture.html");
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
});
async function mount(page, html, properties = {}) {
  await page.evaluate(([html, properties]) => window.fixture.mount(html, properties), [html, properties]);
}

test("sixteen registrations, metadata and generated documentation", async ({ page }) => {
  expect(await page.evaluate((slugs) => slugs.every((slug) => customElements.get(`kima-${slug}`)), slugs)).toBe(true);
  const catalog = await page.evaluate(async () => (await import("/src/site/display-catalog.js")).displayCatalog);
  expect(Object.keys(catalog)).toEqual(slugs);
  expect(Object.values(catalog).every((item) => item.label && item.group === "展示与反馈")).toBe(true);
  const docs = await page.evaluate(async () => (await import("/@id/virtual:kima-docs")).default);
  for (const slug of slugs) expect(docs.find((item) => item.slug === slug).attributes.length).toBeGreaterThan(0);
  expect(docs.find((item) => item.slug === "countdown").events).toContain("finish");
});

test("avatar image alt, error fallback, source recovery and no duplicate id", async ({ page }) => {
  await mount(page, '<kima-avatar id="avatar" name="Alex Kim" src="/not-an-avatar.png"></kima-avatar>');
  await expect(page.locator("#avatar .kima-avatar")).toHaveText("AK");
  await expect(page.locator("#avatar .kima-avatar")).toHaveAccessibleName("Alex Kim");
  await page.evaluate(() => { document.getElementById("avatar").src = "/th.jpg"; });
  await expect(page.locator("#avatar img")).toHaveAttribute("alt", "Alex Kim");
  await expect.poll(() => page.locator("#avatar img").evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  expect(await page.locator('[id="avatar"]').count()).toBe(1);
});

test("avatar group max, accessible overflow and native default slot", async ({ page }) => {
  await mount(page, '<kima-avatar-group id="group" max="2" label="协作者"></kima-avatar-group><kima-avatar-group id="native"><kima-avatar name="原生成员"></kima-avatar></kima-avatar-group>', { group: { items: [{ name: "甲" }, { name: "乙" }, { name: "丙" }, { name: "丁" }] } });
  await expect(page.locator("#group .kima-avatar")).toHaveCount(2);
  await expect(page.locator("#group .kima-avatar-group__more")).toHaveAccessibleName("另有 2 位成员：丙、丁");
  await expect(page.locator("#native .kima-avatar")).toHaveAccessibleName("原生成员");
  await page.evaluate(() => { document.getElementById("group").max = 0; });
  await expect(page.locator("#group .kima-avatar")).toHaveCount(0);
});

test("image exposes native alt, loading/error slots and emits on recovery", async ({ page }) => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  await page.route("**/slow-display.png", async (route) => { await gate; await route.fulfill({ status: 404, body: "missing" }); });
  await mount(page, '<kima-image id="image" src="/slow-display.png" alt="示例图片" loading="eager"><span slot="loading">等待图片</span><span slot="error">自定义失败提示</span><span slot="caption">图注内容</span></kima-image>');
  await page.evaluate(() => { window.imageEvents = []; const host = document.getElementById("image"); for (const type of ["load", "error"]) host.addEventListener(type, () => window.imageEvents.push(type)); });
  await expect(page.locator("#image img")).toHaveAttribute("alt", "示例图片");
  await expect(page.getByText("等待图片")).toBeVisible();
  release();
  await expect(page.locator("#image figure")).toHaveAttribute("data-state", "error");
  await expect(page.getByText("自定义失败提示")).toBeVisible();
  await expect(page.locator("#image .kima-image__error")).toHaveAccessibleName("示例图片");
  await expect(page.locator("#image figcaption")).toHaveText("图注内容");
  await page.evaluate(() => { document.getElementById("image").src = "/th.jpg"; });
  await expect(page.locator("#image figure")).toHaveAttribute("data-state", "loaded");
  expect(await page.evaluate(() => window.imageEvents)).toEqual(["error", "load"]);
});

test("empty image source and decorative alt remain safe", async ({ page }) => {
  await mount(page, '<kima-image id="empty"></kima-image><kima-image id="decorative" src="/th.jpg" alt=""></kima-image>');
  await expect(page.locator("#empty figure")).toHaveAttribute("data-state", "error");
  await expect(page.locator("#empty img")).toHaveCount(0);
  await expect(page.locator("#decorative img")).toHaveAttribute("alt", "");
});

test("skeleton native content restores and reduced motion stops animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mount(page, '<kima-skeleton id="skeleton" rows="4" avatar><p>已加载内容</p></kima-skeleton><kima-spinner id="spinner" label="正在同步"></kima-spinner>');
  await expect(page.locator("#skeleton .kima-skeleton__line")).toHaveCount(4);
  await expect(page.locator("#skeleton .kima-skeleton")).toHaveAttribute("aria-busy", "true");
  expect(await page.locator(".kima-skeleton__placeholder").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  expect(await page.locator(".kima-spinner__ring").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  await expect(page.locator("#spinner [role=status]")).toHaveAccessibleName("正在同步");
  await page.evaluate(() => { document.getElementById("skeleton").loading = false; });
  await expect(page.getByText("已加载内容")).toBeVisible();
  await expect(page.locator("#skeleton .kima-skeleton")).not.toHaveAttribute("aria-busy");
});

test("alerts have semantic icons, native action, keyboard close and reopen", async ({ page }) => {
  await mount(page, '<kima-alert id="alert" variant="danger" heading="保存失败" closable><p>请重试。</p><button slot="action" type="button">重试操作</button></kima-alert>');
  await expect(page.locator("#alert section")).toHaveAttribute("role", "alert");
  await expect(page.locator("#alert .kima-alert__icon")).toHaveAccessibleName("错误");
  await expect(page.locator("#alert .kima-alert__action button")).toHaveText("重试操作");
  await page.evaluate(() => { window.closeCount = 0; document.getElementById("alert").addEventListener("close", () => window.closeCount++); });
  const close = page.getByRole("button", { name: "关闭提示" });
  await close.focus();
  await close.press("Enter");
  await expect(page.locator("#alert section")).toBeHidden();
  expect(await page.evaluate(() => window.closeCount)).toBe(1);
  await page.evaluate(async () => { const host = document.getElementById("alert"); host.open = false; await new Promise((resolve) => requestAnimationFrame(resolve)); host.open = true; });
  await expect(page.locator("#alert section")).toBeVisible();
  for (const [variant, label] of [["info", "信息"], ["success", "成功"], ["warning", "警告"], ["neutral", "提示"]]) {
    await page.evaluate((variant) => { document.getElementById("alert").variant = variant; }, variant);
    await expect(page.locator("#alert .kima-alert__icon")).toHaveAccessibleName(label);
  }
});

test("result native slots and semantic status", async ({ page }) => {
  await mount(page, '<kima-result id="result" variant="warning" heading="待确认" description="请检查配置"><p>详细说明</p><button slot="action">继续操作</button></kima-result>');
  await expect(page.locator("#result h2")).toHaveText("待确认");
  await expect(page.locator("#result .kima-result__icon")).toHaveAccessibleName("警告");
  await expect(page.locator("#result .kima-result__content")).toContainText("详细说明");
  await expect(page.locator("#result .kima-result__actions button")).toHaveText("继续操作");
});

test("descriptions list timeline preserve real document semantics and escape values", async ({ page }) => {
  await mount(page, '<kima-descriptions id="details"></kima-descriptions><kima-list id="list" ordered></kima-list><kima-timeline id="timeline"></kima-timeline>', {
    details: { items: [{ label: "名称", value: "<img onerror=alert(1)>" }, { label: "空值", value: null }] },
    list: { items: [{ title: "第一项", description: "说明" }, { title: "第二项" }] },
    timeline: { items: [{ title: "已完成", time: "今天", datetime: "2026-05-18", variant: "success" }] },
  });
  await expect(page.locator("#details dl dt")).toHaveCount(2);
  await expect(page.locator("#details dd").first()).toHaveText("<img onerror=alert(1)>");
  await expect(page.locator("#details dd").last()).toHaveText("—");
  await expect(page.locator("#details img")).toHaveCount(0);
  await expect(page.locator("#list ol > li")).toHaveCount(2);
  await expect(page.locator("#timeline ol > li")).toHaveCount(1);
  await expect(page.locator("#timeline time")).toHaveAttribute("datetime", "2026-05-18");
});

test("structure components accept native default content", async ({ page }) => {
  await mount(page, '<kima-descriptions id="d"><div><dt>自定义名称</dt><dd>自定义内容</dd></div></kima-descriptions><kima-list id="l"><li>自定义条目</li></kima-list><kima-timeline id="t"><li>自定义事件</li></kima-timeline>');
  await expect(page.locator("#d dl dt")).toHaveText("自定义名称");
  await expect(page.locator("#l ul > li")).toHaveText("自定义条目");
  await expect(page.locator("#t ol > li")).toHaveText("自定义事件");
});

test("statistic Intl currencies, percentages, precision and invalid input", async ({ page }) => {
  await mount(page, '<kima-statistic id="stat" value="12345.678" locale="en-US" precision="2" label="收入"></kima-statistic>');
  await expect(page.locator("#stat .kima-statistic__value")).toHaveText("12,345.68");
  await page.evaluate(() => { Object.assign(document.getElementById("stat"), { options: { style: "currency", currency: "USD" } }); });
  await expect(page.locator("#stat .kima-statistic__value")).toHaveText("$12,345.68");
  await page.evaluate(() => { Object.assign(document.getElementById("stat"), { value: 0.5, precision: 0, options: { style: "percent" } }); });
  await expect(page.locator("#stat .kima-statistic__value")).toHaveText("50%");
  await page.evaluate(() => { document.getElementById("stat").value = "not a number"; });
  await expect(page.locator("#stat .kima-statistic__value")).toHaveText("—");
});

test("countdown wall clock, once finish, new target and invalid value", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-05-18T00:00:00Z") });
  await mount(page, '<kima-countdown id="timer" label="剩余时间"></kima-countdown>');
  await page.evaluate(() => { window.finishes = 0; const el = document.getElementById("timer"); el.addEventListener("finish", () => window.finishes++); el.value = Date.now() + 2100; });
  await expect(page.getByRole("timer")).toHaveText("00:00:03");
  await page.clock.runFor(3000);
  await expect(page.getByRole("timer")).toHaveText("00:00:00");
  await page.clock.runFor(3000);
  expect(await page.evaluate(() => window.finishes)).toBe(1);
  await page.evaluate(() => { document.getElementById("timer").value = Date.now() + 1000; });
  await page.clock.runFor(1500);
  expect(await page.evaluate(() => window.finishes)).toBe(2);
  await page.evaluate(() => { document.getElementById("timer").value = "invalid"; });
  await expect(page.getByRole("timer")).toHaveText("--:--:--");
});

test("countdown days and unmount cancels pending timeout", async ({ page }) => {
  await page.clock.install();
  await page.evaluate(() => {
    window.activeCountdownTimers = new Set();
    const originalSet = window.setTimeout;
    const originalClear = window.clearTimeout;
    window.setTimeout = (callback, delay, ...args) => {
      const id = originalSet(() => { window.activeCountdownTimers.delete(id); callback(...args); }, delay);
      if (callback.name === "tick") window.activeCountdownTimers.add(id);
      return id;
    };
    window.clearTimeout = (id) => { window.activeCountdownTimers.delete(id); originalClear(id); };
  });
  await mount(page, '<kima-countdown id="timer" show-days></kima-countdown>', { timer: { value: Date.now() + 90061000 } });
  await page.evaluate(() => { document.getElementById("timer").value = Date.now() + 90061000; });
  await expect(page.getByRole("timer")).toHaveText("1天 01:01:01");
  expect(await page.evaluate(() => window.activeCountdownTimers.size)).toBe(1);
  await page.evaluate(() => { document.getElementById("timer").remove(); });
  await page.waitForTimeout(1);
  expect(await page.evaluate(() => window.activeCountdownTimers.size)).toBe(0);
});

test("kbd and blockquote retain native semantics and slots", async ({ page }) => {
  await mount(page, '<kima-kbd id="keys"></kima-kbd><kima-blockquote id="quote" author="作者" source="原则" cite="https://example.com">引用内容</kima-blockquote>', { keys: { keys: ["Ctrl", "K"] } });
  await expect(page.locator("#keys kbd.kima-kbd__key")).toHaveText(["Ctrl", "K"]);
  await expect(page.locator("#keys button")).toHaveCount(0);
  await expect(page.locator("#quote blockquote")).toHaveText("引用内容");
  await expect(page.locator("#quote blockquote")).toHaveAttribute("cite", "https://example.com");
  await expect(page.locator("#quote cite")).toHaveText("原则");
});

test("highlight literal regex characters, longest matches and XSS safety", async ({ page }) => {
  const text = '<img src=x onerror="window.pwned=1"> KIMA kima a+b [x] 你好';
  await mount(page, '<kima-highlight id="highlight"></kima-highlight>', { highlight: { text, keywords: ["KIM", "KIMA", "a+b", "[x]", "你好", "", "<img"] } });
  await expect(page.locator("#highlight .kima-highlight")).toHaveText(text);
  await expect(page.locator("#highlight mark")).toHaveText(["<img", "KIMA", "kima", "a+b", "[x]", "你好"]);
  await expect(page.locator("#highlight img")).toHaveCount(0);
  expect(await page.evaluate(() => window.pwned)).toBeUndefined();
  await page.evaluate(() => { document.getElementById("highlight").caseSensitive = true; });
  await expect(page.locator("#highlight mark")).toHaveCount(5);
  await page.evaluate(() => { document.getElementById("highlight").keywords = []; });
  await expect(page.locator("#highlight mark")).toHaveCount(0);
});

test("aspect ratio real dimensions, native child and invalid ratio fallback", async ({ page }) => {
  await mount(page, '<kima-aspect-ratio id="ratio" ratio="2" style="display:block;width:300px"><img src="/th.jpg" alt="风景"></kima-aspect-ratio>');
  const box = await page.locator("#ratio .kima-aspect-ratio").boundingBox();
  expect(box.width / box.height).toBeCloseTo(2, 1);
  await expect(page.locator("#ratio .kima-aspect-ratio__content > img")).toHaveAttribute("alt", "风景");
  await page.evaluate(() => { document.getElementById("ratio").ratio = -2; });
  const fallback = await page.locator("#ratio .kima-aspect-ratio").boundingBox();
  expect(fallback.width / fallback.height).toBeCloseTo(16 / 9, 1);
});

test("all Vue demos render one article, both themes, without page errors", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.evaluate(async () => { const { mountDisplayExamples } = await import("/tests/display-fixture.js"); await mountDisplayExamples(); });
  for (const theme of ["dark", "light"]) {
    await page.evaluate(async (theme) => { const { applyPalette } = await import('/src/utils/theme.js'); applyPalette('#61afef', { isDark: theme === 'dark', variant: 'tonal-spot' }); document.documentElement.dataset.kimaTheme = theme; }, theme);
    for (const slug of slugs) {
      await page.evaluate((slug) => { window.displaySlug.value = slug; }, slug);
      await expect(page.locator("article.kima-gallery__demo")).toHaveCount(1);
      await expect(page.locator("article h2").first()).toBeVisible();
      await page.screenshot({ path: `shots/display-expansion/${testInfo.project.name}-${slug}-${theme}.png`, fullPage: true });
    }
  }
  await page.evaluate(() => { window.displaySlug.value = "skeleton"; });
  await page.getByRole("button", { name: "显示内容" }).click();
  await expect(page.getByText("交互设计", { exact: true })).toBeVisible();
  await page.evaluate(() => { window.displaySlug.value = "alert"; });
  await page.getByRole("button", { name: "查看详情" }).click();
  await expect(page.locator("output")).toHaveText("操作次数：1");
  await page.getByRole("button", { name: "关闭提示" }).click();
  await expect(page.getByRole("button", { name: "重新打开提示" })).toBeVisible();
  await page.evaluate(() => window.displayApp.unmount());
  expect(errors).toEqual([]);
});
