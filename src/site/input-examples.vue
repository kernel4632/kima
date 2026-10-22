<!-- 按 component slug 只挂载当前演示。独立导入，不依赖自动生成入口。 -->
<script setup>
import { ref } from "vue";
import KimaTextarea from "../components/input/textarea.ce.vue";
import KimaRadioGroup from "../components/input/radio-group.ce.vue";
import KimaNumberField from "../components/input/number-field.ce.vue";
import KimaTagsInput from "../components/input/tags-input.ce.vue";
import KimaRating from "../components/input/rating.ce.vue";
import KimaPinInput from "../components/input/pin-input.ce.vue";
import KimaFileUpload from "../components/input/file-upload.ce.vue";
import KimaColorPicker from "../components/form-completion/color-picker.ce.vue";
import KimaToggle from "../components/input/toggle.ce.vue";
import KimaCheckboxGroup from "../components/input/checkbox-group.ce.vue";
import KimaNativeSelect from "../components/input/native-select.ce.vue";
import KimaField from "../components/input/field.ce.vue";
import KimaTextField from "../components/core/text-field.ce.vue";
import KimaButton from "../components/core/button.ce.vue";
const props = defineProps({ component: { type: String, required: true } });
const text = ref("一段可以继续编辑的备注。");
const radio = ref("design");
const number = ref(2);
const tags = ref(["Vue", "KIMA"]);
const rating = ref(3);
const pin = ref("");
const files = ref([]);
const color = ref("#61afef");
const pressed = ref(false);
const checked = ref(["design"]);
const selected = ref("design");
const email = ref("");
const fileError = ref("");
const submitted = ref("");
const options = [
  { value: "design", label: "设计" },
  { value: "code", label: "开发" },
  { value: "docs", label: "文档" },
  { value: "later", label: "暂不可用", disabled: true },
];
function submit(event) {
  submitted.value = JSON.stringify([...new FormData(event.target)].map(([key, value]) => [key, value instanceof File ? value.name : value]));
}
</script>
<template>
  <article class="kima-gallery__demo kima-input-example">
    <form @submit.prevent="submit">
      <template v-if="props.component === 'textarea'"><h3>多行备注</h3><KimaTextarea v-model="text" label="备注" name="notes" :maxlength="200" show-count /><output>{{ text }}</output></template>
      <template v-else-if="props.component === 'radio-group'"><h3>选择工作方向</h3><KimaRadioGroup v-model="radio" label="方向" name="direction" :options="options" required /><output>{{ radio }}</output></template>
      <template v-else-if="props.component === 'number-field'"><h3>数量与小数步长</h3><KimaNumberField v-model="number" label="数量" name="quantity" :min="0" :max="10" :step="0.5" required /><output>{{ number }}</output></template>
      <template v-else-if="props.component === 'tags-input'"><h3>标签 · 回车添加，空输入退格删除</h3><KimaTagsInput v-model="tags" label="标签" name="tags" :max="5" required /><output>{{ tags.join(' / ') }}</output></template>
      <template v-else-if="props.component === 'rating'"><h3>满意度 · 方向键调整</h3><KimaRating v-model="rating" name="rating" clearable required /><output>{{ rating }} / 5</output></template>
      <template v-else-if="props.component === 'pin-input'"><h3>六位验证码 · 支持整段粘贴</h3><KimaPinInput v-model="pin" name="otp" required /><output>{{ pin.length === 6 ? '已填写完整' : '等待验证码' }}</output></template>
      <template v-else-if="props.component === 'file-upload'"><h3>图片或 PDF · 单个不超过 5 MB</h3><KimaFileUpload v-model="files" name="files" accept="image/*,.pdf" multiple :max-files="3" :max-size="5242880" @reject="fileError = `文件未添加：${$event.reason}`" /><p v-if="fileError" role="alert">{{ fileError }}</p><output>{{ files.length }} 个文件</output></template>
      <template v-else-if="props.component === 'color-picker'"><h3>原生面板与 HEX 编辑</h3><KimaColorPicker v-model="color" label="画笔颜色" name="color" required /><output>{{ color }}</output></template>
      <template v-else-if="props.component === 'toggle'"><h3>工具栏按压状态</h3><KimaToggle v-model="pressed" name="bold" label="粗体">粗体</KimaToggle><output>{{ pressed ? '已启用粗体' : '未启用粗体' }}</output></template>
      <template v-else-if="props.component === 'checkbox-group'"><h3>选择多个方向 · 至少一项</h3><KimaCheckboxGroup v-model="checked" label="方向" name="directions" :options="options" required /><output>{{ checked.join(' / ') }}</output></template>
      <template v-else-if="props.component === 'native-select'"><h3>系统原生选择菜单</h3><KimaNativeSelect v-model="selected" label="方向" name="direction" :options="options" required /><output>{{ selected }}</output></template>
      <template v-else-if="props.component === 'field'"><h3>辅助说明与错误，不绘制字段标签</h3><KimaField hint="请输入用于通知的邮箱" :error="email && !email.includes('@') ? '邮箱需要包含 @' : ''"><KimaTextField v-model="email" label="邮箱" type="email" name="email" required /></KimaField></template>
      <div class="kima-input-example__actions"><KimaButton type="submit">读取表单</KimaButton><KimaButton type="reset" variant="text">重置</KimaButton></div>
      <output aria-live="polite">{{ submitted }}</output>
    </form>
  </article>
</template>
<style scoped lang="scss">
.kima-input-example {
  width: 100%;
  color: var(--kima-color-on-surface);
  form { display: grid; gap: var(--kima-space-4); min-width: 0; }
  output { overflow-wrap: anywhere; color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-small); }
  &__actions { display: flex; justify-content: center; gap: var(--kima-space-3); flex-wrap: wrap; }
  [role="alert"] { color: var(--kima-color-error); }
}
</style>
