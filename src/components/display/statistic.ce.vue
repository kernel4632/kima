<!-- 统计数值：使用 Intl.NumberFormat，options 支持货币、百分比等格式。调用示例：<kima-statistic label="访问量" :value="12345.6" locale="zh-CN" :precision="1" suffix="次" /> -->
<script setup>
import { computed, ref, useAttrs } from "vue";
import { useNativeSlots } from "../../utils/native-slots.js";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  value: { type: [Number, String], default: 0 },
  label: { type: String, default: "" },
  locale: { type: String, default: "zh-CN" },
  precision: { type: Number, default: undefined },
  options: { type: Object, default: () => ({}) },
  prefix: { type: String, default: "" },
  suffix: { type: String, default: "" },
});
const attrs = useAttrs();
const root = ref(null);
const { isCustomElement } = useNativeSlots(root);
const formatted = computed(() => {
  const number = Number(props.value);
  if (!Number.isFinite(number)) return "—";
  const digits = Number.isFinite(props.precision) ? Math.min(20, Math.max(0, Math.floor(props.precision))) : undefined;
  const options = { ...props.options, ...(digits === undefined ? {} : { minimumFractionDigits: digits, maximumFractionDigits: digits }) };
  try { return new Intl.NumberFormat(props.locale, options).format(number); }
  catch { return new Intl.NumberFormat("zh-CN").format(number); }
});
</script>
<template>
  <div ref="root" v-bind="{ ...attrs, id: isCustomElement ? undefined : attrs.id }" class="kima-statistic">
    <div v-if="label" class="kima-statistic__label">{{ label }}</div>
    <div class="kima-statistic__value"><span class="kima-statistic__affix"><slot name="prefix">{{ prefix }}</slot></span><span>{{ formatted }}</span><span class="kima-statistic__affix"><slot name="suffix">{{ suffix }}</slot></span></div>
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/display" as *;
.kima-statistic {
  @include display-panel;
  &__label { color: var(--kima-color-on-surface-variant); margin-bottom: var(--kima-space-3); }
  &__value { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--kima-space-2); font-size: var(--kima-font-size-headline-large); line-height: var(--kima-line-height-tight); font-variant-numeric: tabular-nums; }
  &__affix { font-size: var(--kima-font-size-body-large); &:empty { display: none; } }
}
</style>
