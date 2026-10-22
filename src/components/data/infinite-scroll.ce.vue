<!-- 无限加载：请求由 load-more async 回调负责；组件保证同一时刻只有一个请求，并提供按钮替代观察器。 -->
<script setup>
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, useAttrs, useHost, watch } from "vue";
import { presenceTransition } from "../../utils/motion.js";
import KimaSpinner from "../display/spinner.ce.vue";
import KimaButton from "../core/button.ce.vue";

 defineOptions({ inheritAttrs: false });
const props = defineProps({
  disabled: Boolean,
  finished: Boolean,
  observe: { type: Boolean, default: true },
  threshold: { type: Number, default: 160 },
  loadMore: { type: Function, default: null },
  loadingLabel: { type: String, default: "正在加载更多" },
  finishLabel: { type: String, default: "没有更多内容" },
  errorLabel: { type: String, default: "加载失败" },
  retryLabel: { type: String, default: "重试加载" },
  buttonLabel: { type: String, default: "加载更多" },
});
const emit = defineEmits(["load", "error", "finish"]);
const attrs = useAttrs();
const host = getCurrentInstance()?.ce ? useHost() : null;
const root = ref(null);
const sentinel = ref(null);
const loading = ref(false);
const error = ref(null);
const localFinished = ref(props.finished);
let observer;
const hasLoader = computed(() => typeof props.loadMore === "function");
const forwardedAttrs = computed(() => host ? { ...attrs, id: undefined } : attrs);

async function requestLoad() {
  if (loading.value || props.disabled || localFinished.value || !hasLoader.value) return;
  loading.value = true;
  error.value = null;
  emit("load");
  try {
    const result = await props.loadMore();
    if (result === false) {
      localFinished.value = true;
      emit("finish");
    }
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason || props.errorLabel);
    emit("error", reason);
  } finally {
    loading.value = false;
  }
}
function retry() { requestLoad(); }
function observe() {
  observer?.disconnect();
  const View = root.value?.ownerDocument?.defaultView;
  if (!props.observe || !View?.IntersectionObserver || !sentinel.value) return;
  observer = new View.IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) requestLoad();
  }, { root: root.value, rootMargin: `${Math.max(0, Number(props.threshold) || 0)}px` });
  observer.observe(sentinel.value);
}
watch(() => props.finished, (value) => { localFinished.value = value; });
watch(() => [props.observe, props.loadMore], observe);
onMounted(observe);
onBeforeUnmount(() => observer?.disconnect());
</script>
<template>
  <div ref="root" v-bind="forwardedAttrs" class="kima-infinite-scroll" role="region" :aria-busy="loading || undefined">
    <slot />
    <div ref="sentinel" class="kima-infinite-scroll__status" aria-live="polite">
      <Transition name="kima-fade" v-bind="presenceTransition">
      <KimaSpinner v-if="loading" key="loading" :label="loadingLabel" />
      <p v-else-if="error" key="error" class="kima-infinite-scroll__error" role="alert">{{ errorLabel }}<span v-if="error !== errorLabel">：{{ error }}</span></p>
      <p v-else-if="localFinished" key="finished" class="kima-infinite-scroll__finished">{{ finishLabel }}</p>
      <KimaButton v-else key="idle" variant="tonal" :disabled="disabled || !hasLoader" @click="requestLoad">{{ buttonLabel }}</KimaButton>
      </Transition>
      <KimaButton v-if="error" variant="text" @click="retry">{{ retryLabel }}</KimaButton>
    </div>
  </div>
</template>
<style scoped lang="scss">
.kima-infinite-scroll { min-width: 0; color: var(--kima-color-on-surface); font-family: var(--kima-font-family); }
.kima-infinite-scroll__status { display: flex; min-height: var(--kima-touch-target); align-items: center; justify-content: center; flex-wrap: wrap; gap: var(--kima-space-3); padding: var(--kima-space-4); color: var(--kima-color-on-surface-variant); text-align: center; }
.kima-infinite-scroll__status p { margin: 0; }
.kima-infinite-scroll__error { color: var(--kima-color-error); }
</style>
