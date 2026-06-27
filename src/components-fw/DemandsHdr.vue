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
    :title="$t('FORMnewd', [form.typeEd])"
    hdrclass="tbs" vue="DemandsHdr" @close="close">
    <template #default>
      <form-zoom v-model="fctx" @done="onDone"/>
    </template>
  </dialog-std0>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, computed } from 'vue'

import stores from '../stores/all'
import { $t } from '../src-fw/util'
import { Crypt } from '../src-fw/crypt'

import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import NavBar from '../components-fw/NavBar.vue'
import TypeMenu from '../components-fw/TypeMenu.vue'
import FormZoom from '../components-fw/FormZoom.vue'
import { $Form, $FormObj } from '../src-fw/documents'
import SelectSvcorg from '../components-fw/SelectSvcorg.vue'

const ui = stores.ui
const sf = stores.safe

const fctx = computed(() => {
  return { form: form.value, isDemand: true, comment: '' }
})

const formType = ref(null)

const selFt = (ft) => {
  formType.value = ft
}

const dialogs = reactive({
  newdemand: false
})

const form = ref(null)

const oknew = (soa: { svc: string, org: string, admin: boolean}) => {
  if (!soa) return
  // Création du Form
  ui.setEditing()
  dialogs.newdemand = true
  const obj: $FormObj = {
    type: formType.value.type,
    formId: Crypt.rnd(15),
    userId: sf.userId,
    v: 0,
    maxLife: 0,
    status: 0,
    etcU: null,
    etcT: null,
    msgU: null,
    msgT: null
  }
  form.value = $Form.new(obj)
  form.value.svc = soa.svc
  form.value.org = soa.org
}

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

const onDone = (ok: boolean) => { // si false pas créé
  formType.value = ''
  dialogs.newdemand = false
  if (ok)
    ui.currentEvent.fnOnUpdate(form.value.formId)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
