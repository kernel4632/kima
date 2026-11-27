<!-- 全屏交互预览：30 个原语组件组成的真实工作台场景（原语组合用法示例）。
     入口：#/gallery。被裁组件的组合用法（级联=菜单嵌套、通知=dialog 定制等）
     由宿主用这些原语自行组合，这里演示推荐形态。 -->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
// runAction 里 document.querySelector 是事件回调（非渲染期），浏览器专属 API 放在事件处理里执行。
import {
  KimaAvatar, KimaBadge, KimaButton, KimaCard, KimaCheckbox, KimaCombobox,
  KimaDialog, KimaDivider, KimaDrawer, KimaIcon,
  KimaLink, KimaMenu, KimaPopover, KimaProgress, KimaRadioGroup,
  KimaSelect, KimaSkeleton, KimaSlider, KimaSpinner, KimaSwitch,
  KimaTable, KimaTabs, KimaTextField, KimaTextarea, KimaTooltip,
} from '../index.js';
import {
  FavouriteIcon, Folder01Icon, PlusSignIcon, Search01Icon, SparklesIcon,
} from '@hugeicons/core-free-icons';

const props = defineProps({
  navigate: { type: Function, required: true },
});

const name = ref('官网改版');
const notes = ref('让每一次交互都自然发生。');
const visibility = ref('team');
const accepted = ref(true);
const budget = ref(60);
const notifications = ref(true);
const frequency = ref('daily');
const favorite = ref(false);
const tab = ref('all');
const dialogOpen = ref(false);
const drawerOpen = ref(false);
const loading = ref(false);
let loadingTimer;

const visibilityItems = [{ value: 'team', label: '团队可见' }, { value: 'private', label: '仅自己' }];
const frequencies = [{ value: 'daily', label: '日' }, { value: 'weekly', label: '周' }];
const owners = [{ value: 'lin', label: '林青' }, { value: 'chen', label: '陈禾' }, { value: 'alex', label: 'Alex' }];
const owner = ref('lin');
const tabs = [{ value: 'all', label: '全部任务' }, { value: 'done', label: '已完成' }];
const tasks = ref([
  { id: 'task-1', name: '交互评审', status: '进行中' },
  { id: 'task-2', name: '主题走查', status: '已完成' },
  { id: 'task-3', name: '键盘验收', status: '待开始' },
]);
const columns = [{ key: 'name', label: '任务' }, { key: 'status', label: '状态', width: '38%' }];
const filteredTasks = computed(() => tab.value === 'done' ? tasks.value.filter(task => task.status === '已完成') : tasks.value);
const menuItems = [{ value: 'invite', label: '邀请成员' }, { value: 'settings', label: '项目设置' }];

function runAction(value) {
  if (value === 'invite') drawerOpen.value = true;
  else if (value === 'settings') document.querySelector('[aria-label="项目名称"]')?.focus();
}

function saveProject() {
  tasks.value = [{ id: `task-${Date.now()}`, name: name.value.trim() || '新项目', status: '待开始' }, ...tasks.value];
  tab.value = 'all';
  dialogOpen.value = false;
}

function refreshFiles() {
  loading.value = true;
  clearTimeout(loadingTimer);
  loadingTimer = setTimeout(() => { loading.value = false; }, 900);
}
onMounted(() => {});
onBeforeUnmount(() => clearTimeout(loadingTimer));
</script>

