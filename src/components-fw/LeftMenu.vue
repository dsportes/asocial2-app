<template>
<div class="column">
  <btn-cond v-if="sf.step === 0 && ui.page !== 'admin' && isAdmin" 
    flat :label="$t('PAGEadmin')"
    @ok="ui.toggleMenu(); ui.setPage('admin')"/>
  <btn-cond v-if="sf.step === 0 && ui.page !== 'app'" 
    flat :label="$t('PAGEapp')"
    @ok="ui.toggleMenu(); ui.setPage('app')"/>
  <btn-cond v-if="sf.step === 0 && ui.page !== 'test'" 
    flat :label="$t('PAGEtest')"
    @ok="ui.toggleMenu(); ui.setPage('test')"/>
  <div class="q-mt-lg q-pa-sm">
    <div v-for="n in 50" :key="n">Drawer {{ n }} / 50</div>
  </div>
</div>
</template>

<script setup lang="ts">
// @ts-ignore
import { computed } from 'vue'
import stores from '../stores/all'
// import HelpButton from '../components-fw/HelpButton.vue'
import BtnCond from '../components-fw/BtnCond.vue'
import { $t } from '../src-fw/util'

const sf = stores.safe
const ui = stores.ui
// const config = stores.config
const session = stores.session
const isAdmin = computed(() => { 
  return session.servicesAdmin() !== null })

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
