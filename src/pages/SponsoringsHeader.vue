<template>
<div>
  <q-toolbar class="full-width tbp">
    <btn-cond class="q-mr-xs" color="none" flat icon="menu"
      @ok="ui.openMenu"/>
    <btn-cond label="WP" class="q-ml-xs" :color="session.wpReady ? 'green' : 'red'" disable>
      <q-tooltip>{{session.sessionInfo}}</q-tooltip>
    </btn-cond>

    <btn-bubble class="q-ml-md" :text="$t('PAGEsponsorings_bub')"/>
    <q-toolbar-title class="titre-md q-mx-md">{{$t('PAGEsponsorings_label')}}</q-toolbar-title>

    <settings-button class="q-ml-sm"/>
    <div style="color:transparent;width:3px">*<q-tooltip>SponsoringsPage</q-tooltip></div>
  </q-toolbar>

  <div :class="'column full-width items-center' + (dialogs.newproposal ? ' disabled' : '')">
    <select-svcorg @select="selsoa"/>
    <div v-if="!ui.currentForm.soa || !ui.currentForm.soa.org"
      class="full-width msg">{{ $t('FORMnosoa') }}</div>

    <div v-else class="full-width">
      <div v-if="ui.currentForm.soa.admin"
        class="row items-center q-gutter-sm">
        <q-toggle v-model="ui.currentForm.asAdmin" color="warning"/>
        <img v-if="ui.currentForm.asAdmin" :src="superman" width="32px"/>
        <div class="titre-md text-italic">{{ $t('FORMadmin') }}</div>
      </div>

      <div v-if="!ui.currentForm.pft.size" class="msg">{{ $t('FORMnoprops') }}</div>

      <div v-else :class="'column' + (dialogs.newproposal ? ' disabled' : '')">
        <div class="tbs row items-center justify-between">
          <nav-bar class="col-auto q-ma-xs" v-model="ui.navBar"
            @back="back"/>
          <type-menu v-model="formType" :title="$t('FORMnewp')" :allow="ui.currentForm.pft"
            @select="openNewP"/>
        </div>
      </div>
    </div>
  </div>

  <dialog-std0 v-if="dialogs.newproposal" v-model="dialogs.newproposal" width="pwsm" vh="80"
    :title="$t('FORMnewp', [$t('TYPE_' + formType).substring(0,2)])"
    hdrclass="tbs" vue="SponsoringsHeader" @close="close">
    <template #default>
      <input-b class="q-my-sm"
        v-model="alias" size="alias" prefix="FORMuseralias"
        :disable="userId" @validate="valA"/>
      <form-zoom v-if="userId" v-model="fctx" @done="onDone"/>
    </template>
  </dialog-std0>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, computed, watchEffect } from 'vue'

import { $t } from '../src-fw/util'
import stores from '../stores/all'
import { Crypt } from '../src-fw/crypt'

import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import SettingsButton from '../components-fw/SettingsButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import NavBar from '../components-fw/NavBar.vue'
import TypeMenu from '../components-fw/TypeMenu.vue'
import FormZoom from '../components-fw/FormZoom.vue'
import SelectSvcorg from '../components-fw/SelectSvcorg.vue'
import InputB from '../components-fw/InputB.vue'
import { SOA } from '../stores/ui-store'
import { $Form, $FormObj } from '../src-fw/documents'

// @ts-ignore
import superman from '../assets/superman.jpg'

const ui = stores.ui
const sf = stores.safe
const session = stores.session

const dialogs = reactive({
  newproposal: false
})

const fctx = computed(() => {
  return { form: form.value, isDemand: false, comment: '' }
})

const formType = ref('')
const form = ref(null)
const userId = ref('')
const alias = ref('')

watchEffect(async () => {
  const cf = ui.currentForm
  cf.pft = !cf.soa || !cf.soa.svc || !cf.soa.org ? new Set() :
    await $Form.possibleFormTypes(cf.soa.svc, cf.soa.org, cf.asAdmin)
})

const back = async () => {
  const b = await ui.mayClose()
  if (b)
    ui.currentForm.zoomed = false
}

const selsoa = (soa: SOA) => {
  if (!soa) { reset(); return }
  const cf = ui.currentForm
  cf.soa = soa
  cf.asAdmin = false
}

const reset = () => {
  const cf = ui.currentForm
  cf.soa = null
  cf.form = null
  cf.asAdmin = false
}

const openNewP = () => {
  formType.value = ''
  form.value = null
  alias.value = ''
  userId.value = ''
  dialogs.newproposal = true
}

const valA = async () => {
  const cf = ui.currentForm
  userId.value = ''
  const hsha = Crypt.shaS(await Crypt.strongHash(alias.value, false, true))
  const icvs = await sf.mdUserGetICVS(hsha)
  if (!icvs) {
    await ui.diagDisplay($t('APnouser'), true)
    return
  }

  userId.value = icvs.i
  ui.setEditing()
  const obj: $FormObj = {
    type: formType.type,
    formId: Crypt.rnd(15),
    userId: userId.value,
    v: 0,
    maxLife: 0,
    status: 0,
    etcU: null,
    etcT: null,
    msgU: null,
    msgT: null,
  }
  form.value = $Form.new(obj)
  form.value.opts = { asAdmin: cf.asAdmin, alias: alias.value }
  form.value.svc = cf.soa.svc
  form.value.org = cf.soa.org
}

const close = async () => {
  const b = await ui.mayClose()
  if (b) {
    dialogs.newproposal = false
    formType.value = ''
    form.value = null
    alias.value = ''
    userId.value = ''
  }
}

const onDone = (ok: boolean) => { // si false pas créé
  formType.value = ''
  dialogs.newproposal = false
  if (ok)
    ui.currentForm.fnOnUpdate(form.value.formId)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
