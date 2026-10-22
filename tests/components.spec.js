// Run with pnpm exec playwright test. All native fixtures use /src/elements.js.
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/fixture.html");
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
});

async function mount(page, html, properties = {}) {
  await page.evaluate(([html, properties]) => window.fixture.mount(html, properties), [html, properties]);
}

async function events(page, id, type) {
  return page.evaluate(([id, type]) => window.fixture.events.filter((event) => event.id === id && event.type === type), [id, type]);
}

test("one native click emits once and submits once", async ({ page }) => {
  await mount(page, '<form id="form"><kima-button id="save" type="submit">Save</kima-button><kima-icon-button id="icon" label="Action"></kima-icon-button></form>');
  await page.evaluate(() => {
    window.submits = 0;
    document.getElementById("form").addEventListener("submit", (event) => { event.preventDefault(); window.submits++; });
  });
  await page.locator("#save button").click();
  expect(await events(page, "save", "click")).toHaveLength(1);
  expect(await page.evaluate(() => window.submits)).toBe(1);
  await page.locator("#icon button").click();
  expect(await events(page, "icon", "click")).toHaveLength(1);
  expect(await page.evaluate(() => window.submits)).toBe(1);
});

test("native default slot labels render in switch, card and badge", async ({ page }) => {
  await mount(page, `<kima-switch id="native-switch">Sync</kima-switch>
    <kima-card id="native-card"><span>Card body</span></kima-card>
    <kima-badge id="native-badge">New</kima-badge>`);
  await expect(page.locator("#native-switch .kima-switch__label")).toHaveText("Sync");
  await expect(page.locator("#native-card .kima-card__body")).toHaveText("Card body");
  await expect(page.locator("#native-badge")).toHaveText("New");
});

test("native button, icon button and card clicks are one real MouseEvent", async ({ page }) => {
  await mount(page, `<kima-button id="native-button">Save</kima-button>
    <kima-icon-button id="native-icon" label="Action"></kima-icon-button>
    <kima-card id="native-click-card" clickable>Open</kima-card>`);
  await page.locator("#native-button button").click();
  await page.locator("#native-icon button").click();
  await page.locator("#native-click-card .kima-card").click();
  for (const id of ["native-button", "native-icon", "native-click-card"]) {
    const clickEvents = await events(page, id, "click");
    expect(clickEvents).toHaveLength(1);
    expect(clickEvents[0].mouseEvent).toBe(true);
  }
});

test("custom element host ids are not duplicated on internal elements", async ({ page }) => {
  await mount(page, `<kima-button id="button">Button</kima-button>
    <kima-icon-button id="icon" label="Icon"></kima-icon-button>
    <kima-badge id="badge">Badge</kima-badge>
    <kima-progress id="progress" value="20"></kima-progress>
    <kima-checkbox id="checkbox">Check</kima-checkbox>
    <kima-switch id="switch">Switch</kima-switch>
    <kima-slider id="slider"></kima-slider>
    <kima-table id="table"></kima-table>
    <kima-menu id="menu"></kima-menu>
    <kima-dialog id="dialog"></kima-dialog>
    <kima-card id="card">Card</kima-card>
    <kima-divider id="divider"></kima-divider>
    <kima-layout id="layout">Layout</kima-layout>
    <kima-button-group id="group"></kima-button-group>
    <kima-tooltip id="tooltip" text="Hint">Trigger</kima-tooltip>`);
  for (const id of ["button", "icon", "badge", "progress", "checkbox", "switch", "slider", "table", "menu", "dialog", "card", "divider", "layout", "group", "tooltip"]) {
    await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
  }
});

test("slider clamps displayed value when model and bounds are out of range", async ({ page }) => {
  await mount(page, '<kima-slider id="slider" min="10" max="100" model-value="200" show-value></kima-slider>');
  await expect(page.locator("#slider input")).toHaveValue("100");
  await expect(page.locator("#slider output")).toHaveText("100");
  await page.evaluate(() => { document.getElementById("slider").max = 50; });
  await expect(page.locator("#slider input")).toHaveValue("50");
  await expect(page.locator("#slider output")).toHaveText("50");
});

test("layout max width uses border-box sizing", async ({ page }) => {
  await mount(page, '<kima-layout id="layout" max-width="320">Content</kima-layout>');
  await expect(page.locator("#layout > .kima-layout")).toHaveCSS("max-width", "320px");
  await expect(page.locator("#layout > .kima-layout")).toHaveCSS("box-sizing", "border-box");
});

test("native form controls use their field names and enforce required", async ({ page }) => {
  await mount(page, `<form id="form">
    <kima-text-field id="text" name="email" label="Email" required></kima-text-field>
    <kima-checkbox id="check" name="terms" label="Terms" value="yes" required></kima-checkbox>
    <kima-switch id="switch" name="sync" value="enabled" required>Sync</kima-switch>
    <kima-slider id="slider" name="volume" label="Volume" model-value="25"></kima-slider>
    <kima-select id="select" name="country" label="Country" required></kima-select>
  </form>`, { select: { items: [{ value: "cn", label: "China" }] } });
  const validity = () => page.evaluate(() => [...document.getElementById("form").elements].filter((el) => el.name).map((el) => [el.name, el.validity.valid]));
  expect(await validity()).toEqual([["email", false], ["terms", false], ["sync", false], ["volume", true], ["country", false]]);
  await page.locator("#text input").fill("person@example.test");
  await page.locator("#check input").check();
  await page.locator("#switch input").check();
  await page.locator("#select .kima-select__trigger").click();
  await page.getByRole("option", { name: "China" }).click();
  expect(await page.evaluate(() => document.getElementById("form").checkValidity())).toBe(true);
  expect(await page.evaluate(() => Object.fromEntries(new FormData(document.getElementById("form"))))).toEqual({ email: "person@example.test", terms: "yes", sync: "enabled", volume: "25", country: "cn" });
  expect(await events(page, "select", "change")).toHaveLength(1);
});

for (const [tag, attributes, input, changed, initial] of [
  ["text-field", 'label="Text" model-value="initial"', "input", "changed", "initial"],
  ["checkbox", 'label="Check" model-value', "input", false, true],
  ["switch", 'model-value', "input", false, true],
  ["slider", 'label="Volume" model-value="25"', "input", "26", "25"],
]) {
  test(`${tag} native reset restores UI and form value`, async ({ page }) => {
    await mount(page, `<form id="form"><kima-${tag} id="field" name="field" ${attributes}>Field</kima-${tag}><button type="reset">Reset</button></form>`);
    const control = page.locator(`#field ${input}`);
    if (typeof changed === "boolean") await control.uncheck();
    else if (tag === "slider") await control.press("ArrowRight");
    else await control.fill(changed);
    await page.getByRole("button", { name: "Reset" }).click();
    if (typeof initial === "boolean") await expect(control).toBeChecked();
    else await expect(control).toHaveValue(initial);
    // A subsequent render must not resurrect the stale pre-reset local state.
    await page.evaluate(() => { document.getElementById("field").disabled = true; });
    await expect(control).toBeDisabled();
    await page.evaluate(() => { document.getElementById("field").disabled = false; });
    if (typeof initial === "boolean") await expect(control).toBeChecked();
    else await expect(control).toHaveValue(initial);
  });
}

test("select placeholder is empty, required, clearable and resettable", async ({ page }) => {
  await mount(page, '<form id="form"><kima-select id="select" name="choice" label="Choice" required clearable></kima-select><button type="reset">Reset</button></form>', { select: { items: [{ value: 0, label: "Zero" }, { value: 1, label: "One" }] } });
  const native = page.locator("#select select");
  await expect(native.locator("option").first()).toHaveAttribute("value", "");
  await expect(native).toHaveValue("");
  expect(await native.evaluate((el) => el.validity.valueMissing)).toBe(true);
  await page.evaluate(() => document.getElementById("form").reportValidity());
  await expect(page.locator("#select .kima-select__trigger")).toBeFocused();
  await page.locator("#select .kima-select__trigger").click();
  await page.getByRole("option", { name: "Zero" }).click();
  await expect(native).toHaveValue("0");
  expect((await events(page, "select", "change"))[0].detail).toEqual([0]);
  await page.getByRole("button", { name: "清除选择" }).click();
  await expect(native).toHaveValue("");
  expect((await events(page, "select", "change"))[1].detail).toEqual([null]);
  await page.locator("#select .kima-select__trigger").click();
  await page.getByRole("option", { name: "One" }).click();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(native).toHaveValue("");
  await expect(page.locator("#select .kima-select__trigger")).toContainText("请选择");
  expect(await native.evaluate((el) => el.validity.valueMissing)).toBe(true);
});

test("select reset preserves its initial numeric value and respects cancellation", async ({ page }) => {
  await mount(page, '<form id="form"><kima-select id="select" name="choice" label="Choice" clearable></kima-select><button type="reset">Reset</button></form>', { select: { modelValue: 0, items: [{ value: 0, label: "Zero" }, { value: 1, label: "One" }] } });
  await page.locator("#select .kima-select__trigger").click();
  await page.getByRole("option", { name: "One" }).click();
  await page.evaluate(() => document.getElementById("form").addEventListener("reset", (event) => event.preventDefault(), { once: true }));
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.locator("#select select")).toHaveValue("1");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.locator("#select select")).toHaveValue("0");
  await expect(page.locator("#select .kima-select__trigger")).toContainText("Zero");
});

test("select object values retain identity in events but form submission is a string", async ({ page }) => {
  await mount(page, '<form id="form"><kima-select id="select" name="choice" label="Choice"></kima-select></form>', { select: { items: [{ value: { id: 7 }, label: "Object" }] } });
  await page.locator("#select .kima-select__trigger").click();
  await page.getByRole("option", { name: "Object" }).click();
  expect((await events(page, "select", "change"))[0].detail).toEqual([{ id: 7 }]);
  expect(await page.evaluate(() => window.fixture.events.find((event) => event.type === "change").detail[0] === document.getElementById("select").items[0].value)).toBe(true);
  expect(await page.evaluate(() => new FormData(document.getElementById("form")).get("choice"))).toBe("[object Object]");
  await page.locator("#select .kima-select__trigger").click();
  await expect(page.getByRole("option", { name: "Object" })).toHaveAttribute("aria-selected", "true");
});

