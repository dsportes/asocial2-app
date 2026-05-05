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
    <div style="color:transparent;width:3px">*<q-tooltip>DemandsPage</q-tooltip></div>
  </q-toolbar>


  <div :class="sty() + ' row justify-end items-center q-gutter-xs q-py-sm'">
    <btn-cond :label="$t('INVtit_1')" icon="add"
      @ok="dialogs.newrequest = true"/>
    <btn-bubble class="q-ml-md" :text="$t('INVtit_1_bub')"/>
  </div>

  <div :class="sty()">
    <bar-title prefix="INVtit_3"/>
    <invit-hdr v-if="ui.currentInvit.zoomed" v-model="ui.currentInvit"/>
  </div>

  <!--bar-title prefix="INVtit_3"/-->

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

  <div v-if="ui.currentInvit.zoomed">
    <q-separator color="orange" class="q-my-sm"/>
    <invit-hdr  v-model="ui.currentInvit"/>
  </div>

  <invit-newrequest v-if="dialogs.newrequest" v-model="dialogs.newrequest"/>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch, reactive } from 'vue'

import { $t, sty, dkli } from '../src-fw/util'
import stores from '../stores/all'
import SettingsButton from '../components-fw/SettingsButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import BarTitle from '../components-fw/BarTitle.vue'
import InvitHdr from '../components-fw/InvitHdr.vue'
import InvitNewrequest from '../dialogs-fw/InvitNewrequest.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'

const ui = stores.ui
const sf = stores.safe
const config = stores.config
const session = stores.session

const dialogs = reactive({
  newrequest: false
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

reset()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.select:hover { background-color: $yellow-2 !important; color: black !important; }
.cur { color: $warning !important; font-style: italic; font-weight: bold; }
</style>
