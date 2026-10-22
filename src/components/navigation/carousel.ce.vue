<!-- 手动轮播：方向键、前后按钮、计数与可访问幻灯片，无自动轮播。
调用示例：
  <kima-carousel v-model="index" :items="[{ title: '设计', content: '体验优先' }, { title: '交互', content: '键盘可达' }]" />
-->
<script setup>
import { computed, useId } from "vue";
import KimaButton from "../core/button.ce.vue";
import { useNavigationModel, useNavigationRoot } from "../../utils/navigation.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ modelValue: { type: Number, default: 0 }, items: { type: Array, default: () => [] }, loop: Boolean, disabled: Boolean, label: { type: String, default: "内容轮播" } });
const emit = defineEmits(["update:modelValue", "change"]);
const { root, forwardedAttrs } = useNavigationRoot();
const [local, update] = useNavigationModel(props, "modelValue", emit);
const id = `kima-carousel-${useId()}`;
const current = computed(() => Math.max(0, Math.min(props.items.length - 1, Math.trunc(Number(local.value) || 0))));
const previousDisabled = computed(() => props.disabled || props.items.length < 2 || (!props.loop && current.value === 0));
const nextDisabled = computed(() => props.disabled || props.items.length < 2 || (!props.loop && current.value === props.items.length - 1));
function content(item) { return item && typeof item === "object" ? item.content ?? item.label ?? "" : item; }
function move(delta) { if ((delta < 0 && previousDisabled.value) || (delta > 0 && nextDisabled.value)) return; update((current.value + delta + props.items.length) % props.items.length); }
function keydown(event) {
  if (props.disabled || !props.items.length || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
  if (event.target.closest('input,textarea,select,a,[contenteditable="true"]')) return;
  const rtl = getComputedStyle(root.value).direction === "rtl";
  if (event.key === "ArrowRight") move(rtl ? -1 : 1);
  else if (event.key === "ArrowLeft") move(rtl ? 1 : -1);
  else if (event.key === "Home") update(0);
  else if (event.key === "End") update(props.items.length - 1);
  else return;
  event.preventDefault();
}
</script>
<template>
  <section ref="root" v-bind="forwardedAttrs" class="kima-carousel" role="region" aria-roledescription="轮播" :aria-label="label" tabindex="0" @keydown="keydown">
    <div :id="id" class="kima-carousel__viewport">
      <Transition v-for="(item, index) in items" :key="item.value ?? index" name="kima-fade">
        <div v-show="current === index" class="kima-carousel__slide" role="group" aria-roledescription="幻灯片" :aria-label="`第 ${index + 1} 张，共 ${items.length} 张`" :aria-hidden="current !== index" :inert="current !== index">
          <slot :name="`slide-${index}`" :item="item" :index="index"><h3 v-if="item.title">{{ item.title }}</h3><p v-if="content(item)">{{ content(item) }}</p></slot>
        </div>
      </Transition>
      <p v-if="!items.length">暂无内容</p>
    </div>
    <div class="kima-carousel__controls"><KimaButton variant="tonal" :disabled="previousDisabled" :aria-controls="id" aria-label="上一张" @click="move(-1)">上一张</KimaButton><output aria-live="polite" aria-atomic="true">{{ items.length ? current + 1 : 0 }} / {{ items.length }}</output><KimaButton variant="tonal" :disabled="nextDisabled" :aria-controls="id" aria-label="下一张" @click="move(1)">下一张</KimaButton></div><slot />
  </section>
</template>
<style scoped lang="scss">
@use "../../styles/navigation" as *;
@use "../../styles/mixins" as *;
.kima-carousel { @include navigation-surface; @include kima-focus-ring; &__viewport { padding: var(--kima-space-6); min-height: 180px; box-sizing: border-box; background: var(--kima-color-layer-1); border-radius: var(--kima-radius-m); overflow-wrap: anywhere; } &__controls { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--kima-space-3); margin-top: var(--kima-space-4); } }
.kima-carousel__viewport { display: grid; }
.kima-carousel__slide { grid-area: 1 / 1; min-width: 0; }
</style>
