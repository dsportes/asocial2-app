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

  <div :class="'column full-width' + (dialogs.newproposal ? ' disabled' : '')">
    <div class="row items-center q-gutter-sm">
      <select-svcorg class="q-my-sm" @select="selsoa"/>
      <btn-cond icon="close" round color="negative" @ok="reset"/>
    </div>

    <div v-if="cf.soa">
      <div v-if="cf.soa.admin" class="row items-center q-gutter-sm">
        <q-toggle v-model="cf.asAdmin" color="warning"/>
        <img v-if="cf.asAdmin" :src="superman" width="24px"/>
        <div class="titre-md text-italic">{{ $t('FORMadmin') }}</div>
      </div>

      <div v-if="!cf.pft.size" class="msg">{{ $t('FORMnoprops') }}</div>
      <div v-else :class="'column full-width' + (dialogs.newproposal ? ' disabled' : '')">
        <div class="tbs row items-center justify-between">
          <nav-bar class="col-auto q-ma-xs" v-model="ui.navBar"
            @back="ui.currentForm.zoomed = false"/>
          <type-menu v-model="formType" :title="FORMnewp" :allow="cf.pft"
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
      <form-zoom v-if="userId" :form="form" @done="onDone"/>
    </template>
  </dialog-std0>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, computed, watch } from 'vue'

import { $t } from '../src-fw/util'
import stores from '../stores/all'
import { Crypt } from '../src-fw/crypt'

import SettingsButton from '../components-fw/SettingsButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import NavBar from '../components-fw/NavBar.vue'
import FormZoom from '../components-fw/FormZoom.vue'
import { SOA } from '../stores/ui-store'
import { ICVS } from '../stores/safe-store' 
import { $Form, $FormObj } from '../src-fw/documents'
import { MDOperation } from '../src-fw/operation'

// @ts-ignore
import superman from '../assets/superman.jpg'

const ui = stores.ui
const sf = stores.safe
const session = stores.session

const dialogs = reactive({
  newproposal: false
})

const cf = computed(() => ui.currentForm )
const formType = ref('')
const form = ref(null)
const userId = ref('')
const alias = ref('')

watch(() => cf.asAdmin, async (v) => {
  cf.value.pft = await $Form.possibleFormTypes(cf.value.soa.svc, cf.value.soa.org, v)
})

const selsoa = async (soa: SOA) => {
  cf.value.soa = soa
  cf.value.asAdmin = false
  cf.value.pft = await $Form.possibleFormTypes(soa.svc, soa.org, false)
}

watch(() => ui.currentForm.soa), async (soa) => {
  cf.value.pft = !cf.value.soa ? new Set() : await $Form.possibleFormTypes(soa.svc, soa.org, false)
}

const reset = () => {
  cf.value.soa = null
  cf.value.form = null
  cf.value.asAdmin = false
}

const openNewP = () => {
  formType.value = ''
  form.value = null
  alias.value = ''
  userId.value = ''
  dialogs.newproposal = true
}
// const zoomed = computed(() => cf.value.zoomed)

const valA = async () => {
  userId.value = ''
  const sha = await Crypt.strongHash(alias.value, false, true)
  const op = new MDOperation('$mdUserGetICVS')
  op.args['userId'] = Crypt.shaS(sha)
  const ret = await op.post() as ICVS
  const icvs = ret ? ret['icvs'] : null
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
  form.value.opts = { asAdmin: cf.value.asAdmin, alias: alias.value }
  form.value.svc = sf.value.soa.svc
  form.value.org = sf.soa.org
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
    cf.value.fnUpdate(form.value.formId)
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
