<template>
<div class="column items-center">

  <div :class="sty('md')">
    <div v-if="ui.loginPage.tab === 'login' && session.step === 0">
      <mode-net/>
      <mode-local/>
      <login-block @logged="logok"/>
    </div>

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

import LoginBlock from '../components-fw/LoginBlock.vue'
import ModeNet from '../components-fw/ModeNet.vue'
import ModeLocal from '../components-fw/ModeLocal.vue'
import LoginCreate from '../components-fw/LoginCreate.vue'
import SelectOptions from '../dialogs-fw/SelectOptions.vue'

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

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
