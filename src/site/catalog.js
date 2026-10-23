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
  'code-block': '代码块',
  badge: '徽章', button: '按钮', 'button-group': '按钮组', card: '卡片', cascader: '级联选择', checkbox: '复选框', combobox: '组合框', 'date-picker': '日期选择', dialog: '对话框', divider: '分隔线', drawer: '抽屉', 'empty-state': '空状态', icon: '图标', 'icon-button': '图标按钮', layout: '布局', menu: '菜单', notification: '通知', pagination: '分页', progress: '进度条', select: '选择器', slider: '滑块', switch: '开关', table: '表格', tabs: '标签页', 'text-field': '文本框', 'time-picker': '时间选择', tooltip: '提示', tree: '树', 'virtual-scroll': '虚拟滚动',
};
const groups = {
  '操作与导航': ['button', 'icon-button', 'button-group', 'menu', 'tabs'],
  '表单与选择': ['text-field', 'checkbox', 'switch', 'slider', 'select', 'combobox', 'cascader', 'date-picker', 'time-picker'],
  '反馈与弹层': ['dialog', 'drawer', 'notification', 'tooltip', 'progress', 'empty-state'],
  '内容与布局': ['badge', 'card', 'code-block', 'divider', 'icon', 'layout', 'table', 'tree', 'pagination', 'virtual-scroll'],
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
