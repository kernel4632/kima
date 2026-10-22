<script setup>
import { computed, ref } from "vue";
import KimaButton from "../components/button.ce.vue";
import KimaTable from "../components/table.ce.vue";
import KimaInfiniteScroll from "../components/infinite-scroll.ce.vue";
import KimaVirtualTable from "../components/virtual-table.ce.vue";
import KimaVirtualTree from "../components/virtual-tree.ce.vue";
import KimaImagePreview from "../components/image-preview.ce.vue";
import KimaNotificationQueue from "../components/notification-queue.ce.vue";
import KimaRelativeTime from "../components/relative-time.ce.vue";
import KimaRingProgress from "../components/ring-progress.ce.vue";
import KimaCopyButton from "../components/copy-button.ce.vue";
import KimaLongText from "../components/long-text.ce.vue";
import { dataCatalog } from "./data-catalog.js";

const props = defineProps({ component: { type: String, default: "table" } });
const tableRows = ref([
  { id: "a1", name: "设计评审", state: "进行中", owner: "林青" },
  { id: "a2", name: "键盘验收", state: "已完成", owner: "陈禾" },
  { id: "a3", name: "发布检查", state: "待开始", owner: "Alex" },
]);
const tableFilters = ref({});
const expandedRows = ref([]);
const selectedRows = ref([]);
const virtualRows = Array.from({ length: 1000 }, (_, index) => ({ id: index, name: `数据行 ${index + 1}`, value: (index * 17) % 1000 }));
const treeItems = Array.from({ length: 180 }, (_, index) => ({ value: `folder-${index}`, label: `目录 ${index + 1}`, children: [{ value: `file-${index}`, label: `文件 ${index + 1}.md` }] }));
const treeExpanded = ref(["folder-0"]);
const treeValue = ref(null);
const loadedItems = ref(Array.from({ length: 8 }, (_, index) => `已加载记录 ${index + 1}`));
const loadCount = ref(0);
const loadErrorOnce = ref(true);
async function loadMore() {
  await new Promise((resolve) => setTimeout(resolve, 180));
  if (loadErrorOnce.value) { loadErrorOnce.value = false; throw new Error("网络暂时不可用"); }
  loadCount.value += 1;
  loadedItems.value.push(...Array.from({ length: 4 }, (_, index) => `异步记录 ${loadCount.value}-${index + 1}`));
  return loadCount.value >= 2 ? false : true;
}
const notifications = ref([
  { id: "sync", heading: "同步完成", message: "12 条记录已更新", variant: "success", duration: 0 },
  { id: "review", heading: "需要复核", message: "有 2 条数据等待确认", variant: "warning", duration: 0 },
]);
const percent = ref(68);
const copyText = "KIMA keeps data states observable.";
const longText = "这是一段需要按真实容器宽度折叠的长文本。内容不会被截断丢失，展开后仍然是同一份文本；ResizeObserver 会在窄屏、字体变化或父容器尺寸变化时重新判断是否需要展示展开动作。";
const virtualColumns = [{ key: "id", label: "编号", width: 96 }, { key: "name", label: "名称" }, { key: "value", label: "数值", align: "end" }];
const dataColumns = [{ key: "name", label: "任务", filterable: true, width: "34%", editable: true }, { key: "state", label: "状态", filterable: true, width: "26%" }, { key: "owner", label: "负责人", editable: true }];
const imageItems = [{ src: "/th.jpg", alt: "山间风景", caption: "第一张：原始图片" }, { src: "/th.jpg", alt: "重复的风景示例", caption: "第二张：画廊键盘切换" }];
const statusLabel = computed(() => `${percent.value}%`);
function addNotification() { const id = `notice-${Date.now()}`; notifications.value = [...notifications.value, { id, heading: "新的通知", message: "队列按容量和 id 去重", variant: "info", duration: 0 }]; }
</script>

