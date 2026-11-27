<!--
  面包屑容器：M3E BreadcrumbElement.ts（166 行）逐行翻译。
  官方双元素结构 m3e-breadcrumb + m3e-breadcrumb-item 保留为
  kima-breadcrumb + kima-breadcrumb-item 两个入口（官方 index.ts 导出两个元素，同构）。

  官方架构决策（照搬）：
    1. 宿主 role="navigation"（Role mixin），内部 .base 再挂 role="list"。
    2. 末项 current 追踪在容器：slotchange 时 querySelectorAll 全量扫描——
       非末项抹 current、末项无 current 则写 current="page"；
       item 增删/移动后语义自动跟随（官方 #handleSlotChange 130-141 逐行）。
    3. 自定义分隔符：separator slot 内容克隆进每个 item（官方 #setSeparator：
       cloneNode(true) + part="separator"；空槽回落默认 chevron）。
    4. wrap 属性 → flex-wrap（官方 :host([wrap]) .base）。

  官网实测对表（2026-11-27）：宿主 display:block 高 40、宽铺满；
  容器 .base role=list display:flex。

  调用示例：
    <kima-breadcrumb>
      <kima-breadcrumb-item href="/">首页</kima-breadcrumb-item>
      <kima-breadcrumb-item>当前页</kima-breadcrumb-item>
    </kima-breadcrumb>
-->
<script setup>
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, provide, ref, useAttrs, useHost } from "vue";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  /* 官方 wrap attribute：item 是否换行。默认单行，current 项省略号截断。 */
  wrap: { type: Boolean, default: false },
});
const attrs = useAttrs();
const isCustomElement = Boolean(getCurrentInstance()?.ce);
const host = isCustomElement ? useHost() : null;
const forwardedAttrs = computed(() => (isCustomElement ? { ...attrs, id: undefined } : attrs));
const root = ref(null);
const separatorSlotRef = ref(null);

/* ---------- item 扫描与 current 追踪（官方 #handleSlotChange 130-141 逐行）----------
 * 官方在 slot 的 slotchange 里 querySelectorAll("m3e-breadcrumb-item")：
 * 非末项抹 current、末项无 current 则写 current="page"、逐项下发分隔符。
 * KIMA 双载体归一（官方单载体，本库有两种挂载方式，语义照抄）：
 *   CE light DOM：宿主子节点被 Vue 搬进 <slot> 所在 <ol>（slot 投影物理迁移），
 *     item 是真正的 kima-breadcrumb-item 自定义元素；
 *   Vue SFC：item 组件渲染内层 <li class="kima-breadcrumb-item">（root ref），
 *     DOM 里没有自定义元素标签。
 * 官方把 current 写在 item 元素的 current 属性上（Lit reflect），两种载体上
 * 等价位置分别是 CE 宿主的 data-current 属性、li 的 data-current 属性——
 * 统一按"每个 item 自己的根载体"读写。扫描两种都认，DOM 序即官方 slot 序。
 * MutationObserver(childList + subtree) 对应官方 slotchange 的触发时机：
 * item 增删移动、卸载重挂都重新同步。
 * 自激防护：subtree observer 会看到 item 内部重渲染——签名比对拦掉
 * observer → setSeparator → item 重渲染 → observer 的环。 */
let itemObserver = null;
let lastItemSignature = "\u0000init";
let lastSeparatorHtml = "\u0000init";

function scanItems() {
  const scope = root.value;
  if (!scope) return [];
  const list = [];
  for (const el of scope.querySelectorAll("kima-breadcrumb-item, li.kima-breadcrumb-item")) {
    /* CE 模式两种选择器命中的是包含关系的两个节点（宿主 > 其模板 li 根）：
     * 宿主才是官方语义的 item（官方 slotchange 枚举的就是它）。有宿主的 li
     * 不是独立 item，跳过；Vue 模式无宿主，li 独立成项。 */
    if (el.parentElement?.closest("kima-breadcrumb-item")) continue;
    list.push(el);
  }
  /* DOM 序在两种载体下都是官方 slot 序（querySelectorAll 文档序）。 */
  return list;
}

/* 官方 current 的读写都在 item 元素上；KIMA 双载体的载体规则：
 * li 根的 data-current 由 Vue 响应式驱动（容器写属性 + item 的 observer 读回），
 * 与 CE 宿主同通道——item 侧 readDomCurrent 已按载体分派。 */
