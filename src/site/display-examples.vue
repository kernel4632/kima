<script setup>
import { ref } from "vue";
import KimaAvatar from "../components/avatar.ce.vue";
import KimaAvatarGroup from "../components/avatar-group.ce.vue";
import KimaImage from "../components/image.ce.vue";
import KimaSkeleton from "../components/skeleton.ce.vue";
import KimaSpinner from "../components/spinner.ce.vue";
import KimaAlert from "../components/alert.ce.vue";
import KimaResult from "../components/result.ce.vue";
import KimaDescriptions from "../components/descriptions.ce.vue";
import KimaList from "../components/list.ce.vue";
import KimaTimeline from "../components/timeline.ce.vue";
import KimaStatistic from "../components/statistic.ce.vue";
import KimaCountdown from "../components/countdown.ce.vue";
import KimaKbd from "../components/kbd.ce.vue";
import KimaBlockquote from "../components/blockquote.ce.vue";
import KimaHighlight from "../components/highlight.ce.vue";
import KimaAspectRatio from "../components/aspect-ratio.ce.vue";
import KimaButton from "../components/button.ce.vue";
import { displayCatalog } from "./display-catalog.js";

const props = defineProps({ component: { type: String, default: "avatar" } });
const people = [{ name: "林青", src: "/th.jpg" }, { name: "陈禾" }, { name: "Alex Kim" }, { name: "周宁" }, { name: "王川" }];
const busy = ref(true);
const alertOpen = ref(true);
const deadline = ref(Date.now() + 65000);
const finished = ref(false);
const actions = ref(0);
const variants = ["info", "success", "warning", "danger", "neutral"];
const details = [{ label: "项目名称", value: "KIMA" }, { label: "当前状态", value: "准备就绪" }, { label: "负责人", value: "林青" }, { label: "版本", value: "0.6.0" }];
const entries = [{ id: "design", title: "交互设计", description: "用动效引导注意力，而不只是装饰。" }, { id: "access", title: "无障碍检查", description: "键盘可达，状态不只依靠颜色。" }];
const events = [{ title: "设计完成", description: "基础交互与视觉方向已确认。", time: "09:00", datetime: "2026-05-18T09:00:00+08:00", variant: "success" }, { title: "进行可访问性检查", time: "10:30", variant: "info" }, { title: "等待发布", time: "下一步", variant: "neutral" }];
function restart() { finished.value = false; deadline.value = Date.now() + 5000; }
</script>

