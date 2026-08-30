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
    <btn-cond icon="chevron_left" color="none" :label="$t('login')"
      @ok="step(0)"/>
    <btn-cond :label="$t('OPTSok_1')" size="lg" padding="none xs" 
      @ok="session.okOptions = session.okOptions + 1">
      <q-badge v-if="session.haschgOptions" floating color="red" rounded />
    </btn-cond>
    <safe-tools/>
  </div>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
// import { useI18n } from 'vue-i18n'
// @ts-ignore
// import { reactive } from 'vue'

import stores from '../stores/all'
import SettingsButton from '../components-fw/SettingsButton.vue'
import HelpButton from '../components-fw/HelpButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import BtnMode from '../components-fw/BtnMode.vue'
import { $t } from '../src-fw/util'

import SafeTools from '../components-fw/SafeTools.vue'
// @ts-ignore
import anonymous from '../assets/anonymous-w.svg'
// @ts-ignore
import flowers from '../assets/flowers.png'

const sf = stores.safe
const session = stores.session
const ui = stores.ui

const step = async (s: number) => { await session.setStep(s) }

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
