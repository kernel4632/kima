<!--
分页：根据总条目数生成页码、前后按钮和省略号，当前页由 modelValue 控制。
total 是总条目数，pageSize 是每页条目数；modelValue 从 1 开始。
调用示例：
  <kima-pagination v-model="page" :total="240" :page-size="20" @change="loadPage" />
  <kima-pagination v-model="page" :total="240" compact sibling-count="1" />
-->
<script setup>
import { computed, getCurrentInstance, nextTick, ref, useAttrs, useHost, watch } from "vue";
import KimaIcon from "./icon.ce.vue";
import { activateMotionElement, presenceTransition, retireMotionElement } from "../utils/motion.js";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: {
    type: Number,
    default: 1,
  },
  total: {
    type: Number,
    default: 0,
  },
  pageSize: {
    type: Number,
    default: 10,
  },
  siblingCount: {
    type: Number,
    default: 1,
  },
  disabled: Boolean,
  compact: Boolean,
});

const emit = defineEmits(["update:modelValue", "change"]);
const attrs = useAttrs();
const host = getCurrentInstance()?.ce ? useHost() : null;
const forwardedAttrs = computed(() => host ? { ...attrs, id: undefined } : attrs);
const localPage = ref(1);
const pageButtons = new Map();

const safePageSize = computed(() => Number.isFinite(props.pageSize) && props.pageSize > 0 ? props.pageSize : 1);
const pageCount = computed(() => {
  if (!Number.isFinite(props.total) || props.total <= 0) return 0;
  return Math.ceil(props.total / safePageSize.value);
});
const currentPage = computed(() => pageCount.value ? clampPage(localPage.value, pageCount.value) : 0);
const safeSiblingCount = computed(() => Math.max(0, Math.floor(Number.isFinite(props.siblingCount) ? props.siblingCount : 0)));

const pageItems = computed(() => {
  const count = pageCount.value;
  if (!count) return [];

  const pages = new Set();
  const boundaryCount = Math.min(1, count);
  for (let page = 1; page <= boundaryCount; page += 1) pages.add(page);
  for (let page = Math.max(1, currentPage.value - safeSiblingCount.value); page <= Math.min(count, currentPage.value + safeSiblingCount.value); page += 1) pages.add(page);
  for (let page = Math.max(1, count - boundaryCount + 1); page <= count; page += 1) pages.add(page);

  const orderedPages = [...pages].sort((left, right) => left - right);
  const result = [];
  orderedPages.forEach((page, index) => {
    const previousPage = orderedPages[index - 1];
    if (previousPage && page - previousPage > 1) {
      result.push({ type: "ellipsis", key: `ellipsis-${previousPage}-${page}` });
    }
    result.push({ type: "page", page, key: `page-${page}` });
  });
  return result;
});

function clampPage(value, count = pageCount.value) {
  const page = Number.isFinite(value) ? Math.floor(value) : 1;
  return Math.max(1, Math.min(count, page));
}

const pageTransition = {
  onBeforeLeave(element) { retireMotionElement(element); element.removeAttribute("aria-current"); },
  onBeforeEnter(element) {
    activateMotionElement(element);
    if (Number(element.dataset.page) === currentPage.value) element.setAttribute("aria-current", "page");
  },
};

function setPageButton(page, element) {
  if (element) pageButtons.set(page, element);
  else pageButtons.delete(page);
}

function goTo(page) {
  if (props.disabled || !pageCount.value) return;
  const nextPage = clampPage(page);
  if (nextPage === currentPage.value) return;
  localPage.value = nextPage;
  emit("update:modelValue", nextPage);
  emit("change", nextPage);
}

function focusPage(page) {
  nextTick(() => pageButtons.get(page)?.focus());
}

function handlePageKeydown(page, event) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const pages = pageItems.value.filter((item) => item.type === "page").map((item) => item.page);
  const currentIndex = pages.indexOf(page);
  if (currentIndex < 0) return;

  event.preventDefault();
  if (event.key === "Home") focusPage(pages[0]);
  else if (event.key === "End") focusPage(pages[pages.length - 1]);
  else focusPage(pages[Math.max(0, Math.min(pages.length - 1, currentIndex + (event.key === "ArrowRight" ? 1 : -1)))]);
}

watch(() => props.modelValue, (value) => {
  localPage.value = pageCount.value ? clampPage(value) : 0;
}, { immediate: true });

watch(pageCount, (count) => {
  localPage.value = count ? clampPage(localPage.value, count) : 0;
}, { immediate: true });
</script>