test("select filtering and keyboard skip disabled options", async ({ page }) => {
  await mount(page, '<kima-select id="select" label="Choice" searchable></kima-select><button id="after">After</button>', { select: { items: [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta", disabled: true }, { value: "c", label: "Gamma", description: "Last" }] } });
  const trigger = page.locator("#select .kima-select__trigger");
  await trigger.press("ArrowDown");
  const search = page.getByRole("combobox", { name: "搜索选项" });
  await expect(search).toBeFocused();
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(trigger).toContainText("Gamma");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await search.fill("No match");
  await expect(page.getByRole("option")).toHaveCount(0);
  await search.fill("last");
  await expect(page.getByRole("option")).toHaveCount(1);
  await search.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await search.press("Tab");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(page.locator("#after")).toBeFocused();
});

test("date picker selects ISO dates and disables days outside min/max", async ({ page }) => {
  await mount(page, '<kima-date-picker id="date" label="Date" locale="en-GB" min="2024-02-10" max="2024-02-20"></kima-date-picker>', { date: { modelValue: "2024-02-15" } });
  const picker = page.locator("#date");
  const trigger = picker.getByRole("combobox");
  await expect(trigger).toContainText("15 February 2024");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(picker.getByRole("button", { name: "9 February 2024", exact: true })).toBeDisabled();
  await expect(picker.getByRole("button", { name: "21 February 2024", exact: true })).toBeDisabled();
  await expect(picker.getByRole("button", { name: "10 February 2024", exact: true })).toBeEnabled();
  await expect(picker.getByRole("button", { name: "20 February 2024", exact: true })).toBeEnabled();
  await expect(picker.getByRole("button", { name: "Previous month" })).toBeDisabled();
  await expect(picker.getByRole("button", { name: "Next month" })).toBeDisabled();
  await picker.getByRole("button", { name: "20 February 2024", exact: true }).click();
  await expect(picker.locator("input")).toHaveValue("2024-02-20");
  await expect(trigger).toContainText("20 February 2024");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
  await expect(picker.getByRole("grid")).toHaveCount(0);
  expect((await events(page, "date", "update:modelValue")).map((event) => event.detail)).toEqual([["2024-02-20"]]);
  expect((await events(page, "date", "change")).map((event) => event.detail)).toEqual([["2024-02-20"]]);
  await trigger.click();
  await expect(picker.locator('[role="gridcell"][aria-selected="true"] button')).toHaveAccessibleName("20 February 2024");
  await picker.getByRole("button", { name: "20 February 2024", exact: true }).click();
  expect(await events(page, "date", "change")).toHaveLength(1);
  expect(await events(page, "date", "update:modelValue")).toHaveLength(1);
});

test("date picker arrows cross months, clamp to bounds and Escape returns focus", async ({ page }) => {
  await mount(page, '<kima-date-picker id="date" label="Date" locale="en-GB" min="2024-02-28" max="2024-03-07"></kima-date-picker>', { date: { modelValue: "2024-02-29" } });
  const picker = page.locator("#date");
  const trigger = picker.getByRole("combobox");
  await trigger.press("ArrowDown");
  await expect(picker.getByRole("button", { name: "29 February 2024", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(picker.getByRole("button", { name: "1 March 2024", exact: true })).toBeFocused();
  await expect(picker.locator(".kima-date-picker__month")).toHaveText("March 2024");
  await page.keyboard.press("ArrowDown");
  await expect(picker.getByRole("button", { name: "7 March 2024", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(picker.getByRole("button", { name: "7 March 2024", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(picker.getByRole("button", { name: "29 February 2024", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(picker.getByRole("button", { name: "28 February 2024", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(picker.getByRole("button", { name: "28 February 2024", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(picker.getByRole("grid")).toHaveCount(0);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
  await expect(picker.locator("input")).toHaveValue("2024-02-29");
  expect(await events(page, "date", "change")).toHaveLength(0);
  expect(await events(page, "date", "update:modelValue")).toHaveLength(0);
  expect((await events(page, "date", "update:open")).map((event) => event.detail)).toEqual([[true], [false]]);
});

for (const initial of [null, "2024-02-15"]) {
  test(`date picker required FormData and reset restore ${initial || "empty"}`, async ({ page }) => {
    await mount(page, '<form id="form"><kima-date-picker id="date" name="birthday" label="Birthday" locale="en-GB" min="2024-02-10" max="2024-02-20" required></kima-date-picker><button type="reset">Reset</button></form>', { date: { modelValue: initial } });
    const picker = page.locator("#date");
    const native = picker.locator("input");
    const trigger = picker.getByRole("combobox");
    await expect(native).toHaveValue(initial || "");
    expect(await native.evaluate((el) => el.validity.valueMissing)).toBe(initial === null);
    expect(await page.evaluate(() => new FormData(document.getElementById("form")).get("birthday"))).toBe(initial || "");
    if (initial === null) {
      await page.evaluate(() => document.getElementById("form").reportValidity());
      await expect(trigger).toBeFocused();
    }
    await trigger.click();
    await picker.getByRole("button", { name: "20 February 2024", exact: true }).click();
    await expect(native).toHaveValue("2024-02-20");
    expect(await page.evaluate(() => document.getElementById("form").checkValidity())).toBe(true);
    expect(await page.evaluate(() => Object.fromEntries(new FormData(document.getElementById("form"))))).toEqual({ birthday: "2024-02-20" });
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(native).toHaveValue(initial || "");
    await expect(trigger).toContainText(initial ? "15 February 2024" : "Select date");
    expect(await native.evaluate((el) => el.validity.valueMissing)).toBe(initial === null);
    expect(await page.evaluate(() => new FormData(document.getElementById("form")).get("birthday"))).toBe(initial || "");
    expect((await events(page, "date", "update:modelValue")).map((event) => event.detail)).toEqual([["2024-02-20"], [initial]]);
    expect(await events(page, "date", "change")).toHaveLength(1);
    // A later render must keep the reset value rather than resurrecting the selection.
    await page.evaluate(() => { document.getElementById("date").disabled = true; });
    await expect(native).toBeDisabled();
    await page.evaluate(() => { document.getElementById("date").disabled = false; });
    await expect(native).toBeEnabled();
    await expect(native).toHaveValue(initial || "");
    await expect(trigger).toContainText(initial ? "15 February 2024" : "Select date");
  });
}

test("tree expands and collapses nested levels without selecting them", async ({ page }) => {
  await mount(page, '<kima-tree id="tree" selectable></kima-tree>', { tree: { items: [
    { value: "docs", label: "Docs", children: [{ value: "guides", label: "Guides", children: [{ value: "start", label: "Getting started" }] }, { value: "readme", label: "README" }] },
    { value: "other", label: "Other" },
  ] } });
  const tree = page.locator("#tree");
  const docs = tree.getByRole("treeitem").filter({ hasText: "Docs" });
  const guides = tree.getByRole("treeitem").filter({ hasText: "Guides" });
  await expect(tree.getByRole("treeitem")).toHaveCount(2);
  await expect(docs).toHaveAttribute("aria-expanded", "false");
  await tree.getByRole("button", { name: "展开 Docs", exact: true }).click();
  await expect(docs).toHaveAttribute("aria-expanded", "true");
  await expect(tree.getByRole("treeitem")).toHaveCount(4);
  await expect(guides).toHaveAttribute("aria-level", "2");
  await tree.getByRole("button", { name: "展开 Guides", exact: true }).click();
  await expect(guides).toHaveAttribute("aria-expanded", "true");
  await expect(tree.getByRole("treeitem", { name: "Getting started", exact: true })).toHaveAttribute("aria-level", "3");
  await expect(tree.getByRole("treeitem")).toHaveCount(5);
  await tree.getByRole("button", { name: "收起 Docs", exact: true }).click();
  await expect(docs).toHaveAttribute("aria-expanded", "false");
  await expect(tree.getByRole("treeitem")).toHaveCount(2);
  await tree.getByRole("button", { name: "展开 Docs", exact: true }).click();
  await expect(tree.getByRole("treeitem")).toHaveCount(5);
  await tree.getByRole("button", { name: "收起 Guides", exact: true }).click();
  await expect(guides).toHaveAttribute("aria-expanded", "false");
  await expect(tree.getByRole("treeitem", { name: "Getting started", exact: true })).toHaveCount(0);
  await expect(tree.locator('[role="treeitem"][aria-selected="true"]')).toHaveCount(0);
  expect(await events(page, "tree", "update:modelValue")).toHaveLength(0);
});

test("tree single selection is local and external updates do not echo events", async ({ page }) => {
  await mount(page, '<kima-tree id="tree" selectable></kima-tree>', { tree: { modelValue: "b", items: [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }] } });
  const alpha = page.locator("#tree").getByRole("treeitem", { name: "Alpha", exact: true });
  const beta = page.locator("#tree").getByRole("treeitem", { name: "Beta", exact: true });
  await expect(beta).toHaveAttribute("aria-selected", "true");
  await alpha.click();
  await expect(alpha).toHaveAttribute("aria-selected", "true");
  await expect(beta).toHaveAttribute("aria-selected", "false");
  await alpha.click();
  expect((await events(page, "tree", "update:modelValue")).map((event) => event.detail)).toEqual([["a"]]);
  await page.evaluate(() => { document.getElementById("tree").modelValue = "a"; });
  await expect(alpha).toHaveAttribute("aria-selected", "true");
  await page.evaluate(() => { document.getElementById("tree").modelValue = "b"; });
  await expect(beta).toHaveAttribute("aria-selected", "true");
  await expect(alpha).toHaveAttribute("aria-selected", "false");
  expect(await events(page, "tree", "update:modelValue")).toHaveLength(1);
  await beta.press("Space");
  expect(await events(page, "tree", "update:modelValue")).toHaveLength(1);
  await alpha.press("Enter");
  await expect(alpha).toHaveAttribute("aria-selected", "true");
  expect((await events(page, "tree", "update:modelValue")).map((event) => event.detail)).toEqual([["a"], ["a"]]);
});

test("tree multiple selection toggles locally and skips disabled nodes", async ({ page }) => {
  await mount(page, '<kima-tree id="tree" selectable multiple></kima-tree>', { tree: { modelValue: ["hidden"], items: [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta", disabled: true }, { value: "c", label: "Gamma" }] } });
  const tree = page.locator("#tree");
  const alpha = tree.getByRole("treeitem", { name: "Alpha", exact: true });
  const beta = tree.getByRole("treeitem", { name: "Beta", exact: true });
  const gamma = tree.getByRole("treeitem", { name: "Gamma", exact: true });
  await expect(tree.getByRole("tree")).toHaveAttribute("aria-multiselectable", "true");
  await expect(beta).toHaveAttribute("aria-disabled", "true");
  await alpha.click();
  await alpha.press("ArrowDown");
  await expect(gamma).toBeFocused();
  await gamma.press("Space");
  await expect(alpha).toHaveAttribute("aria-selected", "true");
  await expect(gamma).toHaveAttribute("aria-selected", "true");
  await beta.press("Enter");
  await expect(beta).toHaveAttribute("aria-selected", "false");
  await alpha.click();
  await expect(alpha).toHaveAttribute("aria-selected", "false");
  expect((await events(page, "tree", "update:modelValue")).map((event) => event.detail)).toEqual([[["hidden", "a"]], [["hidden", "a", "c"]], [["hidden", "c"]]]);
  await page.evaluate(() => { document.getElementById("tree").modelValue = ["a"]; });
  await expect(alpha).toHaveAttribute("aria-selected", "true");
  await expect(gamma).toHaveAttribute("aria-selected", "false");
  expect(await events(page, "tree", "update:modelValue")).toHaveLength(3);
});

test("tree keyboard expands, enters children, returns to parents and navigates visible nodes", async ({ page }) => {
  await mount(page, '<kima-tree id="tree" selectable></kima-tree>', { tree: { items: [
    { value: "docs", label: "Docs", children: [{ value: "blocked", label: "Blocked", disabled: true }, { value: "readme", label: "README" }] },
    { value: "other", label: "Other" },
  ] } });
  const tree = page.locator("#tree");
  const docs = tree.getByRole("treeitem").filter({ hasText: "Docs" });
  const readme = tree.getByRole("treeitem", { name: "README", exact: true });
  const other = tree.getByRole("treeitem", { name: "Other", exact: true });
  await expect(docs).toHaveAttribute("tabindex", "0");
  await docs.press("ArrowRight");
  await expect(docs).toHaveAttribute("aria-expanded", "true");
  await expect(docs).toBeFocused();
  await docs.press("ArrowRight");
  await expect(readme).toBeFocused();
  await expect(readme).toHaveAttribute("tabindex", "0");
  await readme.press("ArrowLeft");
  await expect(docs).toBeFocused();
  await docs.press("End");
  await expect(other).toBeFocused();
  await other.press("ArrowUp");
  await expect(readme).toBeFocused();
  await readme.press("ArrowDown");
  await expect(other).toBeFocused();
  await other.press("Home");
  await expect(docs).toBeFocused();
  await docs.press("ArrowLeft");
  await expect(docs).toHaveAttribute("aria-expanded", "false");
  await expect(tree.getByRole("treeitem")).toHaveCount(2);
  await expect(docs).toBeFocused();
  expect(await events(page, "tree", "update:modelValue")).toHaveLength(0);
});

test("pagination starts on modelValue with boundary pages and ellipses", async ({ page }) => {
  await mount(page, '<kima-pagination id="pagination" total="200" page-size="10"></kima-pagination>', { pagination: { modelValue: 10 } });
  const pagination = page.locator("#pagination");
  const pages = pagination.getByRole("button", { name: /^第 \d+ 页$/ });
  await expect(pages).toHaveText(["1", "9", "10", "11", "20"]);
  await expect(pagination.locator('[aria-current="page"]')).toHaveAccessibleName("第 10 页");
  await expect(pagination.locator(".kima-pagination__ellipsis")).toHaveCount(2);
  await expect(pagination.locator(".kima-pagination__ellipsis").first()).toHaveAttribute("aria-hidden", "true");
  await pagination.getByRole("button", { name: "第 1 页", exact: true }).click();
  await expect(pages).toHaveText(["1", "2", "20"]);
  await expect(pagination.getByRole("button", { name: "上一页", exact: true })).toBeDisabled();
  await expect(pagination.getByRole("button", { name: "下一页", exact: true })).toBeEnabled();
  await expect(pagination.locator(".kima-pagination__ellipsis")).toHaveCount(1);
  await pagination.getByRole("button", { name: "第 20 页", exact: true }).click();
  await expect(pages).toHaveText(["1", "19", "20"]);
  await expect(pagination.getByRole("button", { name: "下一页", exact: true })).toBeDisabled();
  await expect(pagination.getByRole("button", { name: "上一页", exact: true })).toBeEnabled();
  await expect(pagination.locator('[aria-current="page"]')).toHaveAccessibleName("第 20 页");
  expect((await events(page, "pagination", "change")).map((event) => event.detail)).toEqual([[1], [20]]);
  expect((await events(page, "pagination", "update:modelValue")).map((event) => event.detail)).toEqual([[1], [20]]);
});

test("pagination changes locally once and keyboard focus does not change the page", async ({ page }) => {
  await mount(page, '<kima-pagination id="pagination" total="50" page-size="10"></kima-pagination>', { pagination: { modelValue: 2 } });
  const pagination = page.locator("#pagination");
  await pagination.getByRole("button", { name: "下一页", exact: true }).click();
  await expect(pagination.locator('[aria-current="page"]')).toHaveAccessibleName("第 3 页");
  await pagination.getByRole("button", { name: "第 3 页", exact: true }).click();
  expect(await events(page, "pagination", "change")).toHaveLength(1);
  await pagination.getByRole("button", { name: "第 3 页", exact: true }).press("ArrowRight");
  await expect(pagination.getByRole("button", { name: "第 4 页", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(pagination.getByRole("button", { name: "第 3 页", exact: true })).toBeFocused();
  await page.keyboard.press("End");
  await expect(pagination.getByRole("button", { name: "第 5 页", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(pagination.getByRole("button", { name: "第 5 页", exact: true })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(pagination.getByRole("button", { name: "第 1 页", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(pagination.getByRole("button", { name: "第 1 页", exact: true })).toBeFocused();
  await expect(pagination.locator('[aria-current="page"]')).toHaveAccessibleName("第 3 页");
  expect(await events(page, "pagination", "change")).toHaveLength(1);
  await page.keyboard.press("Enter");
  await expect(pagination.locator('[aria-current="page"]')).toHaveAccessibleName("第 1 页");
  await pagination.getByRole("button", { name: "下一页", exact: true }).click();
  await pagination.getByRole("button", { name: "上一页", exact: true }).click();
  await expect(pagination.locator('[aria-current="page"]')).toHaveAccessibleName("第 1 页");
  expect((await events(page, "pagination", "change")).map((event) => event.detail)).toEqual([[3], [1], [2], [1]]);
  expect((await events(page, "pagination", "update:modelValue")).map((event) => event.detail)).toEqual([[3], [1], [2], [1]]);
  await page.evaluate(() => { document.getElementById("pagination").modelValue = 4; });
  await expect(pagination.locator('[aria-current="page"]')).toHaveAccessibleName("第 4 页");
  expect(await events(page, "pagination", "change")).toHaveLength(4);
  expect(await events(page, "pagination", "update:modelValue")).toHaveLength(4);
});

test("pagination keyboard focus skips ellipses without selecting another page", async ({ page }) => {
  await mount(page, '<kima-pagination id="pagination" total="200" page-size="10"></kima-pagination>', { pagination: { modelValue: 10 } });
  const pagination = page.locator("#pagination");
  await pagination.getByRole("button", { name: "第 1 页", exact: true }).press("ArrowRight");
  await expect(pagination.getByRole("button", { name: "第 9 页", exact: true })).toBeFocused();
  await pagination.getByRole("button", { name: "第 11 页", exact: true }).press("ArrowRight");
  await expect(pagination.getByRole("button", { name: "第 20 页", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(pagination.getByRole("button", { name: "第 11 页", exact: true })).toBeFocused();
  await expect(pagination.locator('[aria-current="page"]')).toHaveAccessibleName("第 10 页");
  expect(await events(page, "pagination", "change")).toHaveLength(0);
  expect(await events(page, "pagination", "update:modelValue")).toHaveLength(0);
});

test("pagination disabled, empty and single-page states prevent navigation", async ({ page }) => {
  await mount(page, '<kima-pagination id="disabled" total="50" disabled></kima-pagination><kima-pagination id="empty" total="0"></kima-pagination><kima-pagination id="single" total="1"></kima-pagination>', { disabled: { modelValue: 3 } });
  const disabled = page.locator("#disabled");
  await expect(disabled.getByRole("navigation")).toHaveAttribute("aria-disabled", "true");
  await expect(disabled.locator('[aria-current="page"]')).toHaveAccessibleName("第 3 页");
  for (const button of await disabled.getByRole("button").all()) {
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute("tabindex", "-1");
  }
  await expect(page.locator("#empty").getByRole("navigation")).toHaveCount(0);
  await expect(page.locator("#empty").getByRole("button")).toHaveCount(0);
  const single = page.locator("#single");
  await expect(single.getByRole("button", { name: /^第 \d+ 页$/ })).toHaveText(["1"]);
  await expect(single.getByRole("button", { name: "上一页", exact: true })).toBeDisabled();
  await expect(single.getByRole("button", { name: "下一页", exact: true })).toBeDisabled();
  await expect(single.locator(".kima-pagination__ellipsis")).toHaveCount(0);
  await single.getByRole("button", { name: "第 1 页", exact: true }).click();
  expect(await events(page, "single", "change")).toHaveLength(0);
  expect(await events(page, "single", "update:modelValue")).toHaveLength(0);
  // Enabling the same host must preserve its initial page without a model roundtrip.
  await page.evaluate(() => { document.getElementById("disabled").disabled = false; });
  await disabled.getByRole("button", { name: "下一页", exact: true }).click();
  await expect(disabled.locator('[aria-current="page"]')).toHaveAccessibleName("第 4 页");
  expect((await events(page, "disabled", "change")).map((event) => event.detail)).toEqual([[4]]);
});

test("date picker and pagination host ids stay unique after internal updates", async ({ page }) => {
  await mount(page, '<kima-date-picker id="date" label="Date" locale="en-GB"></kima-date-picker><kima-pagination id="pagination" total="30"></kima-pagination>', { date: { modelValue: "2024-02-15" }, pagination: { modelValue: 2 } });
  for (const id of ["date", "pagination"]) {
    await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
  }
  await page.locator("#date").getByRole("combobox").click();
  await page.locator("#date").getByRole("button", { name: "16 February 2024", exact: true }).click();
  await page.locator("#pagination").getByRole("button", { name: "第 3 页", exact: true }).click();
  for (const id of ["date", "pagination"]) {
    await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
  }
});

for (const orientation of ["horizontal", "vertical"]) {
  test(`tabs ${orientation} show a short indicator and keep hover text readable`, async ({ page }) => {
    await mount(page, `<kima-tabs id="tabs" orientation="${orientation}"></kima-tabs>`, {
      tabs: { items: [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta", disabled: true }, { value: "c", label: "Gamma" }] },
    });
    const tabs = page.locator("#tabs [role=tab]");
    const selected = tabs.first();
    // 覆盖灰度和彩色主题，避免只在一种配色里看着正常。
    for (const seed of ["#ffffff", "#61afef"]) {
      for (const isDark of [true, false]) {
        await page.evaluate(async ({ seed, isDark }) => {
          const { applyPalette } = await import("/src/utils/theme.js");
          applyPalette(seed, { isDark, variant: seed === "#ffffff" ? "monochrome" : "tonal-spot" });
          document.body.style.background = "var(--kima-color-surface)";
        }, { seed, isDark });
        await page.mouse.move(0, 0);
        await page.waitForTimeout(200);
        const color = await selected.evaluate((element) => getComputedStyle(element).color);
        await selected.hover();
        await page.waitForTimeout(200);
        await expect(selected).toHaveCSS("color", color);
        for (const tab of [selected, tabs.last()]) {
          await tab.hover();
          await page.waitForTimeout(200);
          const contrast = await tab.evaluate((element) => {
            // 用画布合成真实的透明层，再算文字与背景的对比度。
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 1;
            const context = canvas.getContext("2d");
            const style = getComputedStyle(element);
            context.fillStyle = getComputedStyle(document.body).backgroundColor;
            context.fillRect(0, 0, 1, 1);
            for (const node of [element.parentElement, element]) {
              context.fillStyle = getComputedStyle(node).backgroundColor;
              context.fillRect(0, 0, 1, 1);
            }
            const background = context.getImageData(0, 0, 1, 1).data;
            context.fillStyle = style.color;
            context.fillRect(0, 0, 1, 1);
            const foreground = context.getImageData(0, 0, 1, 1).data;
            const luminance = (rgb) => Array.from(rgb).slice(0, 3).map((value) => {
              const channel = value / 255;
              return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
            }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
            const values = [luminance(background), luminance(foreground)];
            return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
          });
          expect(contrast).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
    const marker = page.locator("#tabs .kima-tabs__marker");
    const markerStyle = await marker.evaluate((element) => ({
      width: parseFloat(getComputedStyle(element).width),
      height: parseFloat(getComputedStyle(element).height),
      transitionProperty: getComputedStyle(element).transitionProperty,
    }));
    expect(markerStyle).toMatchObject(orientation === "horizontal" ? { width: 40, height: 4 } : { width: 4, height: 24 });
    expect(markerStyle.transitionProperty).toContain("transform");
    await selected.press(orientation === "horizontal" ? "ArrowRight" : "ArrowDown");
    await expect(tabs.last()).toBeFocused();
    await expect(tabs.last()).toHaveAttribute("aria-selected", "true");
    await expect(page.locator('#tabs [role="tabpanel"][aria-hidden="true"]')).toHaveCount(2);
    await expect(page.locator('#tabs [role="tabpanel"][aria-hidden="true"]:not([inert])')).toHaveCount(0);
    await expect(page.locator('#tabs [role="tabpanel"]:not([aria-hidden="true"])')).toHaveCount(1);
    await tabs.last().press("Home");
    await expect(selected).toBeFocused();
    await expect(selected).toHaveAttribute("aria-selected", "true");
  });
}

test("menu tabs and groups respond without event roundtrips", async ({ page }) => {
  const items = [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta", disabled: true }, { value: "c", label: "Gamma" }];
  await mount(page, '<kima-menu id="menu"></kima-menu><kima-tabs id="tabs"></kima-tabs><kima-button-group id="group" multiple></kima-button-group>', { menu: { items }, tabs: { items }, group: { items } });
  await page.locator("#menu .kima-menu__trigger").click();
  await expect(page.locator("#menu [role=menu]")).toBeVisible();
  await page.locator("#menu [role=menuitemradio]").filter({ hasText: "Gamma" }).click();
  await expect(page.locator("#menu [role=menu]")).toHaveCount(0);
  await expect(page.locator("#menu .kima-menu__trigger")).toContainText("Gamma");
  await page.locator("#tabs [role=tab]").first().press("ArrowRight");
  await expect(page.locator("#tabs [role=tab]").last()).toHaveAttribute("aria-selected", "true");
  await page.locator("#group button").first().click();
  await page.locator("#group button").last().click();
  await expect(page.locator("#group .kima-button-group__item--selected")).toHaveCount(2);
  expect((await events(page, "group", "change")).at(-1).detail).toEqual([["a", "c"]]);
  await page.locator("#group button").first().click();
  expect((await events(page, "group", "change")).at(-1).detail).toEqual([["c"]]);
});

test("dialog traps Tab, closes on Escape and returns focus", async ({ page }) => {
  await mount(page, '<button id="launch">Open</button><kima-dialog id="dialog" title="Confirm"><button id="first" autofocus>First</button><button id="last">Last</button></kima-dialog>');
  await page.evaluate(() => document.getElementById("launch").addEventListener("click", () => { document.getElementById("dialog").open = true; }));
  await page.locator("#launch").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("#first")).toBeFocused();
  await page.locator("#last").focus();
  await page.keyboard.press("Tab");
  await expect(page.locator("#dialog .kima-dialog__close")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#last")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("#launch")).toBeFocused();
  expect(await events(page, "dialog", "close")).toHaveLength(1);
});

test("dialog Escape closes once and independently restores launcher focus", async ({ page }) => {
  await mount(page, '<button id="launch">Open</button><kima-dialog id="dialog" title="Confirm"><button id="first" autofocus>First</button></kima-dialog>');
  await page.evaluate(() => document.getElementById("launch").addEventListener("click", () => { document.getElementById("dialog").open = true; }));
  await page.locator("#launch").click();
  await expect(page.locator("#first")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("#launch")).toBeFocused();
  expect((await events(page, "dialog", "close"))[0].detail).toEqual(["escape"]);
  expect(await events(page, "dialog", "close")).toHaveLength(1);
});

test("dialog backdrop dims with blur and fades out instead of vanishing", async ({ page }) => {
  await mount(page, '<button id="launch">Open</button><kima-dialog id="dialog" title="Confirm"></kima-dialog>');
  await page.evaluate(() => document.getElementById("launch").addEventListener("click", () => { document.getElementById("dialog").open = true; }));
  await page.locator("#launch").click();
  const dialog = page.locator("#dialog dialog");
  await expect(dialog).toBeVisible();

  const readBackdrop = () => dialog.evaluate((el) => {
    const style = getComputedStyle(el, "::backdrop");
    return {
      opacity: Number(style.opacity),
      filter: style.backdropFilter || style.webkitBackdropFilter || "",
      duration: style.transitionDuration,
      properties: style.transitionProperty,
    };
  });

  // 等遮罩的入场过渡播完再断言，否则读到的是中间帧（比如 0.74）。
  await expect.poll(async () => (await readBackdrop()).opacity).toBe(1);
  // 打开状态：遮罩不透明，且带模糊（背后内容要退成背景）。
  const opened = await readBackdrop();
  expect(opened.opacity).toBe(1);
  expect(opened.filter).toContain("blur");
  // 遮罩必须自己带 opacity 过渡——缺了它关闭时遮罩会瞬间消失（用户报过的 bug）。
  expect(opened.properties).toContain("opacity");
  expect(parseFloat(opened.duration)).toBeGreaterThan(0);

  // 关闭过程中采样：遮罩应该出现"半透明"的中间帧，而不是一步跳到 0。
  await page.keyboard.press("Escape");
  const samples = await dialog.evaluate((el) => {
    const frames = [];
    return new Promise((resolve) => {
      const step = () => {
        frames.push(Number(getComputedStyle(el, "::backdrop").opacity));
        if (frames.length >= 10) resolve(frames);
        else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  });
  // 至少有一帧落在 0 和 1 之间：说明它是渐变下去的，不是"啪"一下没了。
  expect(samples.some((value) => value > 0 && value < 1)).toBe(true);
});

test("drawer opens modal, traps Tab, closes on Escape and restores focus", async ({ page }) => {
  await mount(page, '<button id="launch">Open</button><kima-drawer id="drawer" title="Sheet"><button id="first" autofocus>First</button><button id="last">Last</button></kima-drawer>');
  await page.evaluate(() => document.getElementById("launch").addEventListener("click", () => { document.getElementById("drawer").open = true; }));
  await page.locator("#launch").click();
  const panel = page.locator("#drawer dialog");
  await expect(panel).toBeVisible();
  await expect(page.locator("#first")).toBeFocused();
  await page.locator("#last").focus();
  await page.keyboard.press("Tab");
  await expect(page.locator("#drawer .kima-drawer__close")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#last")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(page.locator("#launch")).toBeFocused();
  expect((await events(page, "drawer", "close"))[0].detail).toEqual(["escape"]);
});

test("drawer enters from its own side, not from the middle", async ({ page }) => {
  // 三个方向必须各自从"自己那一侧"进来：
  // 右边从屏右、左边从屏左、底部从屏下。全都从中间往外滑就成了另一种东西。
  // 这条测试读的是面板相对视口的位置，不是 CSS 里的字面值。
  for (const [placement, name] of [["bottom", "下"], ["right", "右"], ["left", "左"]]) {
    await mount(page, `<button id="launch">Open</button><kima-drawer id="drawer" placement="${placement}" title="Sheet"><p>Body</p></kima-drawer>`);
    await page.evaluate(() => document.getElementById("launch").addEventListener("click", () => { document.getElementById("drawer").open = true; }));

    // 装好观察器再点：抓打开后的第一帧位置。
    await page.evaluate(() => {
      window.__first = null;
      const watch = () => {
        const panel = document.querySelector("dialog.kima-drawer[open] .kima-drawer__panel");
        if (panel) {
          window.__first = panel.getBoundingClientRect().toJSON();
          return;
        }
        requestAnimationFrame(watch);
      };
      requestAnimationFrame(watch);
    });
    await page.locator("#launch").click();
    await page.waitForTimeout(120);

    const first = await page.evaluate(() => window.__first);
    const viewport = page.viewportSize();
    let startOutside;
    if (placement === "right") startOutside = first.x >= viewport.width;
    else if (placement === "left") startOutside = first.x + first.width <= 1;
    else startOutside = first.y >= viewport.height;
    expect(startOutside, `${name}侧抽屉的第一帧应当还在屏幕外（first=${JSON.stringify(first)}）`).toBe(true);

    // 落位后必须贴在自己那一侧。
    await page.waitForTimeout(600);
    const settled = await page.locator("#drawer .kima-drawer__panel").boundingBox();
    if (placement === "right") expect(Math.round(settled.x + settled.width)).toBe(viewport.width);
    else if (placement === "left") expect(Math.round(settled.x)).toBe(0);
    else expect(Math.round(settled.y + settled.height)).toBe(viewport.height);

    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  }
});

for (const placement of ["bottom", "right", "left"]) {
  test(`drawer ${placement} closes once and clips offscreen panels`, async ({ page }) => {
    await mount(page, `<button id="launch">Open</button><kima-drawer id="drawer" placement="${placement}" title="Sheet"><p>Body</p></kima-drawer>`);
    await page.evaluate(() => {
      const drawer = document.getElementById("drawer");
      drawer.addEventListener("update:open", (event) => { drawer.open = event.detail[0]; });
      document.getElementById("launch").addEventListener("click", () => { drawer.open = true; });
    });
    await page.locator("#launch").click();
    await page.waitForTimeout(600);

    // 从关闭触发前采样到完全隐藏之后；open=false 不代表 display 已经是 none。
    const frames = await page.locator("#drawer dialog").evaluate((dialog) => new Promise((resolve) => {
      const panel = dialog.querySelector(".kima-drawer__panel");
      const samples = [];
      const start = performance.now();
      const tick = () => {
        const rect = panel.getBoundingClientRect();
        samples.push({
          open: dialog.open,
          visible: getComputedStyle(dialog).display !== "none",
          x: rect.x, y: rect.y, width: rect.width, height: rect.height,
          gutterX: dialog.offsetWidth - dialog.clientWidth,
          gutterY: dialog.offsetHeight - dialog.clientHeight,
          scrollX: dialog.scrollLeft, scrollY: dialog.scrollTop,
          overflowX: getComputedStyle(dialog).overflowX,
          overflowY: getComputedStyle(dialog).overflowY,
        });
        if (samples.length === 1) dialog.querySelector(".kima-drawer__close").click();
        if (performance.now() - start < 900) requestAnimationFrame(tick);
        else resolve(samples);
      };
      requestAnimationFrame(tick);
    }));

    const visible = frames.filter((frame) => frame.visible);
    expect(visible.length).toBeGreaterThan(3);
    expect(frames.some((frame) => !frame.visible)).toBe(true);
    // 移除 open 后必须立即隐藏，不能再靠离散过渡保留一段可见布局。
    expect(frames.filter((frame) => !frame.open && frame.visible)).toEqual([]);
    for (let index = 0; index < visible.length; index++) {
      const frame = visible[index];
      const previous = visible[index - 1];
      expect(frame.gutterX, "全屏抽屉不应出现纵向滚动条").toBe(0);
      expect(frame.gutterY, "全屏抽屉不应出现横向滚动条").toBe(0);
      expect(frame.scrollX).toBe(0);
      expect(frame.scrollY).toBe(0);
      expect(frame.overflowX).toBe("clip");
      expect(frame.overflowY).toBe("clip");
      if (!previous) continue;
      if (placement === "bottom") expect(frame.y).toBeGreaterThanOrEqual(previous.y - 2);
      else if (placement === "right") expect(frame.x).toBeGreaterThanOrEqual(previous.x - 2);
      else expect(frame.x).toBeLessThanOrEqual(previous.x + 2);
    }
    const last = visible.at(-1);
    const viewport = page.viewportSize();
    if (placement === "bottom") expect(last.y).toBeGreaterThanOrEqual(viewport.height - 2);
    else if (placement === "right") expect(last.x).toBeGreaterThanOrEqual(viewport.width - 2);
    else expect(last.x + last.width).toBeLessThanOrEqual(2);
    expect(await events(page, "drawer", "close")).toHaveLength(1);
    await expect(page.locator("#launch")).toBeFocused();
  });
}

test("drawer clips its fullscreen layer while keeping long content scrollable", async ({ page }) => {
  for (const placement of ["bottom", "right", "left"]) {
    await mount(page, `<button id="launch">Open</button><kima-drawer id="drawer" placement="${placement}" title="Sheet"><div style="height: 2000px">Long body</div><button id="last">Last</button></kima-drawer>`);
    await page.evaluate(() => { document.getElementById("drawer").open = true; });
    await page.waitForTimeout(600);
    const result = await page.locator("#drawer dialog").evaluate((dialog) => {
      const content = dialog.querySelector(".kima-drawer__body");
      const panel = dialog.querySelector(".kima-drawer__panel");
      const scroller = getComputedStyle(content).overflowY === "auto" ? content : panel;
      scroller.scrollTop = 100;
      dialog.scrollTo(100, 100);
      return {
        contentScroll: scroller.scrollTop,
        outerX: dialog.scrollLeft, outerY: dialog.scrollTop,
      };
    });
    expect(result.contentScroll).toBeGreaterThan(0);
    expect(result.outerX).toBe(0);
    expect(result.outerY).toBe(0);
    await page.keyboard.press("Escape");
    await expect(page.locator("#drawer dialog")).toBeHidden();
  }
});

test("drawer keeps its expanded snap height throughout closing", async ({ page }) => {
  await mount(page, '<kima-drawer id="drawer" title="Sheet"><p>Body</p></kima-drawer>', {
    drawer: { snapPoints: [0.4, 0.9] },
  });
  await page.evaluate(() => { document.getElementById("drawer").open = true; });
  await page.waitForTimeout(600);
  const handle = await page.locator("#drawer .kima-drawer__handle").boundingBox();
  const viewport = page.viewportSize();
  const x = handle.x + handle.width / 2;
  await page.mouse.move(x, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(x, handle.y + handle.height / 2 - viewport.height * 0.5, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  const frames = await page.locator("#drawer dialog").evaluate((dialog) => new Promise((resolve) => {
    const panel = dialog.querySelector(".kima-drawer__panel");
    const samples = [];
    const start = performance.now();
    const tick = () => {
      const rect = panel.getBoundingClientRect();
      if (getComputedStyle(dialog).display !== "none") samples.push({ height: rect.height, y: rect.y });
      if (performance.now() - start < 800) requestAnimationFrame(tick);
      else resolve(samples);
    };
    tick();
    dialog.querySelector(".kima-drawer__close").click();
  }));
  expect(frames.length).toBeGreaterThan(3);
  for (const frame of frames) expect(Math.abs(frame.height - viewport.height * 0.9)).toBeLessThanOrEqual(2);
  expect(frames.at(-1).y).toBeGreaterThanOrEqual(viewport.height - 2);
  await expect(page.locator("#drawer dialog")).toBeHidden();
});

test("drawer reopens cleanly right after closing", async ({ page }) => {
  // 关掉之后不进场的残留状态必须被清干净：再打开时还能正常滑进。
  // 这里按 v-model 的语义接住 update:open 写回属性——组件内部关闭时
  // 只负责 emit，宿主不写回的话外部值会一直停在 true，第二次点就"没反应"了。
  await mount(page, '<button id="launch">Open</button><kima-drawer id="drawer" title="Sheet"><p>Body</p></kima-drawer>');
  await page.evaluate(() => {
    const drawer = document.getElementById("drawer");
    drawer.addEventListener("update:open", (event) => { drawer.open = event.detail[0]; });
    document.getElementById("launch").addEventListener("click", () => { drawer.open = true; });
  });
  const isOpen = () => page.locator("#drawer dialog").evaluate((el) => el.open);

  await page.locator("#launch").click();
  await expect(page.locator("#drawer dialog")).toBeVisible();
  await page.waitForTimeout(600);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(700);
  expect(await isOpen()).toBe(false);

  // 再开一次：应当还能滑进来并落位。
  await page.locator("#launch").click();
  await expect(page.locator("#drawer dialog")).toBeVisible();
  await page.waitForTimeout(600);
  const settled = await page.locator("#drawer .kima-drawer__panel").boundingBox();
  const viewport = page.viewportSize();
  expect(Math.round(settled.y + settled.height)).toBe(viewport.height);

  // 第三次也一样（确认状态没有累积）。
  await page.keyboard.press("Escape");
  await page.waitForTimeout(700);
  await page.locator("#launch").click();
  await expect(page.locator("#drawer dialog")).toBeVisible();
  await page.waitForTimeout(600);
  const again = await page.locator("#drawer .kima-drawer__panel").boundingBox();
  expect(Math.round(again.y + again.height)).toBe(viewport.height);
});

test("drawer locks page scroll while open and restores it after", async ({ page }) => {
  await mount(page, '<button id="launch">Open</button><kima-drawer id="drawer" title="Sheet"><p>Body</p></kima-drawer>');
  await page.evaluate(() => document.getElementById("launch").addEventListener("click", () => { document.getElementById("drawer").open = true; }));
  const readRoot = () => page.evaluate(() => ({
    overflowY: document.documentElement.style.overflowY,
    paddingRight: document.documentElement.style.paddingRight,
  }));

  expect((await readRoot()).overflowY).toBe("");
  await page.locator("#launch").click();
  await expect(page.locator("#drawer dialog")).toBeVisible();
  // 打开期间页面不许滚：背景跟着滚会和"遮罩聚焦当前内容"的意图相反。
  expect((await readRoot()).overflowY).toBe("hidden");

  await page.keyboard.press("Escape");
  await expect(page.locator("#drawer dialog")).toBeHidden();
  const restored = await readRoot();
  expect(restored.overflowY).toBe("");
  // 补宽的 padding 也要还原，否则页面会永久偏一点。
  expect(restored.paddingRight).toBe("");
});

test("drawer drag handle snaps back short of the threshold and closes past it", async ({ page }) => {
  await mount(page, '<button id="launch">Open</button><kima-drawer id="drawer" title="Sheet"><p>Body</p></kima-drawer>');
  await page.evaluate(() => document.getElementById("launch").addEventListener("click", () => { document.getElementById("drawer").open = true; }));
  await page.locator("#launch").click();
  const sheet = page.locator("#drawer .kima-drawer__panel");
  const isOpen = () => page.locator("#drawer dialog").evaluate((el) => el.open);
  await expect(page.locator("#drawer dialog")).toBeVisible();

  // 从把手正中起步，往下拖到面板高度的指定比例处松手。
  async function drag(ratio) {
    const handle = await page.locator("#drawer .kima-drawer__handle").boundingBox();
    const panel = await sheet.boundingBox();
    const x = handle.x + handle.width / 2;
    await page.mouse.move(x, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(x, handle.y + panel.height * ratio, { steps: 5 });
    await page.mouse.up();
  }

  // 拖 20%：够不着关闭阈值（40%），松手弹回，不关。
  await drag(0.2);
  // 弹回后内联 transform 应被清掉，且弹回动画（300ms）走完再拖下一次，
  // 否则第二次按下时把手还在半路，会抓空。
  await expect(sheet).toHaveAttribute("style", "");
  await page.waitForTimeout(350);
  expect(await isOpen()).toBe(true);
  expect(await events(page, "drawer", "close")).toHaveLength(0);

  // 拖 60%：过阈值，关闭，reason 是 drag。
  await drag(0.6);
  await expect(page.locator("#drawer dialog")).toBeHidden();
  expect((await events(page, "drawer", "close"))[0].detail).toEqual(["drag"]);
});

test("drawer snap points resize the sheet, snap to the nearest one and stay open", async ({ page }) => {
  await mount(page, '<button id="launch">Open</button><kima-drawer id="drawer" title="Sheet"><p>Body</p></kima-drawer>', {
    drawer: { snapPoints: [0.4, 0.9] },
  });
  await page.evaluate(() => document.getElementById("launch").addEventListener("click", () => { document.getElementById("drawer").open = true; }));
  await page.locator("#launch").click();
  const sheet = page.locator("#drawer .kima-drawer__panel");
  const dialog = page.locator("#drawer dialog");
  await expect(dialog).toBeVisible();
  // 入场是"起点帧 + 下一帧过渡回位"两段，等它落定再量，否则量到中间值。
  await page.waitForTimeout(500);

  // 高度基准读组件真正用的那个值（视口高），跟它自己一致地比较。
  const viewport = await page.evaluate(() => window.innerHeight);
  const near = (actual, expected) => Math.abs(actual - expected) <= 2;
  // 打开时落在第一档（0.4），不是内容高度。
  expect(near((await sheet.boundingBox()).height, viewport * 0.4)).toBe(true);

  async function dragBy(pixels) {
    const handle = await page.locator("#drawer .kima-drawer__handle").boundingBox();
    const x = handle.x + handle.width / 2;
    await page.mouse.move(x, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(x, handle.y + handle.height / 2 - pixels, { steps: 6 });
    await page.mouse.up();
  }

  // 往上拖过中点：吸到第二档（0.9），而且不关闭。
  await dragBy(viewport * 0.5);
  await expect(async () => {
    expect(near((await sheet.boundingBox()).height, viewport * 0.9)).toBe(true);
  }).toPass();
  expect(await dialog.evaluate((el) => el.open)).toBe(true);
  expect(await events(page, "drawer", "close")).toHaveLength(0);

  // 再往下拖回中点以上：吸回第一档。
  await dragBy(-viewport * 0.5);
  await expect(async () => {
    expect(near((await sheet.boundingBox()).height, viewport * 0.4)).toBe(true);
  }).toPass();
  expect(await dialog.evaluate((el) => el.open)).toBe(true);

  // 从第一档再往下拖过它自身高的 40%：这次是关闭。
  await dragBy(-viewport * 0.3);
  await expect(dialog).toBeHidden();
  expect((await events(page, "drawer", "close"))[0].detail).toEqual(["drag"]);
});

test("drawer exposes the active snap point to the caller", async ({ page }) => {
  await mount(page, '<button id="launch">Open</button><kima-drawer id="drawer" title="Sheet"><p>Body</p></kima-drawer>', {
    drawer: { snapPoints: [0.3, 0.75] },
  });
  await page.evaluate(() => document.getElementById("launch").addEventListener("click", () => { document.getElementById("drawer").open = true; }));
  await page.locator("#launch").click();
  await expect(page.locator("#drawer dialog")).toBeVisible();
  // 等入场两段动画落定，把手的位置才是最终值。
  await page.waitForTimeout(500);

  const handle = await page.locator("#drawer .kima-drawer__handle").boundingBox();
  const viewport = await page.evaluate(() => window.innerHeight);
  const x = handle.x + handle.width / 2;
  await page.mouse.move(x, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(x, handle.y + handle.height / 2 - viewport * 0.35, { steps: 6 });
  await page.mouse.up();

  // update:activeSnapPoint 带出新的档位，调用方能拿来做别的（比如换图标、改标题）。
  await expect(async () => {
    const updates = await events(page, "drawer", "update:activeSnapPoint");
    expect(updates.at(-1)?.detail?.[0]).toBe(0.75);
  }).toPass();
});

test("drawer closes from the backdrop unless disabled, and the close button always works", async ({ page }) => {
  // closeOnBackdrop 是 Boolean，原生用法下要写 property；属性串 "false" 会被当成 true。
  await mount(page, '<button id="launch">Open</button><kima-drawer id="drawer" title="Sheet"><p>Body</p></kima-drawer>', { drawer: { closeOnBackdrop: false } });
  await page.evaluate(() => document.getElementById("launch").addEventListener("click", () => { document.getElementById("drawer").open = true; }));
  await page.locator("#launch").click();
  const dialog = page.locator("#drawer dialog");
  await expect(dialog).toBeVisible();

  // 底部抽屉只占下缘，点屏幕顶部落在遮罩上；关掉 closeOnBackdrop 后不关。
  await page.mouse.click(400, 20);
  await expect(dialog).toBeVisible();
  expect(await events(page, "drawer", "close")).toHaveLength(0);

  // 关闭按钮照常工作，即使遮罩点击被关掉。
  await page.locator("#drawer .kima-drawer__close").click();
  await expect(dialog).toBeHidden();
  expect((await events(page, "drawer", "close"))[0].detail).toEqual(["button"]);

  // 换回默认（遮罩可关），点遮罩能关。
  await mount(page, '<button id="launch">Open</button><kima-drawer id="drawer" title="Sheet"><p>Body</p></kima-drawer>');
  await page.evaluate(() => document.getElementById("launch").addEventListener("click", () => { document.getElementById("drawer").open = true; }));
  await page.locator("#launch").click();
  await expect(page.locator("#drawer dialog")).toBeVisible();
  await page.mouse.click(400, 20);
  await expect(page.locator("#drawer dialog")).toBeHidden();
  expect((await events(page, "drawer", "close"))[0].detail).toEqual(["backdrop"]);
});

test("notification title attrs and heading do not fight native title", async ({ page }) => {
  await mount(page, '<kima-notification id="notice" open title="Legacy title" duration="0"></kima-notification>');
  await expect(page.locator("#notice .kima-notification__title")).toHaveText("Legacy title");
  await page.evaluate(() => { document.getElementById("notice").title = "Native update"; });
  await expect(page.locator("#notice .kima-notification__title")).toHaveText("Native update");
  await page.evaluate(() => { document.getElementById("notice").heading = "Heading wins"; });
  await expect(page.locator("#notice .kima-notification__title")).toHaveText("Heading wins");
  expect(await page.locator("#notice").evaluate((el) => el.title)).toBe("Native update");
  await page.getByRole("button", { name: "关闭通知" }).click();
  await expect(page.locator("#notice .kima-notification")).toBeHidden();
  expect((await events(page, "notice", "close"))[0].detail).toEqual(["button"]);
});

test("notification timeout, hover and focus use remaining time", async ({ page }) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await mount(page, '<kima-notification id="notice" open heading="Saved" duration="1000"><button id="action" slot="action">Undo</button></kima-notification><button id="outside">Outside</button>');
  const notice = page.locator("#notice .kima-notification");
  await page.clock.runFor(300);
  // Synthetic mouse events work identically in desktop and touch contexts.
  await notice.dispatchEvent("mouseenter");
  await page.clock.runFor(1200);
  await expect(notice).toBeVisible();
  await page.locator("#action").focus();
  await notice.dispatchEvent("mouseleave");
  await page.clock.runFor(1200);
  await expect(notice).toBeVisible();
  await page.locator("#outside").focus();
  await page.clock.runFor(699);
  await expect(notice).toBeVisible();
  await page.clock.runFor(1);
  // 隐藏前要多推一段：离场过渡由 rAF 推进，时钟被 pausAt 冻结时不推它就不会播完，
  // 元素要等过渡结束才真的 display: none。100ms 是退场时长。
  await page.clock.runFor(200);
  await expect(notice).toBeHidden();
  expect((await events(page, "notice", "close"))[0].detail).toEqual(["timeout"]);
  await page.clock.runFor(2000);
  expect(await events(page, "notice", "close")).toHaveLength(1);
});

test("notification variants keep an opaque background and a semantic icon", async ({ page }) => {
  await mount(page, '<kima-notification id="notice" open heading="Saved" message="Body" duration="0" variant="warning"></kima-notification>');
  const notice = page.locator("#notice .kima-notification");
  await expect(notice).toBeVisible();
  // 通知是浮在页面上的弹层，底必须实色：半透明会把背后内容透上来。
  // 用 getComputedStyle 读回的是解析后的 rgba，alpha 必须为 1。
  const alpha = await notice.evaluate((el) => {
    const [r, g, b, a = 1] = getComputedStyle(el).backgroundColor.match(/[\d.]+/g).map(Number);
    return { r, g, b, a };
  });
  expect(alpha.a).toBe(1);
  // 语义图标要出现（状态不只靠颜色表达）。
  await expect(page.locator("#notice .kima-notification__icon svg")).toHaveCount(1);
  // 三栏都在：图标 / 正文 / 关闭。
  await expect(page.locator("#notice .kima-notification__copy")).toHaveCount(1);
  await expect(page.locator("#notice .kima-notification__close")).toHaveCount(1);

  // neutral 没有语义，不给图标——硬塞一个反而像有话说。
  await page.evaluate(() => { const notice = document.getElementById("notice"); notice.variant = "neutral"; });
  await expect(page.locator("#notice .kima-notification__icon")).toHaveCount(0);
});

test("notification duration changes, zero, reopen and unmount clean up timers", async ({ page }) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await mount(page, '<kima-notification id="notice" open heading="Saved" duration="1000"></kima-notification>');
  await page.clock.runFor(300);
  await page.evaluate(() => { document.getElementById("notice").duration = 0; });
  await page.clock.runFor(2000);
  await expect(page.locator("#notice .kima-notification")).toBeVisible();
  await page.evaluate(() => { document.getElementById("notice").open = false; });
  await page.evaluate(() => { const notice = document.getElementById("notice"); notice.duration = 500; notice.open = true; });
  await page.clock.runFor(499);
  await expect(page.locator("#notice .kima-notification")).toBeVisible();
  await page.clock.runFor(1);
  // 同上：多推一段让离场过渡播完，元素才真的隐藏。
  await page.clock.runFor(200);
  await expect(page.locator("#notice .kima-notification")).toBeHidden();
  await page.evaluate(() => { const notice = document.getElementById("notice"); notice.open = false; });
  await page.evaluate(() => { document.getElementById("notice").open = true; });
  await page.evaluate(() => { document.getElementById("notice").remove(); });
  await page.clock.runFor(2000);
  expect(await events(page, "notice", "close")).toHaveLength(1);
});

test("table with caption paints four rounded corners and remains scrollable", async ({ page }) => {
  // 标题位于表头上方，必须验证有底色的表面，不能只读外壳的 radius。
  await page.setViewportSize({ width: 900, height: 700 });
  await mount(page, '<kima-table id="table" caption="Team members" selectable striped></kima-table>', {
    table: {
      columns: [{ key: "name", label: "Name" }, { key: "role", label: "Role" }],
      rows: [{ id: "a", name: "Alice", role: "Design" }, { id: "b", name: "Bob", role: "Development" }],
      modelValue: ["a", "b"],
    },
  });
  for (const theme of ["dark", "light"]) {
    await page.evaluate((value) => {
      document.documentElement.dataset.kimaTheme = value;
      document.body.style.background = "var(--kima-color-surface)";
    }, theme);
    const table = await page.locator("#table .kima-table").boundingBox();
    const shape = await page.locator("#table").evaluate((host) => ({
      scroll: getComputedStyle(host.querySelector(".kima-table__scroll")).borderRadius,
      caption: getComputedStyle(host.querySelector("caption")).borderRadius,
      head: getComputedStyle(host.querySelector("thead th:first-child")).borderRadius,
      tail: getComputedStyle(host.querySelector("tbody:last-child tr:last-child td:first-child")).borderRadius,
    }));
    expect(shape).toEqual({ scroll: "12px", caption: "0px", head: "0px", tail: "0px" });
    expect(await page.locator("#table th, #table td").evaluateAll((cells) =>
      cells.every((cell) => getComputedStyle(cell).borderBottomWidth === "0px")
    )).toBe(true);
    const image = await page.screenshot({ clip: table, scale: "css" });
    const colors = await page.evaluate(async (base64) => {
      const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d");
      context.drawImage(bitmap, 0, 0);
      const pixel = (x, y) => Array.from(context.getImageData(x, y, 1, 1).data);
      const { width, height } = canvas;
      return {
        corners: [pixel(1, 1), pixel(width - 2, 1), pixel(1, height - 2), pixel(width - 2, height - 2)],
        header: pixel(width / 2, 1),
        bottom: pixel(width / 2, height - 2),
      };
    }, image.toString("base64"));
    expect(colors.corners.every((color) => JSON.stringify(color) === JSON.stringify(colors.corners[0]))).toBe(true);
    expect(colors.header).not.toEqual(colors.corners[0]);
    expect(colors.bottom).not.toEqual(colors.corners[0]);
  }
  await page.setViewportSize({ width: 360, height: 700 });
  await page.locator("#table").evaluate((element) => {
    element.style.display = "block";
    element.style.width = "320px";
  });
  const scroll = page.locator("#table .kima-table__scroll");
  expect(await scroll.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
    return element.scrollLeft;
  })).toBeGreaterThan(0);
  await scroll.focus();
  await expect(scroll).toBeFocused();
});

test("table selection is local, accessible, keyed and externally overridable", async ({ page }) => {
  await mount(page, '<kima-table id="table" selectable row-key="id"></kima-table>', { table: { columns: [{ key: "name", label: "Name" }], rows: [{ id: "a", name: "Alice" }, { id: "b", name: "Bob" }], modelValue: ["hidden"] } });
  const checks = page.locator("#table [role=checkbox]");
  await checks.nth(1).click();
  await expect(checks.nth(1)).toHaveAttribute("aria-checked", "true");
  await expect(checks.first()).toHaveAttribute("aria-checked", "mixed");
  await page.locator("#table tbody tr").last().press("Space");
  await expect(checks.first()).toHaveAttribute("aria-checked", "true");
  expect((await events(page, "table", "update:modelValue")).at(-1).detail).toEqual([["hidden", "a", "b"]]);
  await page.evaluate(() => { document.getElementById("table").rows = [{ id: "b", name: "Bob" }, { id: "a", name: "Alice" }]; });
  await expect(checks.nth(1)).toHaveAttribute("aria-checked", "true");
  await checks.first().click();
  expect((await events(page, "table", "update:modelValue")).at(-1).detail).toEqual([["hidden"]]);
  await page.evaluate(() => { document.getElementById("table").modelValue = ["b"]; });
  await expect(checks.nth(1)).toHaveAttribute("aria-checked", "true");
  await expect(checks.nth(2)).toHaveAttribute("aria-checked", "false");
  expect(await events(page, "table", "row-click")).toHaveLength(0);
});

test("table sorts locally without host roundtrips and controlled state stays authoritative", async ({ page }) => {
  await mount(page, '<kima-table id="table" row-key="id"></kima-table>', { table: { columns: [{ key: "score", label: "Score", sortable: true }], rows: [{ id: "b", score: 20 }, { id: "a", score: 10 }] } });
  const sort = page.locator("#table .kima-table__sort-button");
  const bodyRows = page.locator("#table tbody tr");
  await page.evaluate(() => { window.firstRow = document.querySelector("#table tbody tr"); });
  await sort.click();
  expect((await events(page, "table", "sort-change"))[0].detail).toEqual([{ key: "score", direction: "asc" }]);
  await expect(bodyRows).toHaveText(["10", "20"]);
  expect(await page.evaluate(() => window.firstRow === document.querySelector("#table tbody tr:last-child"))).toBe(true);
  expect(await page.locator('#table').evaluate(table => table.rows.map(row => row.score))).toEqual([20, 10]);
  await expect(page.locator("#table th")).toHaveAttribute("aria-sort", "ascending");
  await sort.click();
  await expect(bodyRows).toHaveText(["20", "10"]);
  expect((await events(page, "table", "sort-change"))[1].detail).toEqual([{ key: "score", direction: "desc" }]);
  await page.locator('#table').evaluate(table => { table.sortKey = 'score'; table.sortDirection = 'asc'; });
  await expect(bodyRows).toHaveText(["10", "20"]);
  await sort.click();
  expect((await events(page, "table", "sort-change"))[2].detail).toEqual([{ key: "score", direction: "desc" }]);
  await expect(bodyRows).toHaveText(["10", "20"]);
  await expect(page.locator("#table th")).toHaveAttribute("aria-sort", "ascending");
  await page.locator('#table').evaluate(table => { table.sortDirection = 'desc'; });
  await expect(bodyRows).toHaveText(["20", "10"]);
  await expect(page.locator("#table th")).toHaveAttribute("aria-sort", "descending");
});

test("table items keeps documented precedence including an empty array", async ({ page }) => {
  await mount(page, '<kima-table id="table"><span slot="empty">Empty items</span></kima-table>', { table: { columns: [{ key: "name", label: "Name" }], rows: [{ id: "a", name: "Alice" }], items: [] } });
  await expect(page.locator("#table tbody").filter({ hasText: "Empty items" })).toHaveText("Empty items");
  await page.evaluate(() => { document.getElementById("table").items = undefined; });
  await expect(page.locator("#table tbody").filter({ hasText: "Alice" })).toHaveText("Alice");
});

test("native empty-state named slots survive whitespace without an icon gap", async ({ page }) => {
  await mount(page, `<kima-empty-state id="empty" title="No results">
    <button slot="action">Create</button>
  </kima-empty-state><kima-empty-state id="icon" title="No results"><span slot="icon">X</span></kima-empty-state>`);
  await expect(page.locator("#empty .kima-empty-state__action button")).toHaveText("Create");
  expect(await page.locator("#empty .kima-empty-state__icon").evaluate((el) => el.getBoundingClientRect().height)).toBe(0);
  await expect(page.locator("#icon .kima-empty-state__icon span")).toHaveText("X");
  expect(await page.locator("#icon .kima-empty-state__icon").evaluate((el) => el.getBoundingClientRect().height)).toBe(48);
});

test("Vue consumers retain v-model, title attrs, scoped slots and component styles", async ({ page }) => {
  await page.evaluate(() => window.fixture.mountVue());
  await page.locator("#vue-button").click();
  await expect(page.locator("#vue-clicks")).toHaveText("1");
  // A grid child is blockified by CSS, so inline-flex computes to flex here.
  expect(["flex", "inline-flex"]).toContain(await page.locator("#vue-button").evaluate((el) => getComputedStyle(el).display));
  await page.locator("#vue-select .kima-select__trigger").click();
  await page.getByRole("option", { name: "Two" }).click();
  await expect(page.locator("#vue-choice")).toHaveText("2");
  await page.locator("#vue-table tbody [role=checkbox]").click();
  await expect(page.locator("#vue-selected")).toHaveText("a");
  await expect(page.locator("#vue-table tbody button").last()).toHaveText("Alice");
  await expect(page.locator("#vue-empty .kima-empty-state__action button")).toHaveText("Create");
  await page.locator("#vue-title").click();
  await expect(page.locator("#vue-notification .kima-notification__title")).toHaveText("Updated title");
  await page.getByRole("button", { name: "关闭通知" }).click();
  await expect(page.locator("#vue-open")).toHaveText("false");

  // 抽屉：Vue 侧的 v-model:open 双向绑定、具名插槽都要跟原生用法一致。
  // Vue 非自定义元素模式下组件根节点就是 dialog 本身（原生模式下它在 shadow DOM 里，
  // 所以那边要写 "#drawer dialog"，这里不用）。
  await page.locator("#vue-drawer-open").click();
  await expect(page.locator("#vue-drawer")).toBeVisible();
  await expect(page.locator("#vue-drawer .kima-drawer__title")).toHaveText("Vue drawer");
  await expect(page.locator("#vue-drawer-state")).toHaveText("true");
  await page.locator("#vue-drawer-close").click();
  await expect(page.locator("#vue-drawer")).toBeHidden();
  await expect(page.locator("#vue-drawer-state")).toHaveText("false");
});

test("IDs stay unique across elements, updates and disconnect/reconnect", async ({ page }) => {
  await mount(page, '<kima-select id="one" label="One"></kima-select><kima-select id="two" label="Two"></kima-select><kima-text-field id="text-one" label="Text one"></kima-text-field><kima-text-field id="text-two" label="Text two"></kima-text-field>');
  const before = await page.locator("[id]").evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(new Set(before).size).toBe(before.length);
  await page.evaluate(async () => {
    const host = document.getElementById("one");
    host.label = "Changed";
    host.remove();
    document.getElementById("fixture").append(host);
    await Promise.resolve();
  });
  const after = await page.locator("[id]").evaluateAll((nodes) => nodes.map((node) => node.id));
  expect([...after].sort()).toEqual([...before].sort());
  // 选择器不画可见标签（跟文本框一致）：label 属性只作可访问名，落在触发器的 aria-label 上。
  expect(await page.locator("#one .kima-select__trigger").getAttribute("aria-label")).toBe("Changed");
});

test("virtual scroll renders a window, scrolls rows and selects with Home End Enter", async ({ page }) => {
  const items = Array.from({ length: 10 }, (_, index) => ({ value: `row-${index}`, label: `Row ${index + 1}` }));
  await mount(page, '<kima-virtual-scroll id="virtual" item-height="40" height="120" overscan="1"></kima-virtual-scroll>', { virtual: { items } });
  const scroll = page.locator("#virtual .kima-virtual-scroll");

  await expect(scroll.locator(".kima-virtual-scroll__item")).toHaveCount(4);
  await expect(scroll.locator(".kima-virtual-scroll__item").first()).toHaveText("Row 1");
  await expect(scroll.locator(".kima-virtual-scroll__spacer")).toHaveCount(2);
  expect(await scroll.locator(".kima-virtual-scroll__content").evaluate((element) => element.style.height)).toBe("400px");
  expect(await scroll.locator(".kima-virtual-scroll__spacer").last().evaluate((element) => element.style.height)).toBe("240px");

  await scroll.evaluate((element) => {
    element.scrollTop = 240;
    element.dispatchEvent(new Event("scroll"));
  });
  await expect(scroll.locator(".kima-virtual-scroll__item").first()).toHaveAttribute("aria-posinset", "6");
  await expect(scroll.locator(".kima-virtual-scroll__item").first()).toHaveText("Row 6");
  expect(await scroll.locator(".kima-virtual-scroll__spacer").first().evaluate((element) => element.style.height)).toBe("200px");
  expect(await scroll.locator(".kima-virtual-scroll__spacer").last().evaluate((element) => element.style.height)).toBe("0px");

  await scroll.focus();
  await scroll.press("End");
  await expect(scroll).toHaveAttribute("aria-activedescendant", /item-9$/);
  await scroll.press("Enter");
  await scroll.press("Home");
  await expect(scroll).toHaveAttribute("aria-activedescendant", /item-0$/);
  await scroll.press("Enter");
  expect((await events(page, "virtual", "update:modelValue")).map((event) => event.detail)).toEqual([["row-9"], ["row-0"]]);
  await expect(page.locator('[id="virtual"]')).toHaveCount(1);
});

test("time picker selects HH:mm within step bounds, handles Escape and resets its required form value", async ({ page }) => {
  await mount(page, '<form id="form"><kima-time-picker id="time" name="start" label="Start" mode="24" min="09:00" max="10:30" step="30" required></kima-time-picker><button type="reset">Reset</button></form>', { time: { modelValue: null } });
  const picker = page.locator("#time");
  const trigger = picker.getByRole("combobox");
  const native = picker.locator(".kima-time-picker__native");

  expect(await native.evaluate((element) => element.validity.valueMissing)).toBe(true);
  expect(await page.evaluate(() => new FormData(document.getElementById("form")).get("start"))).toBe("");
  await trigger.click();
  await expect(picker.getByRole("option", { name: "08", exact: true })).toBeDisabled();
  await expect(picker.getByRole("option", { name: "09", exact: true })).toBeEnabled();
  await expect(picker.getByRole("option", { name: "10", exact: true })).toBeEnabled();
  await expect(picker.getByRole("option", { name: "11", exact: true })).toBeDisabled();
  await expect(picker.getByRole("listbox", { name: "Minute" }).getByRole("option", { name: "00", exact: true })).toBeEnabled();
  await expect(picker.getByRole("listbox", { name: "Minute" }).getByRole("option", { name: "30", exact: true })).toBeEnabled();

  await picker.getByRole("option", { name: "09", exact: true }).press("End");
  await expect(picker.getByRole("option", { name: "10", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("End");
  await expect(picker.getByRole("option", { name: "30", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(native).toHaveValue("10:30");
  expect((await events(page, "time", "change")).map((event) => event.detail[0])).toEqual(["10:30"]);
  expect(await page.evaluate(() => document.getElementById("form").checkValidity())).toBe(true);
  expect(await page.evaluate(() => new FormData(document.getElementById("form")).get("start"))).toBe("10:30");

  await trigger.press("ArrowDown");
  await expect(picker.locator(".kima-time-picker__popup")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(picker.locator(".kima-time-picker__popup")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await events(page, "time", "change")).toHaveLength(1);

  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(native).toHaveValue("");
  await expect(trigger).toContainText("Select time");
  expect(await native.evaluate((element) => element.validity.valueMissing)).toBe(true);
  expect(await page.evaluate(() => new FormData(document.getElementById("form")).get("start"))).toBe("");
  expect((await events(page, "time", "change")).map((event) => event.detail[0])).toEqual(["10:30", null]);
  expect(await events(page, "time", "change")).toHaveLength(2);
});

test("cascader selects a path across columns, clears and resets its last form value", async ({ page }) => {
  const options = [{
    value: "electronics",
    label: "Electronics",
    children: [{
      value: "phones",
      label: "Phones",
      children: [{ value: "android", label: "Android" }, { value: "ios", label: "iOS" }],
    }],
  }, { value: "books", label: "Books" }];
  await mount(page, '<form id="form"><kima-cascader id="cascader" name="category" label="Category" required clearable></kima-cascader><button id="outside" type="button">Outside</button><button type="reset">Reset</button></form>', { cascader: { options, modelValue: ["electronics", "phones", "ios"] } });
  const cascader = page.locator("#cascader");
  const trigger = cascader.getByRole("combobox");
  const native = cascader.locator(".kima-cascader__native");
  const idsAreUnique = () => page.locator("[id]").evaluateAll((nodes) => {
    const ids = nodes.map((node) => node.id);
    return new Set(ids).size === ids.length;
  });

  expect(await idsAreUnique()).toBe(true);
  expect(await page.evaluate(() => new FormData(document.getElementById("form")).get("category"))).toBe("ios");
  await trigger.click();
  await expect(cascader.locator('[role="listbox"]')).toHaveCount(3);
  await cascader.getByRole("option", { name: "Electronics", exact: true }).click();
  await cascader.getByRole("option", { name: "Phones", exact: true }).click();
  await cascader.getByRole("option", { name: "Android", exact: true }).click();
  await expect(trigger).toContainText("Electronics / Phones / Android");
  await expect(native).toHaveValue("android");
  expect((await events(page, "cascader", "change")).map((event) => event.detail[0])).toEqual([
    ["electronics"],
    ["electronics", "phones"],
    ["electronics", "phones", "android"],
  ]);
  expect(await page.evaluate(() => new FormData(document.getElementById("form")).get("category"))).toBe("android");
  expect(await idsAreUnique()).toBe(true);

  // 清除按钮是选完最后一级才出现的：等弹层关掉、按钮稳定下来再点，
  // 否则会在它刚插入、还在做过渡的时候去点，移动端命中判定会失败。
  await expect(cascader.locator(".kima-cascader__popup")).toHaveCount(0);
  const clearButton = cascader.getByRole("button", { name: "清除选择", exact: true });
  await expect(clearButton).toBeVisible();
  await clearButton.click();
  await expect(native).toHaveValue("");
  await expect(trigger).toContainText("请选择");
  expect(await native.evaluate((element) => element.validity.valueMissing)).toBe(true);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(native).toHaveValue("ios");
  await expect(trigger).toContainText("Electronics / Phones / iOS");
  expect(await native.evaluate((element) => element.validity.valid)).toBe(true);
  expect(await page.evaluate(() => new FormData(document.getElementById("form")).get("category"))).toBe("ios");
  expect(await events(page, "cascader", "change")).toHaveLength(4);

  await trigger.press("ArrowDown");
  await expect(cascader.locator('[role="listbox"]')).toHaveCount(3);
  await expect(trigger).toHaveAttribute("aria-activedescendant", /option-/);
  await trigger.press("Escape");
  await expect(cascader.locator('[role="listbox"]')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.locator("#outside").dispatchEvent("pointerdown");
  await expect(cascader.locator('[role="listbox"]')).toHaveCount(0);
  expect(await idsAreUnique()).toBe(true);
});

test("combobox filters, selects once, supports freeSolo and resets keyboard form state", async ({ page }) => {
  await mount(page, '<form id="form"><kima-combobox id="combo" name="country" label="Country" required clearable searchable></kima-combobox><kima-combobox id="free" name="tag" label="Tag" free-solo searchable></kima-combobox><button type="reset">Reset</button></form>', {
    combo: { items: [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }, { value: "g", label: "Gamma" }] },
    free: { items: [] },
  });
  const combo = page.locator("#combo");
  const input = combo.locator(".kima-combobox__input");
  const native = combo.locator(".kima-combobox__native");
  const free = page.locator("#free");
  const freeInput = free.locator(".kima-combobox__input");
  const idsAreUnique = () => page.locator("[id]").evaluateAll((nodes) => {
    const ids = nodes.map((node) => node.id);
    return new Set(ids).size === ids.length;
  });

  expect(await native.evaluate((element) => element.validity.valueMissing)).toBe(true);
  await input.fill("be");
  await expect(combo.getByRole("option")).toHaveCount(1);
  await expect(combo.getByRole("option", { name: "Beta", exact: true })).toBeVisible();
  expect(await idsAreUnique()).toBe(true);
  await combo.getByRole("option", { name: "Beta", exact: true }).click();
  await expect(input).toHaveValue("Beta");
  await expect(native).toHaveValue("b");
  expect((await events(page, "combo", "change")).map((event) => event.detail[0])).toEqual(["b"]);
  await input.click();
  await combo.getByRole("option", { name: "Beta", exact: true }).click();
  expect(await events(page, "combo", "change")).toHaveLength(1);

  await input.fill("ga");
  await expect(combo.getByRole("option", { name: "Gamma", exact: true })).toBeVisible();
  await input.press("Escape");
  await expect(input).toHaveValue("Beta");
  await expect(combo.locator(".kima-combobox__popup")).toHaveCount(0);
  await expect(input).toBeFocused();
  expect(await events(page, "combo", "change")).toHaveLength(1);
  expect(await page.evaluate(() => document.getElementById("form").checkValidity())).toBe(true);
  expect(await page.evaluate(() => Object.fromEntries(new FormData(document.getElementById("form"))))).toEqual({ country: "b", tag: "" });

  await freeInput.fill("Custom");
  await expect(free.locator('[role="status"]')).toHaveCount(1);
  await freeInput.press("Enter");
  await expect(freeInput).toHaveValue("Custom");
  await expect(free.locator(".kima-combobox__native")).toHaveValue("Custom");
  expect((await events(page, "free", "change")).map((event) => event.detail[0])).toEqual(["Custom"]);
  expect(await events(page, "free", "change")).toHaveLength(1);
  expect(await page.evaluate(() => Object.fromEntries(new FormData(document.getElementById("form"))))).toEqual({ country: "b", tag: "Custom" });
  expect(await idsAreUnique()).toBe(true);

  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(input).toHaveValue("");
  await expect(freeInput).toHaveValue("");
  await expect(native).toHaveValue("");
  await expect(free.locator(".kima-combobox__native")).toHaveValue("");
  expect(await native.evaluate((element) => element.validity.valueMissing)).toBe(true);
  expect(await events(page, "combo", "change")).toHaveLength(1);
  expect(await events(page, "free", "change")).toHaveLength(1);
  expect(await idsAreUnique()).toBe(true);
});
