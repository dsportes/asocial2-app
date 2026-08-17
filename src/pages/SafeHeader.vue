<template>
<div class="column full-width">
  <q-toolbar class="full-width tbp">
    <btn-mode/>
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

  <q-tabs v-if="session.step === 0" dense v-model="ui.loginPage.tab" breakpoint="2000px"
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

  <div v-if="session.step === 1"
    class="row justify-between q-ma-sm items-center">
    <btn-cond icon="chevron_left" color="none" :label="$t('LOGback')"
      @ok="step(0)"/>
    <safe-tools/>
  </div>

  <div v-if="session.step === 3"> <!-- TODO -->
    <listcreds-mgr v-if="dialogs.ListcredsMgr" v-model="dialogs.ListcredsMgr"/>
  </div>

  <div v-if="session.step === 3"> <!-- TODO -->
    <div :class="sty() + ' row justify-between q-pa-xs items-center'">
      <btn-cond icon="chevron_left" :label="$t('LOGback')"
        @ok="step(0)"/>
      <btn-cond icon="chevron_right" :label="$t('LOGsession')"
        @ok="session.setStep(3)"/>
    </div>
    <!--q-tabs dense v-model="ui.loginPage.tab3"
      class="full-width bg-primary text-white shadow-2">
      <btn-cond icon="add_box" color="none" :label="$t('SFHnewr')"
        @ok="dialogs.NewReq = true"/>
      <q-tab name="scan" icon="search" :label="$t('SFHscan')" />
    </q-tabs-->
    <demands-hdr/>
  </div>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { useI18n } from 'vue-i18n'
// @ts-ignore
import { reactive } from 'vue'

import stores from '../stores/all'
import { sty } from '../src-fw/util'
import SettingsButton from '../components-fw/SettingsButton.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnMode from '../components-fw/BtnMode.vue'
import DemandsHdr from '../components-fw/DemandsHdr.vue'
import ListcredsMgr from '../dialogs-fw/ListcredsMgr.vue'

import SafeTools from '../components-fw/SafeTools.vue'
// @ts-ignore
import anonymous from '../assets/anonymous-w.svg'
// @ts-ignore
import flowers from '../assets/flowers.png'

const $t = useI18n().t
const sf = stores.safe
const session = stores.session
const ui = stores.ui

const step = async (s: number) => { await session.setStep(s) }

const dialogs = reactive({
  ListcredsMgr: false,
  NewReq: false
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
