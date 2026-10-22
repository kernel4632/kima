import { test, expect } from "@playwright/test";

const slugs = ["textarea", "radio-group", "number-field", "tags-input", "rating", "pin-input", "file-upload", "color-picker", "toggle", "checkbox-group", "native-select", "field"];
test.beforeEach(async ({ page }) => {
  await page.goto("/tests/fixture.html");
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
});
async function mount(page, html, properties = {}) {
  await page.evaluate(([html, properties]) => window.fixture.mount(html, properties), [html, properties]);
}
async function reset(page) { await page.evaluate(() => document.querySelector("form").reset()); }
async function data(page) { return page.evaluate(() => [...new FormData(document.querySelector("form"))].map(([key, value]) => [key, value instanceof File ? value.name : value])); }
async function updates(page, id) { return page.evaluate((id) => window.fixture.events.filter((event) => event.id === id && event.type === "update:modelValue").map((event) => event.detail[0]), id); }
const options = [{ value: "a", label: "甲" }, { value: "b", label: "禁用", disabled: true }, { value: "c", label: "丙" }];

test("all twelve inputs register and metadata is complete", async ({ page }) => {
  expect(await page.evaluate((slugs) => slugs.every((slug) => customElements.get(`kima-${slug}`)), slugs)).toBe(true);
  const catalog = await page.evaluate(async () => (await import("/src/site/input-catalog.js")).inputCatalog);
  expect(Object.keys(catalog)).toEqual(slugs);
  for (const item of Object.values(catalog)) expect(item.group).toBe("表单与选择");
});

test("textarea handles IME, external updates, native names and reset without echo", async ({ page }) => {
  await mount(page, '<form><kima-textarea id="text" label="备注" name="notes" model-value="初始" required show-count maxlength="20"></kima-textarea></form>');
  const input = page.locator("#text textarea");
  await input.evaluate((element) => {
    element.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    element.value = "中文";
    element.dispatchEvent(new InputEvent("input", { bubbles: true, isComposing: true }));
  });
  expect(await updates(page, "text")).toEqual([]);
  await input.dispatchEvent("compositionend");
  expect(await updates(page, "text")).toEqual(["中文"]);
  expect(await data(page)).toEqual([["notes", "中文"]]);
  await page.evaluate(() => { document.getElementById("text").modelValue = "外部"; });
  await expect(input).toHaveValue("外部");
  await input.fill("本地不回写");
  await expect(page.locator("#text .kima-textarea__count")).toHaveText("5 / 20");
  await reset(page);
  await expect(input).toHaveValue("初始");
  expect(await data(page)).toEqual([["notes", "初始"]]);
});

test("number field decimal stepping, bounds, empty and reset", async ({ page }) => {
  await mount(page, '<form><kima-number-field id="number" name="qty" label="数量" model-value="0.2" min="0" max="0.6" step="0.2" required></kima-number-field></form>');
  const input = page.locator("#number input");
  await page.getByRole("button", { name: "增加", exact: true }).click();
  await expect(input).toHaveValue("0.4");
  await page.getByRole("button", { name: "增加", exact: true }).click();
  await expect(input).toHaveValue("0.6");
  await expect(page.getByRole("button", { name: "增加", exact: true })).toBeDisabled();
  await input.fill("");
  expect((await updates(page, "number")).at(-1)).toBeNull();
  expect(await input.evaluate((el) => el.checkValidity())).toBe(false);
  await input.fill("0.2");
  await input.press("ArrowUp");
  await expect(input).toHaveValue("0.4");
  await page.evaluate(() => { document.getElementById("number").modelValue = 0.6; });
  await expect(input).toHaveValue("0.6");
  await reset(page);
  await expect(input).toHaveValue("0.2");
});

test("radio group keyboard skips disabled choices, submits and resets", async ({ page }) => {
  await mount(page, '<form><kima-radio-group id="radio" name="choice" label="选择" required></kima-radio-group></form>', { radio: { options, modelValue: "a" } });
  const inputs = page.locator("#radio input");
  await inputs.nth(0).focus();
  await inputs.nth(0).press("ArrowDown");
  await expect(inputs.nth(2)).toBeChecked();
  await expect(inputs.nth(2)).toBeFocused();
  expect(await data(page)).toEqual([["choice", "c"]]);
  await inputs.nth(2).press("Home");
  await expect(inputs.nth(0)).toBeChecked();
  await page.evaluate(() => { document.getElementById("radio").modelValue = "c"; });
  await expect(inputs.nth(2)).toBeChecked();
  await reset(page);
  await expect(inputs.nth(0)).toBeChecked();
});

