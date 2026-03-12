<template>
<div class="column q-gutter-sm items-center">
  <q-btn label="D1" color="primary" @click="dialogs.D1 = true"/>
  <q-btn label="D2" color="primary" @click="dialogs.D2 = true"/>
  <div>i={{i}} - j={{j}}</div>
  <q-btn label="page 1" color="secondary" @click="stores.ui.setPage('p1')"/>
  <d1 v-model="dialogs.D1"/>
  <d2 v-model="dialogs.D2"/>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import stores from '../stores/all'
import D1 from './D1.vue'
import D2 from './D2.vue'

const myModule = 'P2'
const dialogs = reactive({D1: false, D2:false})
onMounted(() => console.log(myModule, "mounted"))
onUnmounted(() => console.log(myModule, "unMounted"))
watch(() => dialogs.D1, (v) => {
  if (!v) {
    console.log(myModule, 'onHide-D1')
  }
})
watch(() => dialogs.D2, (v) => {
  if (!v) {
    console.log(myModule, 'onHide-D2')
  }
})
const i = ref(0)
const j = ref(0)
j.value++
console.log(myModule, "started")


</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>