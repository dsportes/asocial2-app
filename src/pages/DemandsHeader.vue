<template>
<div>
  <q-toolbar class="full-width tbp">
    <btn-menu/>
    <btn-mode/>

    <btn-bubble class="q-ml-md" :text="$t('PAGEdemands_bub')"/>
    <q-toolbar-title class="titre-md text-center q-mx-sm">{{$t('PAGEdemands_label')}}</q-toolbar-title>

    <settings-button class="q-ml-sm"/>
    <div style="color:transparent;width:3px">*<q-tooltip>DemandsPage</q-tooltip></div>
  </q-toolbar>
 
  <div :class="'column full-width' + (dialogs.newdemand ? ' disabled' : '')">
    <div class="tbs row items-center justify-between">
      <div class="row q-gutter-xs items-center">
        <nav-bar class="col-auto q-ma-xs" v-model="ui.navBar" @back="back"/>
        <btn-cond round icon="refresh" @ok="reinit"/>
      </div>
      <type-menu :title="$t('FORMnewd')" @select="selFt"/>
    </div>
    <div v-if="formType" class="column items-center">
      <div class="row items-center justify-between full-width q-pa-xs">
        <btn-cond icon="close" color="warning" :label="$t('giveup')" @ok="nocreate"/>
        <div class="titre-md text-bold text-italic">{{ $t('TYPE_' + formType.svc + '_' + formType.type).substring(2) }}</div>
      </div>
      <select-svcorg @select="oknew"/>
    </div>
  </div>

  <dialog-std0 v-if="dialogs.newdemand" v-model="dialogs.newdemand" width="pwsm" vh="80"
    :title="$t('FORMnewd', [$t('TYPE_' + formType.svc + '_' +formType.type).substring(2)])"
    hdrclass="tbs" vue="DemandsHdr" @close="close">
    <template #default>
      <form-zoom v-if="fctx" v-model="fctx" @done="onDone"/>
      <form-new v-else :form-type="formType" :isDemand="true" @done="onForm"/>
    </template>
  </dialog-std0>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive } from 'vue'
import stores from '../stores/all'

import { $t, sty } from '../src-fw/util'

import SettingsButton from '../components-fw/SettingsButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import BtnMenu from '../components-fw/BtnMenu.vue'
import BtnMode from '../components-fw/BtnMode.vue'

import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import NavBar from '../components-fw/NavBar.vue'
import TypeMenu from '../components-fw/TypeMenu.vue'
import FormZoom from '../components-fw/FormZoom.vue'
import FormNew from '../components/FormNew.vue'
import SelectSvcorg from '../components-fw/SelectSvcorg.vue'
import { SOA } from '../src-fw/registry'

const ui = stores.ui
const session = stores.session
const fst = stores.form

ui.navBar.hasback = false

const formType = ref(null)

const selFt = (ft) => {
  formType.value = ft
  ui.currentForm.increation = true
}

const nocreate = () => {
  formType.value = null
  ui.currentForm.increation = false
}

const dialogs = reactive({
  newdemand: false
})

const fctx = ref(null)

const close = async () => {
  const b = await ui.mayClose()
  if (b) {
    dialogs.newdemand = false
    formType.value = ''
  } else 
    dialogs.newdemand = true
}

const back = async () => {
  const b = await ui.mayClose()
  if (b)
    ui.currentEvent.zoomed = false
}

const reinit = () => {
  ui.demandsPageInit++
}

const oknew = (soa: SOA) => {
  ui.currentForm.soa = soa
  fst.form = null
  dialogs.newdemand = true
}

const onForm = (form) => {
  ui.currentForm.form = form
  ui.currentForm.increation = false
  fctx.value = { form, isDemand: true, comment: '' }
  fst.startEdit(fctx.value)
}

const onDone = (ok: boolean) => { // si false pas créé
  formType.value = ''
  dialogs.newdemand = false
  if (ok)
    ui.currentEvent.fnOnUpdate(fctx.value.form.formId)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.select:hover { background-color: $yellow-2 !important; color: black !important; }
.cur { color: $warning !important; font-style: italic; font-weight: bold; }
</style>
