<!-- 组件总览：把全部组件组合成一个完整的应用界面，看搭配起来的整体效果。
     参考 shadcn/create 的思路——不是每个组件一张孤立卡片，而是一个真实的应用：
     应用壳（侧栏+顶栏）→ 仪表盘（统计卡+图表+热力图）→ 数据（表格+时间线）
     → 表单（字段组+选择+日期+开关+滑块）→ 弹层（对话框/抽屉/通知/命令面板）
     → 导航（手风琴/步骤条/面包屑）。每一块都是库里的实组件，直接可交互。
     入口：App.vue 的 #/gallery 路由。 -->
<script setup>
import { ref } from 'vue';
import {
  KimaAppShell, KimaSidebar, KimaNavigationMenu, KimaMenu, KimaButton, KimaIconButton,
  KimaBadge, KimaCard, KimaStatistic, KimaChart, KimaHeatmap, KimaTable, KimaTimeline,
  KimaList, KimaAlert, KimaBanner, KimaPageHeader, KimaFieldGroup, KimaInputGroup,
  KimaTextField, KimaSelect, KimaSwitch, KimaSlider, KimaCheckbox, KimaCheckboxGroup,
  KimaRadioGroup, KimaDatePicker, KimaTimePicker, KimaDialog, KimaDrawer, KimaTooltip,
  KimaAccordion, KimaStepper, KimaBreadcrumb, KimaTabs, KimaProgress, KimaRingProgress,
  KimaAvatar, KimaAvatarGroup, KimaIcon, KimaLink, KimaDivider, KimaEmptyState,
  KimaSpinner, KimaSkeleton, KimaNotification, KimaCommand, KimaPagination, KimaField,
} from '../index.js';
import {
  Home01Icon, Folder01Icon, Settings01Icon, Notification01Icon, Search01Icon,
  PlusSignIcon, SparklesIcon,
} from '@hugeicons/core-free-icons';

defineProps({ navigate: { type: Function, required: true } });

/* ---- 应用壳 ---- */
const page = ref('dashboard');
const navItems = [
  { value: 'dashboard', label: '仪表盘' },
  { value: 'projects', label: '项目', children: [{ value: 'active', label: '进行中' }, { value: 'archived', label: '已归档' }] },
  { value: 'team', label: '团队' },
  { value: 'settings', label: '设置' },
];
const actions = [
  { value: 'new', label: '新建项目' },
  { value: 'export', label: '导出', children: [{ value: 'pdf', label: 'PDF' }, { value: 'csv', label: 'CSV' }] },
  { value: 'density', label: '舒适密度', type: 'radio', group: 'density' },
  { value: 'compact', label: '紧凑密度', type: 'radio', group: 'density' },
];

/* ---- 仪表盘 ---- */
const chartMode = ref('line');
const chartSeries = [
  { name: '本月', data: [42, 58, 51, 74, 66, 89] },
  { name: '上月', data: [30, 44, 38, 52, 47, 61] },
];
const heatValues = [
  [0, 1, 3, 5, 8, 13],
  [2, 4, 8, 4, 3, 7],
  [3, 5, 9, 12, 2, 4],
  [1, 2, 3, 8, 12, 16],
];

/* ---- 数据 ---- */
const columns = [
  { key: 'name', label: '任务', filterable: true, editable: true, width: '34%' },
  { key: 'state', label: '状态', filterable: true, width: '26%' },
  { key: 'owner', label: '负责人', editable: true },
];
const rows = ref([
  { id: 'a1', name: '设计评审', state: '进行中', owner: '林青' },
  { id: 'a2', name: '键盘验收', state: '已完成', owner: '陈禾' },
  { id: 'a3', name: '发布检查', state: '待开始', owner: 'Alex' },
]);
const selectedRows = ref([]);
const timelineItems = [
  { title: '需求确认', description: '与产品对齐范围', time: '周一' },
  { title: '设计完成', description: '交互稿已评审', time: '周三' },
  { title: '开发中', description: '组件接入完成 60%', time: '今天', current: true },
];
const listItems = [
  { title: '发布前检查', description: '键盘可达性与读屏' },
  { title: '深浅主题走查', description: '容器色配对' },
  { title: '动效中间帧', description: '高度过渡' },
];

