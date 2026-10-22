<!-- 侧栏：嵌套真实导航，collapsed/open 可控；移动端复用抽屉，storageKey 可选持久化折叠状态。
调用示例：<kima-sidebar :items="[{value:'home',label:'首页',href:'#home'}]" storage-key="workspace-sidebar" />
-->
<script setup>
import { onMounted, useId, watch } from 'vue';
import KimaNavigationMenu from './navigation-menu.ce.vue';
import KimaDrawer from './drawer.ce.vue';
import KimaButton from './button.ce.vue';
import { useNavigationRoot } from '../utils/navigation.js';
import { useShellModel, useNarrow } from '../utils/shell.js';
import { useKimaConfig } from '../utils/config.js';
import { useScopedSlots } from '../utils/scoped-slots.js';
const { native, vOutlet } = useScopedSlots();
defineOptions({ inheritAttrs: false });
const props = defineProps({ items: { type: Array, default: () => [] }, modelValue: { type: String, default: '' }, expanded: { type: Array, default: () => [] }, collapsed: Boolean, open: Boolean, breakpoint: { type: Number, default: 720 }, label: { type: String, default: '' }, storageKey: { type: String, default: '' }, disabled: Boolean });
const emit = defineEmits(['update:modelValue', 'update:expanded', 'update:collapsed', 'update:open', 'navigate']);
const { root, forwardedAttrs } = useNavigationRoot(); const config = useKimaConfig(root);
const [value, update] = useShellModel(props, 'modelValue', emit); const [expanded, expand] = useShellModel(props, 'expanded', emit); const [collapsed, collapse] = useShellModel(props, 'collapsed', emit); const [open, setOpen] = useShellModel(props, 'open', emit);
const narrow = useNarrow(root, () => props.breakpoint, true); const id = `kima-sidebar-${useId()}`;
onMounted(() => { if (props.storageKey) try { const saved = localStorage.getItem(props.storageKey); if (saved != null) collapse(saved === 'true'); } catch { /* storage can be unavailable */ } });
watch(collapsed, (value) => { if (props.storageKey) try { localStorage.setItem(props.storageKey, String(value)); } catch { /* optional persistence */ } });
watch(narrow, () => setOpen(false));
function navigate(item, event) { emit('navigate', item, event); if (narrow.value && !event.defaultPrevented && !event.metaKey && !event.ctrlKey) setOpen(false); }
</script>
<template><aside ref="root" v-bind="forwardedAttrs" class="kima-sidebar" :class="{'kima-sidebar--collapsed': collapsed && !narrow, 'kima-sidebar--mobile': narrow}" :data-collapsed="collapsed" :aria-label="label || (config.locale.startsWith('en') ? 'Sidebar' : '侧栏')">
  <KimaButton variant="text" :disabled="disabled" :aria-expanded="narrow ? open : !collapsed" :aria-controls="id" @click="narrow ? setOpen(!open) : collapse(!collapsed)">{{ narrow ? '打开导航' : collapsed ? '展开侧栏' : '折叠侧栏' }}</KimaButton>
  <component :is="narrow ? KimaDrawer : 'div'" :id="id" :open="narrow && open" :placement="config.direction === 'rtl' ? 'right' : 'left'" :title="label || '侧栏导航'" class="kima-sidebar__body" @update:open="setOpen">
    <header><div v-if="native" v-outlet="'header'" /><slot v-else name="header" :collapsed="collapsed && !narrow" /></header>
    <KimaNavigationMenu :items="items" :model-value="value" :expanded="expanded" :disabled="disabled" orientation="vertical" :label="label || '侧栏导航'" @update:model-value="update" @update:expanded="expand" @navigate="navigate" />
    <div v-if="native" v-outlet /><slot v-else :collapsed="collapsed && !narrow" /><footer><div v-if="native" v-outlet="'footer'" /><slot v-else name="footer" :collapsed="collapsed && !narrow" /></footer>
  </component>
</aside></template>
<style scoped lang="scss">
@use '../styles/mixins' as *;
.kima-sidebar { @include kima-layer(1); box-sizing: border-box; width: 288px; max-width: 100%; padding: var(--kima-space-3); border-radius: var(--kima-radius-l); transition: width var(--kima-duration-slow) var(--kima-curve-emphasized); &--collapsed { width: 180px; } &--mobile { width: 100%; } &__body:not(dialog) { display: flex; flex-direction: column; gap: var(--kima-space-4); } footer { margin-top: auto; } }
@media (prefers-reduced-motion: reduce) { .kima-sidebar { transition: none; } }
</style>

