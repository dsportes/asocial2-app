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

  <q-toolbar v-if="!zoomed" 
    class="tbp dense row q-gutter-xs items-center justify-end">
    <btn-cond :label="$t('INVtit_1')" icon="add" @ok="dialogs.newrequest = true"/>
    <btn-bubble class="q-ml-md" clear :text="$t('INVtit_1_bub')"/>
  </q-toolbar>

  <div v-if="admin" class="row items-center wmd full-width">
    <q-tabs dense v-model="ui.adminPage.tab" class="col bg-primary text-white shadow-2">
      <q-tab name="othercases" :label="$t('CASmanager_n')" />
      <q-tab name="admincases">
        <img :src="superman" width="24px"/>
        <div>{{ $t('CASmanager_y') }}</div>
      </q-tab>
    </q-tabs>
  </div>

  <div v-if="zoomed" class="tbp row items-center justify-between">
    <nav-bar class="col-auto q-ma-xs" v-model="ui.navBar"
      @back="ui.currentCase.zoomed = false"/>
    <btn-cond v-if="ui.currentCase.cas" :label="model.cas.topicEd" 
      icon="edit" class="col-auto"
      @ok="dialogs.casesponsor = true"/>
  </div>

  <div v-if="ui.adminPage.tab === 'admincases' && !zoomed">
    <div class="column items-center">
      <div class="titre-md text-italic text-center">{{ $t('APservices') }}</div>
      <scroll-area size="xs" class="pwsm">
        <div v-for="[k,svcOp] of svcOps" :key="k" 
          :class="'row items-center cursor-pointer ' + (svcOp.svc === ui.adminPage.SVC && svcOp.op === ui.adminPage.$OP ? 'current': 'nocurrent')"
          @click="setSvcOp(svcOp)">
          <div class="col-6 text-center">{{ $t('services_' + svcOp.svc) }}</div>
          <div class="col-6 text-center">{{ svcOp.op }}</div>
        </div>
      </scroll-area>

      <div v-if="svcOpSel" class="q-my-md full-width row q-gutter-sm items-center">
        <select-org @change="doOrgOk"/>
        <btn-cond round icon="refresh" @ok="doOrgOk" size="lg"/>
      </div>
    </div>
  </div>

  <div v-if="tab === 'othercases' && !zoomed">
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

const ui = stores.ui
const sf = stores.safe
const config = stores.config
const session = stores.session

const dialogs = reactive({
  newrequest: false,
  invitsponsor: false
})

ui.adminPage.tab = 'othercases' // 'admincases'

const svcOrgs: Ref<SvcOrg[]> = ref()

const isCur = (so: SvcOrg) : boolean => so.svc === session.currentSvc && so.org === session.currentOrg

const admin = ref(sf.auth.admins.length)
const zoomed = ref(ui.currentCase.zoomed)
const majors = Array.from(Object.keys(config.K.majorInvits))
const majOpts = ref([])
for (const m of majors) 
  majOpts.value.push({ value: m, label: $t('INV$' + m)})

type Elt = {
  svc: string
  op: string
}
const svcOps: Ref<Map<string, Elt>> = ref(new Map())

const svcOpSel = computed(() => ui.adminPage.SVC !== '' && ui.adminPage.$OP !== '')

const setSvcOp = (svcOp) => {
  ui.adminPage.SVC = svcOp.svc
  ui.adminPage.$OP = svcOp.op
}

const reset2 = () => {
  if (!sf.auth || !sf.auth.admins) return
  svcOps.value.clear()
  const x = sf.auth.admins
  if (x) {
    const y = x.split('/')
    let first = true
    for (const k of y) {
      const z = k.split('.')
      svcOps.value.set(k, { svc: z[0], op: z[1]})
      if (first) {
        ui.adminPage.SVC = z[0]
        ui.adminPage.$OP = z[1]
        first = false
      }
    }
  }
}

const doOrgOk = async () => { // Liste des cases "manager" en attente

}

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
