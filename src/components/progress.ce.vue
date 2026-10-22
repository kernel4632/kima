<!--
进度条：使用原生 progress 元素，保留浏览器的进度语义和不确定状态。
组件不画标签（和文本框、选择器、滑块一致）：可见的「下载进度」由使用者自己排版，
label 属性只落到 progress 的 aria-label 上。
调用示例：
  <kima-progress :value="downloaded" label="下载进度"></kima-progress>
  <kima-progress indeterminate label="正在连接"></kima-progress>
-->
<script setup>
import { computed, getCurrentInstance, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  indeterminate: { type: Boolean, default: false },
  label: { type: String, default: "" },
});

const attrs = useAttrs();
const isCustomElement = Boolean(getCurrentInstance()?.ce);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);
const safeMax = computed(() => Number.isFinite(props.max) && props.max > 0 ? props.max : 100);
const safeValue = computed(() => Number.isFinite(props.value) ? Math.max(0, Math.min(safeMax.value, props.value)) : 0);
</script>

<template>
  <div class="kima-progress">
    <span class="kima-progress__track">
      <progress
        v-bind="forwardedAttrs"
        class="kima-progress__bar"
        :value="indeterminate ? undefined : safeValue"
        :max="safeMax"
        :aria-label="attrs['aria-label'] || label || undefined"
      />
      <Transition name="kima-fade"><span v-if="indeterminate" class="kima-progress__motion" aria-hidden="true"><span /></span></Transition>
    </span>
  </div>
</template>

<style scoped lang="scss">
.kima-progress {
  display: block;
  width: 100%;
  color: var(--kima-color-on-surface);

  &__bar {
    display: block;
    width: 100%;
    height: var(--kima-progress-height);
    overflow: hidden;
    appearance: none;
    border: 0;
    border-radius: var(--kima-radius-full);
    background: var(--kima-color-layer-3);
  }

  &__bar::-webkit-progress-bar {
    border-radius: var(--kima-radius-full);
    background: var(--kima-color-layer-3);
  }

  &__bar::-webkit-progress-value {
    transition: width var(--kima-duration-medium) var(--kima-curve-standard);
    border-radius: var(--kima-radius-full);
    background: var(--kima-color-primary);
  }

  &__bar::-moz-progress-bar {
    transition: width var(--kima-duration-medium) var(--kima-curve-standard);
    border-radius: var(--kima-radius-full);
    background: var(--kima-color-primary);
  }

  &__track {
    position: relative;
    display: block;
    height: var(--kima-progress-height);
    overflow: hidden;
    border-radius: var(--kima-radius-full);
  }

  &__motion {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--kima-color-layer-3);
    pointer-events: none;

    > span {
      display: block;
      width: 40%;
      height: 100%;
      border-radius: var(--kima-radius-full);
      background: var(--kima-color-primary);
      animation: kima-progress-motion 1.4s linear infinite;
    }
  }
}

@keyframes kima-progress-motion {
  from { transform: translateX(-100%); }
  to { transform: translateX(250%); }
}

@media (prefers-reduced-motion: reduce) {
  .kima-progress__bar::-webkit-progress-value { transition: none; }
  .kima-progress__bar::-moz-progress-bar { transition: none; }
  .kima-progress__motion > span {
    margin-inline: auto;
    animation: none;
  }
}
</style>
