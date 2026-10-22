<script setup>
import { ref } from 'vue';
import Tour from '../components/tour.ce.vue';
import QrCode from '../components/qr-code.ce.vue';
import Watermark from '../components/watermark.ce.vue';
import Affix from '../components/affix.ce.vue';
import FloatButton from '../components/float-button.ce.vue';
import LogViewer from '../components/log-viewer.ce.vue';
import LoadingBar from '../components/loading-bar.ce.vue';
import AnimatedNumber from '../components/animated-number.ce.vue';
import Listbox from '../components/listbox.ce.vue';
import ProgressGroup from '../components/progress-group.ce.vue';
import AlertDialog from '../components/alert-dialog.ce.vue';
import VirtualSelect from '../components/virtual-select.ce.vue';
import TagGroup from '../components/tag-group.ce.vue';
import NotificationQueue from '../components/notification-queue.ce.vue';
import Button from '../components/button.ce.vue';
import { createNotifications } from '../utils/notifications.js';
import { utilityCatalog } from './utility-catalog.js';
const props = defineProps({ component: { type: String, required: true } });
const open = ref(false), number = ref(1250), chosen = ref('a'), many = ref(['a']), loading = ref(null), log = ref(null), action = ref('');
const options = [{ value: 'a', label: '设计' }, { value: 'b', label: '开发' }, { value: 'c', label: '已停用', disabled: true }, { value: 'd', label: '验证' }];
const virtualOptions = Array.from({ length: 10000 }, (_, index) => ({ value: index, label: `项目 ${index}`, disabled: index === 5 }));
const tags = ref(options.slice(0, 2));
const service = createNotifications({ capacity: 3 });
const steps = [{ target: '#kima-utility-tour-first', title: '选择项目', description: '先确定当前工作项目。' }, { target: '#kima-utility-tour-second', title: '完成操作', description: '这里可以保存当前结果。' }];
</script>
<template>
  <article v-if="utilityCatalog[component]" :key="component" class="kima-gallery__demo kima-utility-demo" :data-utility="component">
    <h3>{{ utilityCatalog[component].label }}</h3>
    <template v-if="component === 'tour'"><Button @click="open = true">开始导览</Button><p id="kima-utility-tour-first">当前项目：KIMA</p><Button id="kima-utility-tour-second" variant="tonal">保存项目</Button><Tour v-model:open="open" :steps="steps"/></template>
    <QrCode v-else-if="component === 'qr-code'" value="https://kima.example/你好" label="KIMA 示例链接"/>
    <Watermark v-else-if="component === 'watermark'" :text="['KIMA', '仅供预览']"><p class="kima-utility-demo__document">项目预览 · 文本水印是视觉提示，可被移除，不提供安全保护。</p></Watermark>
    <div v-else-if="component === 'affix'" class="kima-utility-demo__scroll"><div class="kima-utility-demo__tall"><Affix :offset="8"><Button variant="tonal">容器内吸附操作</Button></Affix><p>滚动这里观察吸附，组件受父容器底边约束。</p></div></div>
    <FloatButton v-else-if="component === 'float-button'" :actions="[{ id: 'new', label: '新建项目' }, { id: 'share', label: '分享项目' }]" @action="item => action = item.label"/>
    <template v-else-if="component === 'log-viewer'"><Button @click="log?.append(`INFO 追加日志 ${Date.now()}`)">追加日志</Button><LogViewer ref="log" :lines="['INFO 启动完成', 'WARN 等待网络', 'INFO 已连接']" :max-lines="100"/></template>
    <template v-else-if="component === 'loading-bar'"><div class="kima-utility-demo__tools"><Button @click="loading?.start()">开始任务</Button><Button variant="tonal" @click="loading?.finish()">完成一项</Button><Button variant="text" @click="loading?.error()">失败</Button></div><LoadingBar ref="loading"/></template>
    <template v-else-if="component === 'animated-number'"><AnimatedNumber :value="number" :precision="2"/><Button variant="tonal" @click="number = number === 1250 ? 9856.25 : 1250">切换数值</Button></template>
    <Listbox v-else-if="component === 'listbox'" v-model="many" :options="options" multiple label="工作阶段"/>
    <ProgressGroup v-else-if="component === 'progress-group'" :tasks="[{ id: 'a', label: '实现', value: 100, weight: 3 }, { id: 'b', label: '验证', value: 20, weight: 1 }]"/>
    <template v-else-if="component === 'alert-dialog'"><Button @click="open = true">删除项目</Button><AlertDialog v-model:open="open" heading="删除项目？" description="此操作无法撤销，请确认。" confirm-label="删除"/></template>
    <VirtualSelect v-else-if="component === 'virtual-select'" v-model="chosen" :options="virtualOptions" label="一万条项目"/>
    <TagGroup v-else-if="component === 'tag-group'" v-model:items="tags" v-model="many" selectable removable label="项目标签"/>
    <template v-else-if="component === 'notification-queue'"><div class="kima-utility-demo__tools"><Button @click="service.push({ dedupeKey: 'save', message: '项目已保存', variant: 'success', duration: 0 })">推送 / 去重</Button><Button variant="tonal" @click="service.clear()">清空通知</Button></div><NotificationQueue :service="service"/></template>
    <p v-if="action" role="status">{{ action }}</p>
  </article>
</template>
<style scoped lang="scss">
.kima-utility-demo { min-width: 0; color: var(--kima-color-on-surface); font-family: var(--kima-font-family); display: grid; gap: var(--kima-space-4); padding: var(--kima-space-5); background: var(--kima-color-layer-1); border-radius: var(--kima-radius-m); &__tools { display: flex; flex-wrap: wrap; gap: var(--kima-space-2); } &__document { padding: var(--kima-space-6); min-height: 240px; } &__scroll { height: 240px; overflow: auto; } &__tall { min-height: 720px; } h3 { margin: 0; } }
</style>
