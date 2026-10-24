<!-- 独立布局/内容组示例：父入口按 component 挂载当前一项。 -->
<script setup>
import { ref } from 'vue';
import KimaGrid from '../components/foundation/grid.ce.vue';
import KimaFlex from '../components/foundation/flex.ce.vue';
import KimaFieldGroup from '../components/foundation/field-group.ce.vue';
import KimaInputGroup from '../components/foundation/input-group.ce.vue';
import KimaPageHeader from '../components/foundation/page-header.ce.vue';
import KimaBanner from '../components/foundation/banner.ce.vue';
import KimaErrorState from '../components/foundation/error-state.ce.vue';
import KimaTypography from '../components/foundation/typography.ce.vue';
import KimaTimeDisplay from '../components/foundation/time-display.ce.vue';
import KimaTextField from '../components/core/text-field.ce.vue';
import KimaButton from '../components/core/button.ce.vue';
import KimaLink from '../components/navigation/link.ce.vue';
import { foundationCatalog } from './foundation-catalog.js';
const props = defineProps({ component: { type: String, required: true } });
const groupValid = ref(false), bannerOpen = ref(true), banner = ref(null);
const errorKey = ref('route-members'), errorStatus = ref('尚未重试');
const failOnce = async (attempt) => {
  if (attempt === 1) throw new Error('示例第一次连接失败');
  errorStatus.value = '第二次请求恢复成功';
};
function resetError() { errorKey.value = `route-${Date.now()}`; errorStatus.value = '路由键已更换'; }
</script>
<template>
  <article v-if="foundationCatalog[component]" :key="component" class="kima-gallery__demo kima-foundation-example" :data-foundation="component">
    <template v-if="component === 'grid'">
      <KimaGrid :columns="{ base: 1, sm: 2, md: 3 }" :gap="4">
        <div v-for="index in 6" :key="index" class="kima-foundation-example__cell">栅格 {{ index }}</div>
      </KimaGrid>
      <!-- Vue 里命名插槽要写成 <template #head>；写成 slot="head" 只会落进默认插槽，
           areas 里的格子就全是空的，内容还额外堆在下面一层。 -->
      <KimaGrid :areas="['head head', 'side main']" :gap="3">
        <template #head><strong class="kima-foundation-example__head">跨两列的区域标题</strong></template>
        <template #side><div class="kima-foundation-example__cell">侧栏</div></template>
        <template #main><div class="kima-foundation-example__cell">主内容</div></template>
      </KimaGrid>
    </template>
    <template v-else-if="component === 'flex'">
      <KimaFlex direction="row" wrap="wrap" :gap="4" align="center" justify="space-between">
        <KimaButton variant="tonal">左对齐动作</KimaButton>
        <span>自动换行的弹性区域</span>
        <KimaButton>右侧动作</KimaButton>
      </KimaFlex>
      <KimaFlex direction="column" wrap="nowrap" :gap="4" align="stretch">
        <div class="kima-foundation-example__cell">第一层</div>
        <div class="kima-foundation-example__cell">第二层</div>
        <div class="kima-foundation-example__cell">第三层</div>
      </KimaFlex>
    </template>
    <template v-else-if="component === 'field-group'">
      <KimaFieldGroup legend="通知渠道" hint="至少填写一种联系方式；分组会在输入后更新有效性。" required @validity-change="groupValid = $event.valid">
        <KimaTextField label="工作邮箱" name="foundation-mail" type="email" placeholder="name@example.com" />
        <KimaTextField label="备用电话" name="foundation-phone" placeholder="138 0000 0000" />
      </KimaFieldGroup>
      <p role="status">分组状态：{{ groupValid ? '有效' : '待填写' }}</p>
    </template>
    <KimaInputGroup v-else-if="component === 'input-group'" label="预算金额">
      <template #prefix><span>¥</span></template>
      <KimaTextField label="预算金额" name="foundation-budget" placeholder="0.00" />
      <template #suffix><span>元</span></template>
    </KimaInputGroup>
    <KimaPageHeader v-else-if="component === 'page-header'" heading="项目成员" description="管理当前空间的成员与邀请状态。">
      <template #breadcrumbs><KimaLink href="#workspace">工作区</KimaLink> / <span>成员</span></template>
      <template #actions><KimaButton variant="tonal">导出</KimaButton><KimaButton>邀请成员</KimaButton></template>
    </KimaPageHeader>
    <template v-else-if="component === 'banner'">
      <KimaBanner ref="banner" v-model:open="bannerOpen" heading="计划维护" variant="warning" closable>今晚 22:00 恢复写入，已保存的草稿不会丢失。</KimaBanner>
      <KimaButton v-if="!bannerOpen" variant="text" @click="banner?.restore()">restore() 恢复横幅</KimaButton>
    </template>
    <template v-else-if="component === 'error-state'">
      <KimaErrorState heading="成员列表加载失败" description="请求没有到达服务器，可以重试或稍后再来。" code="NETWORK" :reset-key="errorKey" :retry-handler="failOnce" @retry="errorStatus = `第 ${$event} 次尝试`" @recovered="errorStatus = '恢复成功'" @error="errorStatus = $event.message" />
      <div class="kima-foundation-example__tools"><span role="status">{{ errorStatus }}</span><KimaButton variant="text" @click="resetError">更换路由键</KimaButton></div>
    </template>
    <template v-else-if="component === 'typography'">
      <KimaTypography type="heading" :level="2" size="headline-medium">语义标题，不是图片</KimaTypography>
      <KimaTypography type="body" color="muted">正文尺寸与颜色只来自 token 白名单，组件不生成输入标签。</KimaTypography>
      <KimaTypography type="caption">说明文字使用 caption 语义。</KimaTypography>
    </template>
    <div v-else-if="component === 'time-display'" class="kima-foundation-example__times">
      <KimaTimeDisplay value="2026-06-01T01:30:00Z" mode="datetime" locale="zh-CN" time-zone="UTC" />
      <KimaTimeDisplay value="2026-06-01" mode="date" locale="zh-CN" time-zone="UTC" date-style="full" />
      <KimaTimeDisplay value="09:30" mode="time" locale="zh-CN" time-zone="UTC" />
    </div>
  </article>
</template>
<style scoped lang="scss">
.kima-foundation-example {
  min-width: 0;
  width: 100%;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  &__cell { display: grid; min-height: 88px; place-items: center; padding: var(--kima-space-4); border-radius: var(--kima-radius-m); background: var(--kima-color-layer-1); text-align: center; }
  &__head { display: block; padding: var(--kima-space-3); border-radius: var(--kima-radius-s); background: var(--kima-color-layer-2); }
  &__tools { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--kima-space-3); color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-label-medium); }
  &__prose { max-width: 64ch; margin: 0; line-height: var(--kima-line-height-loose); }
  &__times { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--kima-space-4); }
  a { color: var(--kima-color-primary); }
}
</style>
