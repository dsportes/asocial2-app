<template>
<div class="column full-width">
  <q-toolbar class="full-width tbp">
    <btn-cond label="WP" disable :color="session.wpReady ? 'green' : 'red'">
      <q-tooltip>{{session.sessionInfo}}</q-tooltip>
    </btn-cond>
    <q-toolbar-title class="titre-md q-mx-md">
      {{sf.step === 3 ? $t('SFHreq') : $t('app_label')}}
    </q-toolbar-title>
    <settings-button class="q-ml-sm"/>
    <help-button class="" page="DOCpg"/>
    <div style="color:transparent;width:3px">*<q-tooltip>SafePage</q-tooltip></div>
  </q-toolbar>

  <q-tabs v-if="sf.step === 1" dense v-model="sf.tab" breakpoint="2000px"
    class="full-width bg-primary text-white shadow-2">
    <q-tab name="login">
      <img :src="anonymous" width="32px"/>
      <div>{{ $t('login') }}</div>
    </q-tab>
    <q-tab name="guest">
      <img :src="flowers" width="32px"/>
      <div>{{ $t('guest') }}</div>
    </q-tab>
  </q-tabs>

  <div v-if="sf.step === 2"
    class="row justify-between q-ma-sm items-center">
    <btn-cond icon="chevron_left" color="none" :label="$t('LOGback')"
      @ok="sf.setStep(1)"/>
    <safe-tools/>
  </div>
  <div v-if="sf.step === 2" :class="sty() + ' q-pa-xs'">
    <mode-incognito/>
    <div class="titre-md text-italic q-my-sm">{{$t('HPclicksession')}}</div>
  </div>

  <listcreds-mgr v-if="dialogs.ListcredsMgr" v-model="dialogs.ListcredsMgr"/>

  <div v-if="sf.step === 3">
    <div :class="sty() + ' row justify-between q-pa-xs items-center'">
      <btn-cond icon="chevron_left" :label="$t('LOGback')"
        @ok="sf.setStep(1)"/>
      <btn-cond icon="chevron_right" :label="$t('LOGsession')"
        @ok="sf.setStep(2)"/>
    </div>
    <q-tabs dense v-model="sf.tab3"
      class="full-width bg-primary text-white shadow-2">
      <btn-cond icon="add_box" color="none" :label="$t('SFHnewr')"
        @ok="dialogs.NewReq = true"/>
      <!--q-tab name="newr" icon="add_box" :label="$t('SFHnewr')" /-->
      <q-tab name="scan" icon="search" :label="$t('SFHscan')" />
    </q-tabs>
    <invit-hdr v-if="ui.currentInvit.zoomed" v-model="ui.currentInvit"/>
  </div>

  <case-newrequest v-if="dialogs.NewReq" v-model="dialogs.NewReq"/>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { useI18n } from 'vue-i18n'
// @ts-ignore
import { ref, reactive } from 'vue'

import stores from '../stores/all'
import { sty } from '../src-fw/util'
import SettingsButton from '../components-fw/SettingsButton.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import InvitHdr from '../components-fw/InvitHdr.vue'
import CaseNewrequest from '../dialogs-fw/CaseNewrequest.vue'
import ListcredsMgr from '../dialogs-fw/ListcredsMgr.vue'
import ModeIncognito from '../components-fw/ModeIncognito.vue'

import SafeTools from '../components-fw/SafeTools.vue'
// @ts-ignore
import anonymous from '../assets/anonymous-w.svg'
// @ts-ignore
import flowers from '../assets/flowers.png'

const $t = useI18n().t
const sf = stores.safe
const config = stores.config
const session = stores.session
const ui = stores.ui

const dialogs = reactive({
  ListcredsMgr: false,
  NewReq: false
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
