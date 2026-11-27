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
      <div class="kima-playground__brand"><KimaIcon :icon="SparklesIcon" /><strong>KIMA</strong><span>交互实验室</span></div>
      <KimaBadge value="LIVE" variant="primary" />
      <div class="kima-playground__tools">
        <KimaPopover label="快速搜索" content-label="项目搜索">
          <div class="kima-playground__flow"><KimaTextField label="搜索项目" placeholder="输入关键词" /></div>
        </KimaPopover>
        <KimaButton variant="standard" icon-only label="查看文件" @click="dialogOpen = true"><KimaIcon :icon="Folder01Icon" /></KimaButton>
        <KimaLink href="#/overview">文档</KimaLink>
      </div>
    </header>

    <main class="kima-playground__layout">
      <div class="kima-playground__scenes">
        <div class="kima-playground__column">
        <KimaCard class="kima-playground__scene" data-scene="create">
          <template #header><div class="kima-playground__heading"><h1>开始一个新想法</h1><p>小一点的计划，大一点的体验。</p></div></template>
          <form class="kima-playground__flow" @submit.prevent="saveProject">
            <KimaTextField v-model="name" label="项目名称" name="project-name" placeholder="项目名称" required clearable />
            <KimaSelect v-model="visibility" :items="visibilityItems" label="项目可见性" />
            <KimaTextarea v-model="notes" label="项目备注" :rows="2" resize="none" placeholder="写下你的想法…" />
            <KimaCheckbox v-model="accepted" label="与团队共享进度">与团队共享进度</KimaCheckbox>
            <div class="kima-playground__row kima-playground__row--end">
              <KimaButton variant="text" @click="notes = ''">清空备注</KimaButton>
              <KimaButton type="submit" :disabled="!accepted"><template #leading><KimaIcon :icon="PlusSignIcon" /></template>创建项目</KimaButton>
            </div>
          </form>
        </KimaCard>

        <KimaCard class="kima-playground__scene" data-scene="team">
          <template #header><div class="kima-playground__row kima-playground__row--between"><div class="kima-playground__heading"><h2>一起做点好东西</h2><p>共享团队，保留自己的偏好。</p></div><KimaSwitch v-model="favorite" label="收藏团队">收藏</KimaSwitch></div></template>
          <div class="kima-playground__row kima-playground__row--between"><div class="kima-playground__row"><KimaAvatar name="林青" size="small" /><strong>设计组</strong></div><KimaBadge value="3 人协作" /></div>
          <div class="kima-playground__row kima-playground__row--end"><KimaButton variant="outlined" disabled>访客只读</KimaButton><KimaButton @click="drawerOpen = true">邀请成员</KimaButton></div>
        </KimaCard>
        </div>
        <div class="kima-playground__column">
        <KimaCard class="kima-playground__scene" data-scene="tasks">
          <template #header><div class="kima-playground__row kima-playground__row--between"><div class="kima-playground__heading"><h2>让进展看得见</h2><p>任务面板与操作菜单。</p></div><KimaMenu :items="menuItems" label="任务操作" icon-only @select="runAction" /></div></template>
          <KimaTabs v-model="tab" :items="tabs">
            <template #panel><KimaTable :columns="columns" :rows="filteredTasks" row-key="id" hoverable aria-label="项目任务" /></template>
          </KimaTabs>
          <div class="kima-playground__row kima-playground__row--between"><KimaBadge :value="`${filteredTasks.length} 个任务`" /><KimaTooltip text="点右上角菜单管理任务"><KimaIcon :icon="FavouriteIcon" :size="18" /></KimaTooltip></div>
        </KimaCard>

        <KimaCard class="kima-playground__scene" data-scene="preferences">
          <template #header><div class="kima-playground__heading"><h2>保持刚好的节奏</h2><p>预算与席位，在一处调整。</p></div></template>
          <div class="kima-playground__notification-options"><KimaSwitch v-model="notifications" label="接收通知">通知</KimaSwitch><KimaRadioGroup v-model="frequency" :options="frequencies" label="通知频率" orientation="horizontal" /></div>
          <KimaCombobox v-model="owner" :items="owners" label="评审负责人" />
          <KimaSlider v-model="budget" label="本期预算" />
          <KimaProgress :value="budget" label="预算进度" />
          <KimaDivider />
          <div class="kima-playground__row kima-playground__row--between"><KimaTooltip text="重现同步中的加载状态"><KimaButton variant="text" :loading="loading" @click="refreshFiles">同步文件</KimaButton></KimaTooltip><KimaSpinner v-if="loading" size="small" label="正在同步" /><KimaBadge v-else value="已同步" variant="success" /></div>
          <KimaSkeleton v-if="loading" :rows="1" label="同步占位" />
          <KimaSkeleton v-else :rows="1" label="下次同步预览" />
        </KimaCard>
        </div>
      </div>
    </main>

    <KimaDialog v-model:open="dialogOpen" title="创建项目">
      <div class="kima-playground__flow"><KimaTextField v-model="name" label="新项目名称" placeholder="项目名称" /><KimaSelect v-model="visibility" :items="visibilityItems" label="新项目可见性" /></div>
      <template #footer><KimaButton variant="text" @click="dialogOpen = false">取消</KimaButton><KimaButton @click="saveProject">保存项目</KimaButton></template>
    </KimaDialog>
    <KimaDrawer v-model:open="drawerOpen" placement="right" title="邀请成员"><div class="kima-playground__flow"><KimaTextField label="邀请邮箱" placeholder="name@example.com" type="email" /><KimaButton @click="drawerOpen = false">发送邀请</KimaButton></div></KimaDrawer>
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
