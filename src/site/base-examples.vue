<!-- 组件实时示例：component 指定当前文档页的组件，复用实际 KIMA 交互。 -->
<script setup>
import { ref } from "vue";
import {
  Add01Icon,
  FavouriteIcon,
  Folder01Icon,
  HeartIcon,
  Menu01Icon,
  MoreHorizontalIcon,
  Settings01Icon,
  SparklesIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import {
  KimaBadge,
  KimaButton,
  KimaButtonGroup,
  KimaCard,
  KimaCascader,
  KimaCheckbox,
  KimaCombobox,
  KimaCodeBlock,
  KimaDatePicker,
  KimaDialog,
  KimaDivider,
  KimaDrawer,
  KimaEmptyState,
  KimaIcon,
  KimaIconButton,
  KimaLayout,
  KimaMenu,
  KimaNotification,
  KimaPagination,
  KimaProgress,
  KimaSelect,
  KimaSlider,
  KimaSwitch,
  KimaTable,
  KimaTabs,
  KimaTextField,
  KimaTimePicker,
  KimaTooltip,
  KimaTree,
  KimaVirtualScroll,
} from "@/index";
const props = defineProps({ component: { type: String, required: true } });
// 每个分组只在包含当前组件时渲染；空分组会留下 flex gap，把演示区撑高。
function visible(...keywords) {
  return keywords.includes(props.component);
}

// --- 按钮与动作 ---
const clicks = ref(0);
function countClick() {
  clicks.value += 1;
}

// --- 表单输入 ---
const textValue = ref("");
const password = ref("");
const email = ref("hello@kima.dev");
const accepted = ref(true);
const partial = ref(false);
const syncEnabled = ref(true);
const volume = ref(40);
const progressValue = ref(65);

// --- 选择与日期 ---
const countries = [
  { value: "cn", label: "中国" },
  { value: "jp", label: "日本", description: "东亚" },
  { value: "de", label: "德国", description: "欧洲" },
  { value: "br", label: "巴西", disabled: true },
];
const country = ref("cn");
const tags = [
  { value: "design", label: "设计" },
  { value: "code", label: "开发" },
  { value: "docs", label: "文档" },
];
const tag = ref(null);
const categoryPath = ref(["tech", "web"]);
const categoryOptions = [
  {
    value: "tech",
    label: "技术",
    children: [
      { value: "web", label: "前端", children: [{ value: "vue", label: "Vue" }, { value: "react", label: "React" }] },
      { value: "native", label: "原生" },
    ],
  },
  { value: "life", label: "生活" },
];
const birthday = ref("1998-06-15");
const dateOpen = ref(false);
const startTime = ref("09:30");
const timeOpen = ref(false);

// --- 反馈与提示 ---
const dialogOpen = ref(false);
// 抽屉的三个方向各一个开关：并排展示，方便对比滑入方向。
const drawerBottomOpen = ref(false);
const drawerRightOpen = ref(false);
const drawerLeftOpen = ref(false);
// 吸附版：四档高度，拖一下就换档。当前档位让组件自己管，这里只读不回写。
const drawerSnapOpen = ref(false);
const drawerSnap = ref(0.4);
const noticeOpen = ref(false);
const noticeVariant = ref("success");
const noticeHeading = ref("操作完成");
const noticeMessage = ref("四种语义各配一个图标，状态不只靠颜色表达。");
// --- 数据展示 ---
const columns = [
  { key: "name", label: "名称", sortable: true },
  { key: "role", label: "角色" },
  { key: "state", label: "状态", align: "end" },
];
const rows = ref([
  { id: "1", name: "林一", role: "设计", state: "在线" },
  { id: "2", name: "赵二", role: "开发", state: "离线" },
  { id: "3", name: "钱三", role: "测试", state: "在线" },
]);
const selectedRows = ref([]);
const sort = ref({ key: "", direction: "" });
function applySort(event) {
  sort.value = event;
  const direction = event.direction === "asc" ? 1 : -1;
  rows.value = [...rows.value].sort((left, right) => (left[event.key] > right[event.key] ? direction : -direction));
}

const treeItems = [
  {
    value: "src",
    label: "src",
    children: [
      { value: "components", label: "components", children: [{ value: "button", label: "button.ce.vue" }] },
      { value: "styles", label: "styles" },
    ],
  },
  { value: "readme", label: "README.md" },
];
const treeSelected = ref("button");
const treeExpanded = ref(["src", "components"]);

const page = ref(1);
const treePageSize = 20;

const virtualItems = Array.from({ length: 5000 }, (_, index) => ({ value: `row-${index}`, label: `第 ${index + 1} 行` }));
const virtualSelected = ref(null);

// --- 结构与导航 ---
const menuValue = ref("recent");
const menuOpen = ref(false);
const menuItems = [
  { value: "recent", label: "最近打开" },
  { value: "starred", label: "已收藏" },
  { value: "archived", label: "归档", disabled: true },
];
const tabValue = ref("overview");
const tabItems = [
  { value: "overview", label: "概览" },
  { value: "usage", label: "用法" },
  { value: "api", label: "API" },
];
const viewValue = ref("grid");
const viewItems = [
  { value: "grid", label: "网格" },
  { value: "list", label: "列表" },
  { value: "board", label: "看板" },
];

const codeExample = `import { applyPalette } from '@kernel4632/kima/theme';

// 一颗种子，整个界面。
const theme = { seed: '#61afef', isDark: true };
applyPalette(theme.seed, theme);
`;
</script>
<template>
    <div class="kima-gallery__body">
      <div class="kima-gallery__main">
        <article v-if="component === 'icon'" class="kima-gallery__demo">
          <div class="kima-gallery__row"><KimaIcon v-for="icon in [SparklesIcon, Folder01Icon, StarIcon, Settings01Icon]" :key="icon" :icon="icon" :size="32" /></div>
        </article>
        <article v-if="component === 'code-block'" class="kima-gallery__demo">
          <KimaCodeBlock :code="codeExample" language="javascript" filename="theme.js" line-numbers />
          <KimaCodeBlock code="pnpm add @kernel4632/kima vue" language="shell" />
        </article>
        <!-- 按钮与动作 -->
        <section v-show="visible('按钮与动作', 'button', 'icon-button', 'button-group', 'badge', 'divider', 'card')" id="actions" class="kima-gallery__section">
          <h2>按钮与动作</h2>

          <article v-show="visible('button', '按钮')" class="kima-gallery__demo">
            <header><h3>Button 按钮</h3><p>四种外观、加载和禁用状态。点击计数：{{ clicks }}</p></header>
            <div class="kima-gallery__row">
              <kima-button @click="countClick">填充</kima-button>
              <kima-button variant="tonal" @click="countClick">柔和</kima-button>
              <kima-button variant="outlined" @click="countClick">描边</kima-button>
              <kima-button variant="text" @click="countClick">文字</kima-button>
              <kima-button loading>加载中</kima-button>
              <kima-button disabled>禁用</kima-button>
              <kima-button round @click="countClick">
                <template #leading><KimaIcon :icon="Add01Icon" :size="18" /></template>
                新建
              </kima-button>
            </div>
          </article>

          <article v-show="visible('icon-button', '图标按钮')" class="kima-gallery__demo">
            <header><h3>IconButton 图标按钮</h3><p>单个图标的可访问按钮，三种尺寸。</p></header>
            <div class="kima-gallery__row">
              <kima-icon-button label="收藏" :icon="HeartIcon" />
              <kima-icon-button label="收藏" variant="tonal" :icon="FavouriteIcon" />
              <kima-icon-button label="设置" variant="outlined" :icon="Settings01Icon" />
              <kima-icon-button label="更多" variant="text" :icon="MoreHorizontalIcon" />
              <kima-icon-button label="小号" size="small" variant="tonal" :icon="Menu01Icon" />
              <kima-icon-button label="大号" size="large" :icon="StarIcon" />
              <kima-icon-button label="加载中" loading />
            </div>
          </article>

          <article v-show="visible('button-group', '按钮组')" class="kima-gallery__demo">
            <header><h3>ButtonGroup 按钮组</h3><p>单选切换视图，支持方向键。</p></header>
            <div class="kima-gallery__row">
              <kima-button-group v-model="viewValue" :items="viewItems" />
              <kima-button-group v-model="viewValue" :items="viewItems" size="small" />
            </div>
          </article>

          <article v-show="visible('badge', '徽章')" class="kima-gallery__demo">
            <header><h3>Badge 徽章</h3><p>状态、数量和圆点三种用法。</p></header>
            <div class="kima-gallery__row">
              <kima-badge value="8" />
              <kima-badge :value="128" :max="99" variant="danger" aria-label="128 条未读" />
              <kima-badge value="新" variant="primary" />
              <kima-badge value="在线" variant="success" />
              <kima-badge dot variant="success" aria-label="在线" />
            </div>
          </article>

          <article v-show="visible('divider', '分割线')" class="kima-gallery__demo">
            <header><h3>Divider 分割线</h3><p>水平、带文字和垂直三种形态。</p></header>
            <div class="kima-gallery__stack">
              <kima-divider />
              <kima-divider label="或者" />
              <div class="kima-gallery__row kima-gallery__row--tall">
                <span>左</span>
                <kima-divider vertical />
                <span>右</span>
              </div>
            </div>
          </article>

          <article v-show="visible('card', '卡片')" class="kima-gallery__demo">
            <header><h3>Card 卡片</h3><p>三种容器样式，可点击的卡片支持键盘。</p></header>
            <div class="kima-gallery__grid">
              <kima-card>
                <template #header><strong>表面卡片</strong></template>
                <p>默认的容器样式。</p>
              </kima-card>
              <kima-card variant="outlined">
                <template #header><strong>描边卡片</strong></template>
                <p>透明的底色配描边。</p>
              </kima-card>
              <kima-card variant="elevated" clickable @click="countClick">
                <template #header><strong>可点击卡片</strong></template>
                <p>点击计数加到上方的按钮示例。</p>
              </kima-card>
            </div>
          </article>
        </section>

        <!-- 表单输入 -->
        <section v-show="visible('表单输入', 'text-field', 'checkbox', 'switch', 'slider', 'progress')" id="form" class="kima-gallery__section">
          <h2>表单输入</h2>

          <article v-show="visible('text-field', '文本框')" class="kima-gallery__demo">
            <header><h3>TextField 文本框</h3><p>组件只画输入区域本身。当前值：{{ textValue || "空" }}</p></header>
            <div class="kima-gallery__grid">
              <kima-text-field v-model="textValue" placeholder="请输入昵称" clearable />
              <kima-text-field v-model="email" type="email" placeholder="请输入邮箱" hint="用于接收通知" />
              <kima-text-field :model-value="'错误示例'" error="这个值不符合要求" />
              <kima-text-field v-model="password" type="password" placeholder="请输入密码" clearable />
              <kima-text-field :model-value="''" hint="这段是说明文字" />
              <kima-text-field :model-value="'只读'" readonly />
            </div>
          </article>

          <article v-show="visible('checkbox', '复选框')" class="kima-gallery__demo">
            <header><h3>Checkbox 复选框</h3><p>选中、半选和禁用。选中：{{ accepted }}</p></header>
            <div class="kima-gallery__row">
              <kima-checkbox v-model="accepted" label="接受条款" />
              <kima-checkbox v-model="partial" :indeterminate="true" label="半选状态" />
              <kima-checkbox :model-value="true" disabled label="已禁用" />
            </div>
          </article>

          <article v-show="visible('switch', '开关')" class="kima-gallery__demo">
            <header><h3>Switch 开关</h3><p>开关状态：{{ syncEnabled }}</p></header>
            <div class="kima-gallery__row">
              <kima-switch v-model="syncEnabled">启用同步</kima-switch>
              <kima-switch :model-value="false">关闭示例</kima-switch>
              <kima-switch :model-value="true" disabled>禁用</kima-switch>
            </div>
          </article>

          <article v-show="visible('slider', '滑块')" class="kima-gallery__demo">
            <header><h3>Slider 滑块</h3><p>音量：{{ volume }}</p></header>
            <div class="kima-gallery__stack">
              <kima-slider v-model="volume" label="音量" show-value />
              <kima-slider :model-value="25" :min="0" :max="50" label="范围 0-50" show-value />
              <kima-slider :model-value="60" label="禁用" disabled />
            </div>
          </article>

          <article v-show="visible('progress', '进度条')" class="kima-gallery__demo">
            <header><h3>Progress 进度条</h3><p>进度：{{ progressValue }}%</p></header>
            <div class="kima-gallery__stack">
              <kima-progress :value="progressValue" label="下载进度" />
              <kima-progress indeterminate label="正在连接" />
              <div class="kima-gallery__row">
              <kima-button variant="tonal" @click="progressValue = Math.max(0, progressValue - 10)">减 10</kima-button>
              <kima-button variant="tonal" @click="progressValue = Math.min(100, progressValue + 10)">加 10</kima-button>
              </div>
            </div>
          </article>
        </section>

        <!-- 选择与日期 -->
        <section v-show="visible('选择与日期', 'select', 'combobox', 'cascader', 'date-picker', 'time-picker')" id="pickers" class="kima-gallery__section">
          <h2>选择与日期</h2>

          <article v-show="visible('select', '选择器')" class="kima-gallery__demo">
            <header><h3>Select 选择器</h3><p>已选：{{ country || "未选择" }}</p></header>
            <div class="kima-gallery__grid">
              <kima-select v-model="country" label="国家" :items="countries" searchable clearable />
              <kima-select :model-value="null" label="必填" :items="countries" required placeholder="请选择国家" />
            </div>
          </article>

          <article v-show="visible('combobox', '组合框')" class="kima-gallery__demo">
            <header><h3>Combobox 组合框</h3><p>输入可过滤，已选：{{ tag || "未选择" }}</p></header>
            <div class="kima-gallery__grid">
              <kima-combobox v-model="tag" label="标签" :items="tags" clearable searchable />
              <kima-combobox :model-value="null" label="自由输入" :items="tags" free-solo searchable />
            </div>
          </article>

          <article v-show="visible('cascader', '级联')" class="kima-gallery__demo">
            <header><h3>Cascader 级联选择</h3><p>路径：{{ categoryPath.join(" / ") }}</p></header>
            <kima-cascader v-model="categoryPath" label="分类" :options="categoryOptions" clearable />
          </article>

          <article v-show="visible('date-picker', '日期')" class="kima-gallery__demo">
            <header><h3>DatePicker 日期选择</h3><p>日期：{{ birthday || "未选择" }}</p></header>
            <div class="kima-gallery__grid">
              <kima-date-picker v-model="birthday" v-model:open="dateOpen" label="生日" locale="zh-CN" clearable />
              <kima-date-picker
                :model-value="'2024-06-15'"
                min="2024-06-01"
                max="2024-06-20"
                label="限定范围"
                locale="zh-CN"
              />
            </div>
          </article>

          <article v-show="visible('time-picker', '时间')" class="kima-gallery__demo">
            <header><h3>TimePicker 时间选择</h3><p>时间：{{ startTime || "未选择" }}</p></header>
            <div class="kima-gallery__grid">
              <kima-time-picker v-model="startTime" v-model:open="timeOpen" label="开始时间" locale="zh-CN" :step="15" clearable />
              <kima-time-picker :model-value="'14:00'" label="12 小时制" locale="en-US" :hour12="true" />
            </div>
          </article>
        </section>

        <!-- 反馈与提示 -->
        <section v-show="visible('反馈与提示', 'notification', 'dialog', 'drawer', 'tooltip', 'empty-state')" id="feedback" class="kima-gallery__section">
          <h2>反馈与提示</h2>

          <article v-show="visible('notification', '通知')" class="kima-gallery__demo">
            <header><h3>Notification 通知</h3><p>右上角浮层，可自动关闭。</p></header>
            <div class="kima-gallery__row">
              <kima-button variant="tonal" @click="noticeVariant = 'success'; noticeOpen = true">成功通知</kima-button>
              <kima-button variant="tonal" @click="noticeVariant = 'warning'; noticeOpen = true">警告通知</kima-button>
              <kima-button variant="tonal" @click="noticeVariant = 'danger'; noticeOpen = true">错误通知</kima-button>
              <kima-button variant="outlined" @click="noticeVariant = 'info'; noticeOpen = true">信息通知</kima-button>
            </div>
          </article>

          <article v-show="visible('dialog', '对话框')" class="kima-gallery__demo">
            <header><h3>Dialog 对话框</h3><p>模态弹层，按 Esc 或点遮罩关闭。</p></header>
            <kima-button @click="dialogOpen = true">打开对话框</kima-button>
          </article>

          <article v-show="visible('drawer', '抽屉')" class="kima-gallery__demo">
            <header><h3>Drawer 抽屉</h3><p>从底边或侧边滑入，背景变暗模糊。底部抽屉可抓着把手往下拖关闭。</p></header>
            <div class="kima-gallery__row">
              <kima-button variant="tonal" @click="drawerBottomOpen = true">底部抽屉</kima-button>
              <kima-button variant="tonal" @click="drawerRightOpen = true">右侧抽屉</kima-button>
              <kima-button variant="tonal" @click="drawerLeftOpen = true">左侧抽屉</kima-button>
              <kima-button variant="outlined" @click="drawerSnapOpen = true">
                吸附抽屉（四档 · 当前 {{ Math.round(drawerSnap * 100) }}%）
              </kima-button>
            </div>
          </article>

          <article v-show="visible('tooltip', '提示')" class="kima-gallery__demo">
            <header><h3>Tooltip 提示框</h3><p>悬停或聚焦触发。</p></header>
            <div class="kima-gallery__row">
              <kima-tooltip text="保存当前内容"><kima-button variant="outlined">底部提示</kima-button></kima-tooltip>
              <kima-tooltip text="这段提示显示在上方" position="top"><kima-button variant="outlined">顶部提示</kima-button></kima-tooltip>
              <kima-tooltip text="右侧说明" position="right"><kima-button variant="outlined">右侧提示</kima-button></kima-tooltip>
            </div>
          </article>

          <article v-show="visible('empty-state', '空状态')" class="kima-gallery__demo">
            <header><h3>EmptyState 空状态</h3><p>没有内容时的占位。</p></header>
            <kima-empty-state heading="还没有项目" description="创建第一个项目后，它会显示在这里。">
              <template #icon><KimaIcon :icon="Folder01Icon" :size="40" /></template>
              <template #action><kima-button variant="tonal">创建项目</kima-button></template>
            </kima-empty-state>
          </article>
        </section>

        <!-- 数据展示 -->
        <section v-show="visible('数据展示', 'table', 'tree', 'pagination', 'virtual-scroll')" id="data" class="kima-gallery__section">
          <h2>数据展示</h2>

          <article v-show="visible('table', '表格')" class="kima-gallery__demo">
            <header><h3>Table 数据表</h3><p>已选 {{ selectedRows.length }} 行，可点表头排序。</p></header>
            <kima-table
              v-model="selectedRows"
              :columns="columns"
              :rows="rows"
              row-key="id"
              caption="团队成员"
              selectable
              striped
              hoverable
              :sort-key="sort.key"
              :sort-direction="sort.direction"
              @sort-change="applySort"
            />
          </article>

          <article v-show="visible('tree', '树')" class="kima-gallery__demo">
            <header><h3>Tree 树</h3><p>已选：{{ treeSelected || "未选择" }}</p></header>
            <kima-tree
              v-model="treeSelected"
              v-model:expanded="treeExpanded"
              :items="treeItems"
              selectable
            />
          </article>

          <article v-show="visible('pagination', '分页')" class="kima-gallery__demo">
            <header><h3>Pagination 分页</h3><p>当前第 {{ page }} 页。</p></header>
            <div class="kima-gallery__stack">
              <kima-pagination v-model="page" :total="480" :page-size="treePageSize" />
              <kima-pagination v-model="page" :total="480" :page-size="treePageSize" compact :sibling-count="1" />
            </div>
          </article>

          <article v-show="visible('virtual-scroll', '虚拟滚动')" class="kima-gallery__demo">
            <header><h3>VirtualScroll 虚拟滚动</h3><p>5000 行只渲染可见部分，已选：{{ virtualSelected || "未点击" }}</p></header>
            <kima-virtual-scroll
              v-model="virtualSelected"
              :items="virtualItems"
              :item-height="36"
              height="280"
              :overscan="3"
            >
              <template #default="{ item, index }">
                <span class="kima-gallery__row-index">{{ index + 1 }}</span>
                {{ item.label }}
              </template>
            </kima-virtual-scroll>
          </article>
        </section>

        <!-- 结构与导航 -->
        <section v-show="visible('结构与导航', 'layout', 'menu', 'tabs')" id="structure" class="kima-gallery__section">
          <h2>结构与导航</h2>

          <article v-show="visible('menu', '菜单')" class="kima-gallery__demo">
            <header><h3>Menu 菜单</h3><p>可搜索的单选菜单，已选：{{ menuValue }}</p></header>
            <div class="kima-gallery__row">
              <kima-menu v-model="menuValue" v-model:open="menuOpen" :items="menuItems" label="排序" searchable />
            </div>
          </article>

          <article v-show="visible('tabs', '标签页')" class="kima-gallery__demo">
            <header><h3>Tabs 标签页</h3><p>当前标签：{{ tabValue }}</p></header>
            <kima-tabs v-model="tabValue" :items="tabItems">
              <template #panel="{ item }">
                <p>{{ item.label }} 面板的内容。用方向键切换标签。</p>
              </template>
            </kima-tabs>
          </article>

          <article v-show="visible('layout', '布局')" class="kima-gallery__demo">
            <header><h3>Layout 布局容器</h3><p>页面和面板两种容器。</p></header>
            <div class="kima-gallery__stack">
              <kima-layout variant="panel" :max-width="520" :gap="12">
                <template #header><strong>面板标题</strong></template>
                <span>面板内容，最大宽度 520。</span>
                <template #footer><kima-button variant="tonal">确定</kima-button></template>
              </kima-layout>
            </div>
          </article>
        </section>

      </div>
    </div>
    <kima-notification
      v-model:open="noticeOpen"
      :variant="noticeVariant"
      :duration="8000"
      :heading="noticeHeading"
      :message="noticeMessage"
      position="top-right"
    />

    <kima-dialog v-model:open="dialogOpen" title="确认操作" description="这个示例展示对话框的标题、说明和按钮区。">
      <p>对话框使用原生 modal 实现，会自动隔离背景并管理键盘焦点。</p>
      <template #footer>
        <kima-button variant="text" @click="dialogOpen = false">取消</kima-button>
        <kima-button @click="dialogOpen = false">确定</kima-button>
      </template>
    </kima-dialog>

    <kima-drawer v-model:open="drawerBottomOpen" title="底部抽屉" description="抓住顶部的把手往下拖，可以拖动关闭；没拖到一半会弹回原位。">
      <label class="kima-demo-field">名称<kima-text-field label="名称" :model-value="'新建项目'" /></label>
      <label class="kima-demo-field">负责人<kima-text-field label="负责人" :model-value="'林一'" /></label>
      <template #footer>
        <kima-button variant="text" @click="drawerBottomOpen = false">取消</kima-button>
        <kima-button @click="drawerBottomOpen = false">完成</kima-button>
      </template>
    </kima-drawer>

    <kima-drawer v-model:open="drawerRightOpen" placement="right" title="右侧抽屉" description="侧抽屉适合导航和详情，全高、最宽 420px。">
      <p>按 Esc、点遮罩或点右上角的关闭按钮都能收起它。</p>
    </kima-drawer>

    <kima-drawer v-model:open="drawerLeftOpen" placement="left" title="左侧抽屉">
      <p>方向和右侧抽屉镜像，其余行为完全一致。</p>
      <template #footer>
        <kima-button variant="text" @click="drawerLeftOpen = false">知道了</kima-button>
      </template>
    </kima-drawer>

    <kima-drawer
      v-model:open="drawerSnapOpen"
      v-model:active-snap-point="drawerSnap"
      title="吸附抽屉"
      :snap-points="[0.4, 0.6, 0.8, 0.95]"
      description="往上拖长高、往下拖变矮，松手吸到最近的一档；拖过最矮一档的 40% 就关闭。"
    >
      <kima-layout>
        <kima-card v-for="index in 6" :key="index">第 {{ index }} 张卡片：档位换了但内容位置不变，只是看到的部分多少不同。</kima-card>
      </kima-layout>
      <template #footer>
        <kima-button variant="text" @click="drawerSnapOpen = false">关闭</kima-button>
      </template>
    </kima-drawer>
    </template>
    <style scoped lang="scss">
    .kima-demo-field { display: grid; gap: var(--kima-space-1); }
    </style>
