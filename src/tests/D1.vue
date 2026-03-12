<template>
<q-dialog v-model="model">
<q-card>
<div>Dialogue 1 {{myModule}}</div>
<div class="column q-gutter-sm items-center">
  <q-btn label="close" color="primary" @click="model = false"/>
  <q-btn label="D2" color="primary" @click="dialogs.D2 = true"/>
  <q-btn label="D3" color="primary" @click="dialogs.D3 = true"/>
  <div>i={{i}} - j={{j}}</div>

  <d2 v-model="dialogs.D2"/>
  <d3 v-model="dialogs.D3"/>
</div>
</q-card>
</q-dialog>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import stores from '../stores/all'
import D2 from './D2.vue'
import D3 from './D3.vue'

const myModule = 'D1'
const model = defineModel()
const dialogs = reactive({D2: false, D3:false})
onMounted(() => console.log(myModule, "mounted"))
onUnmounted(() => console.log(myModule, "unMounted"))
watch(model, (v) => {
  if(v) console.log(myModule, "onShow")
  else console.log(myModule, "onHide")
})
watch(() => dialogs.D2, (v) => { if (!v) {
  console.log(myModule, 'onHide-D2')
}})
watch(() => dialogs.D3, (v) => { if (!v) {
  console.log(myModule, 'onHide-D3')
}})

const i = ref(0)
const j = ref(0)
j.value++
console.log(myModule, "started")

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>