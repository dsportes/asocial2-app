<!-- Bouton d'affichage par dialogue du texte
-->
<template>
<div>
  <btn-cond icon="open_in_new" flat :label="label" 
    @ok="dialogs.zoomit = true"/>
  <q-dialog v-model="dialogs.zoomit" persistent>
    <q-card :class="sty('sm')">
      <q-toolbar>
        <btn-cond icon="close" color="none"  flat @ok="dialogs.zoomit = false"/>
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
import { ref, computed, reactive, watch } from 'vue'

import stores from '../stores/all'
import { sty } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'

const props = defineProps({ 
  label: String,
  text: String,
  rows: Number,
  mw: Number
})

watch(() => props.text, (v) => { loc.value = v || ''})

const loc = ref('')
const rx = ref(5)

const dialogs = reactive({
  zoomit: false
})

const init = () => {
  loc.value = props.text || ''
  rx.value = props.rows || 5
}

const zoom = () => {
  rx.value += 10
}

const unzoom = () => {
  if (rx.value >= 15) rx.value -= 10
  else rx.value = 5
}

init()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bord { border-top: 1px solid $grey-5;}
</style>
