<script setup>
import { ref } from 'vue';
import KimaMenu from '../src/components/menu.ce.vue';
import KimaConfigProvider from '../src/components/config-provider.ce.vue';
import KimaSidebar from '../src/components/sidebar.ce.vue';
const open = ref(true); const checked = ref({flag:false}); const accept = ref(false);
const items = [{value:'flag',label:'标记',type:'checkbox'}, {value:'sub',label:'子菜单',children:[{value:'leaf',label:'叶子'}]}];
</script>
<template><button @click="accept = !accept">允许更新</button><button @click="open = !open">外控开关</button><KimaMenu :open="open" :checked="checked" :items="items" @update:open="(v) => {if(accept) open=v}" @update:checked="(v) => {if(accept) checked=v}" /><KimaConfigProvider locale="en-US" direction="rtl"><KimaSidebar :breakpoint="0" /></KimaConfigProvider></template>