/* ---- 表单 ---- */
const name = ref('');
const mail = ref('');
const budget = ref('');
const country = ref('cn');
const countries = [
  { value: 'cn', label: '中国' },
  { value: 'jp', label: '日本' },
  { value: 'de', label: '德国' },
];
const birthday = ref('');
const deadline = ref('09:30');
const notify = ref(true);
const volume = ref(40);
const channels = ref(['邮件']);
const channelOptions = [
  { value: '邮件', label: '邮件' },
  { value: '短信', label: '短信' },
  { value: '站内', label: '站内信' },
];
const plan = ref('pro');
const planOptions = [
  { value: 'free', label: '免费版' },
  { value: 'pro', label: '专业版' },
  { value: 'team', label: '团队版' },
];

/* ---- 弹层 ---- */
const dialogOpen = ref(false);
const drawerOpen = ref(false);
const commandOpen = ref(false);
const commandItems = [
  { value: 'new', label: '新建项目', group: '操作' },
  { value: 'invite', label: '邀请成员', group: '操作' },
  { value: 'theme', label: '切换主题', group: '偏好' },
  { value: 'docs', label: '打开文档', group: '偏好' },
];
const noticeOpen = ref(false);
function notifySent() { noticeOpen.value = true; }

/* ---- 导航 ---- */
const step = ref(1);
const steps = [
  { title: '填写信息' }, { title: '确认订单' }, { title: '完成' },
];
const tabValue = ref('overview');
const tabItems = [
  { value: 'overview', label: '概览' },
  { value: 'activity', label: '动态' },
  { value: 'files', label: '文件' },
];
const accordionItems = [
  { title: '如何换主题色？', content: '调用 applyPalette() 传入新的种子色，全部组件一起换色。' },
  { title: '支持原生网页吗？', content: '支持。引入 elements 入口后直接写 <kima-button> 标签。' },
];
const breadcrumbItems = [
  { label: '工作区', href: '#gallery-workspace' },
  { label: '项目', href: '#gallery-projects' },
  { label: '仪表盘' },
];
const pageNum = ref(2);
</script>

