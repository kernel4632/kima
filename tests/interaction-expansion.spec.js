import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const slugs = ["popover", "popconfirm", "hover-card", "context-menu", "command", "menubar", "chip", "multi-select", "tree-select", "loading-overlay"];
const items = [{ value: "a", label: "Alpha", group: "项目", keywords: ["first"] }, { value: "b", label: "Beta", disabled: true, group: "项目" }, { value: "c", label: "Charlie", group: "导航" }];
const tree = [{ value: "root", label: "项目", children: [{ value: "a", label: "设计" }, { value: "b", label: "归档", disabled: true }, { value: "c", label: "源码" }] }];
const mount = (page, html, properties = {}) => page.evaluate(([html, properties]) => window.interactionFixture.mount(html, properties), [html, properties]);
const property = (page, id, key, value) => page.evaluate(([id, key, value]) => { document.getElementById(id)[key] = value; }, [id, key, value]);
const listen = (page, id, event) => page.evaluate(([id, event]) => { window.events = []; document.getElementById(id).addEventListener(event, (e) => window.events.push(e.detail)); }, [id, event]);
test.beforeEach(async ({ page }) => { await page.goto("/tests/interaction-fixture.html"); await expect(page.locator("html")).toHaveAttribute("data-ready", "true"); });

test("ten registrations extractable metadata native ids and no runtime errors", async ({ page }) => {
  const errors = []; page.on("pageerror", (error) => errors.push(error.message));
  expect(await page.evaluate((slugs) => slugs.every((slug) => customElements.get(`kima-${slug}`)), slugs)).toBe(true);
  const metadata = await page.evaluate(async () => (await import("/src/site/interaction-catalog.js")).interactionCatalog);
  expect(Object.keys(metadata)).toEqual(slugs);
  const docs = await page.evaluate(async () => (await import("/@id/virtual:kima-docs")).default);
  for (const slug of slugs) { const doc = docs.find((entry) => entry.slug === slug); expect(doc.attributes.length).toBeGreaterThan(0); expect(doc.examples).toContain(`<kima-${slug}`); }
  await mount(page, slugs.map((slug, i) => `<kima-${slug} id="probe-${i}"></kima-${slug}>`).join(""));
  for (let i = 0; i < slugs.length; i++) await expect(page.locator(`[id="probe-${i}"]`)).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("popover native slots focus escape outside disabled and property resync", async ({ page }) => {
  await mount(page, '<kima-popover id="p" label="展开" content-label="项目信息"><span slot="trigger">项目详情</span><p>原生正文</p><button id="inside">内部动作</button></kima-popover><button id="outside">外部</button>');
  const trigger = page.getByRole("button", { name: "项目详情" });
  await trigger.click(); await expect(page.getByText("原生正文")).toBeVisible(); await expect(page.locator('#inside')).toBeFocused();
  await expect(page.getByRole("dialog", { name: "项目信息", exact: true })).toBeVisible();
  const id = await trigger.getAttribute("aria-controls"); await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
  await page.keyboard.press("Escape"); await expect(page.getByText("原生正文")).toBeHidden(); await expect(trigger).toBeFocused();
  await trigger.click(); await page.locator("#outside").click(); await expect(page.getByText("原生正文")).toBeHidden(); await expect(page.locator("#outside")).toBeFocused();
  await property(page, "p", "open", true); await expect(page.getByText("原生正文")).toBeVisible();
  await property(page, "p", "open", false); await expect(page.getByText("原生正文")).toBeHidden();
  await property(page, "p", "disabled", true); await expect(trigger).toBeDisabled();
});

test("popover collision flip and nested native dialog escape keeps outer open", async ({ page }) => {
  await mount(page, '<dialog id="outer" style="width:min(650px,80vw);height:70vh"><kima-popover id="p" label="内层弹层"><button id="popup-action">面板动作</button></kima-popover></dialog>');
  await page.locator("#outer").evaluate((el) => el.showModal());
  await page.getByRole("button", { name: "内层弹层" }).click(); await expect(page.locator("#popup-action")).toBeVisible();
  expect(await page.locator("#popup-action").evaluate((el) => { const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); })).toBe(true);
  await page.keyboard.press("Escape"); await expect(page.locator("#outer")).toHaveAttribute("open", ""); await expect(page.locator("#popup-action")).toBeHidden();
  await page.locator("#outer").evaluate((el) => el.close());
  await mount(page, '<kima-popover id="edge" label="靠近下边缘" style="position:fixed;bottom:12px;right:12px"><p>自动翻转的面板</p></kima-popover>');
  await page.getByRole("button", { name: "靠近下边缘" }).click(); await expect(page.locator(".kima-popover__popup")).toHaveAttribute("data-side", "top");
  const box = await page.locator(".kima-popover__popup").boundingBox(); expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
});

test("popconfirm cancellation confirmation native trigger and safety focus", async ({ page }) => {
  await mount(page, '<kima-popconfirm id="p" heading="删除草稿？" description="不可撤销" danger><span slot="trigger">删除草稿</span><p>原生补充内容</p></kima-popconfirm>');
  await listen(page, "p", "confirm");
  await page.getByRole("button", { name: "删除草稿" }).click(); await expect(page.getByText("原生补充内容")).toBeVisible(); await expect(page.getByRole("button", { name: "取消", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "取消", exact: true }).click(); expect(await page.evaluate(() => window.events)).toEqual([]);
  await page.getByRole("button", { name: "删除草稿" }).click(); await page.getByRole("button", { name: "确认", exact: true }).click();
  expect(await page.evaluate(() => window.events.length)).toBe(1); await expect(page.getByRole("button", { name: "删除草稿" })).toBeFocused();
});

test("hover card keyboard click escape disabled and pointer retention", async ({ page }, info) => {
  await mount(page, '<kima-hover-card id="h" label="预览作者" heading="作者资料" open-delay="20" close-delay="80"><p>原生作者简介</p></kima-hover-card>');
  const trigger = page.getByRole("button", { name: "预览作者" });
  if (info.project.name === "desktop") { await trigger.hover(); await expect(page.getByText("原生作者简介")).toBeVisible(); await page.locator(".kima-hover-card__popup").hover(); await expect(page.getByText("原生作者简介")).toBeVisible(); await page.mouse.move(1, 1); await expect(page.getByText("原生作者简介")).toBeHidden(); }
  await trigger.focus(); await expect(page.getByText("原生作者简介")).toBeVisible(); await trigger.press("Escape"); await expect(page.getByText("原生作者简介")).toBeHidden();
  await trigger.click(); await expect(page.getByText("原生作者简介")).toBeVisible(); await property(page, "h", "disabled", true); await expect(page.getByText("原生作者简介")).toBeHidden(); await expect(trigger).toBeDisabled();
});

test("context menu right click or long press keyboard disabled skipping and focus return", async ({ page }, info) => {
  await mount(page, '<kima-context-menu id="m" label="项目操作"><p>原生项目卡片</p></kima-context-menu>', { m: { items } });
  await listen(page, "m", "select");
  const trigger = page.locator(".kima-context-menu__trigger");
  await trigger.focus(); await trigger.press("Shift+F10"); await expect(page.getByRole("menuitem", { name: "Alpha" })).toBeFocused();
  await page.keyboard.press("ArrowDown"); await expect(page.getByRole("menuitem", { name: "Charlie" })).toBeFocused(); await page.keyboard.press("Enter");
  expect(await page.evaluate(() => window.events[0][0])).toBe("c"); await expect(trigger).toBeFocused();
  if (info.project.name === "desktop") await trigger.click({ button: "right" });
  else { await trigger.dispatchEvent("pointerdown", { pointerType: "touch", clientX: 80, clientY: 80 }); await page.waitForTimeout(750); await trigger.dispatchEvent("pointerup", { pointerType: "touch" }); }
  await expect(page.getByRole("menuitem", { name: "Alpha" })).toBeVisible(); await page.keyboard.press("Escape"); await expect(page.getByRole("menuitem", { name: "Alpha" })).toBeHidden();
  await property(page, "m", "disabled", true); await trigger.press("Shift+F10"); await expect(page.getByRole("menuitem", { name: "Alpha" })).toBeHidden();
});

test("command grouped search keywords IME disabled execution and modal focus", async ({ page }) => {
  await mount(page, '<kima-command id="c"><span slot="trigger">运行命令</span></kima-command>', { c: { items } }); await listen(page, "c", "select");
  const trigger = page.getByRole("button", { name: "运行命令" }); await trigger.click(); const search = page.getByRole("combobox"); await expect(search).toBeFocused();
  await expect(page.getByRole("group")).toHaveCount(2); await search.press("ArrowDown"); await search.press("Enter"); expect(await page.evaluate(() => window.events[0][0])).toBe("c"); await expect(trigger).toBeFocused();
  await trigger.click(); await search.fill("first"); await expect(page.getByRole("option")).toHaveCount(1); await search.press("Enter"); expect(await page.evaluate(() => window.events[1][0])).toBe("a");
  await trigger.click(); await search.fill("Beta"); await search.press("Enter"); await expect(page.getByRole("dialog")).toBeVisible(); expect(await page.evaluate(() => window.events.length)).toBe(2);
  await search.fill("missing"); await expect(page.getByRole("status")).toContainText("没有匹配命令"); await search.press("Escape"); await expect(trigger).toBeFocused();
});

test("menubar keyboard between menus actions and disabled", async ({ page }) => {
  await mount(page, '<kima-menubar id="m"></kima-menubar>', { m: { menus: [{ value: "file", label: "文件", items }, { value: "edit", label: "编辑", items: [{ value: "undo", label: "撤销" }] }, { value: "disabled", label: "不可用", disabled: true, items }] } }); await listen(page, "m", "select");
  const file = page.getByRole("menuitem", { name: "文件", exact: true }); await file.focus(); await file.press("ArrowDown"); await expect(page.getByRole("menuitem", { name: "Alpha", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowDown"); await expect(page.getByRole("menuitem", { name: "Charlie", exact: true })).toBeFocused(); await page.keyboard.press("ArrowRight"); await expect(page.getByRole("menuitem", { name: "撤销", exact: true })).toBeFocused(); await page.keyboard.press("Enter");
  expect(await page.evaluate(() => window.events[0][0])).toBe("undo"); await expect(page.getByRole("menuitem", { name: "不可用", exact: true })).toBeDisabled();
});

test("chip static toggle remove semantics and form reset", async ({ page }) => {
  await mount(page, '<form id="f"><kima-chip id="static">静态标签</kima-chip><kima-chip id="c" label="设计" selectable removable name="topic" value="design">设计</kima-chip><button type="reset">重置</button></form>');
  await listen(page, "c", "remove"); await expect(page.locator("#static button")).toHaveCount(0);
  const toggle = page.getByRole("button", { name: "设计", exact: true }); await toggle.focus(); await toggle.press("Space"); await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(await page.locator("#f").evaluate((form) => new FormData(form).getAll("topic"))).toEqual(["design"]);
  await page.getByRole("button", { name: "移除 设计", exact: true }).click(); expect(await page.evaluate(() => window.events[0][0])).toBe("design"); await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "重置" }).click(); await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await property(page, "c", "disabled", true); await expect(toggle).toBeDisabled();
});

test("multi select real multi values keyboard search clear required reset and external sync", async ({ page }) => {
  await mount(page, '<form id="f"><kima-multi-select id="m" name="topics" label="主题" required></kima-multi-select><button type="reset">重置</button></form>', { m: { items, modelValue: ["a"] } });
  await page.getByRole("button", { name: "主题", exact: true }).click(); const search = page.getByRole("combobox"); await expect(search).toBeFocused(); await search.press("ArrowDown"); await search.press("Enter");
  await expect(page.getByRole("listbox")).toBeVisible(); expect(await page.locator("#f").evaluate((form) => new FormData(form).getAll("topics"))).toEqual(["a", "c"]);
  await search.fill("Beta"); await search.press("Enter"); expect(await page.evaluate(() => document.getElementById("m").modelValue)).toEqual(["a", "c"]);
  await search.fill("nothing"); await expect(page.getByRole("status")).toContainText("没有匹配选项"); await search.press("Escape");
  await page.getByRole("button", { name: "清除选择" }).click(); expect(await page.locator("#f").evaluate((form) => form.checkValidity())).toBe(false);
  await page.getByRole("button", { name: "重置" }).click(); await expect(page.getByRole("button", { name: "移除 Alpha" })).toBeVisible(); expect(await page.locator("#f").evaluate((form) => new FormData(form).getAll("topics"))).toEqual(["a"]);
  await property(page, "m", "modelValue", ["c"]); await expect(page.getByRole("button", { name: "移除 Charlie" })).toBeVisible(); await property(page, "m", "disabled", true); expect(await page.locator("#f").evaluate((form) => new FormData(form).getAll("topics"))).toEqual([]);
});

test("tree select hierarchy keyboard disabled single close multi and form reset", async ({ page }) => {
  await mount(page, '<form id="f"><kima-tree-select id="t" name="folder" label="目标目录" required clearable></kima-tree-select><button type="reset">重置</button></form>', { t: { items: tree, modelValue: "a", expanded: ["root"] } });
  const trigger = page.getByRole("button", { name: "目标目录" }); await trigger.click(); await expect(page.getByRole("treeitem", { name: "设计", exact: true })).toBeFocused(); await page.keyboard.press("ArrowDown"); await expect(page.getByRole("treeitem", { name: "源码", exact: true })).toBeFocused(); await page.keyboard.press("Enter"); await expect(page.getByRole("tree")).toBeHidden();
  expect(await page.locator("#f").evaluate((form) => new FormData(form).get("folder"))).toBe("c"); await page.getByRole("button", { name: "重置" }).click(); await expect(trigger).toHaveText("设计");
  await page.getByRole("button", { name: "清除选择" }).click(); expect(await page.locator("#f").evaluate((form) => form.checkValidity())).toBe(false);
  await property(page, "t", "multiple", true); await property(page, "t", "modelValue", ["a"]); await trigger.click(); await page.getByRole("treeitem", { name: "源码", exact: true }).click(); await expect(page.getByRole("tree")).toBeVisible(); expect(await page.locator("#f").evaluate((form) => new FormData(form).getAll("folder"))).toEqual(["a", "c"]);
});

test("loading overlay preserves nodes values original inert and focus", async ({ page }) => {
  await mount(page, '<kima-loading-overlay id="l"><input id="content" value="初始"><div inert id="original"><button>原本隔离</button></div></kima-loading-overlay><button id="outside">外部</button>');
  await page.locator("#content").fill("保留修改"); await page.locator("#content").focus(); await page.evaluate(() => { window.originalInput = document.getElementById("content"); });
  await property(page, "l", "loading", true); await expect(page.locator(".kima-loading-overlay")).toHaveAttribute("aria-busy", "true"); await expect(page.locator(".kima-loading-overlay__content")).toHaveAttribute("inert", ""); await expect(page.getByRole("status")).toBeVisible();
  await property(page, "l", "loading", false); await expect(page.locator("#content")).toHaveValue("保留修改"); await expect(page.locator("#content")).toBeFocused(); expect(await page.evaluate(() => window.originalInput === document.getElementById("content"))).toBe(true); await expect(page.locator("#original")).toHaveAttribute("inert", "");
  await property(page, "l", "blocking", false); await property(page, "l", "loading", true); await expect(page.locator(".kima-loading-overlay__content")).not.toHaveAttribute("inert"); await page.locator("#content").fill("后台可编辑");
});

test("selection popups in native modal and no-search Space multi toggle", async ({ page }) => {
  await mount(page, '<dialog id="outer"><kima-multi-select id="m" label="多选" searchable="false"></kima-multi-select><kima-tree-select id="t" label="树选择"></kima-tree-select></dialog>', { m: { items, searchable: false }, t: { items: tree } });
  await page.locator('#outer').evaluate((element) => element.showModal());
  await page.getByRole('button', { name: '多选', exact: true }).click();
  const list = page.getByRole('listbox'); await expect(list).toBeFocused(); await list.press('Space');
  expect(await page.evaluate(() => document.getElementById('m').modelValue)).toEqual(['a']);
  await list.press('Escape'); await expect(page.locator('#outer')).toHaveAttribute('open', '');
  await page.getByRole('button', { name: '树选择', exact: true }).click();
  const parent = page.getByRole('treeitem', { name: /项目/ }); await expect(parent).toBeFocused(); await parent.press('ArrowRight'); await parent.press('ArrowDown'); await page.keyboard.press('Enter');
  expect(await page.evaluate(() => document.getElementById('t').modelValue)).toBe('a'); await expect(page.locator('#outer')).toHaveAttribute('open', '');
});

test("cancelled reset external menu focus and unique menu instance ids", async ({ page }) => {
  const menus = [{ value: 'file', label: '文件', items }];
  await mount(page, '<form id="f"><kima-multi-select id="m" name="topics"></kima-multi-select><button type="reset">重置</button></form><kima-context-menu id="ctx">右键区域</kima-context-menu><kima-menubar id="bar1"></kima-menubar><kima-menubar id="bar2"></kima-menubar><button id="outside">外部目标</button>', { m: { items, modelValue: ['a'] }, ctx: { items }, bar1: { menus }, bar2: { menus } });
  await property(page, 'm', 'modelValue', ['c']); await page.locator('#f').evaluate((form) => form.addEventListener('reset', (event) => event.preventDefault())); await page.getByRole('button', { name: '重置', exact: true }).click();
  expect(await page.evaluate(() => document.getElementById('m').modelValue)).toEqual(['c']);
  await page.locator('.kima-context-menu__trigger').focus(); await page.keyboard.press('Shift+F10'); await page.locator('#outside').click(); await expect(page.locator('#outside')).toBeFocused();
  const ids = await page.locator('.kima-menubar button').evaluateAll((elements) => elements.map((element) => element.id)); expect(new Set(ids).size).toBe(ids.length);
});

test("loading focus outside is not stolen and unmounting command is safe", async ({ page }) => {
  const errors = []; page.on('pageerror', (error) => errors.push(error.message));
  await mount(page, '<kima-loading-overlay id="l"><input id="input"></kima-loading-overlay><button id="outside">外部</button><kima-command id="c"></kima-command>');
  await page.locator('#input').focus(); await property(page, 'l', 'loading', true); await page.locator('#outside').click(); await property(page, 'l', 'loading', false); await expect(page.locator('#outside')).toBeFocused();
  await page.getByRole('button', { name: '打开命令面板' }).click(); await page.getByRole('combobox').dispatchEvent('keydown', { key: 'Enter', isComposing: true }); await expect(page.getByRole('dialog')).toBeVisible();
  await page.evaluate(() => document.getElementById('c').remove()); await page.waitForTimeout(100); expect(errors).toEqual([]);
});

test("vue examples every component dark light no errors and focused screenshots", async ({ page }, info) => {
  const errors = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mkdir("shots/interaction-expansion", { recursive: true });
  for (const theme of ["dark", "light"]) {
    for (const slug of slugs) {
      await page.evaluate(([slug, theme]) => window.interactionFixture.example(slug, theme), [slug, theme]);
      await expect(page.locator("article.kima-gallery__demo")).toHaveCount(1);
      if (["popover", "popconfirm", "hover-card", "command"].includes(slug)) await page.locator("article button").first().click();
      if (slug === "multi-select" || slug === "tree-select") await page.getByRole("button", { name: slug === "multi-select" ? "关注主题" : "目标目录", exact: true }).click();
      if (slug === "context-menu") { await page.locator(".kima-context-menu__trigger").focus(); await page.keyboard.press("Shift+F10"); }
      if (slug === "menubar") await page.getByRole("menuitem", { name: "文件", exact: true }).click();
      if (slug === "loading-overlay") await page.getByRole("button", { name: "模拟区域加载" }).click();
      const popup = page.locator('.kima-popover__popup, .kima-hover-card__popup, .kima-context-menu__popup, .kima-menubar__popup, .kima-multi-select__popup, .kima-tree-select__popup, .kima-command__panel');
      if (await popup.count()) {
        await expect(popup.first()).toBeVisible();
        const background = await popup.first().evaluate((element) => getComputedStyle(element).backgroundColor);
        expect(background).not.toBe('rgba(0, 0, 0, 0)');
        expect(background).not.toBe('transparent');
      }
      await page.screenshot({ path: `shots/interaction-expansion/${slug}-${theme}-${info.project.name}.png`, fullPage: true });
      if (slug === "command") await page.keyboard.press("Escape");
    }
  }
  expect(errors).toEqual([]);
});