<template>
  <Transition name="kima-content" v-bind="presenceTransition">
  <nav
    v-if="pageCount"
    v-bind="forwardedAttrs"
    class="kima-pagination"
    :class="{ 'kima-pagination--compact': compact, 'kima-pagination--disabled': disabled }"
    :aria-label="attrs['aria-label'] || '分页'"
    :aria-disabled="disabled || undefined"
  >
    <div class="kima-pagination__list">
      <button
        class="kima-pagination__button kima-pagination__button--direction"
        type="button"
        :tabindex="disabled ? -1 : 0"
        :disabled="disabled || currentPage <= 1"
        aria-label="上一页"
        @click="goTo(currentPage - 1)"
      >
        <KimaIcon :icon="ArrowLeft01Icon" :size="18" aria-hidden="true" />
      </button>

      <TransitionGroup name="kima-list" v-bind="pageTransition">
      <template v-for="item in pageItems" :key="item.key">
        <button
          v-if="item.type === 'page'"
          :ref="(element) => setPageButton(item.page, element)"
          class="kima-pagination__button"
          type="button"
          :tabindex="disabled ? -1 : 0"
          :aria-label="`第 ${item.page} 页`"
          :data-page="item.page"
          :aria-current="item.page === currentPage ? 'page' : undefined"
          :disabled="disabled"
          @click="goTo(item.page)"
          @keydown="handlePageKeydown(item.page, $event)"
        >
          {{ item.page }}
        </button>
        <span v-else class="kima-pagination__ellipsis" aria-hidden="true">…</span>
      </template>
      </TransitionGroup>

      <button
        class="kima-pagination__button kima-pagination__button--direction"
        type="button"
        :tabindex="disabled ? -1 : 0"
        :disabled="disabled || currentPage >= pageCount"
        aria-label="下一页"
        @click="goTo(currentPage + 1)"
      >
        <KimaIcon :icon="ArrowRight01Icon" :size="18" aria-hidden="true" />
      </button>
    </div>
  </nav>
  </Transition>
</template>

<style scoped lang="scss">
@use "../styles/mixins" as *;
.kima-pagination {
  display: flex;
  min-width: 0;
  justify-content: center;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-md);
}

.kima-pagination__list {
  display: flex;
  max-width: 100%;
  align-items: center;
  justify-content: center;
  gap: var(--kima-space-1);
  overflow-x: auto;
  padding: var(--kima-space-1);
}

.kima-pagination__button {
  display: inline-flex;
  min-width: 40px;
  min-height: 40px;
  flex: 0 0 40px;
  align-items: center;
  justify-content: center;
  padding: 0 var(--kima-space-2);
  border: 0;
  border-radius: var(--kima-radius-sm);
  box-sizing: border-box;
  color: var(--kima-color-on-surface);
  background: var(--kima-color-transparent);
  font: inherit;
  cursor: pointer;
  @include kima-state-layer;
  @include kima-ripple-host;
  @include kima-motion-colors;

  &:hover:not(:disabled),
  &:focus-visible {
    background: var(--kima-color-layer-3);
  }

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: 1px;
  }
  &[aria-current="page"] {
    color: var(--kima-color-on-primary-container);
    background: var(--kima-color-primary-container);
    font-weight: var(--kima-font-weight-bold);
  }

  /* 当前页被悬停时，底色从容器色派生，不落回通用悬停色：
   * 换回 layer-3 会让"容器文字 + 深灰底"配成一对，对比度就掉了。 */
  &[aria-current="page"]:hover:not(:disabled),
  &[aria-current="page"]:focus-visible {
    background: var(--kima-color-primary-container-hover);
  }

  &:disabled {
    color: var(--kima-color-on-surface-variant);
    cursor: not-allowed;
    opacity: var(--kima-opacity-disabled);
  }
}

.kima-pagination__button:is(.kima-list-enter-active, .kima-list-leave-active) {
  transition: opacity var(--kima-duration-medium) var(--kima-curve-standard),
    transform var(--kima-duration-medium) var(--kima-curve-emphasized);
}
.kima-pagination__button.kima-list-move {
  transition: transform var(--kima-duration-slow) var(--kima-curve-emphasized);
}

.kima-pagination__button--direction {
  color: var(--kima-color-primary);
}

.kima-pagination__ellipsis {
  display: inline-flex;
  min-width: 24px;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  color: var(--kima-color-on-surface-variant);
  user-select: none;
}

.kima-pagination--compact {
  .kima-pagination__button {
    min-width: 32px;
    min-height: 32px;
    flex-basis: 32px;
  }

  .kima-pagination__ellipsis {
    min-height: 32px;
  }
}

@media (max-width: 480px) {
  .kima-pagination__list {
    justify-content: flex-start;
  }
}
</style>
