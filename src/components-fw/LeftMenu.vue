<template>
<div class="column">
  <div v-if="sf.step === 0 && lstSvc !== null" class="q-mt-sm q-mb-xs">
    <div class="titre-md text-italic">{{$t('PAGEadmin')}}</div>
    <div class="q-ml-md q-gutter-sm row">
      <btn-cond v-for="svc in svcLst" :key="svc" color="primary"
        @ok="openAdmin(svc)"/>
    </div>
  </div>
  <btn-cond class="q-my-xs" v-if="sf.step === 0 && ui.page !== 'app'" 
    flat :label="$t('PAGEapp')"
    @ok="ui.toggleMenu(); ui.setPage('app')"/>
  <btn-cond class="q-my-xs" v-if="sf.step === 0 && ui.page !== 'test'" 
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
const lstSvc = computed(() => { return session.admin.services })

const openAdmin = (svc) => {
  ui.toggleMenu()
  ui.setPage('admin')
  session.admin.svc = svc
  session.admin.org = null
}

</script>

<style lang="scss" scoped>
@import '../css/app.scss';
</style>
