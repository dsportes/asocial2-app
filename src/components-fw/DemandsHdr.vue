<template>
<div>
  <div :class="'column full-width' + (dialogs.newdemand ? ' disabled' : '')">
    <div class="tbs row items-center justify-between">
      <nav-bar class="col-auto q-ma-xs" v-model="ui.navBar"
        @back="ui.currentEvent.zoomed = false"/>
      <type-menu v-model="formType" :title="FORMnewd" @select="selx = true"/>
    </div>
    <div v-if="selx" class="q-my-sm row items-center q-gutter-sm full-width">
      <btn-cond class="col-1" icon="close" flat @ok="selx = false"/>
      <select-svc class="col-6" v-model="svc"/>
      <select-org class="col-4"/>
      <btn-cond class="col-1" icon="check" :label="$('ok')"
        :disable="!svc || !session.orgs.c"
        padding="0 xs" @ok="oknew"/>
    </div>
  </div>

  <dialog-std0 v-if="dialogs.newdemand" v-model="dialogs.newdemand" width="pwsm" vh="80"
    :title="$t('FORMnewd', [$t('TYPE_' + type).substring(0,2)])"
    hdrclass="tbs" vue="DemandsHdr" @close="close">
    <template #default>
      <form-zoom :form="form" comment="" @done="onDone"/>
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
import { FormType } from '../src-fw/doctypes'

const ui = stores.ui
const session = stores.session
const sf = stores.safe

const selx = ref(false)
const svc = ref('')
const formType: Ref<FormType> = ref(null)

const dialogs = reactive({
  newdemand: false
})

const form = ref(null)

const oknew = () => {
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
