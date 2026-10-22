<script setup>
import { ref } from "vue";
import KimaPopover from "../components/popover.ce.vue";
import KimaPopconfirm from "../components/popconfirm.ce.vue";
import KimaHoverCard from "../components/hover-card.ce.vue";
import KimaContextMenu from "../components/context-menu.ce.vue";
import KimaCommand from "../components/command.ce.vue";
import KimaMenubar from "../components/menubar.ce.vue";
import KimaChip from "../components/chip.ce.vue";
import KimaMultiSelect from "../components/multi-select.ce.vue";
import KimaTreeSelect from "../components/tree-select.ce.vue";
import KimaLoadingOverlay from "../components/loading-overlay.ce.vue";
import KimaButton from "../components/button.ce.vue";
import KimaTextField from "../components/text-field.ce.vue";
import KimaLink from "../components/link.ce.vue";
import { interactionCatalog } from "./interaction-catalog.js";
const props = defineProps({ component: { type: String, default: "popover" } });
const action = ref("尚未执行操作");
const selected = ref(true);
const removed = ref(false);
const topics = ref(["design"]);
const folder = ref("guide");
const loading = ref(false);
const options = [{ value: "design", label: "交互设计", description: "体验优先" }, { value: "motion", label: "注意力与动效" }, { value: "accessibility", label: "无障碍" }, { value: "future", label: "即将开放", disabled: true }];
const folders = [{ value: "project", label: "KIMA 项目", children: [{ value: "guide", label: "设计指南" }, { value: "components", label: "组件源码" }, { value: "archive", label: "归档（只读）", disabled: true }] }];
const actions = [{ value: "copy", label: "复制链接", shortcut: "Ctrl+C" }, { value: "rename", label: "重命名" }, { value: "delete", label: "删除（不可用）", disabled: true }];
const menus = [{ value: "file", label: "文件", items: [{ value: "new", label: "新建项目", shortcut: "Ctrl+N" }, { value: "save", label: "保存" }] }, { value: "edit", label: "编辑", items: actions }, { value: "locked", label: "只读菜单", disabled: true }];
const commands = [{ value: "new", label: "新建项目", group: "项目", keywords: ["create", "new"], shortcut: "Ctrl+N" }, { value: "search", label: "搜索组件", group: "导航", description: "在组件库中查找", keywords: ["search"] }, { value: "publish", label: "发布项目", group: "项目", disabled: true }];
</script>
<template>
  <article v-if="interactionCatalog[component]" class="kima-gallery__demo kima-interaction-demo">
    <header><h2>{{ interactionCatalog[component].label }}</h2><p>锚定当前任务、键盘可达、状态清晰；弹层使用独立实色平面。</p></header>
    <KimaPopover v-if="component === 'popover'" label="查看项目详情" content-label="项目详情"><h3>KIMA · Alive</h3><p>用动效引导注意力，把下一步交互放在眼前。</p><KimaLink href="#/overview">查看项目文档</KimaLink></KimaPopover>
    <KimaPopconfirm v-else-if="component === 'popconfirm'" label="删除草稿" heading="确定删除草稿？" description="此操作无法撤销；取消是默认焦点。" danger @confirm="action = '已确认删除'" @cancel="action = '已取消删除'" />
    <KimaHoverCard v-else-if="component === 'hover-card'" label="了解 KIMA 团队" heading="KIMA 团队"><p>专注低密度界面、动态配色和可访问交互。</p><p>鼠标悬停、键盘聚焦或触屏点击均可预览。</p></KimaHoverCard>
    <KimaContextMenu v-else-if="component === 'context-menu'" :items="actions" @select="action = $event"><h3>项目卡片</h3><p>右键 / 长按，或聚焦后按 Shift+F10 打开操作。</p></KimaContextMenu>
    <KimaCommand v-else-if="component === 'command'" :items="commands" @select="action = $event" />
    <KimaMenubar v-else-if="component === 'menubar'" :menus="menus" @select="action = $event" />
    <div v-else-if="component === 'chip'" class="kima-interaction-demo__row"><KimaChip label="静态分类">静态分类</KimaChip><KimaChip v-model="selected" selectable label="交互设计">交互设计</KimaChip><KimaChip v-if="!removed" removable label="可移除主题" @remove="removed = true">可移除主题</KimaChip><KimaChip selectable disabled>不可用</KimaChip></div>
    <form v-else-if="component === 'multi-select'" class="kima-interaction-demo__stack" @submit.prevent><KimaMultiSelect v-model="topics" label="关注主题" :items="options" name="topics" required /><output>表单多值：{{ topics.join('、') || '未选择' }}</output><KimaButton type="reset" variant="text">重置表单</KimaButton></form>
    <form v-else-if="component === 'tree-select'" class="kima-interaction-demo__stack" @submit.prevent><KimaTreeSelect v-model="folder" :items="folders" :expanded="['project']" label="目标目录" name="folder" required clearable /><output>当前节点：{{ folder || '未选择' }}</output><KimaButton type="reset" variant="text">重置表单</KimaButton></form>
    <div v-else-if="component === 'loading-overlay'" class="kima-interaction-demo__stack"><KimaButton variant="tonal" @click="loading = !loading">{{ loading ? '结束加载' : '模拟区域加载' }}</KimaButton><KimaLoadingOverlay :loading="loading" label="正在同步项目"><div class="kima-interaction-demo__content"><h3>项目设置</h3><label>项目名称 <KimaTextField model-value="KIMA" label="项目名称" /></label><KimaButton variant="text" @click="action = '已保存项目'">保存项目</KimaButton></div></KimaLoadingOverlay></div>
    <output v-if="['popconfirm', 'context-menu', 'command', 'menubar', 'loading-overlay'].includes(component)" aria-live="polite">{{ action }}</output>
  </article>
</template>
<style scoped lang="scss">
.kima-interaction-demo { min-width: 0; box-sizing: border-box; color: var(--kima-color-on-surface); font-family: var(--kima-font-family); &__row { display: flex; flex-wrap: wrap; gap: var(--kima-space-3); align-items: center; justify-content: center; } &__stack, &__content { display: grid; gap: var(--kima-space-4); width: 100%; } &__content { padding: var(--kima-space-6); min-height: 180px; background: var(--kima-color-layer-1); border-radius: var(--kima-radius-m); } input { font: inherit; padding: var(--kima-space-3); color: var(--kima-color-on-surface); background: var(--kima-color-layer-2); border: 0; border-radius: var(--kima-radius-s); max-width: 100%; box-sizing: border-box; } }
</style>
