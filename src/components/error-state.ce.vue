<!-- 路由错误恢复：显式错误页，不冒充能跨自定义元素独立应用捕获后代异常的错误边界；retryHandler 失败会留在本页，resetKey 变化（例如路由键变化）重置本地重试状态。调用示例：<kima-error-state heading="页面加载失败" code="OFFLINE" :reset-key="routeKey" :retry-handler="load" @retry="load"> </kima-error-state> -->
<script setup>
import { computed, ref, watch } from 'vue';
import { AlertCircleIcon } from '@hugeicons/core-free-icons';
import KimaIcon from './icon.ce.vue';
import KimaButton from './button.ce.vue';
defineOptions({ inheritAttrs: false });
const props = defineProps({ heading: { type: String, default: '页面暂时无法加载' }, description: { type: String, default: '请检查连接后重试，或返回上一页。' }, code: { type: String, default: '' }, retryLabel: { type: String, default: '重试' }, retryHandler: Function, resetKey: { type: [String, Number], default: '' }, compact: Boolean });
const emit = defineEmits(['retry', 'recovered', 'error', 'reset']);
const pending = ref(false), attempts = ref(0), failure = ref('');
const hasActions = computed(() => typeof props.retryHandler === 'function');
let runId = 0;
async function retry() {
  if (pending.value) return;
  const run = ++runId;
  pending.value = true;
  failure.value = '';
  attempts.value += 1;
  emit('retry', attempts.value);
  try {
    if (hasActions.value) await props.retryHandler(attempts.value);
    if (run !== runId) return;
    emit('recovered', attempts.value);
  } catch (error) {
    if (run !== runId) return;
    failure.value = error instanceof Error ? error.message : String(error || '重试失败');
    emit('error', error);
  } finally { if (run === runId) pending.value = false; }
}
function reset() { runId += 1; pending.value = false; attempts.value = 0; failure.value = ''; emit('reset'); }
watch(() => props.resetKey, reset);
defineExpose({ retry, reset });
</script>
<template>
  <section class="kima-error-state" :class="{ 'kima-error-state--compact': compact }" role="alert" aria-live="assertive">
    <span class="kima-error-state__icon" role="img" aria-label="错误"><KimaIcon :icon="AlertCircleIcon" :size="40" /></span>
    <code v-if="code" class="kima-error-state__code">{{ code }}</code>
    <h2 class="kima-error-state__heading"><slot name="heading">{{ heading }}</slot></h2>
    <p class="kima-error-state__description"><slot name="fallback">{{ description }}</slot></p>
    <p v-if="failure" class="kima-error-state__failure" role="status">重试失败：{{ failure }}</p>
    <p v-else-if="attempts" class="kima-error-state__attempts" role="status">已尝试 {{ attempts }} 次</p>
    <div class="kima-error-state__actions">
      <slot name="actions">
        <KimaButton v-if="hasActions" :loading="pending" @click="retry">{{ retryLabel }}</KimaButton>
        <KimaButton v-else variant="tonal" @click="retry">{{ retryLabel }}</KimaButton>
      </slot>
    </div>
  </section>
</template>
<style scoped lang="scss">
@use '../styles/foundation' as *;
@use '../styles/mixins' as *;
.kima-error-state {
  @include foundation-base;
  display: grid;
  justify-items: center;
  gap: var(--kima-space-3);
  max-width: 560px;
  margin-inline: auto;
  padding: var(--kima-space-10) var(--kima-space-6);
  color: var(--kima-color-on-surface);
  text-align: center;
  font-family: var(--kima-font-family);
  &__icon { color: var(--kima-color-error); }
  &__code { padding: var(--kima-space-1) var(--kima-space-2); border-radius: var(--kima-radius-s); background: var(--kima-color-layer-2); color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-label-medium); }
  &__heading { margin: 0; font-size: var(--kima-font-size-title-large); line-height: var(--kima-line-height-tight); }
  &__description { max-width: 52ch; margin: 0; color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-body-medium); line-height: var(--kima-line-height-normal); }
  &__failure { margin: 0; color: var(--kima-color-error); font-size: var(--kima-font-size-label-medium); }
  &__attempts { margin: 0; color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-label-small); }
  &__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--kima-space-2); padding-top: var(--kima-space-2); }
  &--compact { padding: var(--kima-space-6); }
}
</style>
