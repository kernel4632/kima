import { test, expect } from "@playwright/test";

async function mount(page, html, properties = {}) {
  await page.goto("/tests/fixture.html");
  await page.waitForFunction(() => typeof window.fixture?.mount === "function");
  await page.evaluate(({ html, properties }) => window.fixture.mount(html, properties), { html, properties });
}

async function captureLeave(page, hostSelector, nodeSelector, text, signal = "class") {
  return page.evaluate(({ hostSelector, nodeSelector, text, signal }) => new Promise((resolve) => {
    const host = document.querySelector(hostSelector);
    const observer = new MutationObserver(() => {
      const node = [...host.querySelectorAll(nodeSelector)].find((element) => !text || element.textContent.includes(text));
      if (!node || (signal === "class" && ![...node.classList].some((name) => name.endsWith("-leave-active"))) || (signal === "inert" && !node.inert)) return;
      observer.disconnect();
      const animations = node.getAnimations();
      const styles = getComputedStyle(node);
      const progress = animations.map((animation) => animation.effect?.getComputedTiming().progress).find((value) => value != null);
      resolve({
        className: node.className,
        inert: node.inert,
        ariaHidden: node.getAttribute("aria-hidden"),
        opacity: Number(styles.opacity),
        height: node.getBoundingClientRect().height,
        animated: animations.length > 0 || styles.transitionDuration !== "0s",
        progress,
      });
    });
    observer.observe(host, { subtree: true, childList: true, attributes: true });
  }), { hostSelector, nodeSelector, text, signal });
}

