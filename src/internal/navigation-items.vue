<script setup>
import { computed, useId } from 'vue';
import KimaLink from '../components/link.ce.vue';
import KimaButton from '../components/button.ce.vue';
import KimaIcon from '../components/icon.ce.vue';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { collapseTransition } from '../utils/motion.js';
import { navKey, navContains } from '../utils/shell.js';
const props = defineProps({ items: Array, modelValue: String, expanded: Array, disabled: Boolean });
const emit = defineEmits(['navigate', 'expand']);
const id = `kima-nav-${useId()}`;
const keys = computed(() => props.expanded || []);
function toggle(item) { const key = navKey(item); emit('expand', keys.value.includes(key) ? keys.value.filter((k) => k !== key) : [...keys.value, key]); }
function open(item) { return keys.value.includes(navKey(item)); }
function keydown(event, item) {
  if (event.target.closest('li') !== event.currentTarget || !item.children?.length || props.disabled || item.disabled) return;
  const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
  const expandKey = rtl ? 'ArrowLeft' : 'ArrowRight';
  if (event.key === expandKey) { event.preventDefault(); event.stopPropagation(); if (!open(item)) toggle(item); else event.currentTarget.querySelector('ul a, ul button')?.focus(); }
  if (event.key === (rtl ? 'ArrowRight' : 'ArrowLeft') && open(item)) { event.preventDefault(); event.stopPropagation(); toggle(item); event.currentTarget.querySelector('button')?.focus(); }
}
</script>
<template>
  <ul class="kima-shell-nav__list">
    <li v-for="(item, index) in items" :key="navKey(item)" :data-active="navContains(item, modelValue) || undefined" @keydown="keydown($event, item)">
      <div class="kima-shell-nav__row"><KimaLink v-if="item.href" :href="item.href" :target="item.target" :rel="item.rel" :disabled="disabled || item.disabled" :current="modelValue === navKey(item)" :underline="false" @navigate="emit('navigate', item, $event)">{{ item.label }}</KimaLink><span v-else>{{ item.label }}</span><KimaButton v-if="item.children?.length" variant="text" :disabled="disabled || item.disabled" :aria-label="`${open(item) ? '收起' : '展开'} ${item.label}`" :aria-expanded="open(item)" :aria-controls="`${id}-${index}`" @click="toggle(item)"><KimaIcon :icon="ArrowDown01Icon" :size="18" aria-hidden="true" :style="{transform: open(item) ? 'rotate(180deg)' : undefined}" /></KimaButton></div>
      <Transition v-if="item.children?.length" :css="false" v-bind="collapseTransition"><div v-show="open(item)" :id="`${id}-${index}`" :inert="!open(item)" :aria-hidden="!open(item) || undefined"><navigation-items :items="item.children" :model-value="modelValue" :expanded="expanded" :disabled="disabled || item.disabled" @navigate="(item, event) => emit('navigate', item, event)" @expand="emit('expand', $event)" /></div></Transition>
    </li>
  </ul>
</template>
