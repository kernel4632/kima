// 交互组的轻量共用：CE 属性回写、根属性去重、碰撞定位与列表键盘游标。
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useAttrs, useHost, watch } from "vue";
import { useNativeSlots } from "./native-slots.js";

export function useInteractionRoot() {
  const root = ref(null);
  const attrs = useAttrs();
  const { hasNativeSlot, isCustomElement } = useNativeSlots(root);
  const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);
  return { root, attrs, forwardedAttrs, hasNativeSlot };
}

export function useInteractionModel(props, key, emit) {
  const host = getCurrentInstance()?.ce ? useHost() : null;
  const copy = (value) => Array.isArray(value) ? [...value] : value;
  const local = shallowRef(copy(props[key]));
  watch(() => props[key], (value) => { local.value = copy(value); }, { deep: true });
  function update(value) {
    if (Object.is(local.value, value)) return;
    local.value = copy(value);
    // CE 不需要调用者回写事件；公开属性也同步，允许之后重新写入初始值。
    if (host) host[key] = copy(value);
    emit(`update:${key}`, copy(value));
  }
  return [local, update];
}

export function usePlacement(props) {
  return computed(() => {
    const [side, align] = String(props.placement || "bottom-start").split("-");
    return { side: ["top", "right", "bottom", "left"].includes(side) ? side : "bottom", align: ["start", "end"].includes(align) ? align : "center", sideOffset: 8, collisionPadding: 12, avoidCollisions: true, positionStrategy: "fixed" };
  });
}

export function useChoiceCursor(items, choose, id) {
  const active = ref(-1);
  const enabled = computed(() => items.value.flatMap((item, index) => item.disabled ? [] : [index]));
  const activeId = computed(() => active.value >= 0 ? `${id}-${active.value}` : undefined);
  function highlight(index) {
    active.value = index;
    nextTick(() => { if (typeof document !== "undefined") document.getElementById(activeId.value)?.scrollIntoView({ block: "nearest" }); });
  }
  watch(items, () => highlight(enabled.value[0] ?? -1), { immediate: true });
  function keydown(event) {
    if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
    const keys = enabled.value;
    if (!["ArrowDown", "ArrowUp", "Home", "End", "Enter"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Enter") { const item = items.value[active.value]; if (item && !item.disabled) choose(item); return; }
    if (event.key === "Home") highlight(keys[0] ?? -1);
    else if (event.key === "End") highlight(keys.at(-1) ?? -1);
    else {
      const current = keys.indexOf(active.value);
      const step = event.key === "ArrowDown" ? 1 : -1;
      highlight(keys.length ? keys[current < 0 ? (step > 0 ? 0 : keys.length - 1) : (current + step + keys.length) % keys.length] : -1);
    }
  }
  return { active, activeId, highlight, keydown };
}

// 原生 reset 的默认动作完成后同步本地值；取消的 reset 不影响状态。
export function useInteractionReset(root, local, update, afterReset) {
  let initial;
  let doc;
  let timer;
  const copy = (v) => Array.isArray(v) ? [...v] : v;
  function reset(event) {
    if (event.target !== root.value?.closest("form")) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (event.defaultPrevented || !root.value) return;
      update(copy(initial));
      afterReset?.();
    }, 0);
  }
  onMounted(() => { initial = copy(local.value); doc = root.value.ownerDocument; doc.addEventListener("reset", reset, true); });
  onBeforeUnmount(() => { clearTimeout(timer); doc?.removeEventListener("reset", reset, true); });
}

// preventDefault 阻止浏览器同时取消外层原生 dialog；关闭只交给当前最上层。
export function dismissInteraction(event, close) {
  event.preventDefault();
  event.stopPropagation();
  close();
}

export function flattenChoices(items) {
  const result = [];
  function visit(nodes) { for (const item of nodes) { result.push(item); if (Array.isArray(item.children)) visit(item.children); } }
  visit(items);
  return result;
}
