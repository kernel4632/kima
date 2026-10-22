<!-- 文本高亮：text 与 keywords 只作纯文本处理，关键词不是正则表达式。调用示例：<kima-highlight text="KIMA 让交互鲜活" :keywords="['KIMA', '交互']" /> -->
<script setup>
import { computed, ref, useAttrs } from "vue";
import { useNativeSlots } from "../../utils/native-slots.js";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  text: { type: String, default: "" },
  keywords: { type: [String, Array], default: "" },
  caseSensitive: Boolean,
});
const attrs = useAttrs();
const root = ref(null);
const { isCustomElement } = useNativeSlots(root);
const segments = computed(() => {
  const words = [...new Set((Array.isArray(props.keywords) ? props.keywords : [props.keywords]).filter((word) => typeof word === "string" && word.length))].sort((a, b) => b.length - a.length);
  if (!words.length) return [{ text: props.text, marked: false }];
  const escape = (word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(words.map(escape).join("|"), props.caseSensitive ? "gu" : "giu");
  const result = [];
  let end = 0;
  for (const match of props.text.matchAll(pattern)) {
    if (match.index > end) result.push({ text: props.text.slice(end, match.index), marked: false });
    result.push({ text: match[0], marked: true });
    end = match.index + match[0].length;
  }
  if (end < props.text.length) result.push({ text: props.text.slice(end), marked: false });
  return result;
});
</script>
<template>
  <span ref="root" v-bind="{ ...attrs, id: isCustomElement ? undefined : attrs.id }" class="kima-highlight"><template v-for="(segment, index) in segments" :key="index"><mark v-if="segment.marked">{{ segment.text }}</mark><template v-else>{{ segment.text }}</template></template></span>
</template>
<style scoped lang="scss">
@use "../../styles/display" as *;
.kima-highlight { @include display-base; white-space: pre-wrap; mark { border-radius: var(--kima-radius-xs); color: var(--kima-color-on-primary-container); background: var(--kima-color-primary-container); } }
</style>
