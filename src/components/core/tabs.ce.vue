<!--
标签页：提供带底部指示条的标签栏、方向键切换和可访问的内容面板。
调用示例：
  <kima-tabs v-model="current" :items="tabs">
    <template #panel="{ item }">{{ item.content }}</template>
  </kima-tabs>
-->
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from "vue";
import { presenceTransition } from "../../utils/motion.js";
import { useContentMotion } from "../../utils/content-motion.js";

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean, Object, Array],
    default: null,
  },
  items: {
    type: Array,
    default: () => [],
  },
  orientation: {
    type: String,
    default: "horizontal",
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

// 键盘直接聚焦组件自己的按钮，宿主是否使用 Shadow DOM 都能工作。
const tabButtons = ref([]);
const tabList = ref(null);
const panels = ref(null);
const markerStyle = ref({ opacity: 0 });
const markerReady = ref(false);
let markerObserver;
let markerFrame;
function measureMarker() {
  const button = tabButtons.value[activeIndex.value];
  if (!tabList.value || !button) { markerStyle.value = { opacity: 0 }; return; }
  const vertical = tabOrientation.value === "vertical";
  markerStyle.value = {
    opacity: 1,
    width: vertical ? "var(--kima-tabs-indicator-height)" : `${Math.min(40, button.offsetWidth)}px`,
    height: vertical ? "24px" : "var(--kima-tabs-indicator-height)",
    transform: vertical
      ? `translate(${button.offsetLeft + button.offsetWidth}px, ${button.offsetTop + button.offsetHeight / 2}px) translate(-100%, -50%)`
      : `translate(${button.offsetLeft + button.offsetWidth / 2}px, ${button.offsetTop + button.offsetHeight}px) translate(-50%, -100%)`,
  };
  for (const element of tabButtons.value) if (element) markerObserver?.observe(element);
}
onMounted(() => {
  const view = tabList.value.ownerDocument.defaultView;
  if (view.ResizeObserver) {
    markerObserver = new view.ResizeObserver(measureMarker);
    markerObserver.observe(tabList.value);
  }
  measureMarker();
  markerFrame = view.requestAnimationFrame(() => { markerReady.value = true; });
});
onBeforeUnmount(() => {
  markerObserver?.disconnect();
  tabList.value?.ownerDocument.defaultView.cancelAnimationFrame(markerFrame);
});
const localValue = shallowRef(props.modelValue);
const tabsId = `kima-tabs-${useId()}`;

const tabOrientation = computed(() => props.orientation === "vertical" ? "vertical" : "horizontal");
const activeIndex = computed(() => {
  const selected = props.items.findIndex((item) => Object.is(itemValue(item), localValue.value) && !itemDisabled(item));
  if (selected >= 0) return selected;
  return props.items.findIndex((item) => !itemDisabled(item));
});

/* 各面板高度不一样：换标签时如果只让面板淡入，整块高度会一帧跳到位。
 * 这里只补高度，淡入仍由面板自己的 kima-content 负责。 */
useContentMotion(panels, () => activeIndex.value, { opacity: false });

function itemValue(item) {
  return item && typeof item === "object" && Object.prototype.hasOwnProperty.call(item, "value")
    ? item.value
    : item;
}

function itemLabel(item) {
  if (item && typeof item === "object") {
    return String(item.label ?? item.text ?? item.title ?? item.value ?? "");
  }
  return String(item ?? "");
}

function itemDisabled(item) {
  return Boolean(item && typeof item === "object" && item.disabled);
}

function selectItem(item) {
  if (itemDisabled(item)) return;
  const value = itemValue(item);
  if (Object.is(value, localValue.value)) return;
  localValue.value = value;
  emit("update:modelValue", value);
  emit("change", value);
}

function enabledIndexFrom(start, step) {
  const count = props.items.length;
  if (!count) return -1;
  let index = start;
  for (let attempts = 0; attempts < count; attempts += 1) {
    if (index >= 0 && index < count && !itemDisabled(props.items[index])) return index;
    index = (index + step + count) % count;
  }
  return -1;
}

function focusAndSelect(index) {
  if (index < 0) return;
  const item = props.items[index];
  nextTick(() => tabButtons.value[index]?.focus());
  selectItem(item);
}

function handleKeydown(index, event) {
  if (event.isComposing) return;
  const horizontal = tabOrientation.value === "horizontal";
  const rtl = horizontal && tabList.value && getComputedStyle(tabList.value).direction === "rtl";
  const forward = horizontal ? event.key === (rtl ? "ArrowLeft" : "ArrowRight") : event.key === "ArrowDown";
  const backward = horizontal ? event.key === (rtl ? "ArrowRight" : "ArrowLeft") : event.key === "ArrowUp";

  if (event.key === "Home") {
    event.preventDefault();
    focusAndSelect(enabledIndexFrom(0, 1));
    return;
  }
  if (event.key === "End") {
    event.preventDefault();
    focusAndSelect(enabledIndexFrom(props.items.length - 1, -1));
    return;
  }
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    selectItem(props.items[index]);
    return;
  }
  if (!forward && !backward) return;

  event.preventDefault();
  const step = forward ? 1 : -1;
  focusAndSelect(enabledIndexFrom((index + step + props.items.length) % props.items.length, step));
}

watch(() => props.modelValue, (value) => { localValue.value = value; });
watch(() => [activeIndex.value, tabOrientation.value, props.items], () => nextTick(measureMarker), { deep: true, flush: "post" });
</script>

