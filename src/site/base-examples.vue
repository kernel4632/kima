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
  KimaAvatar,
  KimaBadge,
  KimaCalendar,
  KimaCollapsible,
  KimaButton,
  KimaCard,
  KimaCheckbox,
  KimaCombobox,
  KimaLink,
  KimaPopover,
  KimaDialog,
  KimaDivider,
  KimaDrawer,
  KimaIcon,
  KimaMenu,
  KimaProgress,
  KimaRadioGroup,
  KimaSelect,
  KimaSkeleton,
  KimaSpinner,
  KimaSlider,
  KimaSwitch,
  KimaTable,
  KimaTabs,
  KimaTextField,
  KimaTextarea,
  KimaTypography,
  KimaTooltip,
  KimaTree,
} from "@/index";
const props = defineProps({ component: { type: String, required: true } });
// component="*" 是实验台模式：全部演示平铺，一次看到所有组件并直接交互。
// 每个分组只在包含当前组件时渲染；空分组会留下 flex gap，把演示区撑高。
function visible(...keywords) {
  return props.component === "*" || keywords.includes(props.component);
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
const notes = ref('');
const calendarDate = ref('2026-06-15');
const collapsibleOpen = ref(true);
const popoverOpen = ref(false);

// --- 选择 ---
const countries = [
  { value: "cn", label: "中国" },
  { value: "jp", label: "日本", description: "东亚" },
  { value: "de", label: "德国", description: "欧洲" },
  { value: "br", label: "巴西", disabled: true },
];
const country = ref("cn");
const plan = ref("pro");
const plans = [
  { value: "free", label: "免费版", description: "基础功能" },
  { value: "pro", label: "专业版", description: "全部功能与优先支持" },
  { value: "team", label: "团队版", description: "协作与共享", disabled: true },
];
const tags = [
  { value: "design", label: "设计" },
  { value: "code", label: "开发" },
  { value: "docs", label: "文档" },
];
const tag = ref(null);

// --- 反馈与提示 ---
const dialogOpen = ref(false);
// 抽屉的三个方向各一个开关：并排展示，方便对比滑入方向。
const drawerBottomOpen = ref(false);
const drawerRightOpen = ref(false);
const drawerLeftOpen = ref(false);
// 吸附版：四档高度，拖一下就换档。当前档位让组件自己管，这里只读不回写。
const drawerSnapOpen = ref(false);
const drawerSnap = ref(0.4);
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


</script>
<template>
    <div class="kima-gallery__body">
      <div class="kima-gallery__main">
        <!-- 按钮与动作 -->
        <section v-show="visible('按钮与动作', 'button', 'icon', 'badge', 'divider', 'card')" id="actions" class="kima-gallery__section">
          <kima-typography type="heading" :level="2" size="headline-small">按钮与动作</kima-typography>

          <kima-card v-show="visible('icon', '图标')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Icon 图标</kima-typography><kima-typography type="caption">Hugeicons 线宽 2，随尺寸等比缩放。</kima-typography></header>
            <div class="kima-gallery__row"><kima-icon v-for="icon in [SparklesIcon, Folder01Icon, StarIcon, Settings01Icon]" :key="icon" :icon="icon" :size="32" /></div>
          </kima-card>

          <kima-card v-show="visible('button', '按钮')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Button 按钮</kima-typography><kima-typography type="caption">一个原语覆盖纯文字、图文与纯图标（icon-only）三种形态。点击计数：{{ clicks }}</kima-typography></header>
            <div class="kima-gallery__row">
              <kima-button @click="countClick">填充</kima-button>
              <kima-button variant="tonal" @click="countClick">柔和</kima-button>
              <kima-button variant="outlined" @click="countClick">描边</kima-button>
              <kima-button variant="text" @click="countClick">文字</kima-button>
              <kima-button loading>加载中</kima-button>
              <kima-button disabled>禁用</kima-button>
              <kima-button round @click="countClick">
                <template #leading><kima-icon :icon="Add01Icon" :size="18" /></template>
                新建
              </kima-button>
            </div>
            <div class="kima-gallery__row">
              <kima-button variant="standard" icon-only label="收藏"><kima-icon :icon="HeartIcon" :size="24" /></kima-button>
              <kima-button variant="tonal" icon-only label="收藏"><kima-icon :icon="FavouriteIcon" :size="24" /></kima-button>
              <kima-button variant="outlined" icon-only label="设置"><kima-icon :icon="Settings01Icon" :size="24" /></kima-button>
              <kima-button variant="text" icon-only label="更多"><kima-icon :icon="MoreHorizontalIcon" :size="24" /></kima-button>
              <kima-button variant="tonal" icon-only label="加载中" loading />
            </div>
          </kima-card>

        

          <kima-card v-show="visible('badge', '徽章')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Badge 徽章</kima-typography><kima-typography type="caption">状态、数量和圆点三种用法。</kima-typography></header>
            <div class="kima-gallery__row">
              <kima-badge value="8" />
              <kima-badge :value="128" :max="99" variant="danger" aria-label="128 条未读" />
              <kima-badge value="新" variant="secondary" />
              <kima-badge value="在线" variant="success" />
              <kima-badge value="项目" variant="accent" />
              <kima-badge value="_beta" variant="outline" />
              <kima-badge dot variant="success" aria-label="在线" />
            </div>
          </kima-card>

          <kima-card v-show="visible('divider', '分割线')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Divider 分割线</kima-typography><kima-typography type="caption">水平、带文字和垂直三种形态。</kima-typography></header>
            <div class="kima-gallery__stack">
              <kima-divider />
              <kima-divider label="或者" />
              <div class="kima-gallery__row kima-gallery__row--tall">
                <span>左</span>
                <kima-divider vertical />
                <span>右</span>
              </div>
            </div>
          </kima-card>

          <kima-card v-show="visible('card', '卡片')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Card 卡片</kima-typography><kima-typography type="caption">三种容器样式，可点击的卡片支持键盘。</kima-typography></header>
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
          </kima-card>












        </section>

        <!-- 表单输入 -->
        <section v-show="visible('表单输入', 'text-field', 'checkbox', 'switch', 'slider', 'progress')" id="form" class="kima-gallery__section">
          <kima-typography type="heading" :level="2" size="headline-small">表单输入</kima-typography>

          <kima-card v-show="visible('text-field', '文本框')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">TextField 文本框</kima-typography><kima-typography type="caption">组件只画输入区域本身。当前值：{{ textValue || "空" }}</kima-typography></header>
            <div class="kima-gallery__grid">
              <kima-text-field v-model="textValue" placeholder="请输入昵称" clearable />
              <kima-text-field v-model="email" type="email" placeholder="请输入邮箱" hint="用于接收通知" />
              <kima-text-field :model-value="'错误示例'" error="这个值不符合要求" />
              <kima-text-field v-model="password" type="password" placeholder="请输入密码" clearable />
              <kima-text-field :model-value="''" hint="这段是说明文字" />
              <kima-text-field :model-value="'只读'" readonly />
            </div>
          </kima-card>

          <kima-card v-show="visible('checkbox', '复选框')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Checkbox 复选框</kima-typography><kima-typography type="caption">选中、半选和禁用。选中：{{ accepted }}</kima-typography></header>
            <div class="kima-gallery__row">
              <kima-checkbox v-model="accepted" label="接受条款" />
              <kima-checkbox v-model="partial" :indeterminate="true" label="半选状态" />
              <kima-checkbox :model-value="true" disabled label="已禁用" />
            </div>
          </kima-card>

          <kima-card v-show="visible('switch', '开关')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Switch 开关</kima-typography><kima-typography type="caption">开关状态：{{ syncEnabled }}</kima-typography></header>
            <div class="kima-gallery__row">
              <kima-switch v-model="syncEnabled">启用同步</kima-switch>
              <kima-switch :model-value="false">关闭示例</kima-switch>
              <kima-switch :model-value="true" disabled>禁用</kima-switch>
            </div>
          </kima-card>


          <kima-card v-show="visible('textarea', '多行文本')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Textarea 多行文本</kima-typography><kima-typography type="caption">可调整大小的多行输入。</kima-typography></header>
            <kima-textarea v-model="notes" label="备注" :rows="3" placeholder="写下你的想法…" />
          </kima-card>
          <kima-card v-show="visible('slider', '滑块')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Slider 滑块</kima-typography><kima-typography type="caption">音量：{{ volume }}</kima-typography></header>
            <div class="kima-gallery__stack">
              <kima-slider v-model="volume" label="音量" show-value />
              <kima-slider :model-value="25" :min="0" :max="50" label="范围 0-50" show-value />
              <kima-slider :model-value="60" label="禁用" disabled />
            </div>
          </kima-card>

          <kima-card v-show="visible('progress', '进度条')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Progress 进度条</kima-typography><kima-typography type="caption">进度：{{ progressValue }}%</kima-typography></header>
            <div class="kima-gallery__stack">
              <kima-progress :value="progressValue" label="下载进度" />
              <kima-progress indeterminate label="正在连接" />
              <div class="kima-gallery__row">
              <kima-button variant="tonal" @click="progressValue = Math.max(0, progressValue - 10)">减 10</kima-button>
              <kima-button variant="tonal" @click="progressValue = Math.min(100, progressValue + 10)">加 10</kima-button>
              </div>
            </div>
          </kima-card>












        </section>

        <!-- 选择与日期 -->
        <section v-show="visible('选择与日期', 'select', 'combobox')" id="pickers" class="kima-gallery__section">
          <kima-typography type="heading" :level="2" size="headline-small">选择与日期</kima-typography>

          <kima-card v-show="visible('select', '选择器')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Select 选择器</kima-typography><kima-typography type="caption">已选：{{ country || "未选择" }}</kima-typography></header>
            <div class="kima-gallery__grid">
              <kima-select v-model="country" label="国家" :items="countries" searchable clearable />
              <kima-select :model-value="null" label="必填" :items="countries" required placeholder="请选择国家" />
            </div>
          </kima-card>

          <kima-card v-show="visible('combobox', '组合框')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Combobox 组合框</kima-typography><kima-typography type="caption">输入可过滤，已选：{{ tag || "未选择" }}</kima-typography></header>
            <div class="kima-gallery__grid">
              <kima-combobox v-model="tag" label="标签" :items="tags" clearable searchable />
              <kima-combobox :model-value="null" label="自由输入" :items="tags" free-solo searchable />
            </div>
          </kima-card>

          <kima-card v-show="visible('radio-group', '单选组')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Radio Group 单选组</kima-typography><kima-typography type="caption">箭头键在选项间移动，当前：{{ plan || "未选择" }}</kima-typography></header>
            <div class="kima-gallery__grid">
              <kima-radio-group v-model="plan" label="订阅方案" name="plan" :options="plans" />
              <kima-radio-group :model-value="'free'" label="禁用态" name="plan-disabled" :options="plans" disabled />
            </div>
          </kima-card>

        

        

        












        </section>

        <!-- 反馈与提示 -->
        <section v-show="visible('反馈与提示', 'dialog', 'drawer', 'tooltip')" id="feedback" class="kima-gallery__section">
          <kima-typography type="heading" :level="2" size="headline-small">反馈与提示</kima-typography>

        

          <kima-card v-show="visible('dialog', '对话框')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Dialog 对话框</kima-typography><kima-typography type="caption">模态弹层，按 Esc 或点遮罩关闭。</kima-typography></header>
            <kima-button @click="dialogOpen = true">打开对话框</kima-button>
          </kima-card>

          <kima-card v-show="visible('drawer', '抽屉')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Drawer 抽屉</kima-typography><kima-typography type="caption">从底边或侧边滑入，背景变暗模糊。底部抽屉可抓着把手往下拖关闭。</kima-typography></header>
            <div class="kima-gallery__row">
              <kima-button variant="tonal" @click="drawerBottomOpen = true">底部抽屉</kima-button>
              <kima-button variant="tonal" @click="drawerRightOpen = true">右侧抽屉</kima-button>
              <kima-button variant="tonal" @click="drawerLeftOpen = true">左侧抽屉</kima-button>
              <kima-button variant="outlined" @click="drawerSnapOpen = true">
                吸附抽屉（四档 · 当前 {{ Math.round(drawerSnap * 100) }}%）
              </kima-button>
            </div>
          </kima-card>

          <kima-card v-show="visible('tooltip', '提示')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Tooltip 提示框</kima-typography><kima-typography type="caption">悬停或聚焦触发。</kima-typography></header>
            <div class="kima-gallery__row">
              <kima-tooltip text="保存当前内容"><kima-button variant="outlined">底部提示</kima-button></kima-tooltip>
              <kima-tooltip text="这段提示显示在上方" position="top"><kima-button variant="outlined">顶部提示</kima-button></kima-tooltip>
              <kima-tooltip text="右侧说明" position="right"><kima-button variant="outlined">右侧提示</kima-button></kima-tooltip>
            </div>
          </kima-card>

        












        </section>

        <!-- 数据展示 -->
        <section v-show="visible('数据展示', 'table', 'tree')" id="data" class="kima-gallery__section">
          <kima-typography type="heading" :level="2" size="headline-small">数据展示</kima-typography>

          <kima-card v-show="visible('table', '表格')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Table 数据表</kima-typography><kima-typography type="caption">已选 {{ selectedRows.length }} 行，可点表头排序。</kima-typography></header>
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
          </kima-card>

          <kima-card v-show="visible('tree', '树')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Tree 树</kima-typography><kima-typography type="caption">已选：{{ treeSelected || "未选择" }}</kima-typography></header>
            <kima-tree
              v-model="treeSelected"
              v-model:expanded="treeExpanded"
              :items="treeItems"
              selectable
            />
          </kima-card>

        

        












        </section>

        <!-- 结构与导航 -->
        <section v-show="visible('结构与导航', 'menu', 'tabs')" id="structure" class="kima-gallery__section">
          <kima-typography type="heading" :level="2" size="headline-small">结构与导航</kima-typography>


          <kima-card v-show="visible('collapsible', '折叠')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Collapsible 折叠</kima-typography><kima-typography type="caption">内容展开与收起，高度平滑过渡。</kima-typography></header>
            <kima-collapsible v-model:open="collapsibleOpen" label="详情">
              <p>展开的内容区。收起时高度过渡为 0，不会一帧跳到位。</p>
            </kima-collapsible>
          </kima-card>
          <kima-card v-show="visible('menu', '菜单')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Menu 菜单</kima-typography><kima-typography type="caption">可搜索的单选菜单，已选：{{ menuValue }}</kima-typography></header>
            <div class="kima-gallery__row">
              <kima-menu v-model="menuValue" v-model:open="menuOpen" :items="menuItems" label="排序" searchable />
            </div>
          </kima-card>

          <kima-card v-show="visible('tabs', '标签页')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Tabs 标签页</kima-typography><kima-typography type="caption">当前标签：{{ tabValue }}</kima-typography></header>
            <kima-tabs v-model="tabValue" :items="tabItems">
              <template #panel="{ item }">
                <p>{{ item.label }} 面板的内容。用方向键切换标签。</p>
              </template>
            </kima-tabs>
          </kima-card>

        

          <kima-card v-show="visible('calendar', '日历')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Calendar 日历</kima-typography><kima-typography type="caption">月视图网格，支持范围选择。已选：{{ calendarDate || '未选' }}</kima-typography></header>
            <kima-calendar v-model="calendarDate" label="日期" />
          </kima-card>

          <kima-card v-show="visible('avatar', '头像')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Avatar 头像</kima-typography><kima-typography type="caption">文字首字与图片占位。</kima-typography></header>
            <div class="kima-gallery__row">
              <kima-avatar name="林青" />
              <kima-avatar name="陈禾" size="small" />
              <kima-avatar name="Alex" size="large" />
            </div>
          </kima-card>

          <kima-card v-show="visible('skeleton', '骨架屏')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Skeleton 骨架屏</kima-typography><kima-typography type="caption">加载占位。</kima-typography></header>
            <kima-skeleton :rows="2" label="加载占位" />
          </kima-card>

          <kima-card v-show="visible('spinner', '加载指示')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Spinner 加载指示</kima-typography><kima-typography type="caption">独立加载动画。</kima-typography></header>
            <div class="kima-gallery__row">
              <kima-spinner label="加载中" />
              <kima-spinner size="small" label="小号" />
              <kima-spinner size="large" label="大号" />
            </div>
          </kima-card>

          <kima-card v-show="visible('link', '链接')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Link 链接</kima-typography><kima-typography type="caption">行内导航，焦点环与涟漪齐全。</kima-typography></header>
            <kima-link href="#/overview">查看项目文档</kima-link>
          </kima-card>

          <kima-card v-show="visible('typography', '排版')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Typography 排版</kima-typography><kima-typography type="caption">语义化标题与正文的 token 尺寸。</kima-typography></header>
            <kima-typography type="heading" :level="2" size="title-medium">成员列表</kima-typography>
            <kima-typography size="body">正文使用 body 档 15px，行高 1.5。</kima-typography>
            <kima-typography type="caption" size="label-medium">caption 档 14px</kima-typography>
          </kima-card>

          <kima-card v-show="visible('popover', '气泡')" class="kima-gallery__demo">
            <header><kima-typography type="heading" :level="3" size="title-medium">Popover 气泡</kima-typography><kima-typography type="caption">锚定弹层，点击或聚焦打开。</kima-typography></header>
            <kima-popover v-model:open="popoverOpen" label="项目详情" content-label="详情">
              <p>弹层是独立实色平面，挡住背后的内容。</p>
            </kima-popover>
          </kima-card>
        </section>

      </div>
    </div>
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
      <kima-card v-for="index in 6" :key="index">第 {{ index }} 张卡片：档位换了但内容位置不变，只是看到的部分多少不同。</kima-card>
      <template #footer>
        <kima-button variant="text" @click="drawerSnapOpen = false">关闭</kima-button>
      </template>
    </kima-drawer>
    </template>
    <style scoped lang="scss">
    .kima-demo-field { display: grid; gap: var(--kima-space-1); }
    </style>
