<template>
<div>
  <q-toolbar class="full-width tbp">
    <btn-cond class="q-mr-xs" color="none" flat icon="menu"
      @ok="ui.openMenu"/>
    <btn-cond label="WP" class="q-ml-xs" :color="session.wpReady ? 'green' : 'red'" disable>
      <q-tooltip>{{session.sessionInfo}}</q-tooltip>
    </btn-cond>

    <btn-bubble class="q-ml-md" :text="$t('PAGEdemands_bub')"/>
    <q-toolbar-title class="titre-md q-mx-md">{{$t('PAGEdemands_label')}}</q-toolbar-title>

    <settings-button class="q-ml-sm"/>
    <div style="color:transparent;width:3px">*<q-tooltip>DemandsPage</q-tooltip></div>
  </q-toolbar>

  <div :class="sty() + ' row justify-end items-center q-gutter-xs q-py-sm'">
    <btn-cond :label="$t('INVtit_1')" icon="add"
      @ok="dialogs.newrequest = true"/>
    <btn-bubble class="q-ml-md" :text="$t('INVtit_1_bub')"/>
  </div>

  <div :class="sty()">
    <bar-title prefix="INVtit_2"/>
    <invit-hdr v-if="ui.currentInvit.zoomed" v-model="ui.currentInvit"/>
  </div>

  <invit-newrequest v-if="dialogs.newrequest" v-model="dialogs.newrequest"/>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { reactive } from 'vue'

import { $t, sty } from '../src-fw/util'
import stores from '../stores/all'
import SettingsButton from '../components-fw/SettingsButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnBubble from '../components-fw/BtnBubble.vue'
import BarTitle from '../components-fw/BarTitle.vue'
import InvitHdr from '../components-fw/InvitHdr.vue'
import InvitNewrequest from '../dialogs-fw/InvitNewrequest.vue'

const ui = stores.ui
const session = stores.session

const dialogs = reactive({
  newrequest: false
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.select:hover { background-color: $yellow-2 !important; color: black !important; }
.cur { color: $warning !important; font-style: italic; font-weight: bold; }
</style>