<template>
  <article v-if="dataCatalog[component]" class="kima-gallery__demo kima-data-demo">
    <header><h2>{{ dataCatalog[component].label }}</h2><p>固定行高、稳定身份、真实异步状态与可访问反馈；Vue 和原生自定义元素共享同一组件实现。</p></header>
    <div v-if="component === 'table'" class="kima-data-demo__stack">
      <KimaTable :columns="dataColumns" :rows="tableRows" row-key="id" selectable expandable editable hoverable v-model="selectedRows" v-model:filter-values="tableFilters" v-model:expanded-rows="expandedRows"><template #expanded="{ row }"><span>展开内容：{{ row.name }} 由 {{ row.owner }} 负责。</span></template></KimaTable>
      <output>已选 {{ selectedRows.length }} 行；筛选会保留稳定行键。</output>
    </div>
    <div v-else-if="component === 'infinite-scroll'" class="kima-data-demo__stack"><div class="kima-data-demo__feed"><p v-for="item in loadedItems" :key="item">{{ item }}</p><KimaInfiniteScroll :load-more="loadMore" :finished="loadCount >= 2" /></div><output>请求次数：{{ loadCount }}</output></div>
    <KimaVirtualTable v-else-if="component === 'virtual-table'" :rows="virtualRows" :columns="virtualColumns" row-key="id" selectable :height="320" item-height="56" caption="1000 条固定行高数据" />
    <KimaVirtualTree v-else-if="component === 'virtual-tree'" :items="treeItems" v-model="treeValue" v-model:expanded="treeExpanded" selectable :height="320" item-height="48" aria-label="大数据目录树" />
    <KimaImagePreview v-else-if="component === 'image-preview'" src="/th.jpg" alt="山间风景" :items="imageItems" caption="点击进入可键盘操作的预览" />
    <div v-else-if="component === 'notification-queue'" class="kima-data-demo__stack"><KimaNotificationQueue :items="notifications" capacity="3" @update:items="notifications = $event" /><KimaButton @click="addNotification">追加队列通知</KimaButton><output>队列中 {{ notifications.length }} 条</output></div>
    <div v-else-if="component === 'relative-time'" class="kima-data-demo__row"><KimaRelativeTime :date="Date.now() - 92000" locale="zh-CN" update-interval="1000" /><KimaRelativeTime :date="Date.now() + 3600000" locale="zh-CN" numeric="auto" /></div>
    <div v-else-if="component === 'ring-progress'" class="kima-data-demo__row"><KimaRingProgress :value="percent" show-value label="上传进度" /><KimaRingProgress indeterminate label="正在处理" /><KimaButton variant="tonal" @click="percent = percent >= 100 ? 0 : percent + 8">调整到 {{ statusLabel }}</KimaButton></div>
    <div v-else-if="component === 'copy-button'" class="kima-data-demo__row"><code>{{ copyText }}</code><KimaCopyButton :text="copyText" /></div>
    <KimaLongText v-else-if="component === 'long-text'" :text="longText" :lines="3" />
  </article>
</template>

<style scoped lang="scss">
.kima-data-demo { min-width: 0; width: 100%; box-sizing: border-box; color: var(--kima-color-on-surface); font-family: var(--kima-font-family); }
.kima-data-demo__stack { display: grid; gap: var(--kima-space-4); width: 100%; min-width: 0; } .kima-data-demo__row { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--kima-space-4); min-width: 0; }
.kima-data-demo__feed { display: grid; max-height: 360px; gap: var(--kima-space-2); overflow: auto; padding: var(--kima-space-4); border-radius: var(--kima-radius-m); background: var(--kima-color-layer-1); } .kima-data-demo__feed p { margin: 0; padding: var(--kima-space-3); border-radius: var(--kima-radius-s); background: var(--kima-color-layer-2); }
.kima-data-demo code { max-width: 100%; overflow-wrap: anywhere; color: var(--kima-color-primary); } .kima-data-demo output { color: var(--kima-color-on-surface-variant); }
</style>
