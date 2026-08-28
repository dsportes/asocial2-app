<template>
<div class="column items-center">

  <div :class="sty('md')">
    <div v-if="ui.loginPage.tab === 'login' && session.step === 0">
      <mode-net/>
      <mode-local/>
      <login-block @logged="logok"/>
    </div>

    <!--
    <div v-if="session.step === 1" class="column items-center">
      <div v-if="session.syncMode" class="q-my-sm row justify-between items-center">
        <q-toggle class="col q-pr-md" v-model="ui.loginPage.resetdb" dense :label="$t('HPresetdb_0')"/>
      </div>
      <btn-cond label="Ouvrir la session" icon="check" @ok="step(2)"/>
    </div>
    -->

    <div v-if="ui.loginPage.tab === 'guest' && session.step === 0" class="q-pa-xs">
      <login-create class="full-width"
        @done="ui.loginPage.tab3 = 'newr'; step(3)"/>
    </div>
  </div>

  <select-options v-if="session.step === 1"/>

</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { watch, reactive } from 'vue'

import stores from '../stores/all'
import { $t, sty } from '../src-fw/util'

import BtnCond from '../components-fw/BtnCond.vue'
import LoginBlock from '../components-fw/LoginBlock.vue'
import ModeNet from '../components-fw/ModeNet.vue'
import ModeLocal from '../components-fw/ModeLocal.vue'
import LoginCreate from '../components-fw/LoginCreate.vue'
import SelectOptions from '../dialogs-fw/SelectOptions.vue'

// @ts-ignore
// import databaseW from '../assets/database_white.png'
// @ts-ignore
// import databaseB from '../assets/database_black.png'
// const database = computed(() => ui.isDark ? databaseW : databaseB)
// const pincode = '📌' // U+1F4CC : pushpin - icon: push_pin

const ui = stores.ui
const session = stores.session

const dialogs = reactive({
  seloptions: false
})

const logok = async (x) => {
  if (x === 'calc') await step(2)
  else await step(1)
}

const step = async (s: number) => { 
  await session.setStep(s) }

watch(() => ui.loginPage.resetdb, async (v) => {
  if (v) await ui.diagDisplay($t('HPresetdb_1'))
})

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
.bordv { border-left: 1px solid $grey-8; }
.q-toolbar__title { font-size: medium !important;}
.bord2 { border: 1px solid $warning; }

</style>
