<template>
<div>
  <std-header/>

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
      @ok="trigOptions">
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
import StdHeader from '../components-fw/StdHeader.vue'
import BtnCond from '../components-fw/BtnCond.vue'
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

const trigOptions = () => { session.okOptions = session.okOptions + 1 }

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
