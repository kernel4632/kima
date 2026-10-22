<!-- Real Vue consumers exercise v-model, legacy title attrs, scoped slots and styles. -->
<script setup>
import { ref } from "vue";
import Button from "../src/components/core/button.ce.vue";
import Select from "../src/components/core/select.ce.vue";
import Notification from "../src/components/core/notification.ce.vue";
import Table from "../src/components/data/table.ce.vue";
import EmptyState from "../src/components/core/empty-state.ce.vue";
import Drawer from "../src/components/core/drawer.ce.vue";

const clicks = ref(0);
const choice = ref(null);
const selected = ref([]);
const open = ref(true);
const drawerOpen = ref(false);
const title = ref("Legacy title");
const options = [{ value: 1, label: "One" }, { value: 2, label: "Two" }];
</script>

<template>
  <Button id="vue-button" @click="clicks++">Save</Button>
  <output id="vue-clicks">{{ clicks }}</output>
  <Select id="vue-select" v-model="choice" :items="options" label="Number" />
  <output id="vue-choice">{{ choice }}</output>
  <Table id="vue-table" v-model="selected" :rows="[{ id: 'a', name: 'Alice' }]" :columns="[{ key: 'name', label: 'Name' }]" selectable>
    <template #cell-name="{ value }"><button type="button">{{ value }}</button></template>
  </Table>
  <output id="vue-selected">{{ selected.join(',') }}</output>
  <EmptyState id="vue-empty" title="No results"><template #action><button type="button">Create</button></template></EmptyState>
  <Notification id="vue-notification" v-model:open="open" :title="title" :duration="0" position="bottom-right" />
  <button id="vue-title" type="button" @click="title = 'Updated title'">Rename</button>
  <output id="vue-open">{{ open }}</output>
  <!-- 抽屉走 v-model:open，验证 Vue 侧的双向绑定和插槽跟原生用法一致。 -->
  <Drawer id="vue-drawer" v-model:open="drawerOpen" title="Vue drawer" placement="right">
    <p>Body</p>
    <template #footer><button id="vue-drawer-close" type="button" @click="drawerOpen = false">Close</button></template>
  </Drawer>
  <button id="vue-drawer-open" type="button" @click="drawerOpen = true">Open drawer</button>
  <output id="vue-drawer-state">{{ drawerOpen }}</output>
</template>
