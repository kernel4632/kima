/* 导航组共用：原生插槽、CE id 去重、本地交互同步和滚动目标解析。 */
import { computed, getCurrentInstance, ref, shallowRef, useAttrs, useHost, watch } from "vue";
import { useNativeSlots } from "./native-slots.js";

export function useNavigationRoot() {
  const root = ref(null);
  const attrs = useAttrs();
  const { hasNativeSlot, isCustomElement } = useNativeSlots(root);
  const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);
  return { root, forwardedAttrs, hasNativeSlot, isCustomElement };
}

export function useNavigationModel(props, key, emit) {
  const host = getCurrentInstance()?.ce ? useHost() : null;
  const local = shallowRef(props[key]);
  watch(() => props[key], (value) => { local.value = value; });
  function update(value) {
    if (Object.is(value, local.value)) return;
    local.value = value;
    // CE 的公开 property 跟随交互，确保外部重新写入初始值也能触发更新。
    // 普通 Vue 不修改 props，仍通过 update 事件交由父组件同步。
    if (host) host[key] = value;
    emit(`update:${key}`, value);
    emit("change", value);
  }
  return [local, update];
}

export function scrollTarget(target) {
  if (typeof window === "undefined") return null;
  if (!target) return window;
  const element = typeof target === "string" ? (() => { try { return document.querySelector(target); } catch { return null; } })() : target;
  // light DOM CE 的 id 位于宿主，实际滚动的是内部具名区域。
  return element?.matches?.("kima-scroll-area") ? element.querySelector(".kima-scroll-area") : element;
}

export function scrollBehavior(smooth = true) {
  return smooth && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant";
}

export function cssSize(value) {
  return typeof value === "number" || /^\d+(\.\d+)?$/.test(String(value).trim()) ? `${Math.max(0, Number(value))}px` : value;
}