<template>
  <div class="kima-playground" data-testid="playground">
    <header class="kima-playground__bar">
      <div class="kima-playground__brand"><kima-icon :icon="SparklesIcon" /><strong>KIMA</strong><span>交互实验室</span></div>
      <kima-badge value="LIVE" variant="primary" />
      <div class="kima-playground__tools">
        <kima-popover label="快速搜索" content-label="项目搜索">
          <div class="kima-playground__flow"><kima-text-field label="搜索项目" placeholder="输入关键词" /></div>
        </kima-popover>
        <kima-button variant="standard" icon-only label="查看文件" @click="dialogOpen = true"><kima-icon :icon="Folder01Icon" /></kima-button>
        <kima-link href="#/overview">文档</kima-link>
      </div>
    </header>

    <main class="kima-playground__layout">
      <div class="kima-playground__scenes">
        <div class="kima-playground__column">
        <kima-card class="kima-playground__scene" data-scene="create">
          <template #header><div class="kima-playground__heading"><h1>开始一个新想法</h1><p>小一点的计划，大一点的体验。</p></div></template>
          <form class="kima-playground__flow" @submit.prevent="saveProject">
            <kima-text-field v-model="name" label="项目名称" name="project-name" placeholder="项目名称" required clearable />
            <kima-select v-model="visibility" :items="visibilityItems" label="项目可见性" />
            <kima-textarea v-model="notes" label="项目备注" :rows="2" resize="none" placeholder="写下你的想法…" />
            <kima-checkbox v-model="accepted" label="与团队共享进度">与团队共享进度</kima-checkbox>
            <div class="kima-playground__row kima-playground__row--end">
              <kima-button variant="text" @click="notes = ''">清空备注</kima-button>
              <kima-button type="submit" :disabled="!accepted"><template #leading><kima-icon :icon="PlusSignIcon" /></template>创建项目</kima-button>
            </div>
          </form>
        </kima-card>

        <kima-card class="kima-playground__scene" data-scene="team">
          <template #header><div class="kima-playground__row kima-playground__row--between"><div class="kima-playground__heading"><h2>一起做点好东西</h2><p>共享团队，保留自己的偏好。</p></div><kima-switch v-model="favorite" label="收藏团队">收藏</kima-switch></div></template>
          <div class="kima-playground__row kima-playground__row--between"><div class="kima-playground__row"><kima-avatar name="林青" size="small" /><strong>设计组</strong></div><kima-badge value="3 人协作" /></div>
          <div class="kima-playground__row kima-playground__row--end"><kima-button variant="outlined" disabled>访客只读</kima-button><kima-button @click="drawerOpen = true">邀请成员</kima-button></div>
        </kima-card>
        </div>
        <div class="kima-playground__column">
        <kima-card class="kima-playground__scene" data-scene="tasks">
          <template #header><div class="kima-playground__row kima-playground__row--between"><div class="kima-playground__heading"><h2>让进展看得见</h2><p>任务面板与操作菜单。</p></div><kima-menu :items="menuItems" label="任务操作" icon-only @select="runAction" /></div></template>
          <kima-tabs v-model="tab" :items="tabs">
            <template #panel><kima-table :columns="columns" :rows="filteredTasks" row-key="id" hoverable aria-label="项目任务" /></template>
          </kima-tabs>
          <div class="kima-playground__row kima-playground__row--between"><kima-badge :value="`${filteredTasks.length} 个任务`" /><kima-tooltip text="点右上角菜单管理任务"><kima-icon :icon="FavouriteIcon" :size="18" /></kima-tooltip></div>
        </kima-card>

        <kima-card class="kima-playground__scene" data-scene="preferences">
          <template #header><div class="kima-playground__heading"><h2>保持刚好的节奏</h2><p>预算与席位，在一处调整。</p></div></template>
          <div class="kima-playground__notification-options"><kima-switch v-model="notifications" label="接收通知">通知</kima-switch><kima-radio-group v-model="frequency" :options="frequencies" label="通知频率" orientation="horizontal" /></div>
          <kima-combobox v-model="owner" :items="owners" label="评审负责人" />
          <kima-slider v-model="budget" label="本期预算" />
          <kima-progress :value="budget" label="预算进度" />
          <kima-divider />
          <div class="kima-playground__row kima-playground__row--between"><kima-tooltip text="重现同步中的加载状态"><kima-button variant="text" :loading="loading" @click="refreshFiles">同步文件</kima-button></kima-tooltip><kima-spinner v-if="loading" size="small" label="正在同步" /><kima-badge v-else value="已同步" variant="success" /></div>
          <kima-skeleton v-if="loading" :rows="1" label="同步占位" />
          <kima-skeleton v-else :rows="1" label="下次同步预览" />
        </kima-card>
        </div>
      </div>
    </main>

    <kima-dialog v-model:open="dialogOpen" title="创建项目">
      <div class="kima-playground__flow"><kima-text-field v-model="name" label="新项目名称" placeholder="项目名称" /><kima-select v-model="visibility" :items="visibilityItems" label="新项目可见性" /></div>
      <template #footer><kima-button variant="text" @click="dialogOpen = false">取消</kima-button><kima-button @click="saveProject">保存项目</kima-button></template>
    </kima-dialog>
    <kima-drawer v-model:open="drawerOpen" placement="right" title="邀请成员"><div class="kima-playground__flow"><kima-text-field label="邀请邮箱" placeholder="name@example.com" type="email" /><kima-button @click="drawerOpen = false">发送邀请</kima-button></div></kima-drawer>
  </div>
</template>

<style scoped lang="scss">
.kima-playground {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: var(--kima-space-3);
  padding: var(--kima-space-3);
  background: var(--kima-color-surface);
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
}
.kima-playground__bar, .kima-playground__brand, .kima-playground__tools, .kima-playground__row { display: flex; align-items: center; gap: var(--kima-space-2); min-width: 0; }
.kima-playground__bar { flex-wrap: wrap; min-height: var(--kima-touch-target); }
.kima-playground__brand { color: var(--kima-color-primary); white-space: nowrap; }
.kima-playground__brand strong { font-size: var(--kima-font-size-title-medium); }
.kima-playground__brand > span { color: var(--kima-color-on-surface-variant); }
.kima-playground__tools { margin-inline-start: auto; }
.kima-playground__layout { flex: 1; min-height: 0; }
.kima-playground__scenes { display: grid; grid-template-columns: 1fr 1fr; gap: var(--kima-space-3); align-items: start; }
.kima-playground__column { display: flex; flex-direction: column; gap: var(--kima-space-3); min-width: 0; }
.kima-playground__scene { min-width: 0; padding: var(--kima-space-4); gap: var(--kima-space-3); }
.kima-playground__scene :deep(.kima-card__body) { display: flex; flex-direction: column; gap: var(--kima-space-2); }
.kima-playground__heading { min-width: 0; }
.kima-playground__heading h1, .kima-playground__heading h2 { font-size: var(--kima-font-size-body-large); line-height: 1.4; margin: 0; color: var(--kima-color-on-surface); }
.kima-playground__heading p { margin: var(--kima-space-1) 0 0; color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-label-medium); line-height: 1.5; }
.kima-playground__row { flex-wrap: wrap; }
.kima-playground__row--between { justify-content: space-between; }
.kima-playground__row--end { justify-content: flex-end; }
.kima-playground__flow { display: flex; flex-direction: column; gap: var(--kima-space-3); min-width: 0; }
.kima-playground__notification-options { display: flex; flex-wrap: wrap; align-items: center; gap: var(--kima-space-3); }
@media (max-width: 900px) { .kima-playground__scenes { grid-template-columns: minmax(0, 1fr); } }
</style>
