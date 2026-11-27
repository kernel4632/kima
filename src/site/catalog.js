/* 文档目录：属性、事件和示例由构建时读取组件源码生成。
 * 新增 components/*.ce.vue 自动出现；完整源码仅在用户展开时加载。
 * 分组元数据统一取自 groups.js（示例视图注册与 catalog 共用同一映射）。
 */
import metadata from 'virtual:kima-docs';
import { tierOf } from '../component-tiers.js';
import { groupEntries } from './groups.js';
const extensions = groupEntries;
const sources = import.meta.glob('../components/**/*.ce.vue', { query: '?raw', import: 'default' });
const sourcesBySlug = Object.fromEntries(Object.entries(sources).map(([path, load]) => [path.slice(path.lastIndexOf('/') + 1, -'.ce.vue'.length), load]));
const labels = {
  badge: '徽章', button: '按钮', calendar: '日历', card: '卡片', checkbox: '复选框', collapsible: '折叠', combobox: '组合框', dialog: '对话框', divider: '分隔线', drawer: '抽屉', icon: '图标', link: '链接', menu: '菜单', popover: '气泡', progress: '进度条', 'radio-group': '单选组', select: '选择器', skeleton: '骨架屏', slider: '滑块', spinner: '加载指示', switch: '开关', table: '表格', tabs: '标签页', 'text-field': '文本框', textarea: '多行文本', tooltip: '提示', tree: '树', typography: '排版', avatar: '头像',
};
const groups = {
  '操作与导航': ['button', 'menu', 'tabs', 'link'],
  '表单与选择': ['text-field', 'textarea', 'checkbox', 'switch', 'slider', 'select', 'combobox', 'radio-group', 'calendar'],
  '反馈与弹层': ['dialog', 'drawer', 'tooltip', 'popover', 'progress', 'spinner', 'skeleton'],
  '内容与布局': ['badge', 'card', 'divider', 'icon', 'table', 'tree', 'collapsible', 'avatar', 'typography'],
};
export const catalog = metadata.map((item) => ({
  ...item,
  name: item.slug.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(''),
  // 分档来自 src/component-tiers.js，文档页直接显示维护水位。
  tier: tierOf(item.slug) || 'extras',
  label: extensions[item.slug]?.label || labels[item.slug] || item.slug,
  group: extensions[item.slug]?.group || Object.keys(groups).find((name) => groups[name].includes(item.slug)) || '其他组件',
  loadSource: sourcesBySlug[item.slug],
})).sort((a, b) => a.slug.localeCompare(b.slug));
