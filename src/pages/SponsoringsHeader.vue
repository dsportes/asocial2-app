<template>
<div>
  <q-toolbar class="full-width tbp">
    <btn-menu/>
    <btn-cond label="WP" class="q-ml-xs" :color="session.wpReady ? 'green' : 'red'" disable>
      <q-tooltip>{{session.sessionInfo}}</q-tooltip>
    </btn-cond>

    <btn-bubble class="q-ml-md" :text="$t('PAGEsponsorings_bub')"/>
    <q-toolbar-title class="titre-md q-mx-md">{{$t('PAGEsponsorings_label')}}</q-toolbar-title>

    <settings-button class="q-ml-sm"/>
    <div style="color:transparent;width:3px">*<q-tooltip>SponsoringsPage</q-tooltip></div>
  </q-toolbar>

  <div :class="sty() + ' column full-width items-center' + (dialogs.newproposal ? ' disabled' : '')">
    <div class="full-width q-mb-lg">
      <select-svcorg @select="selsoa"/>
    </div>
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
          <type-menu :title="$t('FORMnewp')" :allow="ui.currentForm.pft"
            @select="openNewP"/>
        </div>
      </div>
    </div>
  </div>

  <dialog-std0 v-if="dialogs.newproposal" v-model="dialogs.newproposal"
    width="pwsm" vh="80"
    :title="$t('FORMnewp', [ftLabel])"
    hdrclass="tbs" vue="SponsoringsHeader" @close="close">
    <template #default>
      <form-zoom v-if="fctx" v-model="fctx" @done="onDone"/>
      <form-new v-else :form-type="formType" :isDemand="false" @done="onForm"/>
    </template>
  </dialog-std0>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, reactive, computed, watch } from 'vue'

import { $t, sty } from '../src-fw/util'
import stores from '../stores/all'
import { FormType } from '../src-fw/docDescriptor'

import DialogStd0 from '../dialogs-fw/DialogStd0.vue'
import BtnMenu from '../components-fw/BtnMenu.vue'
import SettingsButton from '../components-fw/SettingsButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import NavBar from '../components-fw/NavBar.vue'
import TypeMenu from '../components-fw/TypeMenu.vue'
import FormZoom from '../components-fw/FormZoom.vue'
import SelectSvcorg from '../components-fw/SelectSvcorg.vue'
import FormNew from '../components/FormNew.vue'
import { SOA } from '../stores/ui-store'
import { $Form } from '../src-fw/documents'

// @ts-ignore
import superman from '../assets/superman.jpg'

const ui = stores.ui
const fst = stores.form
const session = stores.session

const dialogs = reactive({
  newproposal: false
})

const formType: Ref<FormType> = ref()
const ftLabel = computed(() => {
  if (!formType.value) return '?'
  const y = $t('TYPE_' + formType.value.svc + '_' + formType.value.type)
  return y.substring(2)
})
const fctx = ref(null)

watch(() => [ui.currentForm.asAdmin, ui.currentForm.soa], async () => {
  const soa = ui.currentForm.soa
  const pft = !soa ? new Set() : await $Form.possibleFormTypes(soa.svc, soa.org, ui.currentForm.asAdmin)
  ui.currentForm.pft = pft
})

const back = async () => {
  const b = await ui.mayClose()
  if (b)
    ui.currentForm.zoomed = false
}

const selsoa = async (soa: SOA) => {
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

const openNewP = (ft) => {
  formType.value = ft
  fst.form = null
  fctx.value = null
  dialogs.newproposal = true
}

const close = async () => {
  const b = await ui.mayClose()
  if (b) {
    dialogs.newproposal = false
    formType.value = null
    fctx.value = null
  } else
    dialogs.newproposal = true
}

const onForm = (form) => {
  ui.currentForm.form = form
  fctx.value = { form, isDemand: false, comment: '' }
  fst.startEdit(fctx.value)
}

const onDone = (ok: boolean) => { // si false pas créé
  formType.value = null
  dialogs.newproposal = false
  if (ok)
    ui.currentForm.fnOnUpdate(fctx.value.form.formId)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