<template>
  <div
    class="kima-tabs"
    :class="`kima-tabs--${tabOrientation}`"
  >
    <div ref="tabList" class="kima-tabs__list" role="tablist" :aria-orientation="tabOrientation">
      <span class="kima-tabs__marker" :class="{ 'kima-tabs__marker--ready': markerReady }" :style="markerStyle" aria-hidden="true" />
      <button
        v-for="(item, index) in items"
        :id="`${tabsId}-tab-${index}`"
        :key="itemValue(item) ?? index"
        :ref="(element) => { tabButtons[index] = element; }"
        class="kima-tabs__tab"
        type="button"
        role="tab"
        :aria-selected="index === activeIndex"
        :aria-controls="`${tabsId}-panel-${index}`"
        :aria-disabled="itemDisabled(item) || undefined"
        :disabled="itemDisabled(item)"
        :tabindex="index === activeIndex ? 0 : -1"
        @click="selectItem(item)"
        @keydown="handleKeydown(index, $event)"
      >
        <slot name="tab" :item="item" :index="index" :selected="index === activeIndex">
          {{ itemLabel(item) }}
        </slot>
      </button>
    </div>

    <div ref="panels" class="kima-tabs__panels">
      <Transition v-for="(item, index) in items" :key="itemValue(item) ?? index" name="kima-content" v-bind="presenceTransition">
        <section v-show="index === activeIndex" :id="`${tabsId}-panel-${index}`" class="kima-tabs__panel" role="tabpanel" :aria-labelledby="`${tabsId}-tab-${index}`" :inert="index !== activeIndex" :aria-hidden="index !== activeIndex || undefined" :tabindex="index === activeIndex ? 0 : -1">
          <slot name="panel" :item="item" :index="index" :value="itemValue(item)">
            <slot :item="item" :index="index" :value="itemValue(item)" />
          </slot>
        </section>
      </Transition>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kima-tabs {
  --kima-tabs-height: var(--kima-tab-height);
  --kima-tabs-gap: var(--kima-space-4);
  --kima-tabs-indicator-height: var(--kima-tab-indicator-height);

  display: flex;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);

  &--horizontal {
    flex-direction: column;
  }

  &--vertical {
    --kima-tabs-height: 48px;
    flex-direction: row;
    gap: var(--kima-tabs-gap);
  }
}

.kima-tabs__list {
  position: relative;
  display: flex;
  min-width: 0;
  /* 标签属于同一条导航栏，用透明表面归组，不用贯穿的分割线。 */
  padding: var(--kima-space-1);
  border-radius: var(--kima-radius-m);
  background: var(--kima-color-layer-1);

  .kima-tabs--vertical & {
    flex-direction: column;
    width: min(180px, 35%);
    flex: 0 0 min(180px, 35%);
    align-self: flex-start;
  }
}

.kima-tabs__tab {
  box-sizing: border-box;
  position: relative;
  display: inline-flex;
  min-width: 64px;
  min-height: var(--kima-tabs-height);
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  padding: var(--kima-space-2) var(--kima-space-3);
  border: 0;
  border-radius: var(--kima-radius-s);
  color: var(--kima-color-on-surface-variant);
  background: var(--kima-color-transparent);
  font: inherit;
  font-size: var(--kima-font-size-medium);
  font-weight: var(--kima-font-weight-medium);
  white-space: normal;
  overflow-wrap: anywhere;
  cursor: pointer;
  transition:
    color var(--kima-duration-effects) var(--kima-ease-effects),
    background-color var(--kima-duration-effects) var(--kima-ease-effects);

  /* 只改变轻状态底色，选中项与未选中项的文字都保持原配色。 */
  &:hover:not(:disabled) {
    background: var(--kima-color-layer-1);
  }

  &:active:not(:disabled) {
    background: var(--kima-color-layer-2);
  }

  &:focus-visible {
    outline: var(--kima-focus-ring-width) solid var(--kima-color-primary);
    outline-offset: var(--kima-focus-ring-offset);
  }

  &[aria-selected="true"] {
    color: var(--kima-color-primary);

  }

  &:disabled {
    cursor: not-allowed;
    color: var(--kima-color-on-surface-38);
  }

  .kima-tabs--vertical & {
    flex: 0 0 auto;
    min-height: 48px;
    justify-content: flex-start;

  }
}

.kima-tabs__panels { position: relative; display: grid; flex: 1 1 auto; min-width: 0; }

/* 退场面板脱离排版：否则它会在淡出的这段时间里继续占着格子的高度，
 * 新面板进来后整块高度先按高的算，等淡出结束才塌下去——看起来就是"突然变矮"。
 * 绝对定位后容器立刻等于新面板的高度，高度过渡才接得上。 */
.kima-tabs__panel.kima-content-leave-active {
  position: absolute;
  inset-block-start: 0;
  inset-inline: 0;
  /* 退场先结束，避免 50% 帧新旧文字叠在一起；承载区高度仍由 useContentMotion 补间。 */
  transition-duration: var(--kima-duration-fast);
}
.kima-tabs__marker { position: absolute; top: 0; left: 0; pointer-events: none; background: var(--kima-color-primary); border-radius: var(--kima-radius-full); }
.kima-tabs__marker--ready { transition: transform var(--kima-duration-slow) var(--kima-curve-emphasized), width var(--kima-duration-slow) var(--kima-curve-emphasized), height var(--kima-duration-slow) var(--kima-curve-emphasized), opacity var(--kima-duration-effects) var(--kima-curve-standard); }
.kima-tabs__panel {
  grid-area: 1 / 1;
  align-self: start;
  min-width: 0;
  flex: 1 1 auto;
  padding-top: var(--kima-tabs-gap);
  outline: none;

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: 2px;
  }

  .kima-tabs--vertical & {
    padding-top: 0;
  }
}

@media (max-width: 560px) {
  .kima-tabs__tab {
    padding-inline: var(--kima-space-2);
    font-size: var(--kima-font-size-sm);
  }
}
</style>