<template>
  <div class="kima-overview">
    <KimaAppShell class="kima-overview__shell">
      <template #header>
        <div class="kima-overview__topbar">
          <div class="kima-overview__brand">
            <KimaIcon :icon="SparklesIcon" />
            <strong>KIMA 工作台</strong>
            <KimaBadge value="演示" variant="primary" />
          </div>
          <KimaButton variant="text" @click="commandOpen = true">
            <template #leading><KimaIcon :icon="Search01Icon" /></template>搜索…
          </KimaButton>
          <div class="kima-overview__topbar-actions">
            <KimaTooltip label="通知">
              <KimaIconButton :icon="Notification01Icon" label="通知" variant="text" @click="notifySent" />
            </KimaTooltip>
            <KimaMenu :items="actions" label="操作菜单" />
            <KimaAvatar name="林青" />
          </div>
        </div>
      </template>
      <template #sidebar>
        <KimaNavigationMenu v-model="page" :items="navItems" orientation="vertical" label="主导航" />
        <KimaDivider />
        <div class="kima-overview__side-foot">
          <KimaAvatarGroup :items="[{ name: '林青' }, { name: '陈禾' }, { name: 'Alex' }]" :max="3" label="在线成员" />
          <span>3 人在线</span>
        </div>
      </template>
      <template #main>
        <KimaPageHeader heading="仪表盘" description="全部组件组合在一个真实界面里，每一块都可直接交互。">
          <template #breadcrumbs><KimaBreadcrumb :items="breadcrumbItems" /></template>
          <template #actions>
            <KimaButton variant="text" @click="drawerOpen = true">筛选</KimaButton>
            <KimaButton @click="dialogOpen = true"><template #leading><KimaIcon :icon="PlusSignIcon" /></template>新建项目</KimaButton>
          </template>
        </KimaPageHeader>

        <KimaBanner heading="本月剩余额度 32%" variant="info">升级到团队版可解锁无限项目与审计日志。</KimaBanner>

        <!-- 仪表盘：统计 + 图表 + 热力 -->
        <section class="kima-overview__stats">
          <KimaCard><KimaStatistic label="总访问量" :value="123456" suffix="次" /></KimaCard>
          <KimaCard><KimaStatistic label="本月收入" :value="8192.5" :options="{ style: 'currency', currency: 'CNY' }" /></KimaCard>
          <KimaCard><KimaStatistic label="完成比例" :value="0.875" :options="{ style: 'percent', maximumFractionDigits: 1 }" /></KimaCard>
          <KimaCard><div class="kima-overview__ring"><KimaRingProgress :value="68" show-value label="存储用量" /></div></KimaCard>
        </section>

        <section class="kima-overview__charts">
          <KimaCard class="kima-overview__chart-card">
            <template #header>
              <span>月度流量</span>
              <KimaSelect v-model="chartMode" :items="[{ value: 'line', label: '折线' }, { value: 'bar', label: '柱状' }]" label="图表形式" />
            </template>
            <KimaChart :series="chartSeries" :labels="['一月', '二月', '三月', '四月', '五月', '六月']" :mode="chartMode" label="月度流量" />
          </KimaCard>
          <KimaCard class="kima-overview__chart-card">
            <template #header><span>一周活跃度</span></template>
            <KimaHeatmap :values="heatValues" :columns="['周一', '周二', '周三', '周四', '周五', '周六']" :rows="['早间', '午间', '下午', '夜间']" label="活跃热力" />
          </KimaCard>
        </section>

        <!-- 数据：表格 + 时间线 + 列表 -->
        <section class="kima-overview__data">
          <KimaCard class="kima-overview__table-card">
            <template #header>
              <span>任务</span>
              <KimaBadge :value="`${selectedRows.length} 已选`" variant="muted" />
            </template>
            <KimaTable :columns="columns" :rows="rows" row-key="id" selectable hoverable v-model="selectedRows" />
            <template #footer>
              <KimaPagination v-model="pageNum" :total="48" :page-size="10" label="任务分页" />
            </template>
          </KimaCard>
          <div class="kima-overview__data-side">
            <KimaCard><template #header><span>发布进程</span></template><KimaTimeline :items="timelineItems" label="发布进程" /></KimaCard>
            <KimaCard><template #header><span>检查清单</span></template><KimaList :items="listItems" label="检查清单" /></KimaCard>
          </div>
        </section>

        <!-- 表单：字段组 + 复合输入 + 选择 + 日期 + 开关 + 滑块 -->
        <section class="kima-overview__form">
          <KimaCard>
            <template #header><span>项目设置</span></template>
            <form class="kima-overview__form-body" @submit.prevent="notifySent">
              <KimaFieldGroup legend="基本信息" hint="姓名与邮箱至少填一项。">
                <KimaTextField v-model="name" label="项目名称" name="overview-name" placeholder="例如：官网改版" />
                <KimaTextField v-model="mail" label="联系邮箱" name="overview-mail" type="email" placeholder="name@example.com" />
              </KimaFieldGroup>
              <KimaInputGroup v-model="budget" label="预算金额">
                <template #prefix><span>¥</span></template>
                <template #suffix><span>元</span></template>
              </KimaInputGroup>
              <div class="kima-overview__form-grid">
                <KimaSelect v-model="country" :items="countries" label="所在地区" />
                <KimaDatePicker v-model="birthday" label="开始日期" />
                <KimaTimePicker v-model="deadline" label="截止时间" />
              </div>
              <KimaCheckboxGroup v-model="channels" :items="channelOptions" label="通知渠道" />
              <KimaRadioGroup v-model="plan" :items="planOptions" label="套餐" />
              <div class="kima-overview__form-toggles">
                <KimaSwitch v-model="notify" label="接收邮件通知" />
                <KimaCheckbox v-model="notify" label="同时接收站内信" />
              </div>
              <KimaField label="提醒音量">
                <KimaSlider v-model="volume" label="提醒音量" show-value />
              </KimaField>
              <div class="kima-overview__form-actions">
                <KimaButton type="reset" variant="text">重置</KimaButton>
                <KimaButton type="submit">保存设置</KimaButton>
              </div>
            </form>
          </KimaCard>
        </section>

        <!-- 导航与反馈 -->
        <section class="kima-overview__nav">
          <KimaCard>
            <template #header><span>发布流程</span></template>
            <KimaStepper v-model="step" :items="steps" linear label="发布流程" />
            <div class="kima-overview__nav-actions">
              <KimaButton variant="text" :disabled="step <= 0" @click="step -= 1">上一步</KimaButton>
              <KimaButton :disabled="step >= steps.length - 1" @click="step += 1">下一步</KimaButton>
            </div>
          </KimaCard>
          <KimaCard>
            <template #header><span>常见问题</span></template>
            <KimaAccordion :items="accordionItems" label="常见问题" />
          </KimaCard>
          <KimaCard>
            <template #header><span>视图切换</span></template>
            <KimaTabs v-model="tabValue" :items="tabItems" label="项目视图">
              <template #panel="{ item }">
                <p v-if="item.value === 'overview'">项目概览内容。</p>
                <p v-else-if="item.value === 'activity'">最近动态内容。</p>
                <p v-else>文件列表内容。</p>
              </template>
            </KimaTabs>
          </KimaCard>
          <KimaCard>
            <template #header><span>加载与空态</span></template>
            <div class="kima-overview__states">
              <KimaSpinner label="加载中" />
              <KimaProgress :value="volume" :max="100" label="同步进度" />
              <KimaSkeleton :lines="2" label="骨架屏" />
              <KimaEmptyState heading="暂无归档" description="归档的项目会出现在这里。" />
            </div>
          </KimaCard>
        </section>
      </template>
      <template #footer>KIMA · 全部组件组合演示 — 每一块都来自库里的实组件。</template>
    </KimaAppShell>

    <!-- 弹层：真实触发 -->
    <KimaDialog v-model:open="dialogOpen" title="新建项目">
      <KimaTextField label="项目名称" name="dialog-name" placeholder="例如：官网改版" />
      <KimaSelect v-model="country" :items="countries" label="模板" />
      <template #footer>
        <KimaButton variant="text" @click="dialogOpen = false">取消</KimaButton>
        <KimaButton @click="dialogOpen = false; notifySent()">创建</KimaButton>
      </template>
    </KimaDialog>

    <KimaDrawer v-model:open="drawerOpen" placement="right" title="筛选">
      <div class="kima-overview__drawer">
        <KimaField label="状态">
          <KimaCheckboxGroup v-model="channels" :items="channelOptions" label="状态筛选" />
        </KimaField>
        <KimaField label="负责人">
          <KimaSelect v-model="country" :items="countries" label="负责人" />
        </KimaField>
        <KimaButton block @click="drawerOpen = false">应用筛选</KimaButton>
      </div>
    </KimaDrawer>

    <KimaCommand v-model:open="commandOpen" label="命令面板" placeholder="搜索操作…" :items="commandItems" />

    <KimaNotification v-model:open="noticeOpen" heading="操作完成" message="设置已保存，通知从右上角滑入。" variant="success" />
  </div>
