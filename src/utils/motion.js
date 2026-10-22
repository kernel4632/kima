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
  const natural = element.getBoundingClientRect().height;
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
