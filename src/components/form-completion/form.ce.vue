<!-- Native form coordinator, NOT a schema engine. handleSubmit({form,data,event,submitter}) may return a Promise.
Without a handler the native submit/default action is preserved. submitHandler(event,context) is an event-style adapter.
State tracks dirty/touched names, native validity and submit attempts; field errors stay owned by kima-field/host. -->
<script setup>
import { computed, onBeforeUnmount, ref } from "vue";
import { useNativeSlots } from "../../utils/native-slots.js";
import { collapseTransition } from "../../utils/motion.js";
const props = defineProps({ disabled: Boolean, loading: Boolean, novalidate: Boolean, handleSubmit: Function, submitHandler: Function, rules: { type: Object, default: () => ({}) }, context: { type: Object, default: () => ({}) } });
const emit = defineEmits(["submit", "success", "error", "invalid", "reset", "state-change", "validate"]);
const root = ref(null);
useNativeSlots(root);
const pending = ref(false), error = ref(""), displayedError = ref(""), submitted = ref(false), dirty = ref([]), touched = ref([]), invalidNames = ref([]), fieldErrors = ref({}), validating = ref(false);
const busy = computed(() => props.loading || pending.value || validating.value);
let generation = 0, replayingNativeSubmit = false;
const validationRuns = new Map();
const activeValidationTokens = new Set();
function controls() { return [...(root.value?.elements || [])].filter(element => element.willValidate); }
function model() { return Object.fromEntries(controls().filter(element => element.name).map(element => [element.name, element.value])); }
function state() { return { pending: busy.value, validating: validating.value, submitted: submitted.value, dirty: [...dirty.value], touched: [...touched.value], invalid: [...invalidNames.value], errors: { ...fieldErrors.value }, error: error.value }; }
function notify() { emit("state-change", state()); }
function inspect() { invalidNames.value = [...new Set(controls().filter(element => !element.validity.valid).map(element => element.name || element.getAttribute("aria-label") || "unnamed"))]; }
function ruleFor(name) { const rule = props.rules?.[name]; return typeof rule === "function" ? { validator: rule } : rule || {}; }
function normalizeError(result) { if (result === true || result == null || result === "") return ""; return result === false ? "输入无效" : String(result); }
function ruleControls(name) { return controls().filter(element => element.name === name); }
function mapRuleError(name, message) { for (const control of ruleControls(name)) { control.setCustomValidity(message || ""); if (message) control.setAttribute("aria-invalid", "true"); else if (control.dataset.kimaRuleInvalid) control.removeAttribute("aria-invalid"); control.dataset.kimaRuleInvalid = message ? "true" : ""; } for (const field of root.value?.querySelectorAll(".kima-field") || []) { const control = field.querySelector(`[name="${CSS.escape(name)}"]`); if (control) { if (message) field.setAttribute("data-kima-validation-error", message); else field.removeAttribute("data-kima-validation-error"); } } }
async function validateField(name, value = model()[name], source = "change") {
  const rule = ruleFor(name); const validator = typeof rule === "function" ? rule : rule.validator || rule.sync || rule.async;
  if (typeof validator !== "function") return "";
  const previousToken = validationRuns.get(name);
  if (previousToken) activeValidationTokens.delete(`${name}:${previousToken}`);
  const token = (previousToken || 0) + 1;
  validationRuns.set(name, token);
  const validationToken = `${name}:${token}`;
  activeValidationTokens.add(validationToken);
  validating.value = true;
  notify();
  try {
    const context = { name, model: model(), context: props.context, source, form: root.value };
    let result;
    if (typeof rule.sync === "function") result = rule.sync(value, context);
    if (!normalizeError(result)) {
      if (typeof rule.async === "function") result = await rule.async(value, context);
      else if (typeof rule.validator === "function" || typeof rule === "function") result = await validator(value, context);
    }
    if (validationRuns.get(name) !== token) return null;
    const message = normalizeError(result);
    fieldErrors.value = { ...fieldErrors.value, [name]: message };
    mapRuleError(name, message);
    emit("validate", { name, value, valid: !message, message });
    return message;
  } catch (cause) {
    if (validationRuns.get(name) !== token) return null;
    const message = cause?.message || String(cause);
    fieldErrors.value = { ...fieldErrors.value, [name]: message };
    mapRuleError(name, message);
    emit("validate", { name, value, valid: false, message });
    return message;
  } finally {
    activeValidationTokens.delete(validationToken);
    validating.value = activeValidationTokens.size > 0;
    notify();
  }
}
async function validateAll(source = "submit") {
  const names = Object.keys(props.rules || {});
  try {
    const results = await Promise.all(names.map(name => validateField(name, model()[name], source)));
    const errors = Object.fromEntries(names.map((name, index) => [name, results[index] || ""]).filter(([, message]) => message));
    fieldErrors.value = { ...fieldErrors.value, ...errors };
    return Object.keys(errors).length === 0;
  } finally {
    if (source === "submit") { activeValidationTokens.clear(); validating.value = false; notify(); }
  }
}
function track(event, type) { const kind = type === 'dirty' ? dirty : touched; const name = event.target.name; if (name && !kind.value.includes(name)) kind.value = [...kind.value, name]; if (name && type === 'dirty') validateField(name, event.target.value, type); inspect(); notify(); }
function invalid(event) { if (!event.target?.willValidate) return; inspect(); submitted.value = true; emit("invalid", { control: event.target, message: event.target.validationMessage, field: event.target.closest('.kima-field') }); notify(); }
async function submit(event) {
  if (replayingNativeSubmit) return;
  if (pending.value || props.loading || props.disabled) { event.preventDefault(); return; }
  // Native default actions run before an async listener resumes. Own the submit
  // synchronously whenever a handler or rules require asynchronous coordination.
  const hasHandler = Boolean(props.handleSubmit || props.submitHandler);
  const hasRules = Object.keys(props.rules || {}).length > 0;
  if (hasHandler || hasRules) event.preventDefault();
  submitted.value = true;
  inspect();
  if (!hasHandler && !hasRules) { emit("submit", event); notify(); return; }
  const rulesValid = await validateAll("submit");
  if (!rulesValid || (!props.novalidate && !root.value.checkValidity())) { event.preventDefault(); inspect(); root.value.reportValidity(); return; }
  const context = { form: root.value, event, submitter: event.submitter, data: new FormData(root.value, event.submitter || undefined), model: model(), errors: { ...fieldErrors.value }, context: props.context };
  emit("submit", event, context);
  if (!hasHandler) {
    notify();
    replayingNativeSubmit = true;
    try { root.value.requestSubmit(event.submitter || undefined); }
    finally { replayingNativeSubmit = false; }
    return;
  }
  event.preventDefault();
  pending.value = true;
  error.value = "";
  const task = ++generation;
  notify();
  try {
    const result = props.handleSubmit ? await props.handleSubmit(context) : await props.submitHandler(event, context);
    if (task === generation) emit("success", result);
  } catch (cause) {
    if (task === generation) { error.value = cause?.message || String(cause); displayedError.value = error.value; emit("error", cause); }
  } finally { if (task === generation) { pending.value = false; notify(); } }
}
function reset(event) {
  emit("reset", event);
  queueMicrotask(() => {
    if (event.defaultPrevented || !root.value) return;
    generation += 1; pending.value = false; validating.value = false; error.value = ""; submitted.value = false; dirty.value = []; touched.value = []; invalidNames.value = []; fieldErrors.value = {}; validationRuns.clear(); activeValidationTokens.clear(); notify();
  });
}
onBeforeUnmount(() => { generation += 1; });
defineExpose({ form: root, requestSubmit: () => root.value?.requestSubmit(), reset: () => root.value?.reset(), checkValidity: () => root.value?.checkValidity() && Object.values(fieldErrors.value).every(value => !value), validate: validateAll, validateField, getState: state });
</script>
<template>
  <form ref="root" class="kima-form" :aria-busy="busy || undefined" :data-dirty="Boolean(dirty.length)" :data-submitted="submitted" :novalidate="novalidate" @submit.stop="submit" @reset.stop="reset" @invalid.capture="invalid" @input.capture="track($event,'dirty')" @change.capture="track($event,'dirty')" @focusout.capture="track($event,'touched')">
    <fieldset class="kima-form__fields" :disabled="disabled"><slot :pending="busy" :error="error" :state="state()" /></fieldset>
    <Transition :css="false" v-bind="collapseTransition"><div v-show="error" :inert="!error" :aria-hidden="!error || undefined"><p class="kima-form__error" role="alert">{{ displayedError }}</p></div></Transition>
    <slot name="status" :pending="busy" :error="error" :state="state()"></slot>
  </form>
</template>
<style scoped lang="scss">
@use "../../styles/advanced-input" as *;
.kima-form { @include advanced-root; display:grid; gap:var(--kima-space-3); &__fields { display:grid; gap:var(--kima-space-4); min-width:0; margin:0; padding:0; border:0; } &__error { margin:0; padding-block:var(--kima-space-2); color:var(--kima-color-error); } }
</style>
