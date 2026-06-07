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

  <div class="pwmd q-pa-xs column items-center"/>
    <q-option-group v-if="admin" :options="options" type="radio" v-model="manager" />
    <div class="row items-center justify-between q-gutter-sm">
      <select-svc @change="doCheckSO"/>
      <select-org @change="doCheckSO"/>
    </div>
    <div v-if="diag" class="msg full-width">{{ diag }}</div>
  </div>

  <div v-if="zoomed" class="tbp row items-center justify-between">
    <nav-bar class="col-auto q-ma-xs" v-model="ui.navBar"
      @back="ui.currentCase.zoomed = false"/>
    <div class="titre-md text-italic text-right">{{ model.cas.topicEd }}</div>
  </div>
  <q-toolbar v-else class="tbp dense row q-gutter-xs items-center justify-end">
    <btn-cond v-if="zoomed && ui.currentCase.cas" :label="$t('CASeditprop')" 
      icon="edit" class="col-auto" @ok="dialogs.casesponsor = true"/>
    <btn-cond :label="$t('CASaddprop')" 
      icon="add" class="col-auto" @ok="dialogs.newproposal = true"/>
  </q-toolbar>

  <case-newproposal v-if="dialogs.newproposal" v-model="dialogs.newproposal"
    :manager="selManager"/>
  <invit-sponsor v-if="dialogs.invitsponsor" v-model="dialogs.casesponsor"
    :invit="ui.currentInvit.invit" @done="invitDone"/>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, watch, reactive, computed } from 'vue'

import { $t, sty, dkli } from '../src-fw/util'
import stores from '../stores/all'
import { SvcOrg } from '../stores/safe-store'

import { Invitation } from '../src-fw/invitation'
import SettingsButton from '../components-fw/SettingsButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import NavBar from '../components-fw/NavBar.vue'
import CaseNewrequest from '../dialogs-fw/CaseNewrequest.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'
import InvitSponsor from '../dialogs/InvitSponsor.vue'

// @ts-ignore
import superman from '../assets/superman.jpg'

const ui = stores.ui
const sf = stores.safe
const config = stores.config
const session = stores.session

const dialogs = reactive({
  newproposal: false,
  casesponsor: false
})

const admin = computed(() => sf.auth.admins.length)
const zoomed = computed(() => ui.currentCase.zoomed)

const options = ref([
  { label: $t('CASmanager_n'), value: true },
  { label: $t('CASmanager_y'), value: false }
])
const manager = ref(options.value[0])
const selManager = computed(() => manager.value.value)

const svcOrgs: Ref<SvcOrg[]> = ref()
const isCur = (so: SvcOrg) : boolean => so.svc === session.currentSvc && so.org === session.currentOrg

const doCheckSO = async () => { 
  ui.sponsoringsPage.err = await sf.checkSvcOrg(session.currentSvc, session.currentOrg)
}

const diag = computed(() => {
  const e = ui.sponsoringsPage.err
  return (e === 0 || (selManager.value && e === 3)) ? '' : $t('CASso_' + e)
})

const sorgs = ref()
const sponsorings = ref()
const spons = ref()
const majOpt = ref()
const selM = ref(false)

const selSp = (sp) => {
  spons.value = sp
  if (!sp.isSp) { // Cas d'un "manager": faire choisir "major"
    majOpt.value = null
    selM.value = true
  } else { //cas d'un "sponsor" avec un major et peut-être un minor
    selM.value = false
    ui.sponsoringsPage.spons = sp
    ui.sponsoringsPage.time = Date.now()
  }
}

watch(majOpt, (v) => {
  if (v) {
    spons.value.major = v.value
    ui.sponsoringsPage.spons = spons.value
    selM.value = false
    ui.sponsoringsPage.time = Date.now()
  }
})



const invitDone = async (spArgs) => {
  const invit = new Invitation(ui.currentInvit.invit)
  if (await invit.updateByS(spArgs.tab, spArgs.etc)) {
    dialogs.invitsponsor = false
    const f = ui.currentInvit.fnOnUpdate
    if (f) f()
  }
}

reset()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.select:hover { background-color: $yellow-2 !important; color: black !important; }
.cur { color: $warning !important; font-style: italic; font-weight: bold; }
</style>
