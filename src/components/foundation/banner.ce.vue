<!-- 持久行内横幅：留在文档流中，不自动消失；可关闭并可通过 restore() 恢复，open 支持 v-model。调用示例：<kima-banner heading="只读维护" variant="warning" closable>今晚 22:00 恢复写入。</kima-banner> -->
<script setup>
import { computed, ref, watch } from 'vue';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import KimaIcon from '../core/icon.ce.vue';
import KimaButton from '../core/button.ce.vue';
import { displayStatus } from '../../utils/display-status.js';
import { useNativeSlots } from '../../utils/native-slots.js';
import { collapseTransition } from '../../utils/motion.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ open: { type: Boolean, default: true }, variant: { type: String, default: 'info' }, heading: { type: String, default: '' }, description: { type: String, default: '' }, closable: Boolean, dismissLabel: { type: String, default: '关闭横幅' } });
const emit = defineEmits(['update:open', 'dismiss', 'restore']);
const root = ref(null);
const { hasNativeSlot, isCustomElement } = useNativeSlots(root);
const visible = ref(props.open);
watch(() => props.open, (value) => { visible.value = value; });
const status = computed(() => displayStatus(props.variant));
function dismiss() { if (!visible.value) return; visible.value = false; emit('update:open', false); emit('dismiss'); }
function restore() { if (visible.value) return; visible.value = true; emit('update:open', true); emit('restore'); }
defineExpose({ dismiss, restore });
</script>
<template>
  <Transition :css="false" v-bind="collapseTransition">
    <div v-show="visible" class="kima-banner__clip" :inert="!visible" :aria-hidden="!visible || undefined">
      <section ref="root" class="kima-banner" :data-variant="status.variant" :role="['danger', 'warning'].includes(status.variant) ? 'alert' : 'status'">
        <span class="kima-banner__icon" role="img" :aria-label="status.label"><KimaIcon :icon="status.icon" :size="24" /></span>
        <div class="kima-banner__body">
          <strong v-if="heading" class="kima-banner__heading">{{ heading }}</strong>
          <div class="kima-banner__content"><slot>{{ description }}</slot></div>
          <div v-if="$slots.action || hasNativeSlot('action') || isCustomElement" class="kima-banner__action"><slot name="action" /></div>
        </div>
        <KimaButton v-if="closable" variant="text" class="kima-banner__close" :aria-label="dismissLabel" @click="dismiss"><KimaIcon :icon="Cancel01Icon" :size="20" aria-hidden="true" /></KimaButton>
      </section>
    </div>
  </Transition>
</template>
<style scoped lang="scss">
@use '../../styles/display' as *;
@use '../../styles/mixins' as *;
/* 收起动画作用在这个外壳上：它必须占满宽度，
 * 否则关闭横幅时外壳按新的内容宽度收缩，整块会瞬间变窄。 */
.kima-banner__clip {
  @include kima-block-host;
}

.kima-banner {
  @include display-panel;
  @include display-tones;
  display: flex;
  align-items: flex-start;
  gap: var(--kima-space-3);
  padding: var(--kima-space-4) var(--kima-space-5);
  &__icon { display: inline-flex; flex: 0 0 auto; padding-top: var(--kima-space-1); color: var(--kima-display-tone); }
  &__body { display: grid; flex: 1 1 auto; gap: var(--kima-space-1); min-width: 0; }
  &__heading { font-size: var(--kima-font-size-title-small); }
  &__content { color: var(--kima-color-on-surface); font-size: var(--kima-font-size-body-medium); line-height: var(--kima-line-height-normal); }
  &__action { display: flex; flex-wrap: wrap; gap: var(--kima-space-2); padding-top: var(--kima-space-2); &:empty { display: none; } }
  &__close { flex: 0 0 auto; min-width: var(--kima-touch-target); padding: 0; color: inherit; }
}
</style>
