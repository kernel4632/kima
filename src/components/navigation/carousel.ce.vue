<!-- 手动轮播：方向键、前后按钮、计数与可访问幻灯片，无自动轮播。
调用示例：
  <kima-carousel v-model="index" :items="[{ title: '设计', content: '体验优先' }, { title: '交互', content: '键盘可达' }]" />
-->
<script setup>
import { computed, ref, useId, watch } from "vue";
import KimaIconButton from "../core/icon-button.ce.vue";
import KimaTooltip from "../core/tooltip.ce.vue";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { useContentMotion } from "../../utils/content-motion.js";
import { freezeLeaveLayout, presenceTransition } from "../../utils/motion.js";
import { useNavigationModel, useNavigationRoot } from "../../utils/navigation.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ modelValue: { type: Number, default: 0 }, items: { type: Array, default: () => [] }, loop: Boolean, disabled: Boolean, label: { type: String, default: "内容轮播" } });
const emit = defineEmits(["update:modelValue", "change"]);
const { root, forwardedAttrs } = useNavigationRoot();
const [local, update] = useNavigationModel(props, "modelValue", emit);
const id = `kima-carousel-${useId()}`;
const viewport = ref(null);
const direction = ref("forward");
const current = computed(() => Math.max(0, Math.min(props.items.length - 1, Math.trunc(Number(local.value) || 0))));
const currentItem = computed(() => props.items[current.value]);
const transitionName = computed(() => `kima-carousel-${direction.value}`);
let requestedDirection = null;
watch(current, (next, previous) => {
  const delta = next - previous;
  if (requestedDirection) direction.value = requestedDirection;
  else if (Math.abs(delta) === 1) direction.value = delta > 0 ? "forward" : "backward";
  requestedDirection = null;
}, { flush: "sync" });
/* 水平位移表达“上一张/下一张”，高度仍由共用内容工具单独负责。 */
useContentMotion(viewport, () => current.value, { opacity: false });
const previousDisabled = computed(() => props.disabled || props.items.length < 2 || (!props.loop && current.value === 0));
const nextDisabled = computed(() => props.disabled || props.items.length < 2 || (!props.loop && current.value === props.items.length - 1));
function content(item) { return item && typeof item === "object" ? item.content ?? item.label ?? "" : item; }
function select(index, motionDirection = index >= current.value ? "forward" : "backward") {
  if (index === current.value) return;
  requestedDirection = motionDirection;
  update(index);
}
function move(delta) {
  if ((delta < 0 && previousDisabled.value) || (delta > 0 && nextDisabled.value)) return;
  select((current.value + delta + props.items.length) % props.items.length, delta > 0 ? "forward" : "backward");
}
function keydown(event) {
  if (props.disabled || !props.items.length || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
  if (event.target.closest('input,textarea,select,a,[contenteditable="true"]')) return;
  const rtl = getComputedStyle(root.value).direction === "rtl";
  if (event.key === "ArrowRight") move(rtl ? -1 : 1);
  else if (event.key === "ArrowLeft") move(rtl ? 1 : -1);
  else if (event.key === "Home") select(0, "backward");
  else if (event.key === "End") select(props.items.length - 1, "forward");
  else return;
  event.preventDefault();
}
</script>
<template>
  <section ref="root" v-bind="forwardedAttrs" class="kima-carousel" role="region" aria-roledescription="轮播" :aria-label="label" tabindex="0" @keydown="keydown">
    <div :id="id" ref="viewport" class="kima-carousel__viewport">
      <Transition :name="transitionName" v-bind="{ ...presenceTransition, onBeforeLeave: freezeLeaveLayout }">
        <div v-if="items.length" :key="current" class="kima-carousel__slide" role="group" aria-roledescription="幻灯片" :aria-label="`第 ${current + 1} 张，共 ${items.length} 张`">
          <slot :name="`slide-${current}`" :item="currentItem" :index="current"><h3 v-if="currentItem?.title">{{ currentItem.title }}</h3><p v-if="content(currentItem)">{{ content(currentItem) }}</p></slot>
        </div>
      </Transition>
      <p v-if="!items.length">暂无内容</p>
    </div>
    <div class="kima-carousel__controls">
      <KimaTooltip text="上一张" position="right"><KimaIconButton class="kima-carousel__previous" :icon="ArrowLeft01Icon" variant="tonal" :disabled="previousDisabled" :aria-controls="id" label="上一张" @click="move(-1)" /></KimaTooltip>
      <output aria-live="polite" aria-atomic="true">{{ items.length ? current + 1 : 0 }} / {{ items.length }}</output>
      <KimaTooltip text="下一张" position="left"><KimaIconButton class="kima-carousel__next" :icon="ArrowRight01Icon" variant="tonal" :disabled="nextDisabled" :aria-controls="id" label="下一张" @click="move(1)" /></KimaTooltip>
    </div><slot />
  </section>
</template>
<style scoped lang="scss">
@use "../../styles/navigation" as *;
@use "../../styles/mixins" as *;
.kima-carousel { @include navigation-surface; @include kima-focus-ring; &__viewport { position: relative; padding: var(--kima-space-6); min-height: 180px; box-sizing: border-box; background: var(--kima-color-layer-1); border-radius: var(--kima-radius-m); overflow: hidden; overflow-wrap: anywhere; } &__controls { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--kima-space-3); margin-top: var(--kima-space-4); } }
.kima-carousel__viewport { display: grid; }
.kima-carousel__slide { grid-area: 1 / 1; min-width: 0; }
.kima-carousel-forward-enter-active,
.kima-carousel-forward-leave-active,
.kima-carousel-backward-enter-active,
.kima-carousel-backward-leave-active { transition: transform var(--kima-duration-slower) var(--kima-curve-emphasized), opacity var(--kima-duration-medium) var(--kima-curve-standard); }
.kima-carousel-forward-enter-from { opacity: 0; transform: translateX(24px); }
.kima-carousel-forward-leave-to { opacity: 0; transform: translateX(-24px); }
.kima-carousel-backward-enter-from { opacity: 0; transform: translateX(-24px); }
.kima-carousel-backward-leave-to { opacity: 0; transform: translateX(24px); }
/* 前后方向随 RTL 排布镜像，和已有方向键逻辑一致。 */
.kima-carousel:dir(rtl) :deep(.kima-carousel__previous svg),
.kima-carousel:dir(rtl) :deep(.kima-carousel__next svg) { transform: scaleX(-1); }
/* 旧页脱离排版后仍保留视口内的原始坐标，避免换行宽度被外层容器改变。 */
</style>
