<template>
<q-dialog v-model="model">
<q-card>
<div>Dialogue 3 {{myModule}}</div>
<div class="column q-gutter-sm items-center">
  <q-btn label="close" color="primary" @click="model = false"/>
  <q-btn label="D1" color="primary" @click="dialogs.D1 = true"/>
  <q-btn label="D3" color="primary" @click="dialogs.D3 = true"/>
  <q-btn label="page 1" color="secondary" @click="stores.ui.setPage('p1')"/>
  <q-btn label="page 2" color="secondary" @click="stores.ui.setPage('p2')"/>
  <div>i={{i}} - j={{j}}</div>

  <d1 v-model="dialogs.D1"/>
  <d3 v-model="dialogs.D3"/>
</div>
</q-card>
</q-dialog>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import stores from '../stores/all'
import D1 from './D1.vue'
import D3 from './D3.vue'

const myModule = 'D3'
const model = defineModel()
const dialogs = reactive({D1: false, D3: false})
onMounted(() => console.log(myModule, "mounted"))
onUnmounted(() => console.log(myModule, "unMounted"))
watch(model, (v) => {
  if(v) console.log(myModule, "onShow")
  else console.log(myModule, "onHide")
})
watch(() => dialogs.D1, (v) => { if (!v) {
  console.log(myModule, 'onHide-D1')
}})

const i = ref(0)
const j = ref(0)
j.value++
console.log(myModule, "started")

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>