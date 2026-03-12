<!-- Boîte d'affichage d'un texte MD 
Event: edit : demande d'édition par l'utilisateur
-->
<template>
<div>
  <div v-if="!dialogs.shfs" style="position:relative">
    <!--div v-if="zoom || edit" class="row btn"-->
    <div class="row btn">
      <btn-cond icon="fullscreen" round stop @ok="dialogs.shfs = true">
        <q-tooltip class="bg-white text-primary">{{$t('SHpe')}}</q-tooltip>
      </btn-cond>
      <btn-cond v-if="edit" class="q-ml-xs" color="warning" round
        icon="edit" stop @ok="emit('edit', true)">
        <q-tooltip class="bg-white text-primary">{{$t('SHed')}}</q-tooltip>
      </btn-cond>
    </div>
    <sd-nb :style="styx" :text="text || ''" :idx="idx"/>
  </div>

  <q-dialog v-model="dialogs.shfs" persistent maximized
    transition-show="slide-up" transition-hide="slide-down">
    <q-layout container view="hHh lpR fFf" :class="sty()">
      <q-header elevated class="tbs">
        <q-toolbar>
          <q-space/>
          <btn-cond v-if="edit" round icon="edit" @ok="emit('edit', true)">
            <q-tooltip class="bg-white text-primary">{{$t('SHed')}}</q-tooltip>
          </btn-cond>
          <btn-cond round icon="close_fullscreen" 
            @ok="dialogs.shfs = false" class="q-ml-xs">
            <q-tooltip class="bg-white text-primary">{{$t('SHre')}}</q-tooltip>
          </btn-cond>
        </q-toolbar>
      </q-header>
      <q-page-container>
        <sd-nb :text="text" class="q-pa-xs"/>
      </q-page-container>
    </q-layout>
  </q-dialog>
</div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

import stores from '../stores/all'
import { sty } from '../src-fw/util'
import BtnCond from '../components-fw/BtnCond.vue'
import SdNb from '../components-fw//SdNb.vue'

const ui = stores.ui
const emit = defineEmits(['edit'])
const dialogs = reactive({
  shfs: false
})

const props = defineProps({
  text: String,
  idx: Number,
  maxh: String,
  zoom: Boolean,
  edit: Boolean,
  scroll: Boolean
})

const dk = computed(() => {
  const d = ui.isDark
  return d ? (props.idx === -1 ? true : false) : (props.idx === -1 ? false : true)
})
const idx0 = computed(() => props.idx === -1 || !props.idx || (props.idx % 2 === 0))
const styx = computed(() =>
  'min-height:2rem' +
  ';height:' + (props.maxh ? props.maxh + ';' : '') +
  'overflow-y:' + (props.scroll ? 'scroll' : 'auto')
)

</script>

<style lang="scss" scoped>
.btn { position: absolute; right: 7px; top: 0 }
.q-bar--standard { padding: 0 !important }
</style>
