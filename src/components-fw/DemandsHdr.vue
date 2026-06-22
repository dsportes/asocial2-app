<template>
<div>
  <div :class="'column full-width' + (dialogs.newdemand ? ' disabled' : '')">
    <div class="tbs row items-center justify-between">
      <nav-bar class="col-auto q-ma-xs" v-model="ui.navBar"
        @back="ui.currentEvent.zoomed = false"/>
      <type-menu :title="$t('FORMnewd')" @select="selFt"/>
    </div>
    <div v-if="formType">
      <div class="titre-md text-bold text-italic">{{ ($t('TYPE_' + formType.type)).substring(2) }}</div>
      <div class="q-my-sm row items-center q-gutter-sm full-width">
        <btn-cond class="col-1" icon="close" flat @ok="formType = null"/>
        <select-svcorg class="col-11" @select="oknew"/>
      </div>
    </div>
  </div>

  <dialog-std0 v-if="dialogs.newdemand" v-model="dialogs.newdemand" width="pwsm" vh="80"
    :title="$t('FORMnewd', [$t('TYPE_' + type).substring(0,2)])"
    hdrclass="tbs" vue="DemandsHdr" @close="close">
    <template #default>
      <form-zoom :form="form" comment="" isDemand @done="onDone"/>
    </template>
  </dialog-std0>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, reactive, computed, onMounted, watch } from 'vue'

import stores from '../stores/all'
import { $t } from '../src-fw/util'
import { Crypt } from '../src-fw/crypt'

import BtnCond from '../components-fw/BtnCond.vue'
import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import NavBar from '../components-fw/NavBar.vue'
import TypeMenu from '../components-fw/TypeMenu.vue'
import FormZoom from '../components-fw/FormZoom.vue'
import { $Form, $FormObj } from '../src-fw/documents'
import SelectSvcorg from '../components-fw/SelectSvcorg.vue'

const ui = stores.ui
const sf = stores.safe

const formType = ref(null)

const selFt = (ft) => {
  formType.value = ft
}

const dialogs = reactive({
  newdemand: false
})

const form = ref(null)

const oknew = (soa: { svc: string, org: string, admin: boolean}) => {
  // Création du Form
  ui.setEditing()
  dialogs.newdemand = true
  const obj: $FormObj = {
    type: formType.type,
    formId: Crypt.rnd(15),
    userId: sf.auth.userId,
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

const onDone = (ok: boolean) => { // si false pas créé
  formType.value = ''
  dialogs.newdemand = false
  if (ok)
    ui.currentEvent.fnUpdate(form.value.formId)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
