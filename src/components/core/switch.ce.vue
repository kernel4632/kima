<!--
开关：行为层全由 M3E Switch（@m3e/web，Lit Web Component）承担——
结构、动效、无障碍、表单（FACE）、按压膨胀、state layer 光晕全部原生。
用户裁决：源码开源摆在眼前，直接套用，不再手写复刻。
皮肤层：KIMA token 通过 M3E 的 --m3e-switch-* CSS 变量注入 Grok 主题色。
44 触摸命中由外层 label 竖向 padding 补足。
label 属性只落到 aria-label 上，可见标签由使用者自己排版。
调用示例：
  <kima-switch v-model="enabled" name="enabled">启用同步</kima-switch>
  <kima-switch :model-value="true" disabled>已锁定</kima-switch>
-->
<!-- 双 script 块：模块级 script 在组件定义时求值一次（不在 setup 内），
     M3E 注册的 DOM 守卫放这里——Node/SSR 无 customElements 时跳过注册，
     浏览器同步注册；setup 块保持纯同步（Vue 的 async setup 会让组件挂起不渲染）。 -->
<script>
const canRegisterM3e = typeof globalThis.HTMLElement !== "undefined" && typeof globalThis.customElements !== "undefined";
if (canRegisterM3e) {
  globalThis.customElements.get?.("m3e-switch") || (await import("@m3e/web/switch"));
}
</script>
<script setup>
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useNativeSlots } from "../../utils/native-slots.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  name: { type: String, default: undefined },
  value: { type: String, default: "on" },
});

const emit = defineEmits(["update:modelValue", "change"]);
const { hasNativeSlot } = useNativeSlots(null);
const isCustomElement = Boolean(getCurrentInstance()?.ce);

const root = ref(null);

// m3e-switch 是原生 Web Component：受控属性 checked / disabled。
// Vue v-model → checked 属性；原生 input/change 事件回传。
// 用 :is 绑定动态属性，避免 Vue 对自定义元素属性同步的限制。
function syncChecked(value) {
  const el = root.value;
  if (!el) return;
  if (Boolean(el.checked) !== Boolean(value)) el.checked = Boolean(value);
}
watch(() => props.modelValue, syncChecked, { immediate: false });
const initialSync = computed(() => {
  // 初始挂载后同步一次（Web Component 属性需在元素就绪后设置）
  return props.modelValue;
});

function onInput(event) {
  const next = event.target.checked;
  if (next !== props.modelValue) {
    emit("update:modelValue", next);
    emit("change", next);
  }
}

// 自定义元素挂载后设置属性（在 @vue-ignore 容器内用 ref 拿元素）
const setupEl = (el) => {
  root.value = el;
  if (el) {
    el.checked = Boolean(props.modelValue);
    el.addEventListener("input", onInput);
    el.addEventListener("change", onInput);
  }
};
onBeforeUnmount(() => {
  const el = root.value;
  if (el) {
    el.removeEventListener("input", onInput);
    el.removeEventListener("change", onInput);
  }
});
</script>

<template>
  <label
    class="kima-switch"
    :class="{ 'kima-switch--disabled': disabled }"
  >
    <!-- @vue-ignore：m3e-switch 是原生自定义元素，Vue 不解析其内部 -->
    <m3e-switch
      :ref="setupEl"
      class="kima-switch__track"
      :checked="initialSync"
      :disabled="disabled"
      :name="name"
      :value="value"
      :aria-label="$attrs['aria-label'] || $attrs.ariaLabel || undefined"
      :aria-required="required || undefined"
    />
    <span v-if="$slots.default || hasNativeSlot('default')" class="kima-switch__label">
      <slot />
    </span>
  </label>
</template>

<style scoped lang="scss">
@use "../../styles/mixins" as *;

/* 行为/结构/动效全部来自 m3e-switch 原生实现（含按压膨胀、state layer、
 * spring 曲线）——不再手写复刻。皮肤层只做两件事：
 * 1. Grok 主题色注入 M3E 的 --m3e-switch-* 变量（token 化，无硬编码）；
 * 2. label 命中区与字号用 KIMA token。 */
.kima-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--kima-space-2);
  /* 触摸命中：label 竖向 padding 补到 44（M3E 轨道 32 + 2×6），视觉行高不变。 */
  padding-block: calc((var(--kima-touch-target) - var(--kima-switch-height)) / 2);
  color: var(--kima-color-on-surface);
  font-size: var(--kima-font-size-body-medium);
  cursor: pointer;
  user-select: none;

  /* ---- Grok 主题注入 M3E switch token ----
   * M3E 的颜色变量在这里映射 KIMA token（Grok 官方语义色）。 */
  --m3e-switch-selected-track-color: var(--kima-color-primary);
  --m3e-switch-selected-handle-color: var(--kima-color-on-primary);
  --m3e-switch-selected-hover-handle-color: color-mix(in srgb, var(--kima-color-on-primary) 80%, var(--kima-color-primary));
  --m3e-switch-selected-focus-handle-color: color-mix(in srgb, var(--kima-color-on-primary) 80%, var(--kima-color-primary));
  --m3e-switch-selected-pressed-handle-color: color-mix(in srgb, var(--kima-color-on-primary) 80%, var(--kima-color-primary));
  --m3e-switch-unselected-track-color: var(--kima-color-surface-container-highest);
  --m3e-switch-unselected-handle-color: var(--kima-color-outline);
  --m3e-switch-unselected-hover-handle-color: var(--kima-color-on-surface-variant);
  --m3e-switch-unselected-focus-handle-color: var(--kima-color-on-surface-variant);
  --m3e-switch-unselected-pressed-handle-color: var(--kima-color-on-surface-variant);
  --m3e-switch-track-outline-color: var(--kima-color-outline);
  --m3e-switch-unselected-hover-state-layer-color: var(--kima-color-on-surface);
  --m3e-switch-unselected-focus-state-layer-color: var(--kima-color-on-surface);
  --m3e-switch-selected-hover-state-layer-color: var(--kima-color-primary);
  --m3e-switch-selected-focus-state-layer-color: var(--kima-color-primary);

  &--disabled {
    cursor: not-allowed;

    .kima-switch__label {
      opacity: 0.5;
    }
  }

  &__label {
    min-width: 0;
    line-height: 1.4;
  }
}
</style>
