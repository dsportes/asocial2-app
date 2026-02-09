<template>
<div>
  <btn-cond icon="open_in_new" flat :label="label" @ok="ui.oD(idc, 'zoomit')"/>
  <q-dialog v-model="ui.dModels[idc].zoomit" persistent>
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
import { ref, onUnmounted, watch } from 'vue'
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

const loc = ref(props.text || '')
const rx = ref(props.rows || 5)

const ui = stores.ui
const idc = ui.getIdc()
onUnmounted(() => ui.closeVue(idc))

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
