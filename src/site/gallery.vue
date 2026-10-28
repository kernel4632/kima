<!-- 独立组合预览：桌面按四列、两层排布真实场景，不嵌套文档壳。
     组件保持库里的尺寸/交互。只有场景布局属于站点；窄屏自然重排。
     #/gallery 兼容原入口；#/playground 为语义更清楚的入口。 -->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  KimaAccordion, KimaAvatar, KimaAvatarGroup, KimaBadge, KimaBreadcrumb,
  KimaButton, KimaButtonGroup, KimaCard, KimaCascader, KimaChart, KimaCheckbox,
  KimaChip, KimaCodeBlock, KimaCombobox, KimaCommand, KimaDatePicker,
  KimaDialog, KimaDivider, KimaDrawer, KimaEmptyState, KimaIcon, KimaIconButton,
  KimaLayout, KimaLink, KimaMenu, KimaNotification, KimaNumberField,
  KimaPagination, KimaProgress, KimaRadioGroup, KimaRating, KimaRingProgress,
  KimaSelect, KimaSkeleton, KimaSlider, KimaSpinner, KimaStepper, KimaSwitch,
  KimaTable, KimaTabs, KimaTagsInput, KimaTextField, KimaTextarea,
  KimaTimePicker, KimaToggle, KimaTooltip, KimaTree, KimaVirtualScroll, KimaAlert,
} from '../index.js';
import {
  FavouriteIcon, Folder01Icon, Notification01Icon,
  PlusSignIcon, Search01Icon, SparklesIcon, Sun01Icon, Moon02Icon,
} from '@hugeicons/core-free-icons';

const props = defineProps({
  navigate: { type: Function, required: true },
  theme: { type: String, default: 'dark' },
  seed: { type: String, default: '#61afef' },
});
const emit = defineEmits(['update:theme', 'update:seed']);
const seeds = [
  { value: '#61afef', label: '青蓝' }, { value: '#6750a4', label: '紫色' },
  { value: '#2e7d32', label: '绿色' }, { value: '#ffffff', label: '灰度' },
];
const name = ref('官网改版');
const notes = ref('让每一次交互都自然发生。');
const visibility = ref('team');
const accepted = ref(true);
const budget = ref(60);
const seats = ref(5);
const period = ref('week');
const notifications = ref(true);
const frequency = ref('daily');
const favorite = ref(false);
const chipSelected = ref(true);
const rating = ref(4);
const tags = ref(['设计']);
const date = ref('2026-06-18');
const time = ref('09:30');
const owner = ref('lin');
const category = ref(['product', 'web']);
const step = ref(1);
const tab = ref('all');
const page = ref(1);
const selectedFile = ref('design');
const expandedFiles = ref(['project']);
const selectedRevision = ref('r1');
const dialogOpen = ref(false);
const drawerOpen = ref(false);
const commandOpen = ref(false);
const noticeOpen = ref(false);
const noticeMessage = ref('项目已保存在当前演示中。');
const loading = ref(false);
let loadingTimer;