<template>
  <article v-if="displayCatalog[component]" class="kima-gallery__demo kima-display-demo">
    <header><h2>{{ displayCatalog[component].label }}</h2><p>大尺寸、低密度、透明层次；兼容 Vue 与原生自定义元素。</p></header>
    <div v-if="component === 'avatar'" class="kima-display-demo__row"><KimaAvatar src="/th.jpg" name="林青" size="large" /><KimaAvatar name="陈禾" /><KimaAvatar name="Alex Kim" shape="circle" /><KimaAvatar src="/missing-avatar.png" name="失败回退" size="small" /><KimaAvatar alt="匿名用户" /></div>
    <KimaAvatarGroup v-else-if="component === 'avatar-group'" :items="people" :max="3" label="项目协作者" />
    <div v-else-if="component === 'image'" class="kima-display-demo__grid"><KimaImage src="/th.jpg" alt="旅途中的风景" caption="原生图片保留 alt" /><KimaImage src="/missing-image.png" alt="不可用的风景" caption="加载失败时显示清晰提示" /></div>
    <div v-else-if="component === 'skeleton'" class="kima-display-demo__stack"><KimaSkeleton :loading="busy" avatar :rows="3"><KimaList :items="entries" /></KimaSkeleton><KimaButton variant="tonal" @click="busy = !busy">{{ busy ? '显示内容' : '重新加载' }}</KimaButton></div>
    <div v-else-if="component === 'spinner'" class="kima-display-demo__row"><KimaSpinner size="small" label="小尺寸加载" /><KimaSpinner label="正在同步" /><KimaSpinner size="large" label="加载项目中" /><span>正在同步项目…</span></div>
    <div v-else-if="component === 'alert'" class="kima-display-demo__stack"><KimaAlert v-for="variant in variants" :key="variant" :variant="variant" :heading="`${variant} 状态`" description="文字和图标共同传达状态，不只依靠颜色。" /><KimaAlert v-model:open="alertOpen" heading="可关闭的消息" closable><span>可以通过键盘访问操作与关闭按钮。</span><template #action><KimaButton variant="tonal" @click="actions++">查看详情</KimaButton></template></KimaAlert><output>操作次数：{{ actions }}</output><KimaButton v-if="!alertOpen" variant="text" @click="alertOpen = true">重新打开提示</KimaButton></div>
    <KimaResult v-else-if="component === 'result'" variant="success" heading="项目已发布" description="所有内容已同步，你可以继续浏览或分享给协作者。"><template #action><KimaButton @click="actions++">查看项目</KimaButton><KimaButton variant="text" @click="actions++">返回列表</KimaButton></template></KimaResult>
    <KimaDescriptions v-else-if="component === 'descriptions'" :items="details" label="项目信息" />
    <KimaList v-else-if="component === 'list'" :items="entries" label="发布前检查"><template #action="{ item }"><KimaButton variant="text" :aria-label="`查看${item.title}`" @click="actions++">查看</KimaButton></template></KimaList>
    <KimaTimeline v-else-if="component === 'timeline'" :items="events" label="发布进程" />
    <div v-else-if="component === 'statistic'" class="kima-display-demo__grid"><KimaStatistic label="总访问量" :value="123456.78" :precision="1" suffix="次" /><KimaStatistic label="本月收入" :value="8192.5" :options="{ style: 'currency', currency: 'CNY' }" /><KimaStatistic label="完成比例" :value="0.875" :options="{ style: 'percent', maximumFractionDigits: 1 }" /></div>
    <div v-else-if="component === 'countdown'" class="kima-display-demo__stack"><KimaCountdown :value="deadline" label="距离下一次同步" @finish="finished = true" /><output>{{ finished ? '计时结束' : '计时中' }}</output><KimaButton variant="tonal" @click="restart">重新计时 5 秒</KimaButton></div>
    <div v-else-if="component === 'kbd'" class="kima-display-demo__row"><span>打开搜索</span><KimaKbd :keys="['Ctrl', 'K']" label="Control 加 K" /><span>确认</span><KimaKbd :keys="['Enter']" /></div>
    <KimaBlockquote v-else-if="component === 'blockquote'" author="KIMA" source="设计原则" cite="https://m3.material.io">交互体验第一，好看第二。用动效引导注意力，让下一步清晰可见。</KimaBlockquote>
    <div v-else-if="component === 'highlight'" class="kima-display-demo__stack"><KimaHighlight text="KIMA 让交互鲜活：Kima 支持安全的纯文本关键词高亮。" :keywords="['KIMA', '交互', '纯文本']" /><KimaHighlight text="<script>不会作为 HTML 执行</script>，a+b 也不是正则。" :keywords="['<script>', 'a+b']" /></div>
    <KimaAspectRatio v-else-if="component === 'aspect-ratio'" :ratio="16 / 9"><img src="/th.jpg" alt="固定 16 比 9 的风景" /></KimaAspectRatio>
  </article>
</template>

<style scoped lang="scss">
.kima-display-demo {
  display: grid; gap: var(--kima-space-6); min-width: 0; width: 100%; box-sizing: border-box; padding: var(--kima-space-6); color: var(--kima-color-on-surface); font-family: var(--kima-font-family);
  h2 { margin: 0 0 var(--kima-space-3); font-size: var(--kima-font-size-headline-small); }
  header p { margin: 0; color: var(--kima-color-on-surface-variant); }
  &__row { display: flex; flex-wrap: wrap; gap: var(--kima-space-4); align-items: center; }
  &__stack { display: grid; gap: var(--kima-space-4); justify-items: start; > * { max-width: 100%; } > .kima-alert, > .kima-skeleton { width: 100%; } }
  &__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: var(--kima-space-4); }
}
</style>