test.describe("shared motion intermediate frames", () => {
  test("collapse animates measured height and reverses without dropping the panel", async ({ page }) => {
    await mount(page, '<kima-collapsible id="collapse"><p>第一行内容</p><p>第二行内容</p></kima-collapsible>');
    const host = page.locator("kima-collapsible#collapse");
    await host.evaluate((element) => { element.open = true; });
    const panel = page.locator("kima-collapsible#collapse [id^=kima-collapsible-]");
    await expect.poll(() => panel.evaluate((element) => element.getAnimations().some((animation) => animation.playState === "running" && animation.currentTime > 0))).toBe(true);
    const opening = await panel.evaluate((element) => ({ height: element.getBoundingClientRect().height, full: element.firstElementChild.getBoundingClientRect().height, animations: element.getAnimations().map((animation) => ({ currentTime: animation.currentTime, progress: animation.effect?.getComputedTiming().progress })) }));
    expect(opening.animations.some(({ progress }) => progress > 0 && progress < 1)).toBe(true);
    expect(opening.full).toBeGreaterThan(0);
    await panel.evaluate((element) => element.getAnimations().forEach((animation) => animation.pause()));
    const reverse = page.evaluate(() => new Promise((resolve) => {
      const panel = document.querySelector("kima-collapsible#collapse [id^=kima-collapsible-]");
      const observer = new MutationObserver(() => {
        if (![...panel.getAnimations()].some((animation) => animation.playState === "running")) return;
        observer.disconnect();
        resolve({ height: panel.getBoundingClientRect().height, inert: panel.inert, hidden: panel.getAttribute("aria-hidden") });
      });
      observer.observe(panel, { attributes: true, attributeFilter: ["style"] });
    }));
    await host.evaluate((element) => { element.open = false; });
    const frame = await reverse;
    expect(frame.height).toBeGreaterThan(0);
    expect(frame.inert).toBe(true);
    expect(frame.hidden).toBe("true");
    await expect(panel).toBeHidden();
  });

  test("tabs have one moving active marker and an actual crossfade", async ({ page }) => {
    await mount(page, '<kima-tabs id="tabs"></kima-tabs>', {
      tabs: { items: [{ value: "one", label: "一", content: "内容一" }, { value: "two", label: "二", content: "内容二" }], modelValue: "one" },
    });
    const host = page.locator("kima-tabs#tabs");
    await host.evaluate((element) => Object.assign(element, { items: [{ value: "one", label: "一", content: "内容一" }, { value: "two", label: "二", content: "内容二" }], modelValue: "one" }));
    const before = await host.locator(".kima-tabs__marker").evaluate((element) => getComputedStyle(element).transform);
    await host.locator(".kima-tabs__tab").nth(1).click();
    await expect.poll(() => host.locator(".kima-tabs__marker").evaluate((element) => getComputedStyle(element).transform)).not.toBe(before);
    const activeMarker = host.locator(".kima-tabs__marker");
    const markerAnimation = await activeMarker.evaluate((element) => element.getAnimations().length);
    expect(markerAnimation).toBeGreaterThan(0);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const panelFrame = await host.locator(".kima-tabs__panel").evaluateAll((elements) => elements.map((element) => ({ opacity: Number(getComputedStyle(element).opacity), inert: element.inert })));
    expect(panelFrame.some(({ opacity }) => opacity > 0 && opacity < 1)).toBe(true);
    expect(panelFrame.some(({ inert }) => inert)).toBe(true);
  });

  test("tag exit remains inert through motion while form values update immediately; tree rows collapse", async ({ page }) => {
    await mount(page, '<kima-tree id="tree"></kima-tree><kima-tags-input id="tags" name="tag"></kima-tags-input>', {
      tree: { items: [{ value: "root", label: "根", children: [{ value: "child", label: "子" }] }], expanded: ["root"] },
      tags: { modelValue: ["alpha", "beta"] },
    });
    await page.evaluate(() => {
      Object.assign(document.querySelector("kima-tree#tree"), { items: [{ value: "root", label: "根", children: [{ value: "child", label: "子" }] }], expanded: ["root"] });
      Object.assign(document.querySelector("kima-tags-input#tags"), { modelValue: ["alpha", "beta"] });
    });
    const leave = captureLeave(page, "kima-tags-input#tags", ".kima-tags-input__tag", "alpha");
    await page.locator("kima-tags-input#tags .kima-tags-input__tag").filter({ hasText: "alpha" }).locator("button").click();
    const tagFrame = await leave;
    expect(tagFrame.inert).toBe(true);
    expect(tagFrame.ariaHidden).toBe("true");
    expect(tagFrame.animated).toBe(true);
    await expect.poll(() => page.locator("kima-tags-input#tags input[type=hidden]").evaluateAll((inputs) => inputs.map((input) => input.value))).toEqual(["beta"]);
    await expect(page.locator("kima-tags-input#tags .kima-tags-input__tag").filter({ hasText: "alpha" })).toHaveCount(0);

    const treeLeave = captureLeave(page, "kima-tree#tree", ".kima-tree__motion-row", "子", "inert");
    await page.locator("kima-tree#tree .kima-tree__item").first().locator(".kima-tree__toggle").click();
    const treeFrame = await treeLeave;
    expect(treeFrame.inert).toBe(true);
    expect(treeFrame.ariaHidden).toBe("true");
    expect(treeFrame.height).toBeGreaterThan(0);
  });

  test("table keeps old data inert while loading and restores it with motion", async ({ page }) => {
    await mount(page, '<kima-table id="table"></kima-table>', {
      table: { columns: [{ key: "name", label: "姓名" }], rows: [{ id: "a", name: "甲" }, { id: "b", name: "乙" }] },
    });
    const table = page.locator("kima-table#table");
    await table.evaluate((element) => Object.assign(element, { columns: [{ key: "name", label: "姓名" }], rows: [{ id: "a", name: "甲" }, { id: "b", name: "乙" }] }));
    const leave = captureLeave(page, "kima-table#table", "tbody", "甲");
    await table.evaluate((element) => { element.loading = true; });
    const frame = await leave;
    expect(frame.inert).toBe(true);
    expect(frame.ariaHidden).toBe("true");
    expect(frame.animated).toBe(true);
    await expect(table.locator("[role=status]")).toBeVisible();
    await table.evaluate((element) => { element.loading = false; });
    await expect.poll(() => table.locator("tbody tr").count()).toBeGreaterThan(0);
  });

  test("skeleton crossfades without replacing the light DOM slot node", async ({ page }) => {
    await mount(page, '<kima-skeleton id="skeleton"><button id="slotted">操作</button></kima-skeleton>');
    const slot = page.locator("kima-skeleton#skeleton #slotted");
    await page.locator("kima-skeleton#skeleton").evaluate((element) => { element.loading = true; });
    await expect(page.locator("kima-skeleton#skeleton .kima-skeleton__content")).toHaveAttribute("aria-hidden", "true");
    await expect.poll(() => page.locator("kima-skeleton#skeleton .kima-skeleton__placeholder").count()).toBe(1);
    await expect(slot).toBeAttached();
    await page.locator("kima-skeleton#skeleton").evaluate((element) => { element.loading = false; });
    await expect(slot).toBeAttached();
    expect(await slot.evaluate((element) => element.id)).toBe("slotted");
  });

  test("reduced motion stops continuous loops and removes transition time", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mount(page, '<kima-spinner id="spinner"></kima-spinner><kima-skeleton id="skeleton" animated></kima-skeleton>');
    expect(await page.locator("kima-spinner#spinner .kima-spinner__ring").evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
    expect(await page.locator("kima-skeleton#skeleton .kima-skeleton__placeholder").evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
    expect(await page.locator("kima-spinner#spinner").evaluate((element) => getComputedStyle(element).transitionDuration)).toBe("0s");
  });
});

test("motion helpers are SSR-safe and expose the shared API", async ({ page }) => {
  await page.goto("/tests/fixture.html");
  const result = await page.evaluate(async () => {
    const module = await import("/src/utils/motion.js");
    return [typeof module.collapseTransition.onEnter, typeof module.presenceTransition.onBeforeLeave];
  });
  expect(result).toEqual(["function", "function"]);
});