const owners = [{ value: 'lin', label: '林青' }, { value: 'chen', label: '陈禾' }, { value: 'alex', label: 'Alex' }];
const visibilityItems = [{ value: 'team', label: '团队可见' }, { value: 'private', label: '仅自己' }];
const periods = [{ value: 'week', label: '本周' }, { value: 'month', label: '本月' }];
const frequencies = [{ value: 'daily', label: '日' }, { value: 'weekly', label: '周' }];
const categories = [{ value: 'product', label: '产品', children: [{ value: 'web', label: '网站' }, { value: 'app', label: '应用' }] }];
const steps = [{ label: '计划' }, { label: '评审' }, { label: '发布' }];
const tabs = [{ value: 'all', label: '全部任务' }, { value: 'done', label: '已完成' }];
const tasks = ref([
  { id: 'task-1', name: '交互评审', status: '进行中' },
  { id: 'task-2', name: '主题走查', status: '已完成' },
  { id: 'task-3', name: '键盘验收', status: '待开始' },
  { id: 'task-4', name: '发布检查', status: '待开始' },
]);
const columns = [{ key: 'name', label: '任务' }, { key: 'status', label: '状态', width: '38%' }];
const filteredTasks = computed(() => tab.value === 'done' ? tasks.value.filter(task => task.status === '已完成') : tasks.value);
const visibleTasks = computed(() => filteredTasks.value.slice((page.value - 1) * 2, page.value * 2));
const chartSeries = computed(() => [{ name: '投入', data: period.value === 'week' ? [24, 38, 31, 52, 46, budget.value] : [38, 52, 45, 68, 60, budget.value] }]);
const fileItems = [{ value: 'project', label: '项目文件', children: [{ value: 'design', label: '交互稿' }, { value: 'readme', label: '接入说明' }] }];
const revisions = Array.from({ length: 50 }, (_, index) => ({ value: `r${index + 1}`, label: `版本 ${String(index + 1).padStart(2, '0')} · 已同步` }));
const source = computed(() => `// ${selectedFile.value === 'design' ? '交互稿' : '接入说明'}\nconst budget = ${budget.value};\nconst seats = ${seats.value};`);
const people = [{ name: '林青' }, { name: '陈禾' }, { name: 'Alex' }, { name: 'Sam' }];
const accordionItems = [{ value: 'preview', label: '预览如何使用？', content: '这些都是真实组件。更改预算会同步图表、进度与代码；保存会更新任务并显示通知。' }];
const menuItems = [{ value: 'invite', label: '邀请成员' }, { value: 'settings', label: '项目设置' }, { value: 'notify', label: '查看通知' }];
const commands = [{ value: 'new', label: '创建项目', group: '项目' }, { value: 'invite', label: '邀请成员', group: '项目' }, { value: 'theme', label: '切换明暗', group: '外观' }];

function notify(message) { noticeMessage.value = message; noticeOpen.value = true; }
function saveProject() {
  tasks.value = [{ id: `task-${Date.now()}`, name: name.value.trim() || '新项目', status: '待开始' }, ...tasks.value];
  page.value = 1;
  tab.value = 'all';
  dialogOpen.value = false;
  notify('项目已保存，并加入任务列表。');
}
function runAction(value) {
  if (value === 'new') dialogOpen.value = true;
  else if (value === 'invite') drawerOpen.value = true;
  else if (value === 'settings') document.querySelector('[aria-label="项目名称"]')?.focus();
  else if (value === 'theme') emit('update:theme', props.theme === 'dark' ? 'light' : 'dark');
  else notify('所有项目已同步。');
}
function refreshFiles() {
  loading.value = true;
  clearTimeout(loadingTimer);
  loadingTimer = setTimeout(() => { loading.value = false; notify('文件同步完成。'); }, 900);
}
function shortcut(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    commandOpen.value = true;
  }
}
onMounted(() => window.addEventListener('keydown', shortcut));
onBeforeUnmount(() => { window.removeEventListener('keydown', shortcut); clearTimeout(loadingTimer); });
</script>

