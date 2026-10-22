<script setup>
import { ref } from "vue";
import KimaDatetimeRangePicker from "../components/datetime-range-picker.ce.vue";
import KimaPeriodPicker from "../components/period-picker.ce.vue";
import KimaDateField from "../components/date-field.ce.vue";
import KimaTimeField from "../components/time-field.ce.vue";
import KimaTimeSelect from "../components/time-select.ce.vue";
import KimaDynamicInput from "../components/dynamic-input.ce.vue";
import KimaMaskedInput from "../components/masked-input.ce.vue";
import KimaJsonInput from "../components/json-input.ce.vue";
import KimaAngleSlider from "../components/angle-slider.ce.vue";
import KimaUploadManager from "../components/upload-manager.ce.vue";
import KimaForm from "../components/form.ce.vue";
import KimaColorPicker from "../components/color-picker.ce.vue";
import KimaTextField from "../components/text-field.ce.vue";
import KimaField from "../components/field.ce.vue";
import KimaButton from "../components/button.ce.vue";
const props = defineProps({ component: { type: String, required: true } });
const range=ref(["2026-06-01T09:00","2026-06-01T10:30"]),period=ref(["2026-06","2026-08"]),date=ref("2026-06-01"),time=ref("09:30:00"),preset=ref("09:00"),rows=ref([{id:"initial",key:"name",value:"KIMA"}]),masked=ref(""),json=ref('{\n  "ready": true\n}'),angle=ref(225),color=ref("#61afef"),person=ref(""),uploadTasks=ref([]),status=ref("");
const presets=[{value:"09:00",label:"09:00 · 上午",description:"工作日"},{value:"12:30",label:"12:30 · 午间"},{value:"18:00",label:"18:00 · 禁用",disabled:true}];
const rules={person:{validator:async(value,{model,context})=>{await new Promise(resolve=>setTimeout(resolve,context.delay||40));return value?.trim().length>=2&&model.confirm===value?true:"姓名至少两字，且需与确认项一致";}}};
function upload(file,{signal,onProgress}){return new Promise((resolve,reject)=>{let value=0;const timer=setInterval(()=>{if(signal.aborted){clearInterval(timer);reject(new DOMException("已取消","AbortError"));return;}value+=25;onProgress(value);if(value>=100){clearInterval(timer);resolve({id:file.name,url:`/uploads/${encodeURIComponent(file.name)}`});}},40);signal.addEventListener("abort",()=>{clearInterval(timer);reject(new DOMException("已取消","AbortError"));},{once:true});});}
</script>
<template>
  <article class="kima-gallery__demo kima-form-completion-example">
    <KimaForm v-if="props.component === 'form'" :rules="rules" :context="{ delay: 80 }" @success="status = '表单规则验证通过'">
      <template #default="{ pending }">
        <label class="kima-form-completion-example__field">姓名<KimaField hint="必填规则也与确认字段交叉验证"><KimaTextField v-model="person" name="person" label="姓名" required /></KimaField></label>
        <label class="kima-form-completion-example__field">确认姓名<KimaTextField name="confirm" label="确认姓名" required /></label>
        <KimaButton type="submit" :loading="pending">校验并提交</KimaButton>
      </template>
      <template #status><output role="status">{{ status }}</output></template>
    </KimaForm>

    <form v-else-if="props.component === 'color-picker'" @submit.prevent="status = color">
      <label class="kima-form-completion-example__field">编辑颜色<KimaColorPicker v-model="color" name="brand" label="编辑颜色" /></label>
      <KimaButton type="submit">读取颜色值</KimaButton>
      <output v-if="status" role="status">{{ status }}</output>
    </form>

    <form v-else-if="props.component === 'upload-manager'" @submit.prevent="status = JSON.stringify(uploadTasks.map(task => ({ file: task.file.name, status: task.status, progress: task.progress })))">
      <KimaUploadManager v-model="uploadTasks" :upload="upload" multiple />
      <output v-if="status" role="status">{{ status }}</output>
    </form>

    <form v-else class="kima-form-completion-example__form" @submit.prevent="status = JSON.stringify([...new FormData($event.target)])">
      <label v-if="props.component === 'datetime-range-picker'" class="kima-form-completion-example__field">预约区间<KimaDatetimeRangePicker v-model="range" name="appointment" required step="900" /></label>
      <label v-else-if="props.component === 'period-picker'" class="kima-form-completion-example__field">结算周期<KimaPeriodPicker v-model="period" mode="month" range name="period" required min="2025-01" max="2027-12" /></label>
      <label v-else-if="props.component === 'date-field'" class="kima-form-completion-example__field">预约日期<KimaDateField v-model="date" name="day" label="预约日期" required min="2025-01-01" /></label>
      <label v-else-if="props.component === 'time-field'" class="kima-form-completion-example__field">开始时间<KimaTimeField v-model="time" name="time" label="开始时间" seconds required /></label>
      <label v-else-if="props.component === 'time-select'" class="kima-form-completion-example__field">预设时刻<KimaTimeSelect v-model="preset" :items="presets" name="preset" label="预设时刻" required /></label>
      <div v-else-if="props.component === 'dynamic-input'" class="kima-form-completion-example__field">
        <span>字段列表</span>
        <KimaDynamicInput v-model="rows" :create="() => ({ key: '', value: '' })">
          <template #default="{ row, index, update }">
            <label>键<KimaTextField :model-value="row.key" :name="`fields[${index}][key]`" label="键" required @update:model-value="update({ ...row, key: $event })" /></label>
            <label>值<KimaTextField :model-value="row.value" :name="`fields[${index}][value]`" label="值" required @update:model-value="update({ ...row, value: $event })" /></label>
          </template>
        </KimaDynamicInput>
      </div>
      <label v-else-if="props.component === 'masked-input'" class="kima-form-completion-example__field">编号<KimaMaskedInput v-model="masked" name="code" label="编号" mask="AAA-####" required /></label>
      <label v-else-if="props.component === 'json-input'" class="kima-form-completion-example__field">JSON 数据<KimaJsonInput v-model="json" name="payload" label="JSON 数据" required /></label>
      <label v-else-if="props.component === 'angle-slider'" class="kima-form-completion-example__field">旋转角度<KimaAngleSlider v-model="angle" name="rotation" label="旋转角度" /></label>
      <KimaButton type="submit">读取 FormData</KimaButton>
      <output v-if="status" role="status">{{ status }}</output>
      <output v-else-if="props.component === 'angle-slider'" role="status">{{ angle }}°</output>
    </form>
  </article>
</template>
<style scoped lang="scss">
.kima-form-completion-example{min-width:0;width:100%;color:var(--kima-color-on-surface);font-family:var(--kima-font-family);form{display:grid;gap:var(--kima-space-3);min-width:0}label{display:grid;gap:var(--kima-space-1)}&__field{gap:var(--kima-space-2)}&__field>span{color:var(--kima-color-on-surface-variant);font-size:var(--kima-font-size-label-small)}output{overflow-wrap:anywhere;color:var(--kima-color-on-surface-variant);font-size:var(--kima-font-size-label-medium)}}
</style>