test("checkbox group requires one not all, submits arrays and resets", async ({ page }) => {
  await mount(page, '<form><kima-checkbox-group id="checks" label="兴趣" name="interest" required></kima-checkbox-group></form>', { checks: { options } });
  expect(await page.locator("form").evaluate((el) => el.checkValidity())).toBe(false);
  await page.locator("#checks input").nth(2).check();
  expect(await page.locator("form").evaluate((el) => el.checkValidity())).toBe(true);
  await page.locator("#checks input").nth(0).check();
  expect(await data(page)).toEqual([["interest", "a"], ["interest", "c"]]);
  await page.evaluate(() => { document.getElementById("checks").modelValue = ["a"]; });
  await expect(page.locator("#checks input").nth(2)).not.toBeChecked();
  await reset(page);
  await expect(page.locator("#checks input:checked")).toHaveCount(0);
});

test("tags input IME, duplicate rejection, limit, backspace, form and reset", async ({ page }) => {
  await mount(page, '<form><kima-tags-input id="tags" label="标签" name="tags" max="3" required></kima-tags-input></form>', { tags: { modelValue: ["Vue"] } });
  const input = page.locator('#tags input[type="text"]');
  await input.fill("KIMA");
  await input.press("Enter");
  expect(await data(page)).toEqual([["tags", "Vue"], ["tags", "KIMA"]]);
  await input.fill("Vue");
  await input.press("Enter");
  expect(await data(page)).toHaveLength(2);
  await input.dispatchEvent("compositionstart");
  await input.fill("中文");
  await input.press("Enter");
  expect(await data(page)).toHaveLength(2);
  await input.dispatchEvent("compositionend");
  await input.press("Enter");
  await expect(input).toHaveAttribute("readonly", "");
  await page.getByRole("button", { name: "移除 中文" }).click();
  await input.press("Backspace");
  expect(await data(page)).toEqual([["tags", "Vue"]]);
  await page.evaluate(() => { document.getElementById("tags").modelValue = ["外部"]; });
  await expect(page.locator('#tags .kima-tags-input__tag:not([aria-hidden="true"])')).toHaveText("外部×");
  await reset(page);
  expect(await data(page)).toEqual([["tags", "Vue"]]);
});

test("rating supports arrows, clear, readonly and reset", async ({ page }) => {
  await mount(page, '<form><kima-rating id="rating" name="score" clearable required model-value="2"></kima-rating></form>');
  const second = page.locator('#rating input[type="radio"]').nth(1);
  await second.focus();
  await second.press("ArrowRight");
  expect(await data(page)).toEqual([["score", "3"]]);
  await page.getByRole("button", { name: "清除评分" }).click();
  expect(await page.locator("form").evaluate((el) => el.checkValidity())).toBe(false);
  await page.evaluate(() => { document.getElementById("rating").modelValue = 4; document.getElementById("rating").readonly = true; });
  const fourth = page.locator('#rating input[type="radio"]').nth(3);
  await fourth.focus();
  await fourth.press("ArrowRight");
  await fourth.press(" ");
  expect(await data(page)).toEqual([["score", "4"]]);
  await reset(page);
  expect(await data(page)).toEqual([["score", "2"]]);
});

test("pin sanitizes paste, emits completion, validates length and resets", async ({ page }) => {
  await mount(page, '<form><kima-pin-input id="pin" label="验证码" name="otp" required></kima-pin-input></form>');
  const input = page.locator("#pin input");
  await page.evaluate(() => { window.completed = []; document.getElementById("pin").addEventListener("complete", (event) => window.completed.push(event.detail[0])); });
  await input.evaluate((el) => {
    const transfer = new DataTransfer();
    transfer.setData("text/plain", "12 34-56");
    el.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: transfer }));
  });
  await expect(input).toHaveValue("123456");
  expect(await page.evaluate(() => window.completed)).toEqual(["123456"]);
  expect(await data(page)).toEqual([["otp", "123456"]]);
  await input.press("Home");
  await input.press("Delete");
  await expect(input).toHaveValue("23456");
  expect(await input.evaluate((el) => el.checkValidity())).toBe(false);
  await page.evaluate(() => { document.getElementById("pin").modelValue = "654321"; });
  await expect(input).toHaveValue("654321");
  await reset(page);
  await expect(input).toHaveValue("");
});

