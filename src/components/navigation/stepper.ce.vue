<!-- 步骤导航：顺序状态、当前步骤、可选线性约束，区别于标签面板和时间线。
调用示例：
  <kima-stepper v-model="step" :items="[{ label: '信息' }, { label: '确认' }, { label: '完成' }]" />
-->
<script setup>
import { computed } from "vue";
import { presenceTransition } from "../../utils/motion.js";
import KimaButton from "../core/button.ce.vue";
import { useNavigationModel, useNavigationRoot } from "../../utils/navigation.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ modelValue: { type: Number, default: 0 }, items: { type: Array, default: () => [] }, linear: Boolean, disabled: Boolean, orientation: { type: String, default: "horizontal" }, label: { type: String, default: "步骤导航" } });
const emit = defineEmits(["update:modelValue", "change"]);
const { root, forwardedAttrs } = useNavigationRoot();
const [local, update] = useNavigationModel(props, "modelValue", emit);
const active = computed(() => Math.max(0, Math.min(props.items.length - 1, Number(local.value) || 0)));
function blocked(item, index) { return props.disabled || item.disabled || (props.linear && index > active.value + 1); }
</script>
<template>
  <nav ref="root" v-bind="forwardedAttrs" class="kima-stepper" :class="{ 'kima-stepper--vertical': orientation === 'vertical' }" :aria-label="label">
    <ol>
      <li v-for="(item, index) in items" :key="item.id ?? index" :data-state="index === active ? 'current' : index < active ? 'complete' : 'pending'">
        <KimaButton :variant="index === active ? 'tonal' : 'text'" :disabled="blocked(item, index)" :aria-current="index === active ? 'step' : undefined" @click="update(index)">
          <span class="kima-stepper__number" aria-hidden="true"><Transition name="kima-fade"><span :key="index < active">{{ index < active ? '✓' : index + 1 }}</span></Transition></span>
          <span>{{ item.label }}<small v-if="item.description">{{ item.description }}</small><span class="kima-stepper__status"><Transition name="kima-fade" v-bind="presenceTransition"><span :key="index < active ? 'complete' : index === active ? 'current' : 'pending'">{{ index < active ? '已完成' : index === active ? '进行中' : '待开始' }}</span></Transition></span></span>
        </KimaButton>
      </li>
    </ol>
    <slot />
  </nav>
</template>
<style scoped lang="scss">
@use "../../styles/navigation" as *;
@use "../../styles/mixins" as *;
.kima-stepper__number { @include kima-motion-colors; }
.kima-stepper__number > span { grid-area: 1 / 1; }
.kima-stepper .kima-stepper__status { display: grid; }
.kima-stepper__status > span { grid-area: 1 / 1; }
.kima-stepper [data-state="complete"] .kima-stepper__number { color: var(--kima-color-on-primary-container); background: var(--kima-color-primary-container); }
.kima-stepper [data-state="current"] .kima-stepper__number { color: var(--kima-color-on-primary); background: var(--kima-color-primary); }
.kima-stepper__status { @include kima-motion-colors; color: var(--kima-color-on-surface-variant); }
.kima-stepper [data-state="current"] .kima-stepper__status { color: var(--kima-color-on-primary-container); }
.kima-stepper { @include navigation-root; @include kima-block-host; ol { display: flex; flex-wrap: wrap; gap: var(--kima-space-4); list-style: none; margin: 0; padding: 0; } &--vertical ol { flex-direction: column; } :deep(.kima-button) { min-height: 64px; text-align: start; } :deep(.kima-button__label) { gap: var(--kima-space-3); white-space: normal; } &__number { display: grid; place-items: center; width: 32px; height: 32px; border-radius: var(--kima-radius-full); background: var(--kima-color-layer-2); flex-shrink: 0; } small, &__status { display: block; margin-top: var(--kima-space-1); font-size: var(--kima-font-size-label-small); } }
</style>
