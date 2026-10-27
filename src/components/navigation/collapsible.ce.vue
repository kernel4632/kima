<!-- 单块折叠：独立的可控内容展开区域，不承担手风琴列表联动。
调用示例：
  <kima-collapsible v-model:open="open" label="高级设置">更多设置</kima-collapsible>
-->
<script setup>
import { CollapsibleRoot, CollapsibleTrigger } from "reka-ui";
import { nextTick, ref, watch } from "vue";
import KimaButton from "../core/button.ce.vue";
import { collapseTransition } from "../../utils/motion.js";
import { useId } from "vue";
import { useNavigationModel, useNavigationRoot } from "../../utils/navigation.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ open: Boolean, disabled: Boolean, label: { type: String, default: "展开内容" } });
const emit = defineEmits(["update:open", "change"]);
const { root, forwardedAttrs } = useNavigationRoot();
const [localOpen, update] = useNavigationModel(props, "open", emit);
const contentId = `kima-collapsible-${useId()}`;
const content = ref(null);
const savedTabIndexes = new WeakMap();
function syncContentFocus() {
  const element = content.value;
  if (!element) return;
  for (const node of element.querySelectorAll('a,button,input,select,textarea,[tabindex]')) {
    if (!savedTabIndexes.has(node)) savedTabIndexes.set(node, node.getAttribute('tabindex'));
    if (localOpen.value) {
      const saved = savedTabIndexes.get(node);
      if (saved == null) node.removeAttribute('tabindex');
      else node.setAttribute('tabindex', saved);
    } else node.setAttribute('tabindex', '-1');
  }
}
watch(localOpen, () => nextTick(syncContentFocus), { immediate: true });
</script>
<template>
  <div ref="root" v-bind="forwardedAttrs" class="kima-collapsible">
    <CollapsibleRoot :open="localOpen" :disabled="disabled" @update:open="update">
      <CollapsibleTrigger as-child><KimaButton variant="text" :disabled="disabled" :aria-expanded="localOpen" :aria-controls="contentId"><slot name="trigger">{{ label }}</slot></KimaButton></CollapsibleTrigger>
      <!-- 保留插槽挂载：关闭时原生插槽内容也不会丢失。 -->
      <Transition :css="false" v-bind="collapseTransition">
        <div ref="content" v-show="localOpen" :id="contentId" :aria-hidden="!localOpen" :inert="!localOpen"><div class="kima-collapsible__content"><slot /></div></div>
      </Transition>
    </CollapsibleRoot>
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/navigation" as *;
.kima-collapsible { @include navigation-surface; &__content { padding: var(--kima-space-4); line-height: 1.7; } }
</style>
