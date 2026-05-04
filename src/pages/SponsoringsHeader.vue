<template>
<div>
  <q-toolbar class="full-width tbp">
    <btn-cond class="q-mr-xs" color="none" flat icon="menu"
      @ok="ui.openMenu"/>
    <btn-cond label="WP" class="q-ml-xs" :color="session.wpReady ? 'green' : 'red'" disable>
      <q-tooltip>{{session.sessionInfo}}</q-tooltip>
    </btn-cond>

    <q-toolbar-title class="titre-md q-mx-md">{{$t('PAGEdemands')}}</q-toolbar-title>

    <settings-button class="q-ml-sm"/>
    <help-button page="DOCpg"/>
    <div style="color:transparent;width:3px">*<q-tooltip>DemandsPage</q-tooltip></div>
  </q-toolbar>

  <q-tabs v-model="ui.demandsPage.tab" breakpoint="2000px"
    inline-label dense class="full-width tbp shadow-2">
    <q-tab name="new" icon="task" :label="$t('INVtit_1')" />
    <q-tab name="list" icon="list" :label="$t('INVtit_2')" />
    <q-tab name="process" icon="construction" :label="$t('INVtit_3')" />
  </q-tabs>

  <div v-if="ui.demandsPage.tab === 'new'" :class="sty()">
    <bar-title prefix="INVtit_1"/>
  </div>

  <div v-if="ui.demandsPage.tab === 'list'" :class="sty()">
    <bar-title prefix="INVtit_2"/>
    <invit-hdr v-if="ui.currentInvit.zoomed" v-model="ui.currentInvit"/>
  </div>

  <div v-if="ui.demandsPage.tab === 'process'" :class="sty()">
    <bar-title prefix="INVtit_3"/>

    <div v-if="sponsorings.length">
      <div class="titre-md text-italic text-center q-mt-sm">{{ $t('INVspons_on') }}</div>
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
  </div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch } from 'vue'

import { $t, sty, dkli } from '../src-fw/util'
import stores from '../stores/all'
import SettingsButton from '../components-fw/SettingsButton.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BarTitle from '../components-fw/BarTitle.vue'
import InvitHdr from '../components-fw/InvitHdr.vue'
import ScrollArea from '../components-fw/ScrollArea.vue'

const ui = stores.ui
const sf = stores.safe
const config = stores.config
const session = stores.session

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
    ui.demandsPage.spons = sp
    ui.demandsPage.time = Date.now()
  }
}

watch(majOpt, (v) => {
  if (v) {
    spons.value.major = v.value
    ui.demandsPage.spons = spons.value
    selM.value = false
    ui.demandsPage.time = Date.now()
  }
})

const reset = () => {
  ui.demandsPage.spons = null
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
