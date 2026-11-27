/* 最小回归：入口注册、真实点击、弹层关闭、表单值。
 * 视觉、间距、排版和中间帧由人工截图审查，不在这里堆自动化用例。 */
import { test, expect } from "@playwright/test";

test("core smoke: entries, real click, dialog escape, select value", async ({ page }) => {
  await page.goto("/tests/smoke-fixture.html");
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");

  const missing = await page.evaluate(() =>
    ["button", "dialog", "radio-group", "select"].filter((name) => !customElements.get(`kima-${name}`))
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
  // 弹层进场是 350ms bounce 动画（M3E 官方复刻），等动画稳定后再点选项，
  // 否则点击会命中 scaleY 动画中的移动目标。
  await page.waitForTimeout(450);
  await page.getByRole("option", { name: "Beta" }).click();
  expect(await page.evaluate(() => [...new FormData(document.getElementById("f"))])).toEqual([["v", "b"]]);

  /* 单选组：M3E 复刻后结构、四态、表单值、宿主 hover 一起回归。 */
  await page.evaluate(() =>
    window.smoke.mount('<form id="rf"><kima-radio-group id="r" name="size" label="Size" orientation="horizontal"></kima-radio-group></form>', {
      r: {
        modelValue: "s",
        options: [
          { value: "s", label: "Small" },
          { value: "m", label: "Medium" },
          { value: "l", label: "Large" },
          { value: "x", label: "Extra", disabled: true },
        ],
      },
    })
  );
  const radio = page.locator("#r .kima-radio-group__item").nth(1);
  await expect(radio).toBeVisible();
  const geometry = await page.evaluate(() => {
    const group = document.getElementById("r");
    const items = [...group.querySelectorAll(".kima-radio-group__item")];
    const base = items[0].querySelector(".kima-radio-group__base");
    const inner = items[0].querySelector(".kima-radio-group__inner");
    return {
      bases: items.map((x) => x.querySelector(".kima-radio-group__base").getBoundingClientRect().width),
      touch: items[0].querySelector(".kima-radio-group__touch").getBoundingClientRect().width,
      icon: items[0].querySelector(".kima-radio-group__wrapper").getBoundingClientRect().width,
      inner: inner.getBoundingClientRect().width,
      unselected: getComputedStyle(items[1].querySelector(".kima-radio-group__base")).color,
      selected: getComputedStyle(base).color,
      disabled: getComputedStyle(items[3].querySelector(".kima-radio-group__base")).color,
      innerOpacity: getComputedStyle(inner).opacity,
    };
  });
  expect(geometry.bases).toEqual([40, 40, 40, 40]);
  expect(geometry.touch).toBe(48);
  expect(geometry.icon).toBe(20);
  expect(geometry.inner).toBe(10);
  expect(geometry.innerOpacity).toBe("1");
  expect(geometry.selected).not.toBe(geometry.unselected);
  expect(geometry.disabled).toContain("0.38");

  /* hover 由宿主 label 驱动：鼠标停在文字上，40px 光圈也要亮。
   * 输入框盖满整行（原生语义层），Playwright 的可操作性检查会拒绝停在文字上，
   * 所以按坐标移动真实鼠标——与人工操作一致。 */
  const text = await radio.locator(".kima-radio-group__label").boundingBox();
  await page.mouse.move(text.x + text.width / 2, text.y + text.height / 2);
  /* 状态层换色是官方 medium1 = 250ms，等过渡落定再读。 */
  await page.waitForTimeout(320);
  const hoverLayer = await page.evaluate(() => {
    const items = [...document.querySelectorAll("#r .kima-radio-group__item")];
    return items.map((x) => getComputedStyle(x.querySelector(".kima-radio-group__state-layer")).backgroundColor);
  });
  expect(hoverLayer[0]).toBe("rgba(0, 0, 0, 0)");
  expect(hoverLayer[1]).toContain("0.08");

  /* 真实点击换选 + 表单值跟随。 */
  await radio.click();
  expect(await page.evaluate(() => [...new FormData(document.getElementById("rf"))])).toEqual([["size", "m"]]);

  /* 键盘：ArrowDown 从 m 到 l，并跳过禁用项。 */
  await page.evaluate(() => document.querySelector('#r input[tabindex="0"]').focus());
  await page.keyboard.press("ArrowDown");
  expect(await page.evaluate(() => [...new FormData(document.getElementById("rf"))])).toEqual([["size", "l"]]);
});