test("color picker editable hex, invalid validation, native input and reset", async ({ page }) => {
  await mount(page, '<form><kima-color-picker id="color" name="color" model-value="#123456" required></kima-color-picker></form>');
  const hex = page.locator('#color input[type="text"]');
  await hex.fill("#abcdef");
  await expect(page.locator('#color input[type="color"]')).toHaveValue("#abcdef");
  expect(await data(page)).toEqual([["color", "#abcdef"]]);
  await hex.fill("#oops");
  expect(await hex.evaluate((el) => el.checkValidity())).toBe(false);
  await page.locator('#color input[type="color"]').evaluate((el) => { el.value = "#654321"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  await expect(hex).toHaveValue("#654321");
  await page.evaluate(() => { document.getElementById("color").modelValue = "#abc"; });
  await expect(hex).toHaveValue("#aabbcc");
  await reset(page);
  await expect(hex).toHaveValue("#123456");
});

test("color picker converts green and blue HSL, rejects seven digits and normalizes opaque alpha", async ({ page }) => {
  await mount(page, '<form><kima-color-picker id="color" name="color" model-value="#00ff80"></kima-color-picker></form>');
  const hex = page.locator('#color input[type="text"]');
  await expect(page.locator('#color output')).toContainText('HSL 150°, 100%, 50%');
  await hex.fill('#8000ff');
  await expect(page.locator('#color output')).toContainText('HSL 270°, 100%, 50%');
  await hex.fill('#abcdef7');
  expect(await hex.evaluate(el => el.checkValidity())).toBe(false);
  expect((await updates(page, 'color')).at(-1)).toBe('#8000ff');
  await hex.fill('#abcdef80');
  expect(await data(page)).toEqual([['color', '#abcdef80']]);
  await hex.fill('#abcdefff');
  await expect(hex).toHaveValue('#abcdef');
  expect(await data(page)).toEqual([['color', '#abcdef']]);
  expect(await hex.evaluate(el => el.checkValidity())).toBe(true);
  await page.locator('#color').evaluate(el => { el.modelValue = '#00ff81'; });
  const area = page.locator('.kima-color-picker__area');
  await expect(hex).toHaveValue('#00ff81');
  await expect(area).toHaveAttribute('aria-valuetext', 'S 100%, V 100%');
  const before = await area.getAttribute('aria-valuetext');
  await area.press('ArrowLeft');
  const after = await area.getAttribute('aria-valuetext');
  expect(before).toBe('S 100%, V 100%');
  expect(after).toBe('S 99%, V 100%');
});

for (const state of ['disabled', 'readonly']) {
  test(`color picker ${state} prevents pointer and keyboard HSV mutations and resumes cleanly`, async ({ page }) => {
    await mount(page, `<form><kima-color-picker id="color" name="color" ${state} model-value="#61afef"></kima-color-picker></form>`);
    const sliders = page.locator('#color [role="slider"]');
    const snapshot = () => page.locator('#color').evaluate(el => ({
      output: el.querySelector('output').textContent,
      hex: el.querySelector('input[type=text]').value,
      sliders: [...el.querySelectorAll('[role=slider]')].map(slider => [slider.getAttribute('aria-valuenow'), slider.getAttribute('aria-valuetext'), slider.querySelector('span').getAttribute('style')]),
    }));
    const before = await snapshot();
    for (const slider of await sliders.all()) {
      await expect(slider).toHaveAttribute(`aria-${state}`, 'true');
      await slider.dispatchEvent('pointerdown', { pointerId: 1, clientX: 0, clientY: 0 });
      await slider.dispatchEvent('pointermove', { buttons: 1, clientX: 100, clientY: 100 });
      for (const key of ['ArrowLeft', 'ArrowUp', 'Home', 'End']) await slider.dispatchEvent('keydown', { key });
    }
    expect(await snapshot()).toEqual(before);
    expect(await updates(page, 'color')).toEqual([]);
    expect(await data(page)).toEqual(state === 'disabled' ? [] : [['color', '#61afef']]);
    await page.locator('#color').evaluate((el, state) => { el[state] = false; }, state);
    await page.locator('#color .kima-color-picker__hue').press('Home');
    await expect(page.locator('#color output')).toContainText('HSL 0°');
    expect(await updates(page, 'color')).toHaveLength(1);
  });
}

test("file selection validates size/type/count and removal changes real FileList", async ({ page }) => {
  await mount(page, '<form><kima-file-upload id="files" name="files" accept=".txt" multiple max-size="5" max-files="2" required></kima-file-upload></form>');
  await page.evaluate(() => { window.rejected = []; document.getElementById("files").addEventListener("reject", (event) => window.rejected.push(event.detail[0].reason)); });
  await page.locator('#files input[type="file"]').setInputFiles([
    { name: "ok.txt", mimeType: "text/plain", buffer: Buffer.from("ok") },
    { name: "big.txt", mimeType: "text/plain", buffer: Buffer.from("too large") },
    { name: "bad.png", mimeType: "image/png", buffer: Buffer.from("x") },
    { name: "two.txt", mimeType: "text/plain", buffer: Buffer.from("ok") },
    { name: "three.txt", mimeType: "text/plain", buffer: Buffer.from("ok") },
  ]);
  expect(await data(page)).toEqual([["files", "ok.txt"], ["files", "two.txt"]]);
  expect(await page.evaluate(() => window.rejected)).toEqual(["size", "accept", "count"]);
  await page.getByRole("button", { name: "移除 ok.txt" }).click();
  expect(await data(page)).toEqual([["files", "two.txt"]]);
  await page.evaluate(() => { document.getElementById("files").modelValue = [new File(["x"], "external.txt", { type: "text/plain" })]; });
  expect(await data(page)).toEqual([["files", "external.txt"]]);
  await reset(page);
  await expect(page.locator("#files li")).toHaveCount(0);
  expect(await page.locator('#files input').evaluate((el) => el.checkValidity())).toBe(false);
});

test("file drag and drop updates native submission", async ({ page }) => {
  await mount(page, '<form><kima-file-upload id="files" name="files" accept=".txt"></kima-file-upload></form>');
  await page.locator("#files .kima-file-upload__drop").evaluate((el) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(["hello"], "dropped.txt", { type: "text/plain" }));
    el.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
  });
  expect(await data(page)).toEqual([["files", "dropped.txt"]]);
});

