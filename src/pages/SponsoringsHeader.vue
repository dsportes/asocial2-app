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

  <div class="pwmd q-pa-xs column items-center">
    <q-option-group v-if="admin" :options="options" type="radio" 
      v-model="ui.sponsoringsPage.manOpt"/>
    <div class="row items-center justify-between q-gutter-sm">
      <select-svc @change="doCheckSO"/>
      <select-org @change="doCheckSO"/>
      <btn-cond size="md":label="$t('ok')" icon="check" :disable="diag"
        @ok="ui.sponsoringPage.time = Date.now()"/>
    </div>
    <div v-if="diag" class="msg full-width">{{ diag }}</div>
  </div>

  <div v-if="zoomed" class="tbp row items-center justify-between">
    <nav-bar class="col-auto q-ma-xs" v-model="ui.navBar"
      @back="ui.currentCase.zoomed = false"/>
    <div class="titre-md text-italic text-right">{{ model.cas.topicEd }}</div>
  </div>

  <q-toolbar v-if="!diag && !zoomed" class="tbp dense row q-gutter-xs items-center justify-end">
    <btn-cond :disable="!ui.currentCase.cas" :label="$t('CASeditprop')" 
      icon="edit" class="col-auto" @ok="dialogs.casesponsor = true"/>
    <btn-cond :label="$t('CASaddprop')" :disable="diag"
      icon="add" class="col-auto" @ok="dialogs.newproposal = true"/>
  </q-toolbar>

  <case-newproposal v-if="dialogs.newproposal" v-model="dialogs.newproposal"
    :manager="manMode"/>
  <invit-sponsor v-if="dialogs.invitsponsor" v-model="dialogs.casesponsor"
    :invit="ui.currentInvit.invit"/>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, reactive, computed } from 'vue'

import { $t } from '../src-fw/util'
import stores from '../stores/all'

import SettingsButton from '../components-fw/SettingsButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import NavBar from '../components-fw/NavBar.vue'
import InvitSponsor from '../dialogs/InvitSponsor.vue'

// @ts-ignore
// import superman from '../assets/superman.jpg'

const ui = stores.ui
const sf = stores.safe
const session = stores.session

const dialogs = reactive({
  newproposal: false,
  casesponsor: false
})

const admin = computed(() => sf.auth.admins.length !== 0)
const zoomed = computed(() => ui.currentCase.zoomed)

const options = ref([
  { label: $t('CASmanager_n'), value: false },
  { label: $t('CASmanager_y'), value: true }
])
ui.sponsoringsPage.manager = options.value[0]
const manMode = computed(() => ui.sponsoringsPage.manager.value)

const doCheckSO = async () => { 
  ui.sponsoringsPage.err = await sf.checkSvcOrg(session.currentSvc, session.currentOrg)
}

const diag = computed(() => {
  const e = ui.sponsoringsPage.err
  return (e === 0 || (manMode.value && e === 3)) ? '' : $t('CASso_' + e)
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
