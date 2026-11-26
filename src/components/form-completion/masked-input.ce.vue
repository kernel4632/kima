<script setup>
import { ref } from "vue";
import { useInputAttrs, useInputState } from "../../utils/input-state.js";
const props=defineProps({modelValue:{type:String,default:""},mask:{type:String,default:""},name:String,label:String,placeholder:String,required:Boolean,disabled:Boolean,readonly:Boolean});const emit=defineEmits(["update:modelValue","change"]);const root=ref(null),input=ref(null);const {attrs,controlAttrs}=useInputAttrs();const {local,update}=useInputState(props,emit,root,v=>String(v||""));
function accepts(token,char){if(token==="#")return /\d/.test(char);if(token==="A")return /[a-z]/i.test(char);if(token==="*")return /[a-z0-9]/i.test(char);return char===token;}
function apply(raw,caret){if(!props.mask){update(raw,false);return;}let out="",source=0,slot=0;const pattern=props.mask;while(slot<pattern.length&&source<raw.length){const token=pattern[slot],char=raw[source++];if(token==="#"||token==="A"||token==="*"){if(accepts(token,char)){out+=char;slot++;}}else{if(char===token){out+=token;slot++;}else{out+=token;slot++;source--;}}}update(out,false);requestAnimationFrame(()=>{const pos=Math.min(out.length,caret);input.value?.setSelectionRange(pos,pos);});}
function onInput(e){apply(e.target.value,e.target.selectionStart||0);}function validity(){const complete=!props.mask||local.value.length===props.mask.length;input.value?.setCustomValidity(complete?"":"请完成掩码输入");}
</script>
<template><div ref="root" :class="['kima-masked-input',attrs.class]" :style="attrs.style"><input ref="input" v-bind="controlAttrs" class="kima-masked-input__control" :value="local" :name="name" :aria-label="controlAttrs['aria-label']||label" :placeholder="placeholder||mask" :required="required" :disabled="disabled" :readonly="readonly" @input.stop="onInput;validity()" @paste="()=>{}" @compositionend="onInput" @change.stop="validity();emit('change',local)"></div></template>
<style scoped lang="scss">
@use "../../styles/mixins" as *;
.kima-masked-input{box-sizing: border-box;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-body-large);
  font-weight: var(--kima-font-weight-semi-bold);
  &[aria-disabled="true"] { opacity: var(--kima-opacity-disabled); }@include kima-field-skin;
&__control{box-sizing: border-box;
  min-width: 0;
  min-height: var(--kima-field-height);
  padding: var(--kima-space-3) var(--kima-field-padding);
  border: 0;
  outline: 0;
  border-radius: inherit;
  color: inherit;
  background: transparent;
  font: inherit;
  &::placeholder { color: var(--kima-color-on-surface-variant); }
  &:disabled { cursor: not-allowed; }width:100%;font-variant-numeric:tabular-nums}}
</style>
