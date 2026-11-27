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
// useNarrow 已随 sidebar 裁撤移除（无消费者）。需要时从 git 历史找回。
export const navKey = (item) => String(item.value ?? item.href ?? item.label);
export function navContains(item, value) { return navKey(item) === value || (item.children || []).some((child) => navContains(child, value)); }
