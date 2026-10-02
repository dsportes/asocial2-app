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

    <select-options v-if="session.step === 1"/>
  </div>

  <!--date-time2 v-model="dt" :class="sty('md') + ' q-my-md'" 
    @ok="chgdt" title="Test saisie période" :checkfn="checkDT"/-->
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, watch } from 'vue'
// @ts-ignore
import { date } from 'quasar'
import stores from '../stores/all'
import { sty } from '../src-fw/util'

import LoginBlock from '../components-fw/LoginBlock.vue'
import ModeNet from '../components-fw/ModeNet.vue'
import ModeLocal from '../components-fw/ModeLocal.vue'
import LoginCreate from '../components-fw/LoginCreate.vue'
import SelectOptions from '../components-fw/SelectOptions.vue'

// import DateTime2 from '../components-fw/DateTime2.vue'

const ui = stores.ui
const session = stores.session

/* Test Date-time 
const nowInMin = Math.floor(Date.now() / 60000) * 60000
const dt = ref({
  start: nowInMin - 60000,
  end: nowInMin
})

const chgdt = (okdt) => {
  console.log(okdt.star ? date.formatDate(okdt.start, 'YYYY-MM-DD HH:mm') : 0, 
    okdt.end ? date.formatDate(okdt.end, 'YYYY-MM-DD HH:mm') : 0)
}

const checkDT = (v) => {
  if (!v) return 'obligatoire'
  if (v.start && v.end && v.end < v.start + 600000) return 'minimum 10 minutes'
  return ''
}
Fin test Date-time */

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
