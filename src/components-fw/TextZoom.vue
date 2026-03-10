<template>
<div>
  <btn-cond icon="open_in_new" flat :label="label" 
    @ok="ui.oD(myidc, 'zoomit')"/>
  <q-dialog v-model="me" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar>
        <btn-cond icon="close" color="none"  flat @ok="ui.fD()"/>
        <q-toolbar-title class="titre-md full-width text-center q-pr-xs">{{label}}</q-toolbar-title>
        <btn-cond icon="zoom_in" flat @ok="zoom"/>
        <btn-cond class="q-ml-xs" icon="zoom_out" flat @ok="unzoom" :disable="rx < 5"/>
      </q-toolbar>
      <q-input class="q-pa-xs bord" v-model="loc" type="textarea" readonly :rows="rx"
        :style="'max-width='+ (mw || 300) + 'px;'"
      />
    </q-card>
  </q-dialog>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, onUnmounted, watch } from 'vue'
import stores from '../stores/all'
import BtnCond from '../components-fw/BtnCond.vue'
import { sty } from '../src-fw/util'

const props = defineProps({ 
  label: String,
  text: String,
  rows: Number,
  mw: Number
})

watch(() => props.text, (v) => { loc.value = v || ''})

const loc = ref('')
const rx = ref(5)

const ui = stores.ui
const myidc = ui.getIdc('TextZoom')
onUnmounted(() => ui.closeVue(myidc))
const emit = defineEmits(['close', 'done'])
const me = computed(() => ui.dModels[myidc].zoomit)
watch(() => me.value, (v: boolean) => { 
  if (v) init(); else { cleanup(); emit('close', myidc) } })

const init = () => {
  loc.value = props.text || ''
  rx.value = props.rows || 5
}
const cleanup = () => {}

const zoom = () => {
  rx.value += 10
}

const unzoom = () => {
  if (rx.value >= 15) rx.value -= 10
  else rx.value = 5
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord { border-top: 1px solid $grey-5;}
</style>