<template>
  <div class="kima-playground" data-testid="playground">
    <header class="kima-playground__bar">
      <div class="kima-playground__brand"><KimaIcon :icon="SparklesIcon" /><strong>KIMA</strong><span>交互实验室</span></div>
      <KimaBadge value="LIVE" variant="primary" />
      <div class="kima-playground__tools">
        <KimaSelect :model-value="seed" :items="seeds" label="主题种子" @update:model-value="emit('update:seed', $event)" />
        <KimaTooltip text="切换明暗主题"><KimaIconButton :icon="theme === 'dark' ? Sun01Icon : Moon02Icon" label="切换明暗主题" @click="emit('update:theme', theme === 'dark' ? 'light' : 'dark')" /></KimaTooltip>
        <KimaCommand v-model:open="commandOpen" label="工作台命令" :items="commands" @select="runAction">
          <template #trigger><KimaIcon :icon="Search01Icon" />搜索 / Ctrl K</template>
        </KimaCommand>
        <KimaIconButton :icon="Notification01Icon" label="查看通知" @click="notify('所有项目已同步。')" />
        <KimaLink href="#/overview">文档</KimaLink>
      </div>
    </header>

    <KimaLayout as="main" :max-width="'none'" :padding="0" :gap="12" class="kima-playground__layout">
      <div class="kima-playground__scenes">
        <KimaCard class="kima-playground__scene" data-scene="create">
          <template #header><div class="kima-playground__heading"><h1>开始一个新想法</h1><p>小一点的计划，大一点的体验。</p></div></template>
          <form class="kima-playground__flow" @submit.prevent="saveProject">
            <div class="kima-playground__pair">
              <KimaTextField v-model="name" label="项目名称" name="project-name" placeholder="项目名称" required clearable />
              <KimaSelect v-model="visibility" :items="visibilityItems" label="项目可见性" />
            </div>
            <KimaTextarea v-model="notes" label="项目备注" :rows="2" resize="none" placeholder="写下你的想法…" />
            <KimaCheckbox v-model="accepted" label="与团队共享进度">与团队共享进度</KimaCheckbox>
            <div class="kima-playground__row kima-playground__row--end">
              <KimaButton variant="text" @click="notes = ''">清空备注</KimaButton>
              <KimaButton type="submit" :disabled="!accepted"><template #leading><KimaIcon :icon="PlusSignIcon" /></template>创建项目</KimaButton>
            </div>
          </form>
        </KimaCard>

        <KimaCard class="kima-playground__scene" data-scene="budget">
          <template #header><div class="kima-playground__heading"><h2>把时间花在重要的事上</h2><p>投入趋势与预算，共用一份数据。</p></div></template>
          <div class="kima-playground__row kima-playground__row--between"><KimaButtonGroup v-model="period" :items="periods" size="small" aria-label="投入周期" /><strong>{{ budget }}%</strong></div>
          <KimaChart class="kima-playground__chart" :series="chartSeries" :labels="['一', '二', '三', '四', '五', '六']" mode="bar" label="投入趋势" />
          <KimaSlider v-model="budget" label="本期预算" />
        </KimaCard>

        <KimaCard class="kima-playground__scene" data-scene="schedule">
          <template #header><div class="kima-playground__heading"><h2>下一次见面</h2><p>从选择负责人，到安排评审。</p></div></template>
          <div class="kima-playground__pair">
            <KimaDatePicker v-model="date" label="评审日期" locale="zh-CN" />
            <KimaTimePicker v-model="time" label="评审时间" locale="zh-CN" />
          </div>
          <div class="kima-playground__pair">
            <KimaCombobox v-model="owner" :items="owners" label="评审负责人" />
            <KimaCascader v-model="category" :options="categories" label="项目分类" />
          </div>
          <KimaStepper v-model="step" :items="steps" label="发布步骤" />
          <KimaButton variant="tonal" @click="notify(`已安排 ${date} ${time} 的评审。`)">确认排期</KimaButton>
        </KimaCard>

        <KimaCard class="kima-playground__scene" data-scene="tasks">
          <template #header><div class="kima-playground__row kima-playground__row--between"><div class="kima-playground__heading"><h2>让进展看得见</h2><p>真实切换、翻页与新增任务。</p></div><KimaMenu :items="menuItems" label="任务操作" icon-only @select="runAction" /></div></template>
          <KimaTabs v-model="tab" :items="tabs" @update:model-value="page = 1">
            <template #panel><KimaTable :columns="columns" :rows="visibleTasks" row-key="id" hoverable aria-label="项目任务" /></template>
          </KimaTabs>
          <div class="kima-playground__row kima-playground__row--between"><KimaBadge :value="`${filteredTasks.length} 个任务`" /><KimaPagination v-model="page" :total="filteredTasks.length" :page-size="2" aria-label="任务分页" /></div>
          <KimaBreadcrumb :items="[{ label: '工作台', href: '#/gallery' }, { label: '当前项目' }]" />
        </KimaCard>

        <KimaCard class="kima-playground__scene" data-scene="team">
          <template #header><div class="kima-playground__row kima-playground__row--between"><div class="kima-playground__heading"><h2>一起做点好东西</h2><p>共享团队，保留自己的偏好。</p></div><KimaToggle v-model="favorite" label="收藏团队"><KimaIcon :icon="FavouriteIcon" /></KimaToggle></div></template>
          <div class="kima-playground__row kima-playground__row--between"><div class="kima-playground__row"><KimaAvatar name="林青" size="small" /><strong>设计组</strong></div><KimaAvatarGroup :items="people" :max="2" label="协作者" /></div>
          <div class="kima-playground__row"><KimaChip v-model="chipSelected" selectable label="设计优先">设计优先</KimaChip><KimaTagsInput v-model="tags" label="团队标签" :max="3" /></div>
          <KimaRating v-model="rating" label="协作满意度" name="team-rating" />
          <div class="kima-playground__row kima-playground__row--end"><KimaButton variant="outlined" disabled>访客只读</KimaButton><KimaButton @click="drawerOpen = true">邀请成员</KimaButton></div>
        </KimaCard>

        <KimaCard class="kima-playground__scene" data-scene="preferences">
          <template #header><div class="kima-playground__heading"><h2>保持刚好的节奏</h2><p>配额、消息与席位，在一处调整。</p></div></template>
          <div class="kima-playground__row kima-playground__row--between"><KimaSwitch v-model="notifications" label="接收通知" /><KimaRadioGroup v-model="frequency" :options="frequencies" label="通知频率" orientation="horizontal" /></div>
          <div class="kima-playground__quota"><div><span class="kima-playground__muted">团队席位</span><KimaNumberField v-model="seats" label="团队席位" :min="1" :max="20" /></div><KimaRingProgress :value="budget" show-value label="预算占用" /></div>
          <KimaProgress :value="budget" label="预算进度" />
          <KimaDivider />
          <div class="kima-playground__row kima-playground__row--between"><KimaTooltip text="重现同步中的加载状态"><KimaButton variant="text" :loading="loading" @click="refreshFiles">同步文件</KimaButton></KimaTooltip><KimaSpinner v-if="loading" size="small" label="正在同步" /><KimaBadge v-else value="已同步" variant="success" /></div>
          <KimaSkeleton v-if="loading" :rows="1" label="同步占位" />
          <KimaSkeleton v-else :rows="1" label="下次同步预览" />
        </KimaCard>

        <KimaCard class="kima-playground__scene" data-scene="files">
          <template #header><div class="kima-playground__row kima-playground__row--between"><div class="kima-playground__heading"><h2>想法与实现，同步发生</h2><p>文件树、版本列表与代码片段。</p></div><KimaTooltip text="新增文件"><KimaIconButton :icon="PlusSignIcon" label="新增文件" @click="dialogOpen = true" /></KimaTooltip></div></template>
          <div class="kima-playground__pair"><KimaTree v-model="selectedFile" v-model:expanded="expandedFiles" :items="fileItems" selectable aria-label="项目文件" /><KimaVirtualScroll v-model="selectedRevision" :items="revisions" :height="144" :item-height="48" aria-label="历史版本"><template #default="{ item }">{{ item.label }}</template></KimaVirtualScroll></div>
          <KimaCodeBlock :code="source" language="javascript" label="项目配置代码" />
        </KimaCard>

        <KimaCard class="kima-playground__scene" data-scene="inbox">
          <template #header><div class="kima-playground__heading"><h2>留一点空间给好消息</h2><p>状态反馈不必打断手头的事。</p></div></template>
          <KimaAlert variant="success" heading="团队空间已就绪" />
          <KimaEmptyState compact heading="收件箱已清空" description="新的消息会出现在这里。"><template #icon><KimaIcon :icon="Folder01Icon" /></template></KimaEmptyState>
          <KimaButton variant="text" @click="dialogOpen = true">从一个新项目开始</KimaButton>
        </KimaCard>
      </div>
    </KimaLayout>

    <KimaDialog v-model:open="dialogOpen" title="创建项目">
      <div class="kima-playground__flow"><KimaTextField v-model="name" label="新项目名称" placeholder="项目名称" /><KimaSelect v-model="visibility" :items="visibilityItems" label="新项目可见性" /><KimaAccordion :items="accordionItems" label="预览帮助" /></div>
      <template #footer><KimaButton variant="text" @click="dialogOpen = false">取消</KimaButton><KimaButton @click="saveProject">保存项目</KimaButton></template>
    </KimaDialog>
    <KimaDrawer v-model:open="drawerOpen" placement="right" title="邀请成员"><div class="kima-playground__flow"><KimaTextField label="邀请邮箱" placeholder="name@example.com" type="email" /><KimaButton @click="drawerOpen = false; notify('邀请已发送。')">发送邀请</KimaButton></div></KimaDrawer>
    <KimaNotification v-model:open="noticeOpen" heading="操作完成" :message="noticeMessage" variant="success" />
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
.kima-playground__bar { flex-wrap: wrap; min-height: 64px; }
.kima-playground__brand { color: var(--kima-color-primary); white-space: nowrap; }
.kima-playground__brand strong { font-size: var(--kima-font-size-title-medium); }
.kima-playground__brand > span { color: var(--kima-color-on-surface-variant); }
.kima-playground__tools { margin-inline-start: auto; }
.kima-playground__tools > .kima-select { width: 132px; }
.kima-playground__layout { flex: 1; min-height: 0; }
.kima-playground__scenes { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--kima-space-3); }
.kima-playground__scene { min-width: 0; padding: var(--kima-space-3); gap: var(--kima-space-2); }
.kima-playground__scene :deep(.kima-card__body) { display: flex; flex-direction: column; gap: var(--kima-space-2); }
.kima-playground__heading { min-width: 0; }
.kima-playground__heading h1, .kima-playground__heading h2 { font-size: var(--kima-font-size-title-small); line-height: 1.4; margin: 0; color: var(--kima-color-on-surface); }
.kima-playground__heading p, .kima-playground__muted { margin: var(--kima-space-1) 0 0; color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-label-small); line-height: 1.5; }
.kima-playground__row { flex-wrap: wrap; }
.kima-playground__row--between { justify-content: space-between; }
.kima-playground__row--end { justify-content: flex-end; }
.kima-playground__pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--kima-space-2); align-items: center; }
.kima-playground__flow { display: flex; flex-direction: column; gap: var(--kima-space-3); min-width: 0; }
.kima-playground__chart { min-height: 0; }
/* 图表的帮助保留给读屏；数据表入口照常可操作，不让固定图高与内容重叠。 */
.kima-playground__chart :deep(.kima-chart__hint) { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.kima-playground__chart :deep(.kima-chart__plot) { height: 112px; }
.kima-playground__quota { display: grid; grid-template-columns: minmax(0, 1fr) 92px; gap: var(--kima-space-2); align-items: center; }
.kima-playground__quota :deep(.kima-number-field .kima-button) { min-width: 48px; padding-inline: var(--kima-space-2); }
.kima-playground__scene :deep(.kima-stepper .kima-button__label) { gap: var(--kima-space-1); font-size: var(--kima-font-size-label-medium); }
.kima-playground__scene :deep(.kima-stepper__number) { width: 24px; height: 24px; }
.kima-playground__scene :deep(.kima-stepper ol) { gap: var(--kima-space-1); }
.kima-playground__scene :deep(.kima-stepper .kima-button) { padding-inline: var(--kima-space-2); }
.kima-playground__scene :deep(.kima-tabs__panels) { margin-top: var(--kima-space-2); padding: 0; }
.kima-playground__scene :deep(.kima-tabs__panel) { padding: 0; }
/* 站点的两列表格不需要库为通用宽表预留的 32rem；不改控件尺寸。 */
.kima-playground__scene :deep(.kima-table table) { min-width: 0; }
.kima-playground__scene :deep(.kima-table th), .kima-playground__scene :deep(.kima-table td) { padding: var(--kima-space-2); }
.kima-playground__scene :deep(.kima-code-block__viewport) { max-height: 100px; }
.kima-playground__scene :deep(.kima-tags-input) { flex: 1; min-width: 120px; }
.kima-playground__scene :deep(.kima-rating) { flex-wrap: wrap; }
@media (max-width: 1199px) { .kima-playground__scenes { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 639px) {
  .kima-playground { padding: var(--kima-space-3); }
  .kima-playground__scenes { grid-template-columns: minmax(0, 1fr); }
  .kima-playground__bar, .kima-playground__tools { flex-wrap: wrap; }
  .kima-playground__tools { margin: 0; width: 100%; }
}
</style>
