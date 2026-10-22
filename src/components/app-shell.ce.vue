<!-- 应用壳：header/sidebar/main/footer 插槽；窄屏侧栏复用原生 modal 抽屉，skip link 聚焦正文。
调用示例：<kima-app-shell><template #header>工作区</template><template #sidebar>导航</template><template #main>正文</template><template #footer>页脚</template></kima-app-shell>
-->
<script setup>
import { ref, useId, watch } from 'vue';
import KimaDrawer from './drawer.ce.vue';
import KimaButton from './button.ce.vue';
import { useNavigationRoot } from '../utils/navigation.js';
import { useShellModel, useNarrow } from '../utils/shell.js';
import { useKimaConfig } from '../utils/config.js';
import { useScopedSlots } from '../utils/scoped-slots.js';
const { native, vOutlet } = useScopedSlots();
defineOptions({ inheritAttrs: false });
const props = defineProps({ open: Boolean, breakpoint: { type: Number, default: 720 }, sidebarWidth: { type: String, default: '288px' }, label: { type: String, default: '应用导航' }, skipLabel: { type: String, default: '跳到正文' } });
const emit = defineEmits(['update:open']);
const { root, forwardedAttrs } = useNavigationRoot(); const config = useKimaConfig(root); const main = ref(null);
const [open, setOpen] = useShellModel(props, 'open', emit); const narrow = useNarrow(root, () => props.breakpoint); const id = `kima-main-${useId()}`;
watch(narrow, () => setOpen(false));
</script>
<template><div ref="root" v-bind="forwardedAttrs" class="kima-app-shell" :class="{'kima-app-shell--narrow': narrow}" :style="{'--kima-shell-sidebar-width': sidebarWidth}">
  <a class="kima-app-shell__skip" :href="`#${id}`" @click.prevent="main?.focus()">{{ skipLabel }}</a>
  <header class="kima-app-shell__header"><KimaButton v-if="narrow" variant="text" :aria-expanded="open" :aria-controls="`${id}-sidebar`" @click="setOpen(!open)">打开导航</KimaButton><div v-if="native" v-outlet="'header'" /><slot v-else name="header" /></header>
  <component :is="narrow ? KimaDrawer : 'aside'" :id="`${id}-sidebar`" :open="narrow && open" :placement="config.direction === 'rtl' ? 'right' : 'left'" :title="label" :aria-label="label" class="kima-app-shell__sidebar" @update:open="setOpen"><div v-if="native" v-outlet="'sidebar'" /><slot v-else name="sidebar" :close="() => setOpen(false)" /></component>
  <main :id="id" ref="main" tabindex="-1" class="kima-app-shell__main"><template v-if="native"><div v-outlet="'main'" /><div v-outlet /></template><slot v-else name="main"><slot /></slot></main>
  <footer class="kima-app-shell__footer"><div v-if="native" v-outlet="'footer'" /><slot v-else name="footer" /></footer>
</div></template>
<style scoped lang="scss">
@use '../styles/mixins' as *;
.kima-app-shell { position: relative; display: grid; grid-template-columns: minmax(0, var(--kima-shell-sidebar-width)) minmax(0, 1fr); grid-template-areas: 'header header' 'sidebar main' 'footer footer'; gap: var(--kima-space-4); color: var(--kima-color-on-surface); font-family: var(--kima-font-family); &--narrow { grid-template-columns: minmax(0, 1fr); grid-template-areas: 'header' 'main' 'footer'; } &__header { grid-area: header; display: flex; align-items: center; gap: var(--kima-space-3); } &__sidebar { grid-area: sidebar; @include kima-layer(1); padding: var(--kima-space-4); border-radius: var(--kima-radius-l); } &__main { grid-area: main; min-width: 0; @include kima-focus-ring; } &__footer { grid-area: footer; } &__skip { position: absolute; z-index: 100; padding: var(--kima-space-3); color: var(--kima-color-on-primary); background: var(--kima-color-primary); clip-path: inset(50%); width: 1px; height: 1px; overflow: hidden; &:focus { clip-path: none; width: auto; height: auto; overflow: visible; } } }
</style>