test("toggle is pressed button not switch and submits only when selected", async ({ page }) => {
  await mount(page, '<form><kima-toggle id="toggle" name="bold" label="粗体">粗体</kima-toggle></form>');
  const button = page.getByRole("button", { name: "粗体" });
  await button.press("Space");
  await expect(button).toHaveAttribute("aria-pressed", "true");
  expect(await data(page)).toEqual([["bold", "on"]]);
  await button.press("Enter");
  await expect(button).toHaveAttribute("aria-pressed", "false");
  expect(await data(page)).toEqual([]);
  await page.evaluate(() => { document.getElementById("toggle").modelValue = true; });
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await reset(page);
  await expect(button).toHaveAttribute("aria-pressed", "false");
});

test("native select supports multiple typed values, disabled options and reset", async ({ page }) => {
  await mount(page, '<form><kima-native-select id="native" name="choice" label="选择" multiple required></kima-native-select></form>', { native: { options, modelValue: ["a"] } });
  const select = page.locator("#native select");
  await select.selectOption(["a", "c"]);
  expect(await data(page)).toEqual([["choice", "a"], ["choice", "c"]]);
  await page.evaluate(() => { document.getElementById("native").modelValue = ["c"]; });
  await expect(select).toHaveValues(["c"]);
  await reset(page);
  await expect(select).toHaveValues(["a"]);
  await page.evaluate(() => { document.getElementById("native").disabled = true; });
  expect(await data(page)).toEqual([]);
});

