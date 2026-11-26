/*
 * 涟漪：按下时整块场地亮一下，再淡出。
 * 按钮、图标按钮、按钮组、卡片、选择器共用同一个效果，所以放在这里而不是各写一套。
 * 调用示例：
 *   const root = ref(null);
 *   useRipple(root);
 *   // root 指向的元素要套 kima-ripple-host mixin（见 _mixins.scss）：
 *   // 它负责把光斑铺满场地、裁进圆角、压到内容之上。
 *
 * 为什么不是"从按下点涨出一个圆"：圆边扫过场地时，画面里必然同时存在
 * "已扫到"和"还没扫到"两块，宽控件（选择器、卡片）上一眼看得出割裂；
 * 把边柔化、把过程压快都只能减轻，消不掉。
 * 整块均匀亮起只是一层没有边的亮层，全程透明度量变，眼睛没有可追的东西。
 */
import { onBeforeUnmount, onMounted } from "vue";

export function useRipple(host) {
  let element = null;

  // 一次按下亮一块。
  function onPointerDown(event) {
    if (!element || event.button !== 0) return;

    // 禁用中的控件不亮。宿主可能是按钮（自己带 disabled），
    // 也可能是整块场地（用 aria-disabled 表示禁用），两种都认。
    if (element.matches(":disabled, [aria-disabled='true']")) return;

    // 落点取"被按下的那块场地"，不是宿主本身：
    // 宿主可能是组级容器（radio/checkbox 组整组接 useRipple），
    // 按下组里某一个选项时，亮的应该是那个选项自己的场地，不是整组。
    // 带 data-kima-ripple-host 的是"有自己场地的子项"（组渲染时标上），
    // 没有标记时回落到宿主（按钮、卡片这类单体场景不受影响）。
    const host = event.target.closest?.("[data-kima-ripple-host]") || element;

    // 宿主没套 kima-ripple-host 时不亮。
    // 少了那个 mixin，这个 span 会变成一个没定位的普通子元素，被布局算进去，
    // 凭空把宿主撑高一段（卡片踩过这个坑：高度多出整整一个 gap）。
    // 拦住比每个调用点都记得套 mixin 可靠。
    const position = getComputedStyle(host).position;
    if (position !== "relative" && position !== "absolute" && position !== "fixed") return;

    const ripple = document.createElement("span");
    ripple.className = "kima-ripple";
    // 动画播完自己摘掉，不留垃圾节点。
    // 长按跨过整个动画时 animationend 不会再触发，补一个定时器兜底。
    const remove = () => {
      if (ripple.getAnimations().some((animation) => animation.playState === "running")) return;
      ripple.remove();
    };
    ripple.addEventListener("animationend", remove);
    setTimeout(remove, 700);
    host.append(ripple);
  }

  onMounted(() => {
    element = host.value;
    element?.addEventListener("pointerdown", onPointerDown);
  });
  onBeforeUnmount(() => element?.removeEventListener("pointerdown", onPointerDown));
}
