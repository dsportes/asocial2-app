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

  <q-toolbar v-if="!ui.currentInvit.zoomed" 
    class="tbp dense row q-gutter-xs items-center justify-end">
    <btn-cond :label="$t('INVtit_1')" icon="add" @ok="dialogs.newrequest = true"/>
    <btn-bubble class="q-ml-md" clear :text="$t('INVtit_1_bub')"/>
  </q-toolbar>
  <div v-else>
    <div class="tbp row items-center justify-between">
      <nav-bar class="col-auto q-ma-xs" v-model="ui.navBar"
        @back="ui.currentInvit.zoomed = false"/>
      <div v-if="ui.currentInvit.invit" class="titre-sm q-mr-xs">
        {{$t('INVtitzoom', [ui.currentInvit.invit.$t()])}}</div>
      <div v-else class="titre-md text-italic diag q-mr-xs">
        {{$t('INVnotfound')}}</div>
    </div>
    <div class="tbp row items-center q-gutter-xs justify-end">
      <!-- un sponsor peut éditer la demande / invitation -->
      <btn-cond :label="$t('INVbtn_' + (ui.currentInvit.invit.etc !== null ? 'rev' : 'inv'))" 
        icon="edit" class="col-auto"
        @ok="dialogs.invitsponsor = true"/>
    </div>
    <div v-if="ui.currentInvit.msgVal" class="row items-start q-my-sm">
      <btn-bubble :text="$t('INVsponsoring')" class="q-mr-md col-auto"/>
      <div :class="ui.currentInvit.msgVal.ok ? 'col titre-sm text-italic' : 'col titre-md msg'">
        {{ui.currentInvit.msgVal.txt}}
      </div>
    </div>
  </div>

  <div v-if="!ui.currentInvit.zoomed">
    <div v-if="sponsorings.length" :class="sty()">
      <div class="titre-md text-italic text-center q-pt-sm">{{ $t('INVspons_on') }}</div>
      <scroll-area class="full-width" size="sm"><template #default>
        <div v-for="(sp, idx) in sponsorings" :key="sp.id" 
          :class="dkli(idx) + ' row q-my-xs cursor-pointer select' + (spons && spons.id === sp.id ? ' cur' : '')"
          @click="selSp(sp)">
          <div class="col-3 font-mono ellipsis text-center">{{$t('services_' + sp.svc)}}</div>
          <div class="col-3 font-mono ellipsis text-center q-px-sm">{{sp.org}}</div>
          <div class="col-3 font-mono ellipsis text-center q-px-sm">{{sp.major || '[manager]'}}</div>
          <div class="col-3 font-mono ellipsis text-center">{{sp.minor || (sp.major ? '*' : '')}}</div>
        </div>
      </template #default></scroll-area>
      <div v-if="selM" class="column items-center">
        <q-select class="q-my-md" style="width:300px"
          dense filled options-dense clearable
          v-model="majOpt"
          :options="majOpts" :label="$t('INVmajor_c')"/>
      </div>
    </div>
    <div v-else class="titre-md text-italic text-center q-mt-sm">{{ $t('INVspons_no') }}</div>
  </div>

  <invit-newrequest v-if="dialogs.newrequest" v-model="dialogs.newrequest"/>
  <invit-sponsor v-if="dialogs.invitsponsor" v-model="dialogs.invitsponsor"
    :invit="ui.currentInvit.invit" @done="invitDone"/>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch, reactive } from 'vue'

import { $t, sty, dkli } from '../src-fw/util'
import stores from '../stores/all'
import { Invitation } from '../src-fw/invitation'
import SettingsButton from '../components-fw/SettingsButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import NavBar from '../components-fw/NavBar.vue'
import InvitNewrequest from '../dialogs-fw/InvitNewrequest.vue'
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
