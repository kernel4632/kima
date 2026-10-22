/* 最小回归：入口注册、真实点击、弹层关闭、表单值。
 * 视觉、间距、排版和中间帧由人工截图审查，不在这里堆自动化用例。 */
import { test, expect } from "@playwright/test";

test("core smoke: entries, real click, dialog escape, select value", async ({ page }) => {
  await page.goto("/tests/smoke-fixture.html");
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");

  const missing = await page.evaluate(() =>
    ["button", "dialog", "select"].filter((name) => !customElements.get(`kima-${name}`))
  );
  expect(missing).toEqual([]);

  await page.evaluate(() => window.smoke.mount('<kima-button id="b">Save</kima-button>'));
  await page.getByRole("button", { name: "Save" }).click();
  const events = await page.evaluate(() => window.smoke.events);
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({ id: "b", type: "click", mouseEvent: true });

  await page.evaluate(() => window.smoke.mount('<kima-dialog id="d" title="Confirm"><p>Body</p></kima-dialog>'));
  await page.evaluate(() => { document.getElementById("d").open = true; });
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);

  await page.evaluate(() =>
    window.smoke.mount('<form id="f"><kima-select id="s" name="v"></kima-select></form>', {
      s: { modelValue: "a", items: [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }] },
    })
  );
  await page.locator("#s .kima-select__trigger").click();
  await page.getByRole("option", { name: "Beta" }).click();
  expect(await page.evaluate(() => [...new FormData(document.getElementById("f"))])).toEqual([["v", "b"]]);
});