</template>

<style scoped lang="scss">
@use "../styles/mixins" as *;

.kima-overview { min-width: 0; }

/* 应用壳撑满内容区，内部各分区用统一的纵向节奏。 */
.kima-overview__shell { width: 100%; }

.kima-overview__topbar {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--kima-space-3);
  min-width: 0;
}

.kima-overview__brand {
  display: flex;
  align-items: center;
  gap: var(--kima-space-2);
  color: var(--kima-color-primary);
}

.kima-overview__topbar-actions {
  display: flex;
  align-items: center;
  gap: var(--kima-space-2);
  margin-inline-start: auto;
}

.kima-overview__side-foot {
  display: flex;
  flex-direction: column;
  gap: var(--kima-space-2);
  padding: var(--kima-space-3) 0;
  color: var(--kima-color-on-surface-variant);
  font-size: var(--kima-font-size-label-small);
}

.kima-overview__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
  gap: var(--kima-space-4);
}

.kima-overview__ring { display: grid; place-items: center; padding: var(--kima-space-2); }

.kima-overview__charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(360px, 100%), 1fr));
  gap: var(--kima-space-4);
}

.kima-overview__chart-card :deep(.kima-card__header) { justify-content: space-between; }

.kima-overview__data {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(240px, 1fr);
  gap: var(--kima-space-4);
  align-items: start;
}

.kima-overview__table-card :deep(.kima-card__header) { justify-content: space-between; }
.kima-overview__table-card :deep(.kima-card__footer) { justify-content: center; }

.kima-overview__data-side {
  display: grid;
  gap: var(--kima-space-4);
  min-width: 0;
}

.kima-overview__form-body {
  display: flex;
  flex-direction: column;
  gap: var(--kima-space-5);
  min-width: 0;
}

.kima-overview__form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
  gap: var(--kima-space-4);
}

.kima-overview__form-toggles { display: flex; flex-wrap: wrap; gap: var(--kima-space-6); }
.kima-overview__form-actions { display: flex; justify-content: flex-end; gap: var(--kima-space-3); }

.kima-overview__nav {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr));
  gap: var(--kima-space-4);
  align-items: start;
}

.kima-overview__nav-actions { display: flex; justify-content: flex-end; gap: var(--kima-space-3); margin-top: var(--kima-space-4); }

.kima-overview__states {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--kima-space-6);
}

.kima-overview__drawer { display: flex; flex-direction: column; gap: var(--kima-space-5); }

@media (max-width: 900px) {
  .kima-overview__data { grid-template-columns: minmax(0, 1fr); }
}
</style>
