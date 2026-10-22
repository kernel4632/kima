<script setup>
import { ref } from 'vue';
import Rich from '../src/components/content/rich-text-editor.ce.vue';
import Code from '../src/components/content/code-editor.ce.vue';
const rich=ref('<p>Alpha beta</p>'),code=ref('const alpha = 1;'),cancel=ref(false),result=ref('');
function submit(event){result.value=JSON.stringify(Object.fromEntries(new FormData(event.target)));}
</script>
<template><form @submit.prevent="submit" @reset="cancel&&$event.preventDefault()"><Rich v-model="rich" name="rich" label="文档" placeholder="写点内容" required/><Code v-model="code" name="code" label="代码" placeholder="输入代码" required/><button type="button" @click="rich='<p>External beta</p>';code='const external = 2;'">外部更新</button><button type="button" @click="rich='';code=''">清空模型</button><label><input v-model="cancel" type="checkbox"/>取消重置</label><button type="reset">重置</button><button type="submit">提交</button><output id="result">{{ result }}</output></form></template>
