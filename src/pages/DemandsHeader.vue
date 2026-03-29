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

    <div v-if="sorgs.length">
      <bar-title prefix="MNOmajor"/>
      <div class="full-width q-my-md q-px-sm">
        <q-select dense options-dense filled clearable
          transition-show="flip-up" transition-hide="flip-down"
          v-model="ui.demandsPage.svcOrg"
          :options="sorgs" :label="$t('MNOorgs')"/>
      </div>
      <q-select class="col q-mr-md" style="margin-left:20px"
        dense filled options-dense clearable
        v-model="ui.demandsPage.major" 
        :disable="ui.demandsPage.svcOrg.org === ''"
        :options="majOpts" :label="$t('INVmajor_c')"/>
    </div>
    <div v-else class="titre-md text-italic text-center q-mt-sm">{{ $t('INVnosponsmgr') }}</div>
    <div v-if="ui.currentInvit.zoomed">
      <q-separator color="orange" class="q-my-sm"/>
      <invit-hdr  v-model="ui.currentInvit"/>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref } from 'vue'

import { $t, sty } from '../src-fw/util'
import stores from '../stores/all'
import SettingsButton from '../components-fw/SettingsButton.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BarTitle from '../components-fw/BarTitle.vue'
import InvitHdr from '../components-fw/InvitHdr.vue'

const ui = stores.ui
const sf = stores.safe
const config = stores.config
const session = stores.session

const majors = Array.from(Object.keys(config.K.majorInvits))
const majOpts = ref([])
for (const m of majors) 
  majOpts.value.push({ value: m, label: $t('INV_' + m)})

const sorgs = ref()

const reset = () => {
  sorgs.value = sf.managedOrgs()
  if (sorgs.value.length) ui.demandsPage.svcOrg = sorgs.value.length
}

reset()

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
