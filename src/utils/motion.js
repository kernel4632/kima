// Small Vue Transition hooks, safe to import during SSR. No timers or DOM at module scope.
const active = new WeakMap();
const interrupted = new WeakMap();

export function prefersReducedMotion(element) {
  const scope = element?.closest?.('[data-kima-reduced-motion]');
  if (scope?.getAttribute('data-kima-reduced-motion') === 'reduce') return true;
  return element?.ownerDocument?.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function milliseconds(value) {
  const number = parseFloat(value) || 0;
  return value.trim().endsWith("ms") ? number : number * 1000;
}

export function retireMotionElement(element) {
  element.inert = true;
  element.setAttribute("aria-hidden", "true");
}
export function activateMotionElement(element) {
  element.inert = false;
  element.removeAttribute("aria-hidden");
}
export const presenceTransition = { onBeforeEnter: activateMotionElement, onBeforeLeave: retireMotionElement };

const frozenLayouts = new WeakMap();

// 同一个 key 在退场完成前回来时，必须恢复正常排版，不能留下 absolute 和固定尺寸。
export function restoreLeaveLayout(element) {
  const styles = frozenLayouts.get(element);
  if (styles) {
    Object.assign(element.style, styles);
    frozenLayouts.delete(element);
  }
  activateMotionElement(element);
}

/* 退出节点先冻结在原坐标并脱离排版，让承载容器可立即测得新自然尺寸。
 * 用于网格、弹性布局等列表；表格行不应使用此 helper。 */
export function freezeLeaveLayout(element) {
  const parent = element.parentElement;
  if (!parent) return;
  const rect = element.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();
  const style = element.ownerDocument.defaultView.getComputedStyle(parent);
  if (style.position === 'static') parent.style.position = 'relative';
  if (!frozenLayouts.has(element)) {
    frozenLayouts.set(element, Object.fromEntries(
      ['position', 'top', 'left', 'right', 'bottom', 'width', 'height', 'boxSizing', 'margin']
        .map(key => [key, element.style[key]]),
    ));
  }
  Object.assign(element.style, {
    position: 'absolute',
    // DOMRect 是物理坐标，不能写入 RTL 下从右侧起算的 inset-inline-start。
    top: `${rect.top - parentRect.top - parent.clientTop + parent.scrollTop}px`,
    left: `${rect.left - parentRect.left - parent.clientLeft + parent.scrollLeft}px`,
    right: 'auto',
    bottom: 'auto',
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    boxSizing: 'border-box',
    margin: '0',
  });
  retireMotionElement(element);
}

/* 收起时内容可能和开关一起从 DOM 消失（字段组提示就是这种）。
 * 那时现场量高度只能量到 0，动画就成了 0→0。
 * 组件在更新前调用一次 rememberCollapseHeight(元素)，把旧高度存下来当起点。 */
const rememberedHeights = new WeakMap();

export function rememberCollapseHeight(element) {
  const height = element?.getBoundingClientRect().height || 0;
  if (height > 0) rememberedHeights.set(element, height);
}

function cancelCollapse(element) {
  const state = active.get(element);
  if (!state) return;
  interrupted.set(element, { height: element.getBoundingClientRect().height, opacity: getComputedStyle(element).opacity });
  state.observer?.disconnect();
  active.delete(element);
  state.animation?.cancel();
  element.style.overflow = state.overflow;
}

function collapse(element, done, entering) {
  const view = element.ownerDocument.defaultView;
  const wasHidden = element.style.display === "none" || view.getComputedStyle(element).display === "none";
  if (entering && wasHidden) element.style.display = "";
  const style = view.getComputedStyle(element);
  const previous = interrupted.get(element);
  interrupted.delete(element);
  const natural = element.getBoundingClientRect().height || rememberedHeights.get(element) || 0;
  const duration = prefersReducedMotion(element) ? 0 : milliseconds(style.getPropertyValue("--kima-duration-slow") || "300ms");
  const easing = style.getPropertyValue("--kima-curve-emphasized").trim() || "ease-out";
  if (!duration || !element.animate) { done(); return; }
  const state = { overflow: element.style.overflow, animation: null, observer: null };
  active.set(element, state);
  element.style.overflow = "clip";
  let target = entering ? natural : 0;
  function play(fromHeight, fromOpacity) {
    const animation = element.animate([
      { height: `${fromHeight}px`, opacity: fromOpacity },
      { height: `${target}px`, opacity: entering ? 1 : 0 },
    ], { duration, easing, fill: "both" });
    state.animation = animation;
    animation.finished.then(() => {
      if (active.get(element) !== state || state.animation !== animation) return;
      state.observer?.disconnect();
      active.delete(element);
      element.style.overflow = state.overflow;
      // Vue owns display:none after leave and keeps display enabled after enter.
      // For enter, cancelling the fill restores natural auto height, not a frozen px height.
      done();
      animation.cancel();
    }).catch(() => {});
  }
  play(previous?.height ?? (entering ? 0 : natural), previous?.opacity ?? (entering ? 0 : style.opacity));
  // Expanded content remains auto-sized after enter; only retarget during the short enter.
  // Observe the inner content, not our animated wrapper (which changes every frame).
  if (entering && view.ResizeObserver && element.firstElementChild) {
    let last = element.firstElementChild.getBoundingClientRect().height;
    state.observer = new view.ResizeObserver(() => {
      const height = element.firstElementChild?.getBoundingClientRect().height ?? last;
      if (Math.abs(height - last) < 0.5 || active.get(element) !== state) return;
      const current = element.getBoundingClientRect().height;
      const opacity = view.getComputedStyle(element).opacity;
      target += height - last;
      last = height;
      state.animation.cancel();
      play(current, opacity);
    });
    state.observer.observe(element.firstElementChild);
  }
}

// Use with <Transition :css="false" v-bind="collapseTransition"> and a padding-free
// v-show wrapper. Keep semantic inert/aria-hidden bound to the actual open state.
export const collapseTransition = {
  onEnter: (element, done) => collapse(element, done, true),
  onLeave: (element, done) => collapse(element, done, false),
  onEnterCancelled: cancelCollapse,
  onLeaveCancelled: cancelCollapse,
};
