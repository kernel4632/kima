<!-- 手风琴列表：单选/多选展开、方向键焦点和每项独立禁用。
调用示例：
  <kima-accordion v-model="expanded" :items="[{ value: 'a', label: '常见问题', content: '解答' }]" />
-->
<script setup>
import { computed, useId } from "vue";
import { AccordionRoot, AccordionItem, AccordionHeader, AccordionTrigger } from "reka-ui";
import KimaButton from "./button.ce.vue";
import KimaIcon from "./icon.ce.vue";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { collapseTransition } from "../utils/motion.js";
import { useNavigationModel, useNavigationRoot } from "../utils/navigation.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ modelValue: { type: [String, Array], default: "" }, items: { type: Array, default: () => [] }, multiple: Boolean, disabled: Boolean, collapsible: { type: Boolean, default: true }, label: { type: String, default: "折叠列表" } });
const emit = defineEmits(["update:modelValue", "change"]);
const { root, forwardedAttrs } = useNavigationRoot();
const [local, update] = useNavigationModel(props, "modelValue", emit);
const id = `kima-accordion-${useId()}`;
const selected = computed(() => props.multiple ? (Array.isArray(local.value) ? local.value : local.value ? [local.value] : []) : (Array.isArray(local.value) ? local.value[0] || "" : local.value));
function valueOf(item, index) { return String(item.value ?? index); }
function expanded(value) { return props.multiple ? selected.value.includes(value) : selected.value === value; }
</script>
<template>
  <div ref="root" v-bind="forwardedAttrs" class="kima-accordion">
    <AccordionRoot :model-value="selected" :type="multiple ? 'multiple' : 'single'" :collapsible="collapsible" :disabled="disabled" :aria-label="label" @update:model-value="update">
      <AccordionItem v-for="(item, index) in items" :key="valueOf(item, index)" :value="valueOf(item, index)" :disabled="item.disabled" class="kima-accordion__item">
        <AccordionHeader class="kima-accordion__heading"><AccordionTrigger as-child><KimaButton :id="`${id}-trigger-${index}`" variant="text" :disabled="disabled || item.disabled" :aria-controls="`${id}-panel-${index}`" class="kima-accordion__trigger">{{ item.label }}<KimaIcon class="kima-accordion__arrow" :class="{ 'kima-accordion__arrow--expanded': expanded(valueOf(item, index)) }" :icon="ArrowDown01Icon" :size="20" aria-hidden="true" /></KimaButton></AccordionTrigger></AccordionHeader>
        <Transition :css="false" v-bind="collapseTransition">
          <div v-show="expanded(valueOf(item, index))" :id="`${id}-panel-${index}`" role="region" :aria-labelledby="`${id}-trigger-${index}`" :aria-hidden="!expanded(valueOf(item, index))" :inert="!expanded(valueOf(item, index))">
            <div class="kima-accordion__content"><slot :name="`panel-${valueOf(item, index)}`" :item="item" :index="index">{{ item.content }}</slot></div>
          </div>
        </Transition>
      </AccordionItem>
    </AccordionRoot>
  </div>
</template>
<style scoped lang="scss">
@use "../styles/navigation" as *;
.kima-accordion { @include navigation-root; &__item { margin-block: var(--kima-space-2); background: var(--kima-color-layer-1); border-radius: var(--kima-radius-m); padding: var(--kima-space-2); } &__heading { margin: 0; font: inherit; } &__trigger { width: 100%; justify-content: space-between; min-height: 56px; :deep(.kima-button__label) { width: 100%; justify-content: space-between; gap: var(--kima-space-4); white-space: normal; text-align: start; } } &__content { padding: var(--kima-space-4); line-height: 1.7; } }
.kima-accordion__arrow { flex: 0 0 auto; transition: transform var(--kima-duration-medium) var(--kima-curve-emphasized); }
.kima-accordion__arrow--expanded { transform: rotate(180deg); }
@media (prefers-reduced-motion: reduce) { .kima-accordion__arrow { transition: none; } }
</style>