test("field appends descriptions, updates error and preserves child error semantics", async ({ page }) => {
  await mount(page, '<kima-field id="field" hint="辅助"><kima-text-field id="child" label="邮箱" hint="原有说明"></kima-text-field></kima-field><kima-field id="other" error="容器错误"><input aria-label="已有错误" aria-invalid="grammar" aria-describedby="external"></kima-field><p id="external">已有说明</p>');
  const input = page.locator("#child input");
  await expect(input).toHaveAccessibleDescription("原有说明 辅助");
  await page.evaluate(() => { document.getElementById("field").error = "错误"; });
  await expect(input).toHaveAccessibleDescription("原有说明 错误");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await page.evaluate(() => { document.getElementById("field").error = ""; });
  await expect(input).not.toHaveAttribute("aria-invalid");
  await expect(page.locator("#other input")).toHaveAttribute("aria-invalid", "grammar");
  await expect(page.locator("#other input")).toHaveAccessibleDescription("已有说明 容器错误");
});

test("disabled controls neither mutate nor submit", async ({ page }) => {
  await mount(page, '<form><kima-textarea id="text" name="text" disabled model-value="text"></kima-textarea><kima-number-field id="number" name="n" disabled model-value="2"></kima-number-field><kima-tags-input id="tags" name="tags" disabled></kima-tags-input><kima-pin-input name="pin" disabled></kima-pin-input><kima-color-picker name="color" disabled></kima-color-picker><kima-toggle name="toggle" disabled model-value></kima-toggle><kima-radio-group id="radio" name="radio" disabled></kima-radio-group><kima-checkbox-group id="checks" name="checks" disabled></kima-checkbox-group><kima-rating name="score" disabled model-value="2"></kima-rating><kima-file-upload name="file" disabled></kima-file-upload><kima-native-select id="native" name="select" disabled></kima-native-select></form>', { tags: { modelValue: ["tag"] }, radio: { options, modelValue: "a" }, checks: { options, modelValue: ["a"] }, native: { options, modelValue: "a" } });
  expect(await data(page)).toEqual([]);
  for (const control of await page.locator("form input:not([type=hidden]), form textarea, form button, form select").all()) await expect(control).toBeDisabled();
});

test("uncommitted tag draft cannot satisfy required", async ({ page }) => {
  await mount(page, '<form><kima-tags-input label="标签" required></kima-tags-input></form>');
  const input = page.locator('input[type="text"]');
  await input.fill("只是草稿");
  expect(await page.locator("form").evaluate((form) => form.checkValidity())).toBe(false);
  await input.press("Enter");
  expect(await page.locator("form").evaluate((form) => form.checkValidity())).toBe(true);
});

test("prevented reset preserves edits", async ({ page }) => {
  await mount(page, '<form><kima-textarea id="text" name="text" model-value="初始"></kima-textarea></form>');
  await page.locator("textarea").fill("保留");
  await page.evaluate(() => { document.querySelector("form").addEventListener("reset", (event) => event.preventDefault()); document.querySelector("form").reset(); });
  await expect(page.locator("textarea")).toHaveValue("保留");
});

test("Vue demos render one article and models update then reset", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.evaluate(async () => {
    const { mountInputExamples } = await import("/tests/input-fixture.js");
    mountInputExamples();
  });
  await expect(page.locator("article.kima-gallery__demo")).toHaveCount(1);
  await page.getByRole("textbox", { name: "备注" }).fill("Vue 更新");
  await expect(page.locator("output").first()).toHaveText("Vue 更新");
  await page.getByRole("button", { name: "重置" }).click();
  await expect(page.getByRole("textbox", { name: "备注" })).toHaveValue("一段可以继续编辑的备注。");
  for (const slug of slugs) {
    await page.evaluate((slug) => { window.demoSlug.value = slug; }, slug);
    await expect(page.locator("article.kima-gallery__demo")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "读取表单" })).toBeVisible();
    await page.screenshot({ path: `shots/input-expansion/${testInfo.project.name}-${slug}.png`, fullPage: true });
  }
  await page.evaluate(async () => {
    const { applyPalette } = await import("/src/utils/theme.js");
    applyPalette("#61afef", { isDark: false });
  });
  for (const slug of slugs) {
    await page.evaluate((slug) => { window.demoSlug.value = slug; }, slug);
    await expect(page.getByRole("button", { name: "读取表单" })).toBeVisible();
    await page.screenshot({ path: `shots/input-expansion/${testInfo.project.name}-${slug}-light.png`, fullPage: true });
  }
  await page.evaluate(() => { window.demoApp.unmount(); });
  expect(errors).toEqual([]);
});
