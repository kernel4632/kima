// 输入组件共用的本地状态与原生 form reset；不要求 CE 使用者回写事件。
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";

export function useInputState(props, emit, root, normalize = (value) => value, afterReset) {
  const copy = (value) => Array.isArray(value) ? [...value] : value;
  const local = ref(copy(normalize(props.modelValue)));
  watch(() => props.modelValue, (value) => { local.value = copy(normalize(value)); }, { deep: true });
  function update(value, change = true) {
    if (props.disabled || props.readonly) return;
    local.value = copy(normalize(value));
    emit("update:modelValue", copy(local.value));
    if (change) emit("change", copy(local.value));
  }
  let initial;
  let doc;
  function reset(event) {
    const element = root.value;
    const form = element?.form || element?.querySelector("input,select,textarea,button")?.form || element?.closest("form");
    if (event.target !== form) return;
    queueMicrotask(() => {
      if (event.defaultPrevented || !root.value) return;
      local.value = copy(initial);
      afterReset?.(local.value);
      emit("update:modelValue", copy(local.value));
    });
  }
  onMounted(() => {
    initial = copy(local.value);
    doc = root.value?.ownerDocument;
    doc?.addEventListener("reset", reset, true);
    // 默认值必须与挂载值一致，否则原生 reset 会在微任务前清掉选中态。
    const controls = root.value?.matches("input,select,textarea") ? [root.value] : [...(root.value?.querySelectorAll("input,select,textarea") || [])];
    for (const control of controls) {
      if (control.tagName === "SELECT") {
        for (const option of control.options) option.defaultSelected = option.selected;
      } else if (["checkbox", "radio"].includes(control.type)) control.defaultChecked = control.checked;
      else if (control.type !== "file") control.defaultValue = control.value;
    }
  });
  onBeforeUnmount(() => doc?.removeEventListener("reset", reset, true));
  return { local, update };
}

// 宿主 id 留在 CE 上；普通 Vue 的 id 落到真正的输入元素，原生 label for 可以引用。
export function useInputAttrs() {
  const attrs = useAttrs();
  const ce = Boolean(getCurrentInstance()?.ce);
  const controlAttrs = computed(() => {
    const result = { ...attrs };
    delete result.class;
    delete result.style;
    if (ce) delete result.id;
    return result;
  });
  return { attrs, controlAttrs };
}
