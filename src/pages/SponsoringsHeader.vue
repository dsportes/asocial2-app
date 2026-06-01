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

  <q-toolbar v-if="!ui.currentCase.zoomed" 
    class="tbp dense row q-gutter-xs items-center justify-end">
    <btn-cond :label="$t('INVtit_1')" icon="add" @ok="dialogs.newrequest = true"/>
    <btn-bubble class="q-ml-md" clear :text="$t('INVtit_1_bub')"/>
  </q-toolbar>
  <div v-else>
    <div class="tbp row items-center justify-between">
      <nav-bar class="col-auto q-ma-xs" v-model="ui.navBar"
        @back="ui.currentCase.zoomed = false"/>
      <div v-if="ui.currentCase.cas" class="titre-sm q-mr-xs">
        {{ model.cas.topicEd }}</div>
      <div v-else class="titre-md text-italic diag q-mr-xs">
        {{$t('INVnotfound')}}</div>
    </div>
    <div class="tbp row items-center q-gutter-xs justify-end">
      <!-- un sponsor peut éditer la demande / invitation -->
      <btn-cond :label="$t('INVbtn_' + (ui.currentCase.cas.etc !== null ? 'rev' : 'inv'))" 
        icon="edit" class="col-auto"
        @ok="dialogs.casesponsor = true"/>
    </div>
    <div v-if="ui.currentCase.msgVal" class="row items-start q-my-sm">
      <btn-bubble :text="$t('INVsponsoring')" class="q-mr-md col-auto"/>
      <div :class="ui.currentCase.msgVal.ok ? 'col titre-sm text-italic' : 'col titre-md msg'">
        {{ui.currentCase.msgVal.txt}}
      </div>
    </div>
  </div>

  <div v-if="!ui.currentCase.zoomed">
    <div v-if="svcOrgs.length" :class="sty()">
      <div class="titre-md text-italic text-center q-pt-sm">{{ $t('INVsvcorg_on') }}</div>
      <scroll-area class="full-width" size="sm"><template #default>
        <div v-for="(so, idx) in svcOrgs" :key="x.k" 
          :class="dkli(idx) + ' row q-my-xs cursor-pointer select' + (isCur(so) ? ' cur' : '')"
          @click="selSo(so)">
          <div class="col-9 font-mono ellipsis text-center">{{so.svcL}}</div>
          <div class="col-3 font-mono ellipsis text-center q-px-sm">{{so.org}}</div>
        </div>
      </template #default></scroll-area>
    </div>
    <div v-else class="titre-md text-italic text-center q-mt-sm">{{ $t('INVsvcorg_no') }}</div>
  </div>

  <case-newrequest v-if="dialogs.newrequest" v-model="dialogs.newrequest"/>
  <invit-sponsor v-if="dialogs.invitsponsor" v-model="dialogs.invitsponsor"
    :invit="ui.currentInvit.invit" @done="invitDone"/>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, Ref, watch, reactive } from 'vue'

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

const ui = stores.ui
const sf = stores.safe
const config = stores.config
const session = stores.session

const dialogs = reactive({
  newrequest: false,
  invitsponsor: false
})

const svcOrgs: Ref<SvcOrg[]> = ref()

const isCur = (so: SvcOrg) : boolean => so.svc === session.currentSvc && so.org === session.currentOrg


const majors = Array.from(Object.keys(config.K.majorInvits))
const majOpts = ref([])
for (const m of majors) 
  majOpts.value.push({ value: m, label: $t('INV$' + m)})

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

const reset = () => {
  svcOrgs.value = sf.svcOrgs()

  ui.sponsoringsPage.spons = null
  sorgs.value = sf.managedOrgs()
  sponsorings.value = sf.sponsorings()
  spons.value = null
  selM.value = false
}

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
