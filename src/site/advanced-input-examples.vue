<!-- Parent integration: <AdvancedInputExamples :component="slug" />. Only this group's active example mounts. -->
<script setup>
import { computed, ref } from "vue";
import KimaRangeSlider from "../components/advanced-input/range-slider.ce.vue";
import KimaCalendar from "../components/advanced-input/calendar.ce.vue";
import KimaDateRangePicker from "../components/advanced-input/date-range-picker.ce.vue";
import KimaTimeRangePicker from "../components/advanced-input/time-range-picker.ce.vue";
import KimaMention from "../components/advanced-input/mention.ce.vue";
import KimaForm from "../components/form-completion/form.ce.vue";
import KimaEditable from "../components/advanced-input/editable.ce.vue";
import KimaTransfer from "../components/advanced-input/transfer.ce.vue";
import KimaField from "../components/input/field.ce.vue";
import KimaTextField from "../components/core/text-field.ce.vue";
import KimaButton from "../components/core/button.ce.vue";
const props = defineProps({ component: { type: String, required: true } });
const range=ref([20,80]),day=ref('2026-06-01'),dates=ref(['2026-06-01',null]),times=ref(['22:00','02:00']),message=ref(''),editable=ref('可以行内编辑的说明'),transferred=ref(['a']),formName=ref(''),status=ref('');
const suggestions=[{value:'kai',label:'凯'},{value:'kima',label:'KIMA'},{value:'design',label:'设计组'}];
const choices=[{value:'a',label:'设计'},{value:'b',label:'开发'},{value:'c',label:'文档',disabled:true},{value:'d',label:'测试'}];
const saveHandler=async value=>{await new Promise(resolve=>setTimeout(resolve,100));if(value.trim()==='fail')throw new Error('保存失败，草稿仍保留');};
const handleSubmit=async ({data})=>{await new Promise(resolve=>setTimeout(resolve,120));if(data.get('person')==='fail')throw new Error('提交失败，请重试');status.value=JSON.stringify([...data]);};
const summary=computed(()=>range.value.join(' 至 '));
</script>
<template>
  <article class="kima-gallery__demo kima-advanced-input-example" :data-component="props.component">
    <KimaForm v-if="props.component==='form'" :handle-submit="handleSubmit">
      <template #default="{pending}"><KimaField hint="填写工作姓名，输入 fail 演示异步失败"><KimaTextField v-model="formName" label="姓名" name="person" required /></KimaField><KimaButton type="submit" :loading="pending">异步提交</KimaButton><KimaButton type="reset" variant="text">重置</KimaButton></template>
      <template #status><output role="status">{{ status }}</output></template>
    </KimaForm>
    <form v-else class="kima-advanced-input-example__form" @submit.prevent="status=JSON.stringify([...new FormData($event.target)])">
      <template v-if="props.component==='range-slider'"><KimaRangeSlider v-model="range" start-name="minimum" end-name="maximum" start-label="下限" end-label="上限" /><output>{{ summary }}</output></template>
      <template v-else-if="props.component==='calendar'"><KimaCalendar v-model="day" name="day" required label="选择日期" min="2025-01-01" /><output>{{ day || '尚未选择' }}</output></template>
      <template v-else-if="props.component==='date-range-picker'"><KimaDateRangePicker v-model="dates" start-name="date-start" end-name="date-end" required /><output>{{ dates.join(' 至 ') }}</output></template>
      <template v-else-if="props.component==='time-range-picker'"><KimaTimeRangePicker v-model="times" start-name="time-start" end-name="time-end" required /><output>22:00–02:00 为 4 小时，起止相同为 24 小时</output></template>
      <template v-else-if="props.component==='mention'"><KimaMention v-model="message" name="message" :items="suggestions" label="消息" placeholder="输入 @ 查看建议" /><output>{{ message }}</output></template>
      <template v-else-if="props.component==='editable'"><KimaEditable v-model="editable" name="description" label="说明" :save-handler="saveHandler" /><output>Enter 保存、Escape 取消；输入 fail 演示保留失败草稿。</output></template>
      <template v-else-if="props.component==='transfer'"><KimaTransfer v-model="transferred" :options="choices" name="groups" label="分配小组" /><output>{{ transferred.join(', ') }}</output></template>
      <div class="kima-advanced-input-example__actions"><KimaButton type="submit">读取表单</KimaButton><KimaButton type="reset" variant="text">重置</KimaButton></div>
      <output role="status">{{ status }}</output>
    </form>
  </article>
</template>
<style scoped lang="scss">
.kima-advanced-input-example {color:var(--kima-color-on-surface);font-family:var(--kima-font-family);min-width:0;width:100%; &__form{display:grid;gap:var(--kima-space-4);min-width:0;} output{overflow-wrap:anywhere;color:var(--kima-color-on-surface-variant);font-size:var(--kima-font-size-label-medium);} &__actions{display:flex;flex-wrap:wrap;justify-content:center;gap:var(--kima-space-2);} }
</style>
