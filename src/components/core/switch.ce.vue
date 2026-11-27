<!--
开关：行为层全由 Reka Switch 承担（键盘、表单 input、aria），皮肤按 Grok 官方 web
switch 一比一（chunk 1eqhhq8j5i595.js，全站唯一 switch 皮肤类）：
44×24 胶囊（w-11 h-6）+ border-2 透明占位；未选底 primary 20%、选中 primary 实色、
hover 轨道 opacity-90；拇指 20px（size-5）页面底色（与 primary 反色）+ shadow-lg，
150ms ease-out 滑移 20px（translate-x-5）。focus-visible ring-2 offset-2 primary/30。
label 竖向 padding 补足 44 触摸命中（视觉行高不变）。证据链见 docs/grok-component-reference.md。
label 属性只落到内部输入的 aria-label 上，可见标签由使用者自己排版。
调用示例：
  <kima-switch v-model="enabled" name="enabled">启用同步</kima-switch>
  <kima-switch :model-value="true" disabled>已锁定</kima-switch>
-->
<script setup>
import { computed, getCurrentInstance, useAttrs } from "vue";
import { SwitchRoot, SwitchThumb } from "reka-ui";
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
const attrs = useAttrs();
const { hasNativeSlot, isCustomElement } = useNativeSlots(null);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);

function handleChange(value) {
  emit("update:modelValue", value);
  emit("change", value);
}
</script>

<template>
  <label
    class="kima-switch"
    :class="{ 'kima-switch--disabled': disabled }"
  >
    <SwitchRoot
      v-bind="forwardedAttrs"
      class="kima-switch__track"
      :model-value="modelValue"
      :disabled="disabled"
      :required="required"
      :name="name"
      :value="value"
      :aria-label="attrs['aria-label'] || attrs.ariaLabel || undefined"
      @update:model-value="handleChange"
    >
      <SwitchThumb class="kima-switch__thumb" />
    </SwitchRoot>
    <span v-if="$slots.default || hasNativeSlot('default')" class="kima-switch__label">
      <slot />
    </span>
  </label>
</template>

<style scoped lang="scss">
@use "../../styles/mixins" as *;

/* 官方 Grok web switch 一比一（chunk 1eqhhq8j5i595.js 全站唯一 switch 类串）：
 * 轨道 peer inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors
 *   底色 c ? "bg-primary hover:opacity-90" : "bg-primary/20 hover:opacity-90"
 *   focus-visible ring-2 ring-offset-2 ring-primary/30；disabled opacity-50
 * 拇指 pointer-events-none size-5 rounded-full bg-[var(--cookie-consent-surface)]
 *   = 页面底色（--background → 深色近黑/浅色近白，与 primary 反色）+ shadow-lg
 *   transition-transform duration-150 ease-out；位移 translate-x-5 / translate-x-0
 * 注意：官方 --toggle-border/--toggle-selected 无任何 switch 消费者（JS 唯一引用
 * 是设置行 border-b 分隔线），此前两轮的「边框轨道」是误读，已废弃。 */
.kima-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--kima-space-2);
  /* 触摸命中：官方用伪元素外扩（见 docs/grok-component-reference.md 六）。
   * 这里 label 竖向 padding 补到 44 命中（24 轨道 + 2×10 padding），视觉行高不变。 */
  padding-block: calc((var(--kima-touch-target) - var(--kima-switch-height)) / 2);
  color: var(--kima-color-on-surface);
  font-size: var(--kima-font-size-body-medium);
  cursor: pointer;
  user-select: none;

  &__track {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    /* 官方 web 规格：44×24 胶囊（w-11 h-6）。 */
    width: var(--kima-switch-width);
    height: var(--kima-switch-height);
    box-sizing: border-box;
    /* 官方 Tailwind preflight 按钮零内边距；UA 默认 padding 会吃掉几何，必须归零。 */
    padding: 0;
    /* 官方 border-2 border-transparent：2px 透明占位（占几何不占视觉）。
     * 官方轨道无边框、无可见描边——形全靠底色。 */
    border: 2px solid transparent;
    border-radius: var(--kima-radius-full);
    /* 官方未选底 = bg-primary/20（fg-primary 混 20% 透明）。 */
    background: color-mix(in srgb, var(--kima-color-primary) 20%, transparent);
    /* 官方 transition-colors = 默认 150ms cubic-bezier(.4,0,.2,1)。 */
    transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
    outline: none;

    /* 官方 focus-visible ring-2 ring-offset-2 ring-primary/30：
     * ring 是外圈 2px 30% primary；offset 2px 垫底用页面底色（官方 ring-offset 透明垫）。 */
    &:focus-visible {
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--kima-color-primary) 30%, transparent),
        0 0 0 4px var(--kima-color-surface);
    }

    /* 官方选中底 = bg-primary 实色（不透明）。 */
    &[data-state="checked"] {
      background: var(--kima-color-primary);
    }

    /* 官方 hover:opacity-90 作用于整个轨道（含选中）。 */
    &:hover:not(:disabled) {
      opacity: 0.9;
    }

    /* 官方 disabled:opacity-50。 */
    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  &__thumb {
    display: block;
    pointer-events: none;
    /* 官方 size-5 = 20px。行程 translate-x-5 = 20px。
     * 官方无 margin——两端内距 2px 全部来自轨道的 border-2 透明占位（border-box），
     * 拇指起点即在边框位内缘。 */
    width: var(--kima-switch-thumb);
    height: var(--kima-switch-thumb);
    border-radius: var(--kima-radius-full);
    /* 官方 bg-[var(--cookie-consent-surface)] = var(--background) 页面底色：
     * 深色主题近黑、浅色主题近白——正好是 primary 轨道的反色。 */
    background: var(--kima-color-surface);
    /* 官方 shadow-lg 编译值：0 0 30px -5px #0000001a, 0 0 6px -4px #0000001a
     * ——大柔焦外晕（用户记忆的"一圈东西"）+ 近距锐影，球的立体感来源。 */
    box-shadow: 0 0 30px -5px rgba(0, 0, 0, 0.1), 0 0 6px -4px rgba(0, 0, 0, 0.1);
    /* iOS 原生 switch 的 thumb 动效（用户指认"官方的球有大小变化"）：
     * 按住时球隆起放大 ~12%（thumb 按压感），松手弹回；滑移同步进行不互抢。 */
    transition: transform 150ms ease-out, scale 150ms var(--kima-curve-standard);

    /* 按住轨道时球放大——iOS UISwitch 的隆起手感（Space 键同样命中 :active）。 */
    .kima-switch__track:active & {
      scale: 1.12;
    }

    &[data-state="checked"] {
      transform: translateX(var(--kima-switch-travel));
    }

    &[data-state="unchecked"] {
      transform: translateX(0);
    }
  }

  &__label {
    min-width: 0;
    line-height: 1.4;
  }

  &--disabled {
    cursor: not-allowed;

    .kima-switch__label {
      opacity: 0.5;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .kima-switch__track,
  .kima-switch__thumb {
    transition: none;
  }
}
</style>
