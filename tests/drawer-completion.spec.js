// 等待真实 CSS 过渡，覆盖暂停、取消、替换、零时长与卸载；不靠延长关闭计时器。
import { test, expect } from "@playwright/test";

async function mount(page, placement = "bottom") {
  await page.goto("/tests/fixture.html");
  await page.waitForFunction(() => window.fixture);
  await page.evaluate((placement) => window.fixture.mount(`<kima-drawer id="drawer" placement="${placement}" title="Sheet"><p>Body</p></kima-drawer>`), placement);
  await page.evaluate(() => {
    const drawer = document.getElementById("drawer");
    drawer.addEventListener("update:open", (event) => { drawer.open = event.detail[0]; });
    drawer.open = true;
  });
  await expect(page.locator("#drawer dialog")).toBeVisible();
  await page.waitForFunction(() => {
    const panel = document.querySelector(".kima-drawer__panel");
    return !document.querySelector(".kima-drawer--entering") && panel.getAnimations().length === 0;
  });
}

async function pauseLeave(page) {
  await page.locator("#drawer dialog").evaluate((dialog) => new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (!dialog.classList.contains("kima-drawer--leaving")) return;
      const slide = dialog.querySelector(".kima-drawer__panel").getAnimations().find((animation) => animation.transitionProperty === "transform");
      slide.pause();
      window.drawerSlide = slide;
      observer.disconnect();
      resolve();
    });
    observer.observe(dialog, { attributes: true, attributeFilter: ["class"] });
    dialog.querySelector("button").click();
  }));
}

for (const placement of ["bottom", "left", "right"]) {
  test(`drawer ${placement} waits for actual transform completion even when paused`, async ({ page }) => {
    await mount(page, placement);
    await pauseLeave(page);
    // 故意超过旧实现的 300ms；暂停中的真实过渡还没有结束，不能关 dialog。
    await page.waitForTimeout(400);
    await expect(page.locator("#drawer dialog")).toHaveAttribute("open", "");
    await expect(page.locator("html")).toHaveCSS("overflow-y", "hidden");
    await page.evaluate(() => window.drawerSlide.finish());
    await expect(page.locator("#drawer dialog")).toBeHidden();
    expect(await page.locator("html").evaluate((root) => root.style.overflowY)).toBe("");
  });
}

test("drawer cancels stale leave when rapidly reopened and waits for replacement transitions", async ({ page }) => {
  await mount(page);
  await pauseLeave(page);
  await page.evaluate(() => { document.getElementById("drawer").open = true; });
  await expect(page.locator("#drawer dialog")).not.toHaveClass(/leaving/);
  await page.waitForTimeout(400);
  await expect(page.locator("#drawer dialog")).toHaveAttribute("open", "");
  await pauseLeave(page);
  await page.evaluate(() => {
    // 改变目标会取消旧过渡并产生新的 CSS transition，不能把拒绝当成退场结束。
    document.querySelector(".kima-drawer__panel").style.transform = "translateY(110vh)";
    document.querySelector(".kima-drawer__panel").getAnimations().forEach((animation) => animation.pause());
  });
  await page.waitForTimeout(400);
  await expect(page.locator("#drawer dialog")).toHaveAttribute("open", "");
  await page.evaluate(() => document.querySelector(".kima-drawer__panel").getAnimations().forEach((animation) => animation.finish()));
  await expect(page.locator("#drawer dialog")).toBeHidden();
});

for (const motion of ["zero", "reduce"]) {
  test(`drawer closes without hanging with ${motion} motion`, async ({ page }) => {
    if (motion === "reduce") await page.emulateMedia({ reducedMotion: "reduce" });
    await mount(page);
    if (motion === "zero") await page.locator(".kima-drawer__panel").evaluate((panel) => { panel.style.transitionDuration = "0s"; });
    await page.locator("#drawer .kima-drawer__close").click();
    await expect(page.locator("#drawer dialog")).toBeHidden();
    expect(await page.locator("html").evaluate((root) => root.style.overflowY)).toBe("");
  });
}

test("drawer unmount during a paused leave releases scroll and invalidates pending work", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await mount(page);
  await pauseLeave(page);
  await page.evaluate(() => {
    window.drawerSlideSettled = false;
    window.drawerSlide.finished.finally(() => { window.drawerSlideSettled = true; }).catch(() => {});
  });
  await page.locator("#drawer").evaluate((drawer) => drawer.remove());
  await expect.poll(() => page.locator("html").evaluate((root) => root.style.overflowY)).toBe("");
  await expect.poll(() => page.evaluate(() => window.drawerSlideSettled)).toBe(true);
  expect(errors).toEqual([]);
});