function syncCurrent() {
  const items = scanItems();
  const signature = items.map((item, index) => `${index}:${item.tagName}:${item.hasAttribute("data-current")}`).join("|");
  if (signature === lastItemSignature) return;
  lastItemSignature = signature;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (i < items.length - 1) {
      if (item.hasAttribute("data-current")) item.removeAttribute("data-current");
    } else if (!item.hasAttribute("data-current")) {
      item.setAttribute("data-current", "page");
    }
  }
}

onMounted(() => {
  syncCurrent();
  syncSeparators();
  itemObserver = new MutationObserver(() => {
    syncCurrent();
    syncSeparators();
  });
  itemObserver.observe(root.value, { childList: true, subtree: true });
});
onBeforeUnmount(() => itemObserver?.disconnect());

/* ---------- 自定义分隔符（官方 #handleSeparatorSlotChange / #setSeparator 逐行）----------
 * 官方：separator slot 内容克隆进每个 item 的 .separator 容器（cloneNode(true) +
 * part="separator"）；空槽回落默认 chevron。
 * KIMA：CE 模式 slot="separator" 节点被 Vue 搬进 <div hidden> 的插槽位——从那里收，
 * 克隆 outerHTML 下发到每个 item（v-html 渲染；样式钩子类名承担官方 part 的职责）。
 * Vue 模式：#separator 插槽 vnode 经 provide/inject 下发（item 直接渲染 vnode，
 * 天然满足"每项渲染一次"的克隆语义）。
 * 克隆时剥掉 slot 属性：v-html 渲出的节点若仍带 slot="separator" 会被下一次收采反捕
 * （separator 在 root 子树内），形成 read → 下发 → 渲染 → read 的指数自激。
 * 官方 cloneNode 进 shadow DOM，不存在反馈环；这是 light DOM 的结构差异，非行为改写。 */
const separatorSlotNodes = ref(null);
function readSeparatorNodes() {
  if (!isCustomElement) return;
  /* light DOM 投影后 <slot> 元素本身被 Vue 移除，separator 节点直接落在
   * hidden div 里（挂载位）。从那里收，剥掉 slot 属性防 v-html 反捕。 */
  const holder = root.value?.querySelector("div[hidden]");
  const nodes = holder ? [...holder.children].filter((n) => n.tagName.toLowerCase() !== "template" && n.getAttribute("slot") === "separator") : [];
  separatorSlotNodes.value = nodes.length
    ? nodes.map((n) => n.outerHTML.replace(/\s*slot="separator"/, "")).join("")
    : null;
}
const separatorVNodes = computed(() => {
  const slot = separatorSlotRef.value;
  return slot ? slot() : [];
});
function syncSeparators() {
  readSeparatorNodes();
  const html = separatorSlotNodes.value;
  /* 内容没变不下发——避免 observer → setSeparator → 重渲染 → observer 自激。 */
  if (html === lastSeparatorHtml) return;
  lastSeparatorHtml = html;
  for (const item of scanItems()) {
    item.setSeparator?.(html);
  }
}
/* inject 端拿到的是"取分隔符内容"的函数：Vue 模式给 vnode 数组，CE 模式给 HTML 串。 */
provide("kimaBreadcrumbSeparator", () => (separatorVNodes.value.length ? separatorVNodes.value : separatorSlotNodes.value));
</script>

<template>
  <nav ref="root" v-bind="forwardedAttrs" class="kima-breadcrumb" :class="{ 'kima-breadcrumb--wrap': wrap }" role="navigation">
    <!-- 官方 render() 同构：.base[role=list] > 默认 slot + separator slot（不显示）。 -->
    <ol class="kima-breadcrumb__list" role="list">
      <slot></slot>
    </ol>
    <div hidden aria-hidden="true"><slot name="separator" ref="separatorSlotRef"></slot></div>
  </nav>
</template>

<style scoped lang="scss">
/* ============ BreadcrumbElement.ts styles（94-111 逐行）============ */
.kima-breadcrumb {
  display: block;
  box-sizing: border-box;
  min-width: 0;
}
.kima-breadcrumb[hidden] {
  display: none;
}
.kima-breadcrumb__list {
  display: flex; /* 官方 .base */
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
  /* 块级场地：宽度铺满可用空间（KIMA 宽度规矩），官方 :host display:block 同义。 */
  width: 100%;
}
.kima-breadcrumb--wrap .kima-breadcrumb__list {
  flex-wrap: wrap; /* 官方 :host([wrap]) .base */
}
</style>
