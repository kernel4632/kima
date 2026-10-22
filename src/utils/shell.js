// Shell state: Vue controlled values stay owned by the caller; CE properties synchronize locally.
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, shallowRef, useHost, watch } from 'vue';
export function useShellModel(props, key, emit) {
  const instance = getCurrentInstance();
  const host = instance?.ce ? useHost() : null;
  const local = shallowRef(props[key]);
  const kebab = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  const controlled = () => !host && (Object.hasOwn(instance.vnode.props || {}, key) || Object.hasOwn(instance.vnode.props || {}, kebab));
  watch(() => props[key], (value) => { local.value = value; });
  const value = computed(() => controlled() ? props[key] : local.value);
  function update(next) {
    if (Object.is(value.value, next)) return;
    if (!controlled()) local.value = next;
    if (host) host[key] = next;
    emit(`update:${key}`, next);
  }
  return [value, update];
}
export function useMenuChecks(props, emit) {
  const [checked, update] = useShellModel(props, 'checked', emit);
  function check(item, value) {
    const key = item.type === 'radio' ? (item.group || 'default') : item.value;
    const next = { ...checked.value, [key]: value };
    update(next);
    emit('check', next, item);
  }
  return { checked, check };
}
export function useNarrow(root, breakpoint, parent = false) {
  const narrow = ref(false);
  let observer;
  onMounted(() => {
    const target = parent ? root.value.closest('kima-sidebar')?.parentElement || root.value.parentElement : root.value;
    const measure = () => { narrow.value = target.getBoundingClientRect().width < Number(breakpoint()); };
    observer = new ResizeObserver(measure); observer.observe(target); measure();
  });
  watch(breakpoint, () => { if (root.value) narrow.value = root.value.getBoundingClientRect().width < Number(breakpoint()); });
  onBeforeUnmount(() => observer?.disconnect());
  return narrow;
}
export const navKey = (item) => String(item.value ?? item.href ?? item.label);
export function navContains(item, value) { return navKey(item) === value || (item.children || []).some((child) => navContains(child, value)); }
