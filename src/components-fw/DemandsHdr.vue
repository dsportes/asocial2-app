<template>
<div>
  <div :class="'column full-width' + (dialogs.newdemand ? ' disabled' : '')">
    <div class="tbs row items-center justify-between">
      <nav-bar class="col-auto q-ma-xs" v-model="ui.navBar"
        @back="back"/>
      <type-menu :title="$t('FORMnewd')" @select="selFt"/>
    </div>
    <div v-if="formType" class="column items-center">
      <div class="titre-md text-bold text-italic">{{ ($t('TYPE_' + formType.type)).substring(2) }}</div>
      <select-svcorg @select="oknew"/>
    </div>
  </div>

  <dialog-std0 v-if="dialogs.newdemand" v-model="dialogs.newdemand" width="pwsm" vh="80"
    :title="$t('FORMnewd', [$t('TYPE_' + formType.type).substring(2)])"
    hdrclass="tbs" vue="DemandsHdr" @close="close">
    <template #default>
      <form-new :form-type="formType" :isDemand="true" @done="onForm"/>
      <form-zoom v-if="fctx" v-model="fctx" @done="onDone"/>
    </template>
  </dialog-std0>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, computed } from 'vue'

import stores from '../stores/all'
import { $t } from '../src-fw/util'

import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import NavBar from '../components-fw/NavBar.vue'
import TypeMenu from '../components-fw/TypeMenu.vue'
import FormZoom from '../components-fw/FormZoom.vue'
import FormNew from '../components/FormNew.vue'
import SelectSvcorg from '../components-fw/SelectSvcorg.vue'

const ui = stores.ui
const fst = stores.form
ui.navBar.hasback = false

const formType = ref(null)

const selFt = (ft) => {
  formType.value = ft
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
  }
}

const back = async () => {
  const b = await ui.mayClose()
  if (b)
    ui.currentEvent.zoomed = false
}

const oknew = (soa) => {
  ui.currentForm.soa = soa
  fst.form = null
  dialogs.newdemand = true
}

const onForm = (form) => {
  ui.currentForm.form = form
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
</style>
