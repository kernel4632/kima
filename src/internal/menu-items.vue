<script setup>
import { computed, reactive } from 'vue';
import * as Reka from 'reka-ui';
import KimaIcon from '../components/core/icon.ce.vue';
import { ArrowRight01Icon, Tick01Icon } from '@hugeicons/core-free-icons';
import { presenceTransition } from '../utils/motion.js';
const props = defineProps({ items: Array, family: { type: String, default: 'DropdownMenu' }, checked: Object, modelValue: null, selection: Boolean, disabled: Boolean });
const emit = defineEmits(['select', 'check']);
const opened = reactive({});
function closeSub(event, index) {
  if (event.target.closest('[data-kima-submenu]') !== event.currentTarget) return;
  const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
  if (event.key !== 'Escape' && event.key !== (rtl ? 'ArrowRight' : 'ArrowLeft')) return;
  event.preventDefault(); event.stopImmediatePropagation(); event.stopPropagation();
  const trigger = event.currentTarget.ownerDocument.getElementById(event.currentTarget.getAttribute('aria-labelledby'));
  opened[index] = false;
  trigger?.focus();
}
const part = computed(() => Object.fromEntries(['Sub', 'SubTrigger', 'SubContent', 'Item', 'CheckboxItem', 'RadioGroup', 'RadioItem', 'Separator'].map((name) => [name, Reka[`${props.family}${name}`]])));
function selected(item) { return item.type === 'checkbox' ? (props.checked?.[item.value] ?? item.checked ?? false) : item.type === 'radio' ? Object.is(props.checked?.[item.group || 'default'], item.value) : props.selection && Object.is(props.modelValue, item.value); }
function choose(item, event) { if (props.disabled || item.disabled) { event.preventDefault(); return; } if (item.type === 'checkbox' || item.type === 'radio') event.preventDefault(); else emit('select', item); }
</script>
<template>
  <template v-for="(item, index) in items" :key="item.value ?? index">
    <component :is="part.Separator" v-if="item.type === 'separator'" class="kima-shell-menu__separator" />
    <component :is="part.Sub" v-else-if="item.children?.length" v-model:open="opened[index]">
      <component :is="part.SubTrigger" class="kima-shell-menu__item" :disabled="disabled || item.disabled" :text-value="item.label"><span>{{ item.label }}</span><KimaIcon :icon="ArrowRight01Icon" :size="18" aria-hidden="true" /></component>
      <Transition name="kima-popup" v-bind="presenceTransition"><component :is="part.SubContent" class="kima-shell-menu__popup" data-kima-submenu :side-offset="4" :collision-padding="12" position-strategy="fixed" loop @keydown.capture="closeSub($event, index)">
        <menu-items :items="item.children" :family="family" :checked="checked" :model-value="modelValue" :selection="selection" :disabled="disabled || item.disabled" @select="emit('select', $event)" @check="(item, value) => emit('check', item, value)" />
      </component></Transition>
    </component>
    <component :is="part.CheckboxItem" v-else-if="item.type === 'checkbox'" class="kima-shell-menu__item" :disabled="disabled || item.disabled" :model-value="selected(item)" :text-value="item.label" @select="choose(item, $event)" @update:model-value="emit('check', item, $event)"><span>{{ item.label }}</span><KimaIcon v-if="selected(item)" :icon="Tick01Icon" :size="18" aria-hidden="true" /></component>
    <component :is="part.RadioGroup" v-else-if="item.type === 'radio'" :model-value="checked?.[item.group || 'default']" :aria-label="item.group || 'default'" @update:model-value="emit('check', item, $event)"><component :is="part.RadioItem" class="kima-shell-menu__item" :value="item.value" :disabled="disabled || item.disabled" :text-value="item.label" @select="choose(item, $event)"><span>{{ item.label }}</span><KimaIcon v-if="selected(item)" :icon="Tick01Icon" :size="18" aria-hidden="true" /></component></component>
    <component :is="part.Item" v-else class="kima-shell-menu__item" :role="selection ? 'menuitemradio' : 'menuitem'" :aria-checked="selection ? selected(item) : undefined" :disabled="disabled || item.disabled" :text-value="item.label" @select="choose(item, $event)"><span class="kima-shell-menu__copy"><span>{{ item.label }}</span><small v-if="item.description">{{ item.description }}</small></span><small v-if="item.shortcut">{{ item.shortcut }}</small><KimaIcon v-if="selected(item)" :icon="Tick01Icon" :size="18" aria-hidden="true" /></component>
  </template>
</template>
