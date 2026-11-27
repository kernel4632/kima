/* Breadcrumb 实测对表：middleware 伺服 fixture + headless 浏览器测量。
 * 用法：node tests/breadcrumb-measure.mjs */
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import http from "node:http";
import { readFile } from "node:fs/promises";

const vite = await createServer({ root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom" });
const server = http.createServer(async (req, res) => {
  if (req.url === "/tests/breadcrumb-fixture.html") {
    res.setHeader("content-type", "text/html");
    res.end(await readFile("tests/breadcrumb-fixture.html", "utf8"));
    return;
  }
  vite.middlewares(req, res);
});
await new Promise((r) => server.listen(5391, r));

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("[pageerror]", e.message.slice(0, 200)));

await page.goto("http://127.0.0.1:5391/tests/breadcrumb-fixture.html", { waitUntil: "domcontentloaded", timeout: 20000 });
await page.waitForSelector("#basic kima-breadcrumb-item", { timeout: 10000 });
await page.waitForTimeout(600);

const data = await page.evaluate(() => {
  const out = {};
  const measure = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, fontSize: cs.fontSize, fontWeight: cs.fontWeight, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, padding: cs.padding, gap: cs.columnGap, radius: cs.borderRadius, color: cs.color };
  };

  const basic = document.getElementById("basic");
  const items = [...basic.querySelectorAll("kima-breadcrumb-item")];
  out.basic = {
    itemButton: measure("#basic kima-breadcrumb-item .kima-breadcrumb-item-button__base"),
    separatorBox: measure("#basic kima-breadcrumb-item .kima-breadcrumb-item__separator"),
    separatorSvg: (() => { const s = document.querySelector("#basic kima-breadcrumb-item .kima-breadcrumb-item__separator svg"); if (!s) return null; const r = s.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), strokeWidth: getComputedStyle(s).strokeWidth, color: getComputedStyle(s).color }; })(),
    currents: items.map((i) => i.getAttribute("data-current")),
    roles: items.map((i) => i.querySelector(".kima-breadcrumb-item-button")?.getAttribute("role")),
    lastCurrent: (() => { const last = items.at(-1); const base = last.querySelector(".kima-breadcrumb-item-button__base"); return { ariaCurrent: base.getAttribute("aria-current"), hasSeparator: !!last.querySelector(".kima-breadcrumb-item__separator"), role: last.querySelector(".kima-breadcrumb-item-button").getAttribute("role"), tabindex: last.querySelector(".kima-breadcrumb-item-button").getAttribute("tabindex"), color: getComputedStyle(base).color, hasTouch: !!last.querySelector(".kima-breadcrumb-item-button__touch"), hasPseudoLink: !!last.querySelector(".kima-breadcrumb-item-button__pseudo-link") }; })(),
    touch: (() => { const t = document.querySelector("#basic kima-breadcrumb-item .kima-breadcrumb-item-button__touch"); return t ? { h: getComputedStyle(t).height, w: getComputedStyle(t).width, rectW: Math.round(t.getBoundingClientRect().width) } : null; })(),
    navRole: basic.querySelector("nav")?.getAttribute("role"),
    listRole: basic.querySelector("ol")?.getAttribute("role"),
    listDisplay: getComputedStyle(basic.querySelector("ol")).display,
  };

  const links = [...document.querySelectorAll("#links kima-breadcrumb-item")];
  out.links = links.map((item) => {
    const btn = item.querySelector(".kima-breadcrumb-item-button");
    const a = item.querySelector(".kima-breadcrumb-item-button__pseudo-link");
    return { role: btn.getAttribute("role"), pseudo: a ? { href: a.getAttribute("href"), target: a.getAttribute("target"), rel: a.getAttribute("rel"), tabindex: a.getAttribute("tabindex"), ariaHidden: a.getAttribute("aria-hidden") } : null, color: getComputedStyle(item.querySelector(".kima-breadcrumb-item-button__base")).color };
  });

  const dis = document.querySelector("#disabled kima-breadcrumb-item");
  out.disabled = (() => { const btn = dis.querySelector(".kima-breadcrumb-item-button"); return { ariaDisabled: btn.getAttribute("aria-disabled"), tabindex: btn.getAttribute("tabindex"), color: getComputedStyle(btn.querySelector(".kima-breadcrumb-item-button__base")).color, role: btn.getAttribute("role") }; })();

  const step = document.querySelectorAll("#disabled kima-breadcrumb-item")[1];
  out.step = (() => { const base = step.querySelector(".kima-breadcrumb-item-button__base"); return { dataCurrent: step.getAttribute("data-current"), ariaCurrent: base.getAttribute("aria-current"), role: step.querySelector(".kima-breadcrumb-item-button").getAttribute("role"), hasSeparator: !!step.querySelector(".kima-breadcrumb-item__separator"), color: getComputedStyle(base).color }; })();

  out.customSep = (() => { const s = document.querySelector("#custom-sep kima-breadcrumb-item .kima-breadcrumb-item__separator"); return s ? { text: s.textContent.trim(), customCount: document.querySelectorAll("#custom-sep .kima-breadcrumb-item__separator-custom").length, hasChevron: !!s.querySelector("svg.kima-breadcrumb-item__separator-icon") } : "none"; })();

  const narrow = [...document.querySelectorAll("#narrow kima-breadcrumb-item")];
  const nowrap = [...document.querySelectorAll("#nowrap kima-breadcrumb-item")];
  out.wrap = {
    wrapLines: new Set(narrow.map((i) => Math.round(i.getBoundingClientRect().top))).size,
    nowrapLines: new Set(nowrap.map((i) => Math.round(i.getBoundingClientRect().top))).size,
    lastCurrent: narrow.at(-1).getAttribute("data-current"),
    truncated: (() => { const last = nowrap.at(-1); const ov = last.querySelector(".kima-breadcrumb-item-button__overflow"); if (!ov) return null; const child = ov.firstElementChild; if (!child) return { child: false }; const cs = getComputedStyle(child); return { textOverflow: cs.textOverflow, whiteSpace: cs.whiteSpace, scrollW: ov.scrollWidth, clientW: ov.clientWidth, clipped: ov.scrollWidth > ov.clientWidth }; })(),
  };

  out.hostAttrs = (() => { const it = document.querySelector("#links kima-breadcrumb-item"); return it.getAttributeNames(); })();

  // icon-only：单个小元素 → 方形收缩 + item-label 可访问名
  const io = document.querySelector("#icon-only kima-breadcrumb-item");
  out.iconOnly = (() => {
    const btn = io.querySelector(".kima-breadcrumb-item-button");
    const base = btn.querySelector(".kima-breadcrumb-item-button__base");
    const r = base.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), ariaLabel: btn.getAttribute("aria-label"), role: btn.getAttribute("role"), classes: btn.className };
  })();

  return out;
});

console.log(JSON.stringify(data, null, 1));
await browser.close();
server.close();
await vite.close();
